function getReviewBlocks(q, lang) {
  const en = q.variants?.en || {};
  const v = q.variants?.[lang] || {};

  // IS-10 review rules:
  // en -> English only
  // es -> Spanish only
  // fr -> English + French
  // ht -> English + Haitian Creole
  if (lang === "en" || lang === "es") {
    return [{
      label: lang.toUpperCase(),
      question_text: v.question_text || "",
      options: v.options || {},
      why_correct: v.rationale?.why_correct || "",
      prometric_signal: v.rationale?.prometric_signal || ""
    }];
  }

  if (lang === "fr" || lang === "ht") {
    return [
      {
        label: "EN",
        question_text: en.question_text || "",
        options: en.options || {},
        why_correct: en.rationale?.why_correct || "",
        prometric_signal: en.rationale?.prometric_signal || ""
      },
      {
        label: lang.toUpperCase(),
        question_text: v.question_text || "",
        options: v.options || {},
        why_correct: v.rationale?.why_correct || "",
        prometric_signal: v.rationale?.prometric_signal || ""
      }
    ];
  }

  // Default fallback: English only
  return [{
    label: "EN",
    question_text: en.question_text || "",
    options: en.options || {},
    why_correct: en.rationale?.why_correct || "",
    prometric_signal: en.rationale?.prometric_signal || ""
  }];
}

function scoreAttemptFromForm({ form, questionById, attempt }) {
  const lang = attempt.language || "en";

  // Build lookup of answers
  const answeredById = {};
  (attempt.answers || []).forEach((a) => {
    answeredById[a.question_id] = a.selected;
  });

  let correctCount = 0;
  const review = [];

  (form.question_ids || []).forEach((qid, idx) => {
    const q = questionById[qid];
    const selected = answeredById[qid] || "";

    if (!q) {
      review.push({
        index: idx + 1,
        question_id: qid,
        error: "Question not found in bank"
      });
      return;
    }

    const correctAnswer = q.correct_answer;
    const isCorrect = selected === correctAnswer;
    if (isCorrect) correctCount += 1;

    review.push({
      index: idx + 1,
      question_id: q.question_id,
      selected,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      review_blocks: getReviewBlocks(q, lang)
    });
  });

  const total = (form.question_ids || []).length;
  const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return {
    attempt_id: attempt.attempt_id,
    exam_form_id: form.exam_form_id,
    blueprint_id: form.blueprint_id,
    language: lang,
    started_at: attempt.started_at || "",
    finished_at: attempt.finished_at || "",
    total_questions: total,
    correct: correctCount,
    percent,
    review
  };
}

module.exports = { getReviewBlocks, scoreAttemptFromForm };
