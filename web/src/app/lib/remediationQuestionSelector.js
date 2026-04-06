// Phase 6 - Step 6.2
// Remediation Question Selector (logic only)
// IMPORTANT: No UI, no scoring, no outcomes, no persistence.

const ERROR_PATTERN_RULES = [
  {
    id: "observe_report_boundary",
    keywords: [
      "within my role",
      "observe and report",
      "scope",
      "diagnosis",
      "treatment",
      "act independently",
      "routine documentation",
      "requires reporting",
      "report promptly",
      "chain of command",
    ],
  },
  {
    id: "recognize_change",
    keywords: [
      "baseline",
      "change in condition",
      "mental status",
      "sudden",
      "neurological",
      "speech changes",
      "one-sided weakness",
      "acute",
      "infection indicators",
    ],
  },
  {
    id: "infection_prevention",
    keywords: [
      "contamination",
      "spread",
      "infection",
      "germs",
      "hand hygiene",
      "gloves",
      "ppe",
      "isolation",
      "clean",
      "dirty",
    ],
  },
  {
    id: "safety_first",
    keywords: [
      "safety",
      "prevent harm",
      "hazard",
      "unstable",
      "instability",
      "transfer",
      "ambulation",
      "fall",
      "positioning",
      "support",
    ],
  },
  {
    id: "resident_centered_support",
    keywords: [
      "empathetic",
      "emotional",
      "dignity",
      "privacy",
      "comfort",
      "independence",
      "validation",
      "redirection",
      "reassurance",
      "communication",
      "autonomy",
      "confidentiality",
    ],
  },
];

const CATEGORY_DEFAULT_PATTERN = {
  "Scope of Practice & Reporting": "observe_report_boundary",
  "Change in Condition": "recognize_change",
  "Observation & Safety": "safety_first",
  "Environment & Safety": "safety_first",
  "Infection Control": "infection_prevention",
  "Personal Care & Comfort": "resident_centered_support",
  "Mobility & Positioning": "safety_first",
  "Communication & Emotional Support": "resident_centered_support",
  "Dignity & Resident Rights": "resident_centered_support",
};

function getDifficulty(question) {
  const raw = Number(question?.difficulty_tag ?? question?.difficulty ?? 2);
  if (!Number.isFinite(raw)) return 2;
  return Math.max(1, Math.min(3, raw));
}

function getPrometricSignal(question) {
  return (
    question?.variants?.en?.rationale?.prometric_signal ||
    question?.variants?.es?.rationale?.prometric_signal ||
    ""
  );
}

function classifyPrometricPattern(question) {
  const signal = String(getPrometricSignal(question) || "").toLowerCase();
  for (const rule of ERROR_PATTERN_RULES) {
    if (rule.keywords.some((keyword) => signal.includes(keyword))) {
      return rule.id;
    }
  }
  return CATEGORY_DEFAULT_PATTERN[question?.category_tag] || "resident_centered_support";
}

function normalizeQuestionBank(questionBankSnapshot) {
  return Array.isArray(questionBankSnapshot)
    ? questionBankSnapshot
    : Object.values(questionBankSnapshot || {});
}

function buildQuestionStats(previousSessions) {
  const statsById = {};

  (previousSessions || []).forEach((session) => {
    const answers = session?.answers || {};
    Object.entries(answers).forEach(([qid, answer]) => {
      if (!statsById[qid]) {
        statsById[qid] = {
          seenCount: 0,
          submitCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        };
      }

      statsById[qid].seenCount += 1;
      if (answer?.submitted) {
        statsById[qid].submitCount += 1;
        if (answer.is_correct === true) statsById[qid].correctCount += 1;
        if (answer.is_correct === false) statsById[qid].incorrectCount += 1;
      }
    });
  });

  return statsById;
}

function scoreCandidate({
  question,
  categoryId,
  preferredPattern,
  targetDifficulty,
  chapterPriority,
  questionStats,
  seenSet,
  lastSessionSet,
  usedQuestionIds,
}) {
  const qid = question.question_id;
  const stats = questionStats[qid] || {
    seenCount: 0,
    submitCount: 0,
    correctCount: 0,
    incorrectCount: 0,
  };

  const difficulty = getDifficulty(question);
  const pattern = classifyPrometricPattern(question);

  let score = 0;

  if (!usedQuestionIds.has(qid)) score += 1000;
  if (!seenSet.has(qid)) score += 400;
  if (!lastSessionSet.has(qid)) score += 180;

  if (stats.correctCount >= 2) score -= 420;
  else if (stats.correctCount >= 1) score -= 140;

  if (stats.incorrectCount >= 1) score += 80;
  if (stats.incorrectCount >= 2) score += 40;

  if (preferredPattern && pattern === preferredPattern) score += 120;
  else if (preferredPattern) score -= 10;

  if (Number.isFinite(chapterPriority)) {
    if (chapterPriority === 0) score += 90;
    else if (chapterPriority === 1) score += 45;
    else if (chapterPriority === 2) score += 15;
  }

  score -= Math.abs(difficulty - targetDifficulty) * 35;
  score -= stats.seenCount * 18;

  return {
    question,
    score,
    difficulty,
    pattern,
  };
}

function makeDifficultyPlan(count) {
  if (count <= 1) return [2];
  if (count === 2) return [2, 2];
  if (count === 3) return [1, 2, 3];
  if (count === 4) return [1, 2, 2, 3];
  if (count === 5) return [1, 2, 2, 3, 3];
  if (count === 6) return [1, 2, 2, 2, 3, 3];
  if (count === 7) return [1, 1, 2, 2, 2, 3, 3];
  return [1, 1, 2, 2, 2, 2, 3, 3];
}

function pickFromTopBand(scored, rng = Math.random) {
  if (!Array.isArray(scored) || scored.length === 0) return null;

  const topScore = Number(scored[0]?.score || 0);
  const band = scored
    .filter((entry) => Number(entry?.score || 0) >= topScore - 45)
    .slice(0, 6);

  const pool = band.length > 0 ? band : scored.slice(0, 1);
  const index = Math.floor(rng() * pool.length);
  return pool[index]?.question || null;
}

function interleaveSelections(selectedByCategory, selectedCategories, rng = Math.random) {
  const buckets = Object.fromEntries(
    selectedCategories.map((categoryId) => [categoryId, [...(selectedByCategory[categoryId] || [])]])
  );

  const orderedCategories = [...selectedCategories];
  if (orderedCategories.length > 1) {
    const offset = Math.floor(rng() * orderedCategories.length);
    if (offset > 0) {
      orderedCategories.push(...orderedCategories.splice(0, offset));
    }
  }

  const ordered = [];
  let categoryIndex = 0;

  while (true) {
    const categoryId = orderedCategories[categoryIndex % orderedCategories.length];
    const bucket = buckets[categoryId];
    if (bucket && bucket.length) {
      ordered.push(bucket.shift());
    }

    categoryIndex += 1;
    const remaining = orderedCategories.some((id) => (buckets[id] || []).length > 0);
    if (!remaining) break;
  }

  return ordered;
}

export function selectRemediationQuestions({
  selectedCategories,
  perCategoryCount,
  categoryChapterSources,
  questionBankSnapshot,
  previouslySeenQuestionIds = [],
  previousSessions = [],
  lastSessionQuestionIds = [],
  preferredPatternsByCategory = {},
  rng = Math.random,
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

  const questionsArray = normalizeQuestionBank(questionBankSnapshot);
  const seenSet = new Set(previouslySeenQuestionIds || []);
  const lastSessionSet = new Set(lastSessionQuestionIds || []);
  const usedQuestionIds = new Set();
  const selectedByCategory = {};
  const questionStats = buildQuestionStats(previousSessions);

  selectedCategories.forEach((categoryId) => {
    const allowedChapters = categoryChapterSources[categoryId] || [];
    const needed = perCategoryCount[categoryId] || 0;
    const allowedSet = new Set(allowedChapters.map((value) => String(value)));
    const candidates = questionsArray.filter((question) => {
      if (!question) return false;
      if (question.category_tag !== categoryId) return false;
      if (!allowedSet.has(String(question.chapter_tag))) return false;
      return true;
    });

    const preferredPattern = preferredPatternsByCategory[categoryId] || null;
    const difficultyPlan = makeDifficultyPlan(needed);
    const chapterPriorityByTag = Object.fromEntries(
      allowedChapters.map((chapter, index) => [String(chapter), index])
    );
    const picked = [];

    for (let slot = 0; slot < needed; slot += 1) {
      const targetDifficulty = difficultyPlan[slot] || 2;
      const scored = candidates
        .filter((question) => !usedQuestionIds.has(question.question_id))
        .map((question) =>
          scoreCandidate({
            question,
            categoryId,
            preferredPattern,
            targetDifficulty,
            chapterPriority: chapterPriorityByTag[String(question.chapter_tag)],
            questionStats,
            seenSet,
            lastSessionSet,
            usedQuestionIds,
          })
        )
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return String(a.question.question_id).localeCompare(String(b.question.question_id));
        });

      const next = pickFromTopBand(scored, rng);
      if (!next) {
        throw new Error(
          `selectRemediationQuestions: insufficient questions for category ${categoryId}`
        );
      }

      usedQuestionIds.add(next.question_id);
      picked.push(next);
    }

    if (picked.length > 1) {
      for (let i = picked.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [picked[i], picked[j]] = [picked[j], picked[i]];
      }
    }

    selectedByCategory[categoryId] = picked;
  });

  const orderedQuestions = interleaveSelections(selectedByCategory, selectedCategories, rng);
  return {
    selectedQuestionIds: orderedQuestions.map((question) => question.question_id),
  };
}
