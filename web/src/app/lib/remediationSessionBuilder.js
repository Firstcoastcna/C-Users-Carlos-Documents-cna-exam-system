import { selectRemediationQuestions } from "./remediationQuestionSelector";
import { saveRemediationSession } from "./remediationSessionStorage";

const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [1],
    secondary: [4, 5],
  },
  "Change in Condition": {
    primary: [4],
    secondary: [3, 5],
  },
  "Observation & Safety": {
    primary: [4],
    secondary: [3, 2],
  },
  "Environment & Safety": {
    primary: [2],
    secondary: [3],
  },
  "Infection Control": {
    primary: [2],
    secondary: [3, 4],
  },
  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4],
  },
  "Mobility & Positioning": {
    primary: [3],
    secondary: [4],
  },
  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1, 3],
  },
  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [3, 5],
  },
};

const TOTAL_QUESTIONS = 12;

function normalizeQuestionBank(questionBankSnapshot) {
  return Array.isArray(questionBankSnapshot)
    ? questionBankSnapshot
    : Object.values(questionBankSnapshot || {});
}

function pickTargetCategories(rankedCategories) {
  const sorted = [...rankedCategories].sort((a, b) => {
    if ((b.priority_score || 0) !== (a.priority_score || 0)) {
      return (b.priority_score || 0) - (a.priority_score || 0);
    }
    if ((a.accuracy ?? 1) !== (b.accuracy ?? 1)) {
      return (a.accuracy ?? 1) - (b.accuracy ?? 1);
    }
    return String(a.category_id).localeCompare(String(b.category_id));
  });

  const highRiskPriority = sorted.filter((category) => category.is_high_risk && category.level !== "Strong");
  const weakPriority = sorted.filter((category) => !category.is_high_risk && category.level === "Weak");
  const developingPriority = sorted.filter(
    (category) => !category.is_high_risk && category.level === "Developing"
  );

  return (highRiskPriority.length > 0 ? highRiskPriority : [...weakPriority, ...developingPriority])
    .slice(0, 2)
    .map((category) => category.category_id);
}

function buildPerCategoryCount(selectedCategories, rankedCategories) {
  const counts = {};
  if (selectedCategories.length === 0) return counts;

  if (selectedCategories.length === 1) {
    counts[selectedCategories[0]] = TOTAL_QUESTIONS;
    return counts;
  }

  const byCategoryId = Object.fromEntries(
    rankedCategories.map((category) => [category.category_id, category])
  );

  const first = byCategoryId[selectedCategories[0]] || {};
  const second = byCategoryId[selectedCategories[1]] || {};
  const firstScore = Number(first.priority_score || 0);
  const secondScore = Number(second.priority_score || 0);
  const scoreGap = firstScore - secondScore;

  let firstCount = 6;
  if (scoreGap >= 0.2) firstCount = 8;
  else if (scoreGap >= 0.08) firstCount = 7;

  counts[selectedCategories[0]] = firstCount;
  counts[selectedCategories[1]] = TOTAL_QUESTIONS - firstCount;
  return counts;
}

export function buildRemediationSession({
  mode,
  resultsPayload,
  questionBankSnapshot,
  priorRemediationState,
}) {
  if (!resultsPayload) {
    throw new Error("buildRemediationSession: resultsPayload is required (read-only)");
  }
  if (!questionBankSnapshot) {
    throw new Error("buildRemediationSession: questionBankSnapshot is required (read-only)");
  }
  if (mode !== "targeted" && mode !== "focused") {
    throw new Error("buildRemediationSession: invalid mode");
  }

  const rankedCategories = Array.isArray(resultsPayload.category_priority)
    ? resultsPayload.category_priority
    : [];

  const selectedCategories = pickTargetCategories(rankedCategories);
  const perCategoryCount = buildPerCategoryCount(selectedCategories, rankedCategories);
  const categoryChapterSources = {};

  selectedCategories.forEach((categoryId) => {
    const mapping = CATEGORY_TO_CHAPTERS[categoryId];
    if (!mapping) {
      throw new Error(`Missing chapter mapping for category: ${categoryId}`);
    }

    categoryChapterSources[categoryId] = [...mapping.primary, ...mapping.secondary].slice(0, 2);
  });

  const preferredPatternsByCategory = Object.fromEntries(
    selectedCategories.map((categoryId) => {
      const categoryMeta = rankedCategories.find((category) => category.category_id === categoryId);
      return [categoryId, categoryMeta?.dominant_error_pattern || null];
    })
  );

  const normalizedBank = normalizeQuestionBank(questionBankSnapshot);
  const { selectedQuestionIds } = selectRemediationQuestions({
    selectedCategories,
    perCategoryCount,
    categoryChapterSources,
    questionBankSnapshot: normalizedBank,
    previouslySeenQuestionIds: priorRemediationState?.seenQuestionIds || [],
    previousSessions: priorRemediationState?.previousSessions || [],
    lastSessionQuestionIds: priorRemediationState?.lastSessionQuestionIds || [],
    preferredPatternsByCategory,
  });

  const questionsById = Object.fromEntries(
    selectedQuestionIds.map((qid) => [
      qid,
      normalizedBank.find((question) => question.question_id === qid),
    ])
  );

  const session = {
    session_id: `rem_${Date.now()}`,
    created_at: Date.now(),
    mode,
    results_attempt_id: resultsPayload.attempt_id,
    selectedCategories,
    totalQuestions: TOTAL_QUESTIONS,
    perCategoryCount,
    categoryChapterSources,
    questionIds: selectedQuestionIds,
    questionsById,
    currentIndex: 0,
    answers: {},
    status: "active",
  };

  saveRemediationSession(session);
  return session;
}
