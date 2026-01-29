const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(
  __dirname,
  "../data/questionBank_test12_per_chapter_phase6_build.json"
);

// For IS-9 testing, we will score and review attempt_002 (language = ht)
const RESPONSES_PATH = path.join(
  __dirname,
  "./attempts/attempt_002_responses.json"
);

const RESULTS_PATH = path.join(
  __dirname,
  "./attempts/attempt_002_results.json"
);

// ----------------------------
// Helpers: language display rules with English fallback
// ----------------------------
function getVariant(q, lang) {
  const en = q.variants?.en || {};
  const target = q.variants?.[lang] || {};

  // Display-only: prefer selected language, fallback to English
  return {
    question_text: target.question_text || en.question_text || "",
    options: target.options || en.options || {},
    rationale_why_correct:
      target.rationale?.why_correct || en.rationale?.why_correct || "",
    prometric_signal:
      target.rationale?.prometric_signal || en.rationale?.prometric_signal || ""
  };
}

// ----------------------------
// Load question bank
// ----------------------------
const questionsRaw = fs.readFileSync(DATA_PATH, "utf-8");
const questions = JSON.parse(questionsRaw);

// Index questions by question_id
const questionById = {};
questions.forEach((q) => {
  questionById[q.question_id] = q;
});

// ----------------------------
// Load responses
// ----------------------------
const responsesRaw = fs.readFileSync(RESPONSES_PATH, "utf-8");
const responses = JSON.parse(responsesRaw);

const displayLang = responses.language || "en";

// ----------------------------
// Score + build review
// ----------------------------
let correctCount = 0;
const review = [];

responses.answers.forEach((answer, index) => {
  const q = questionById[answer.question_id];

  if (!q) {
    review.push({
      index: index + 1,
      question_id: answer.question_id,
      error: "Question not found in question bank"
    });
    return;
  }

  // Authoritative scoring: use correct_answer from the question record
  const correctAnswer = q.correct_answer;
  const isCorrect = answer.selected === correctAnswer;

  if (isCorrect) {
    correctCount += 1;
  }

  // Display-only language selection with English fallback
  const v = getVariant(q, displayLang);

  review.push({
    index: index + 1,
    question_id: q.question_id,
    display_language: displayLang,
    question_text: v.question_text,
    options: v.options,
    selected: answer.selected,
    correct_answer: correctAnswer,
    is_correct: isCorrect,
    rationale_why_correct: v.rationale_why_correct,
    prometric_signal: v.prometric_signal
  });
});

// ----------------------------
// Build results object
// ----------------------------
const totalQuestions = responses.answers.length;
const percentScore =
  totalQuestions === 0
    ? 0
    : Math.round((correctCount / totalQuestions) * 100);

const results = {
  attempt_id: responses.attempt_id,
  language: displayLang,
  started_at: responses.started_at,
  finished_at: responses.finished_at,
  total_questions: totalQuestions,
  correct: correctCount,
  percent: percentScore,
  review: review
};

// ----------------------------
// Save results file
// ----------------------------
fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), "utf-8");

// ----------------------------
// Print results to terminal
// ----------------------------
console.log("\nRESULTS SUMMARY (language display test)");
console.log(`Display language: ${displayLang}`);
console.log(`Correct: ${correctCount} / ${totalQuestions}`);
console.log(`Score: ${percentScore}%`);

review.forEach((r) => {
  console.log("\n----------------------------");
  console.log(`Q${r.index} (${r.question_id})`);
  console.log(r.question_text);

  Object.entries(r.options).forEach(([key, text]) => {
    console.log(`${key}: ${text}`);
  });

  console.log(`Selected: ${r.selected}`);
  console.log(`Correct:  ${r.correct_answer}`);
  console.log(`Result:   ${r.is_correct ? "CORRECT" : "INCORRECT"}`);

  console.log("Rationale (Why Correct):");
  console.log(r.rationale_why_correct);

  console.log("Prometric Signal:");
  console.log(r.prometric_signal);
});

console.log("\nSaved results to:");
console.log(RESULTS_PATH);
