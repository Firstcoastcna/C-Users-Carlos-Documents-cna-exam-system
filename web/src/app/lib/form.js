import fs from "fs";
import path from "path";

export function loadForm(formFileName = "form_001.json") {
  const filePath = path.join(process.cwd(), "private_data", formFileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
