const fs = require("fs");
const path = require("path");

const { loadQuestionBank } = require("./lib/questionBank");
const { loadForm, validateForm } = require("./lib/form");
const { scoreAttemptFromForm } = require("./lib/review");

const ATTEMPT_PATH = path.join(__dirname, "./attempts/attempt_003_responses.json");
const RESULTS_PATH = path.join(__dirname, "./attempts/attempt_003_results_modular.json");

const { questions, byId } = loadQuestionBank();
const form = loadForm("form_001.json");
validateForm(form, byId);

const attemptRaw = fs.readFileSync(ATTEMPT_PATH, "utf-8");
const attempt = JSON.parse(attemptRaw);

const results = scoreAttemptFromForm({ form, questionById: byId, attempt });
fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), "utf-8");

console.log("MODULAR SCORE COMPLETE");
console.log("Saved to:", RESULTS_PATH);
console.log(`Score: ${results.correct}/${results.total_questions} (${results.percent}%)`);
