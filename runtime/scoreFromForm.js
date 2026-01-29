const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../data/questionBank_test12_per_chapter_phase6_build.json");
const FORM_PATH = path.join(__dirname, "./forms/form_001.json");
const RESPONSES_PATH = path.join(__dirname, "./attempts/attempt_003_responses.json");
const RESULTS_PATH = path.join(__dirname, "./attempts/attempt_003_results.json");

// Language rules (IS-10)
function getReviewVariant(q, lang) {
  const en = q.variants?.en || {};
  const v = q.variants?.[lang] || {};

  // Review rules:
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

// Load bank
const questionsRaw = fs.readFileSync(DATA_PATH, "utf-8");
const questions = JSON.parse(questionsRaw);
const byId = {};
questions.forEach((q) => {
  byId[q.question_id] = q;
});

// Load form (frozen order)
const formRaw = fs.readFileSync(FORM_PATH, "utf-8");
const form = JSON.parse(formRaw);

// Load responses
const respRaw = fs.readFileSync(RESPONSES_PATH, "utf-8");
const resp = JSON.parse(respRaw);

const lang = resp.language || "en";

// Build a response lookup by question_id
const answeredById = {};
(resp.answers || []).forEach((a) => {
  answeredById[a.question_id] = a.selected;
});

// Score in form order
let correctCount = 0;
const review = [];

form.question_ids.forEach((qid, idx) => {
  const q = byId[qid];
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

  const blocks = getReviewVariant(q, lang);

  review.push({
    index: idx + 1,
    question_id: q.question_id,
    selected: selected,
    correct_answer: correctAnswer,
    is_correct: isCorrect,
    review_blocks: blocks
  });
});

const total = form.question_ids.length;
const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);

const results = {
  attempt_id: resp.attempt_id || "attempt_003",
  exam_form_id: form.exam_form_id,
  blueprint_id: form.blueprint_id,
  language: lang,
  started_at: resp.started_at || "",
  finished_at: resp.finished_at || "",
  total_questions: total,
  correct: correctCount,
  percent: percent,
  review: review
};

// Save results
fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), "utf-8");

// Print summary + review
console.log("\nRESULTS SUMMARY (from frozen form)");
console.log(`Form: ${form.exam_form_id}`);
console.log(`Language: ${lang}`);
console.log(`Correct: ${correctCount} / ${total}`);
console.log(`Score: ${percent}%`);

review.forEach((r) => {
  console.log("\n============================");
  console.log(`Q${r.index} (${r.question_id})`);
  console.log("============================");
  console.log(`Selected: ${r.selected || "(no answer)"}`);
  console.log(`Correct:  ${r.correct_answer}`);
  console.log(`Result:   ${r.is_correct ? "CORRECT" : "INCORRECT"}`);

  (r.review_blocks || []).forEach((b) => {
    console.log("\n----------------------------");
    console.log(`[${b.label}] ${b.question_text}`);
    Object.entries(b.options || {}).forEach(([k, t]) => {
      console.log(`${k}: ${t}`);
    });
    console.log("\nRationale (Why Correct):");
    console.log(b.why_correct || "");
    console.log("\nPrometric Signal:");
    console.log(b.prometric_signal || "");
  });
});

console.log("\nSaved results to:");
console.log(RESULTS_PATH);
