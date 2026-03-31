const TOTAL_QUESTIONS = 60;

const CHAPTER_RANGES = {
  1: { min: 12, max: 12 },
  2: { min: 13, max: 13 },
  3: { min: 12, max: 12 },
  4: { min: 14, max: 14 },
  5: { min: 9, max: 9 },
};

const CATEGORY_RANGES = {
  "Scope of Practice & Reporting": { min: 8, max: 10 },
  "Change in Condition": { min: 6, max: 8 },
  "Infection Control": { min: 8, max: 10 },
  "Observation & Safety": { min: 6, max: 8 },
  "Environment & Safety": { min: 4, max: 6 },
  "Personal Care & Comfort": { min: 6, max: 8 },
  "Mobility & Positioning": { min: 4, max: 6 },
  "Communication & Emotional Support": { min: 4, max: 6 },
  "Dignity & Resident Rights": { min: 4, max: 6 },
};

const HIGH_RISK_CATEGORIES = new Set([
  "Scope of Practice & Reporting",
  "Change in Condition",
  "Infection Control",
]);

const DIFFICULTY_TARGETS = {
  easy: 16,
  moderate: 34,
  challenging: 10,
};

function normalizeDifficulty(question) {
  const raw = Number(question?.difficulty_tag ?? question?.difficulty ?? 2);
  if (raw <= 1) return "easy";
  if (raw >= 3) return "challenging";
  return "moderate";
}

function toArray(questionBankSnapshot) {
  return Array.isArray(questionBankSnapshot)
    ? questionBankSnapshot
    : Object.values(questionBankSnapshot || {});
}

function cloneCounts(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value]));
}

function pickWeightedRandom(items, rng, weightFn) {
  const weighted = items
    .map((item) => ({ item, weight: Math.max(0, weightFn(item)) }))
    .filter((entry) => entry.weight > 0);

  if (weighted.length === 0) return null;

  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = rng() * total;

  for (const entry of weighted) {
    threshold -= entry.weight;
    if (threshold <= 0) return entry.item;
  }

  return weighted[weighted.length - 1].item;
}

function buildCountsFromRanges(ranges, total, rng) {
  const counts = {};
  let remaining = total;

  Object.entries(ranges).forEach(([key, range]) => {
    counts[key] = range.min;
    remaining -= range.min;
  });

  while (remaining > 0) {
    const candidates = Object.entries(ranges)
      .filter(([key, range]) => counts[key] < range.max)
      .map(([key]) => key);

    if (candidates.length === 0) break;

    const picked = pickWeightedRandom(candidates, rng, (key) => {
      const range = ranges[key];
      return 1 + (range.max - counts[key]);
    });

    counts[picked] += 1;
    remaining -= 1;
  }

  return counts;
}

function buildAvailabilityMatrix(questions) {
  const matrix = {};

  questions.forEach((question) => {
    const chapter = String(question.chapter_tag);
    const category = question.category_tag;

    if (!chapter || !category) return;

    matrix[chapter] ||= {};
    matrix[chapter][category] ||= 0;
    matrix[chapter][category] += 1;
  });

  return matrix;
}

function assignCellPlan({ chapterTargets, categoryTargets, availabilityMatrix, rng }) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const remainingByChapter = cloneCounts(chapterTargets);
    const remainingByCategory = cloneCounts(categoryTargets);
    const plan = {};

    Object.keys(chapterTargets).forEach((chapter) => {
      plan[chapter] = {};
    });

    const categories = Object.keys(categoryTargets).sort((a, b) => {
      const aAvail = Object.keys(chapterTargets).reduce(
        (sum, chapter) => sum + (availabilityMatrix[chapter]?.[a] || 0),
        0
      );
      const bAvail = Object.keys(chapterTargets).reduce(
        (sum, chapter) => sum + (availabilityMatrix[chapter]?.[b] || 0),
        0
      );

      if (aAvail !== bAvail) return aAvail - bAvail;
      return remainingByCategory[b] - remainingByCategory[a];
    });

    let failed = false;

    for (const category of categories) {
      while (remainingByCategory[category] > 0) {
        const chapters = Object.keys(chapterTargets).filter((chapter) => {
          const alreadyPlanned = plan[chapter][category] || 0;
          const available = availabilityMatrix[chapter]?.[category] || 0;
          return remainingByChapter[chapter] > 0 && available > alreadyPlanned;
        });

        if (chapters.length === 0) {
          failed = true;
          break;
        }

        const pickedChapter = pickWeightedRandom(chapters, rng, (chapter) => {
          const available = availabilityMatrix[chapter]?.[category] || 0;
          const used = plan[chapter][category] || 0;
          const spare = available - used;
          return 1 + remainingByChapter[chapter] * 3 + spare;
        });

        plan[pickedChapter][category] = (plan[pickedChapter][category] || 0) + 1;
        remainingByChapter[pickedChapter] -= 1;
        remainingByCategory[category] -= 1;
      }

      if (failed) break;
    }

    if (failed) continue;

    const chapterSatisfied = Object.values(remainingByChapter).every((value) => value === 0);
    const categorySatisfied = Object.values(remainingByCategory).every((value) => value === 0);

    if (chapterSatisfied && categorySatisfied) {
      return plan;
    }
  }

  return null;
}

function pickQuestionsForPlan({
  questions,
  plan,
  excludedIds,
  rng,
  questionUsageCounts = {},
}) {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const selected = [];
    const selectedIds = new Set();
    const difficultyRemaining = { ...DIFFICULTY_TARGETS };

    let failed = false;

    const slots = [];
    Object.entries(plan).forEach(([chapter, byCategory]) => {
      Object.entries(byCategory).forEach(([category, count]) => {
        for (let i = 0; i < count; i += 1) {
          slots.push({ chapter, category });
        }
      });
    });

    slots.sort(() => rng() - 0.5);

    for (const slot of slots) {
      const candidates = questions.filter((question) => {
        if (selectedIds.has(question.question_id)) return false;
        if (excludedIds.has(question.question_id)) return false;
        return (
          String(question.chapter_tag) === slot.chapter &&
          question.category_tag === slot.category
        );
      });

      if (candidates.length === 0) {
        failed = true;
        break;
      }

      const picked = pickWeightedRandom(candidates, rng, (question) => {
        const difficulty = normalizeDifficulty(question);
        const difficultyNeed = difficultyRemaining[difficulty] || 0;
        const scarcity = 1 / Math.max(1, candidates.length);
        const usagePenalty = (Number(questionUsageCounts[question.question_id]) || 0) * 3.5;
        return Math.max(0.1, 2 + difficultyNeed * 4 + scarcity - usagePenalty);
      });

      if (!picked) {
        failed = true;
        break;
      }

      selected.push(picked);
      selectedIds.add(picked.question_id);

      const difficulty = normalizeDifficulty(picked);
      difficultyRemaining[difficulty] = (difficultyRemaining[difficulty] || 0) - 1;
    }

    if (failed) continue;

    const counts = selected.reduce(
      (acc, question) => {
        acc[normalizeDifficulty(question)] += 1;
        return acc;
      },
      { easy: 0, moderate: 0, challenging: 0 }
    );

    if (
      counts.easy >= 15 &&
      counts.easy <= 18 &&
      counts.moderate >= 30 &&
      counts.moderate <= 36 &&
      counts.challenging >= 9 &&
      counts.challenging <= 12
    ) {
      return selected;
    }
  }

  return null;
}

function orderSelectedQuestions(selectedQuestions, rng) {
  const remaining = [...selectedQuestions];
  const ordered = [];
  const earlyHighRiskSeen = new Set();

  while (remaining.length > 0) {
    const recentCategories = ordered.slice(-3).map((question) => question.category_tag);
    const candidates = remaining.filter((question) => {
      if (recentCategories.length < 3) return true;
      return !recentCategories.every((category) => category === question.category_tag);
    });

    const pool = candidates.length > 0 ? candidates : remaining;

    const picked = pickWeightedRandom(pool, rng, (question) => {
      let score = 1;

      if (
        ordered.length < 15 &&
        HIGH_RISK_CATEGORIES.has(question.category_tag) &&
        !earlyHighRiskSeen.has(question.category_tag)
      ) {
        score += 25;
      }

      const recentTwo = ordered.slice(-2).map((item) => item.category_tag);
      if (recentTwo.includes(question.category_tag)) {
        score -= 0.5;
      }

      return score;
    });

    ordered.push(picked);

    if (HIGH_RISK_CATEGORIES.has(picked.category_tag) && ordered.length <= 15) {
      earlyHighRiskSeen.add(picked.category_tag);
    }

    const idx = remaining.findIndex((question) => question.question_id === picked.question_id);
    remaining.splice(idx, 1);
  }

  return ordered.map((question) => question.question_id);
}

export function assembleExamQuestionIds({
  questionBankSnapshot,
  excludedQuestionIds = [],
  rng = Math.random,
  questionUsageCounts = {},
}) {
  const allQuestions = toArray(questionBankSnapshot).filter(
    (question) => question && question.question_id && question.chapter_tag && question.category_tag
  );

  if (allQuestions.length < TOTAL_QUESTIONS) {
    throw new Error("assembleExamQuestionIds: insufficient question bank size");
  }

  const excludedIds = new Set(excludedQuestionIds);
  const availableQuestions = allQuestions.filter((question) => !excludedIds.has(question.question_id));

  if (availableQuestions.length < TOTAL_QUESTIONS) {
    throw new Error("assembleExamQuestionIds: insufficient available questions after exclusions");
  }

  const availabilityMatrix = buildAvailabilityMatrix(availableQuestions);

  for (let attempt = 0; attempt < 400; attempt += 1) {
    const chapterTargets = buildCountsFromRanges(CHAPTER_RANGES, TOTAL_QUESTIONS, rng);
    const categoryTargets = buildCountsFromRanges(CATEGORY_RANGES, TOTAL_QUESTIONS, rng);

    const plan = assignCellPlan({
      chapterTargets,
      categoryTargets,
      availabilityMatrix,
      rng,
    });

    if (!plan) continue;

    const selectedQuestions = pickQuestionsForPlan({
      questions: availableQuestions,
      plan,
      excludedIds,
      rng,
      questionUsageCounts,
    });

    if (!selectedQuestions) continue;

    return orderSelectedQuestions(selectedQuestions, rng);
  }

  throw new Error("assembleExamQuestionIds: unable to generate a canon-aligned exam form");
}
