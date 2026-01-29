const fs = require("fs");
const path = require("path");

function loadQuestionBank() {
  const DATA_PATH = path.join(
    __dirname,
    "../../data/questionBank_test12_per_chapter_phase6_build.json"
  );

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const questions = JSON.parse(raw);

  const byId = {};
  questions.forEach((q) => {
    byId[q.question_id] = q;
  });

  return { questions, byId };
}

module.exports = { loadQuestionBank };
