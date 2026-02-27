// Phase 6 — Step 6.2
// Remediation Question Selector (logic only)
// IMPORTANT: No UI, no scoring, no outcomes, no persistence.

export function selectRemediationQuestions({
  selectedCategories,
  perCategoryCount,
  categoryChapterSources,
  questionBankSnapshot,
  previouslySeenQuestionIds = [],
  rotationOffset = 0, // NEW
}) {
  if (!Array.isArray(selectedCategories)) {
    throw new Error("selectRemediationQuestions: selectedCategories must be an array");
  }
  if (!perCategoryCount || typeof perCategoryCount !== "object") {
    throw new Error("selectRemediationQuestions: perCategoryCount is required");
  }
  if (!categoryChapterSources || typeof categoryChapterSources !== "object") {
    throw new Error("selectRemediationQuestions: categoryChapterSources is required");
  }
  if (!questionBankSnapshot) {
    throw new Error("selectRemediationQuestions: questionBankSnapshot is required");
  }

  const seenSet = new Set(previouslySeenQuestionIds);

  const questionsArray = Array.isArray(questionBankSnapshot)
    ? questionBankSnapshot
    : Object.values(questionBankSnapshot);

console.log("REM BANK TOTAL", questionsArray.length);

const countsByCategory = {};
for (const q of questionsArray) {
  if (!q) continue;
  const c = q.category_tag || "(missing category_tag)";
  countsByCategory[c] = (countsByCategory[c] || 0) + 1;
}
console.log("REM BANK CATEGORY COUNTS", countsByCategory);

  const selectedQuestionIds = [];
  const usedQuestionIds = new Set();

  selectedCategories.forEach((category_id) => {
    const allowedChapters = categoryChapterSources[category_id] || [];
    const needed = perCategoryCount[category_id] || 0;

    // IMPORTANT: chapter_tag may be string or number depending on source
    const allowedSet = new Set(allowedChapters.map((x) => String(x)));

    const candidates = questionsArray.filter((q) => {
      if (!q) return false;
      if (q.category_tag !== category_id) return false;
      if (!allowedSet.has(String(q.chapter_tag))) return false;
      return true;
    });

    const unseen = candidates.filter((q) => !seenSet.has(q.question_id));
    const seen = candidates.filter((q) => seenSet.has(q.question_id));

    // Deterministic within each group, but unseen always preferred
    const orderedPool = [
      ...unseen.sort((a, b) => String(a.question_id).localeCompare(String(b.question_id))),
      ...seen.sort((a, b) => String(a.question_id).localeCompare(String(b.question_id))),
    ];
if (unseen.length === 0 && orderedPool.length > 0) {
  const shift = rotationOffset % orderedPool.length;
  const rotated = orderedPool.slice(shift).concat(orderedPool.slice(0, shift));
  orderedPool.splice(0, orderedPool.length, ...rotated);
}

    // Tiny debug (temporary): tells us if pool is exhausted
    // You can delete later once verified.
    console.log(
  "REM POOL",
  category_id,
  "offset",
  rotationOffset,
  "candidates",
  candidates.length,
  "unseen",
  unseen.length,
  "seen",
  seen.length,
  "needed",
  needed
);


    let taken = 0;
    for (const q of orderedPool) {
      if (taken >= needed) break;
      if (usedQuestionIds.has(q.question_id)) continue;

      usedQuestionIds.add(q.question_id);
      selectedQuestionIds.push(q.question_id);
      taken += 1;
    }

    if (taken < needed) {
      throw new Error(
        `selectRemediationQuestions: insufficient questions for category ${category_id}`
      );
    }
  });

  return { selectedQuestionIds };
}
