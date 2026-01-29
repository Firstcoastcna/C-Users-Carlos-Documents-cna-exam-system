const fs = require("fs");
const path = require("path");

// Paths
const DATA_PATH = path.join(__dirname, "../data/questionBank_test12_per_chapter_phase6_build.json");
const BLUEPRINT_PATH = path.join(__dirname, "./blueprints/blueprint_001.json");
const OUTPUT_FORM_PATH = path.join(__dirname, "./forms/form_001.json");

// -------- Deterministic RNG (seeded) --------
// Mulberry32 PRNG for deterministic shuffles
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeterministic(arr, seed) {
  const rng = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// -------- Load inputs --------
const questionsRaw = fs.readFileSync(DATA_PATH, "utf-8");
const questions = JSON.parse(questionsRaw);

const blueprintRaw = fs.readFileSync(BLUEPRINT_PATH, "utf-8");
const blueprint = JSON.parse(blueprintRaw);

// -------- Prefilter (by chapter_tags) --------
// Use numeric chapter to avoid string/number mismatches
const allowedChapters = new Set((blueprint.chapter_tags || []).map((x) => Number(x)));
const eligible = questions.filter((q) => allowedChapters.has(Number(q.chapter)));

if (eligible.length === 0) {
  throw new Error("No eligible questions found for blueprint chapter_tags");
}

const total = blueprint.total_questions;
if (typeof total !== "number" || total <= 0) {
  throw new Error("blueprint.total_questions must be a positive number");
}
if (total > eligible.length) {
  throw new Error(
    `Blueprint requests ${total} questions but only ${eligible.length} eligible exist`
  );
}

// Deterministic selection: shuffle then take first N
const shuffled = shuffleDeterministic(eligible, blueprint.seed || 0);
const selected = shuffled.slice(0, total);

// Build ExamForm (minimal)
const form = {
  exam_form_id: "form_001",
  blueprint_id: blueprint.blueprint_id,
  created_at: new Date().toISOString(),
  question_ids: selected.map((q) => q.question_id)
};

// Save form (immutable artifact)
fs.writeFileSync(OUTPUT_FORM_PATH, JSON.stringify(form, null, 2), "utf-8");

console.log("FORM GENERATED");
console.log(`Saved to: ${OUTPUT_FORM_PATH}`);
console.log(`Questions: ${form.question_ids.length}`);
