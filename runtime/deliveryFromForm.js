const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DATA_PATH = path.join(__dirname, "../data/questionBank_test12_per_chapter_phase6_build.json");
const FORM_PATH = path.join(__dirname, "./forms/form_001.json");
const OUTPUT_RESPONSES_PATH = path.join(__dirname, "./attempts/attempt_003_responses.json");

// Load bank + build lookup
const questionsRaw = fs.readFileSync(DATA_PATH, "utf-8");
const questions = JSON.parse(questionsRaw);
const byId = {};
questions.forEach((q) => {
  byId[q.question_id] = q;
});

// Load frozen form
const formRaw = fs.readFileSync(FORM_PATH, "utf-8");
const form = JSON.parse(formRaw);

// Attempt (delivery) settings
const attempt = {
  attempt_id: "attempt_003",
  exam_form_id: form.exam_form_id,
  language: "en",
  started_at: new Date().toISOString(),
  answers: []
};

// Delivery language rules (IS-10 locked behavior)
function getDeliveryVariant(q, lang) {
  const en = q.variants?.en || {};
  const v = q.variants?.[lang] || {};

  // Delivery rules:
  // en -> English only
  // es -> Spanish only
  // fr -> English + French
  // ht -> English + Haitian Creole
  if (lang === "en" || lang === "es") {
    return [{ label: lang.toUpperCase(), question_text: v.question_text || "", options: v.options || {} }];
  }

  if (lang === "fr" || lang === "ht") {
    const primary = v;
    return [
      { label: "EN", question_text: en.question_text || "", options: en.options || {} },
      { label: lang.toUpperCase(), question_text: primary.question_text || "", options: primary.options || {} }
    ];
  }

  // Default fallback: English only
  return [{ label: "EN", question_text: en.question_text || "", options: en.options || {} }];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(index) {
  const qid = form.question_ids[index];
  const q = byId[qid];

  if (!q) {
    console.log(`\nMissing question in bank: ${qid}`);
    // Skip missing questions
    if (index + 1 >= form.question_ids.length) return finish();
    return ask(index + 1);
  }

  const blocks = getDeliveryVariant(q, attempt.language);

  console.log("\n============================");
  console.log(`Question ${index + 1} of ${form.question_ids.length}`);
  console.log("============================");

  blocks.forEach((b) => {
    console.log(`\n[${b.label}] ${b.question_text}`);
    Object.entries(b.options || {}).forEach(([key, text]) => {
      console.log(`${key}: ${text}`);
    });
  });

  rl.question("\nYour answer (A/B/C/D): ", (input) => {
    const ans = String(input || "").trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(ans)) {
      console.log("Please type only A, B, C, or D.");
      return ask(index);
    }

    attempt.answers.push({ question_id: q.question_id, selected: ans });

    if (index + 1 >= form.question_ids.length) return finish();
    ask(index + 1);
  });
}

function finish() {
  attempt.finished_at = new Date().toISOString();
  fs.writeFileSync(OUTPUT_RESPONSES_PATH, JSON.stringify(attempt, null, 2), "utf-8");
  console.log("\nATTEMPT SAVED:");
  console.log(OUTPUT_RESPONSES_PATH);
  rl.close();
}

console.log("EXAM START (from frozen form)");
console.log(`Form: ${form.exam_form_id}`);
console.log(`Questions: ${form.question_ids.length}`);
ask(0);
