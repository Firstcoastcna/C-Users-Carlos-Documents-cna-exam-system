const fs = require("fs");
const path = require("path");

function loadForm(formFilename = "form_001.json") {
  const FORM_PATH = path.join(__dirname, "../forms", formFilename);
  const raw = fs.readFileSync(FORM_PATH, "utf-8");
  return JSON.parse(raw);
}

function validateForm(form, questionById) {
  const missing = [];
  (form.question_ids || []).forEach((qid) => {
    if (!questionById[qid]) missing.push(qid);
  });

  if (missing.length > 0) {
    throw new Error("Form contains missing question_ids: " + missing.join(", "));
  }

  return true;
}

module.exports = { loadForm, validateForm };
