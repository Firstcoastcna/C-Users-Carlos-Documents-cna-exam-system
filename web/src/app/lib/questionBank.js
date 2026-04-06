import fs from "fs";
import path from "path";

export function loadQuestionBank() {
  const filePath = path.join(
    process.cwd(),
    "private_data",
    "questionBank_master_phase6_build_609_questions_04062026.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
