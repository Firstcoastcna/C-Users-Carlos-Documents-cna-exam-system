// src/app/lib/analytics/computeResultsPayload.js

/**
 * LOCKED CONTRACT: computeResultsPayload
 * - Runs ONLY when attempt.status is "submitted" or "time_expired"
 * - Pure computation (no UI, no localStorage, no router)
 * - Output: ResultsPayload { attempt_id, overall_status, category_diagnosis[], chapter_guidance[] }
 */

const CANON_CATEGORIES = [
  "Scope of Practice & Reporting",
  "Change in Condition",
  "Observation & Safety",
  "Environment & Safety",
  "Infection Control",
  "Personal Care & Comfort",
  "Mobility & Positioning",
  "Communication & Emotional Support",
  "Dignity & Resident Rights",
];

const CANON_CATEGORY_SET = new Set(CANON_CATEGORIES);

const CHAPTER_IDS = [1, 2, 3, 4, 5];

const HIGH_RISK_CATEGORIES = new Set([
  "Scope of Practice & Reporting",
  "Change in Condition",
  "Infection Control",
]);

const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [1],
    secondary: [4, 5],
    lens: "Is this within my role, or do I observe and report?",
  },
  "Change in Condition": {
    primary: [4],
    secondary: [3, 5],
    lens: "What is different from this resident's baseline?",
  },
  "Observation & Safety": {
    primary: [4],
    secondary: [3, 2],
    lens: "What should I notice right now to prevent harm?",
  },
  "Environment & Safety": {
    primary: [2],
    secondary: [3],
    lens: "Is the physical environment safe and compliant?",
  },
  "Infection Control": {
    primary: [2],
    secondary: [3, 4],
    lens: "What prevents contamination or spread?",
  },
  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4],
    lens: "Am I supporting comfort and independence?",
  },
  "Mobility & Positioning": {
    primary: [3],
    secondary: [4],
    lens: "Is movement safe and biomechanically correct?",
  },
  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1, 3],
    lens: "How should I respond verbally and emotionally?",
  },
  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [3, 5],
    lens: "Am I preserving autonomy and respect?",
  },
};

const ERROR_PATTERN_LABELS = {
  observe_report_boundary: "Knowing when to observe, support, and report",
  recognize_change: "Recognizing meaningful changes from baseline",
  safety_first: "Choosing safety over speed, convenience, or preference alone",
  infection_prevention: "Preventing contamination and spread",
  resident_centered_support: "Protecting dignity, communication, and emotional support",
};

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
      "documentation alone",
      "routine documentation",
      "report promptly",
      "requires reporting",
      "signalement",
      "reportable",
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
      "one-sided weakness",
      "speech changes",
      "neurological",
      "physiological changes",
      "infection indicators",
      "acute",
      "recognition of urgent",
    ],
  },
  {
    id: "infection_prevention",
    keywords: [
      "contamination",
      "spread",
      "infection",
      "germs",
      "clean",
      "dirty",
      "gloves",
      "hand hygiene",
      "ppe",
      "isolation",
    ],
  },
  {
    id: "safety_first",
    keywords: [
      "prevent harm",
      "safety",
      "hazard",
      "unstable",
      "instability",
      "transfer",
      "ambulation",
      "fall",
      "positioning",
      "support",
      "proper positioning",
      "environment safe",
    ],
  },
  {
    id: "resident_centered_support",
    keywords: [
      "empathetic",
      "emotional",
      "dignity",
      "privacy",
      "confidentiality",
      "comfort",
      "independence",
      "validation",
      "redirection",
      "reassurance",
      "respectful communication",
      "resident information",
      "autonomy",
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

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round4(value) {
  return Number(value.toFixed(4));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function pickDominantPattern(counts) {
  const entries = Object.entries(counts || {}).filter(([, count]) => count > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  return entries[0][0];
}

function computeConsistencyMetrics(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) {
    return {
      stability: 0,
      weaknessConsistency: 0,
      patternedWeakness: false,
    };
  }

  if (outcomes.length === 1) {
    const singleWeak = outcomes[0] === 0;
    return {
      stability: singleWeak ? 1 : 0.5,
      weaknessConsistency: singleWeak ? 1 : 0,
      patternedWeakness: false,
    };
  }

  let transitions = 0;
  for (let i = 1; i < outcomes.length; i += 1) {
    if (outcomes[i] !== outcomes[i - 1]) transitions += 1;
  }

  const wrongCount = outcomes.filter((value) => value === 0).length;
  const missRate = wrongCount / outcomes.length;
  const stability = 1 - transitions / (outcomes.length - 1);
  const weaknessConsistency = missRate === 0 ? 0 : missRate * (0.5 + 0.5 * stability);
  const patternedWeakness = wrongCount >= 2 && missRate >= 0.4 && stability >= 0.35;

  return {
    stability: round4(stability),
    weaknessConsistency: round4(weaknessConsistency),
    patternedWeakness,
  };
}

function classifyPrometricPattern({ signal, categoryId }) {
  const text = String(signal || "").toLowerCase();
  for (const rule of ERROR_PATTERN_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.id;
    }
  }
  return CATEGORY_DEFAULT_PATTERN[categoryId] || "resident_centered_support";
}

function makeGuidanceText(chapterId, priority, lens) {
  const priorityText = String(priority || "").toLowerCase();
  return `Review Chapter ${chapterId} (${priorityText}) - ${lens}`;
}

export function computeResultsPayload({
  attempt,
  questionAttempts,
  contentTags,
  bankCorrectByQid,
}) {
  if (!attempt || !attempt.attempt_id) {
    throw new Error("computeResultsPayload: missing attempt.attempt_id");
  }

  const status = attempt.status;
  if (status !== "submitted" && status !== "time_expired") {
    throw new Error(
      `computeResultsPayload: illegal status "${status}" (must be submitted or time_expired)`
    );
  }

  if (!Array.isArray(questionAttempts)) {
    throw new Error("computeResultsPayload: questionAttempts must be an array");
  }
  if (!contentTags || typeof contentTags !== "object") {
    throw new Error("computeResultsPayload: contentTags must be an object mapping question_id -> tags");
  }
  if (!bankCorrectByQid || typeof bankCorrectByQid !== "object") {
    throw new Error("computeResultsPayload: bankCorrectByQid must be an object mapping question_id -> correct_answer_id");
  }

  const scored = questionAttempts.map((qa) => {
    const qid = qa && qa.question_id;
    if (!qid) {
      throw new Error("computeResultsPayload: missing questionAttempt.question_id");
    }

    const selected = qa.selected_answer_id ?? null;
    const correct = bankCorrectByQid[qid];
    if (!correct) {
      throw new Error(`computeResultsPayload: missing correct answer for question_id ${qid}`);
    }

    const tags = contentTags[qid];
    if (!tags) {
      throw new Error(`computeResultsPayload: missing contentTags for question_id ${qid}`);
    }

    const categoryId = tags.category_id;
    const chapterId = Number(tags.chapter_id);
    if (!categoryId) {
      throw new Error(`computeResultsPayload: missing category_id in contentTags for question_id ${qid}`);
    }
    if (!CANON_CATEGORY_SET.has(categoryId)) {
      throw new Error(`computeResultsPayload: unknown category_id "${categoryId}" for question_id ${qid}`);
    }
    if (!chapterId || !CHAPTER_IDS.includes(chapterId)) {
      throw new Error(`computeResultsPayload: missing or invalid chapter_id for question_id ${qid}`);
    }

    const isCorrect = selected !== null && selected === correct;

    return {
      question_id: qid,
      selected_answer_id: selected,
      is_correct: isCorrect,
      category_id: categoryId,
      chapter_id: chapterId,
      prometric_signal: tags.prometric_signal || "",
    };
  });

  const totalQuestions = scored.length;
  const correctCount = scored.reduce((acc, row) => acc + (row.is_correct ? 1 : 0), 0);
  const overallAccuracy = totalQuestions === 0 ? 0 : correctCount / totalQuestions;

  const catTotals = {};
  const catCorrect = {};
  const categoryOutcomes = {};
  const categoryPatternCounts = {};
  const chapterTotals = {};
  const chapterCorrect = {};
  const overallPatternCounts = {};

  CANON_CATEGORIES.forEach((categoryId) => {
    catTotals[categoryId] = 0;
    catCorrect[categoryId] = 0;
    categoryOutcomes[categoryId] = [];
    categoryPatternCounts[categoryId] = {};
  });

  CHAPTER_IDS.forEach((chapterId) => {
    chapterTotals[chapterId] = 0;
    chapterCorrect[chapterId] = 0;
  });

  scored.forEach((row) => {
    catTotals[row.category_id] += 1;
    if (row.is_correct) catCorrect[row.category_id] += 1;
    categoryOutcomes[row.category_id].push(row.is_correct ? 1 : 0);

    chapterTotals[row.chapter_id] += 1;
    if (row.is_correct) chapterCorrect[row.chapter_id] += 1;

    if (!row.is_correct) {
      const patternId = classifyPrometricPattern({
        signal: row.prometric_signal,
        categoryId: row.category_id,
      });
      categoryPatternCounts[row.category_id][patternId] =
        (categoryPatternCounts[row.category_id][patternId] || 0) + 1;
      overallPatternCounts[patternId] = (overallPatternCounts[patternId] || 0) + 1;
    }
  });

  const chapterPerformance = CHAPTER_IDS.map((chapterId) => {
    const total = chapterTotals[chapterId];
    const correct = chapterCorrect[chapterId];
    const accuracy = total === 0 ? null : correct / total;
    return {
      chapter_id: chapterId,
      n_total: total,
      n_correct: correct,
      accuracy,
    };
  });

  const chapterAccuracyById = Object.fromEntries(
    chapterPerformance.map((chapter) => [chapter.chapter_id, chapter.accuracy])
  );

  const categoryMeta = CANON_CATEGORIES.map((categoryId) => {
    const nTotal = catTotals[categoryId];
    const nCorrect = catCorrect[categoryId];
    const nWrong = nTotal - nCorrect;
    const accuracy = nTotal === 0 ? null : nCorrect / nTotal;

    let level = "Developing";
    if (accuracy === null) level = "Strong";
    else if (accuracy >= 0.8) level = "Strong";
    else if (accuracy >= 0.7) level = "Developing";
    else level = "Weak";

    const isHighRisk = HIGH_RISK_CATEGORIES.has(categoryId);
    const highRiskFlag = isHighRisk && accuracy !== null && accuracy < 0.7;
    const label =
      highRiskFlag ? "High-Risk Flag" : accuracy !== null && accuracy >= 0.8 ? "Strength" : "Weakness";

    const consistency = computeConsistencyMetrics(categoryOutcomes[categoryId]);
    const dominantPattern = pickDominantPattern(categoryPatternCounts[categoryId]);
    const mapping = CATEGORY_TO_CHAPTERS[categoryId];
    if (!mapping) {
      throw new Error(`computeResultsPayload: missing CATEGORY_TO_CHAPTERS mapping for ${categoryId}`);
    }

    const primaryChapterAccuracies = mapping.primary
      .map((chapterId) => chapterAccuracyById[chapterId])
      .filter((value) => value !== null && value !== undefined);
    const primaryChapterAccuracy = average(primaryChapterAccuracies);
    const chapterReinforcement =
      primaryChapterAccuracy === null ? 0 : clamp01((0.75 - primaryChapterAccuracy) / 0.75);

    const sampleConfidence = Math.min(1, nTotal / 4);
    const deficit = accuracy === null ? 0 : Math.max(0, 1 - accuracy);
    const highRiskBonus = isHighRisk ? 0.22 : 0;
    const levelBonus = level === "Weak" ? 0.18 : level === "Developing" ? 0.08 : 0;
    const consistencyBonus = consistency.weaknessConsistency * 0.18;
    const chapterBonus = chapterReinforcement * 0.16;
    const priorityScore = round4(
      deficit * sampleConfidence + highRiskBonus + levelBonus + consistencyBonus + chapterBonus
    );

    return {
      category_id: categoryId,
      label,
      level,
      accuracy,
      n_total: nTotal,
      n_correct: nCorrect,
      n_wrong: nWrong,
      is_high_risk: isHighRisk,
      consistency_score: consistency.weaknessConsistency,
      stability_score: consistency.stability,
      patterned_weakness: consistency.patternedWeakness,
      dominant_error_pattern: dominantPattern,
      chapter_reinforcement_score: round4(chapterReinforcement),
      priority_score: priorityScore,
      primary_chapter_accuracy:
        primaryChapterAccuracy === null ? null : round4(primaryChapterAccuracy),
    };
  });

  const category_diagnosis = categoryMeta.map(({ category_id, label }) => ({
    category_id,
    label,
  }));

  const overallPct = overallAccuracy * 100;
  const highRiskAccuracies = categoryMeta
    .filter((category) => HIGH_RISK_CATEGORIES.has(category.category_id))
    .map((category) => category.accuracy)
    .filter((accuracy) => accuracy !== null);

  const anyHighRiskBelow70 = highRiskAccuracies.some((accuracy) => accuracy < 0.7);
  const anyHighRisk65to69 = highRiskAccuracies.some((accuracy) => accuracy >= 0.65 && accuracy < 0.7);
  const anyHighRiskBelow65 = highRiskAccuracies.some((accuracy) => accuracy < 0.65);

  let overall_status = "Borderline";
  if (overallPct >= 80 && !anyHighRiskBelow70) {
    overall_status = "On Track";
  } else if (overallPct < 70 || anyHighRiskBelow65) {
    overall_status = "High Risk";
  } else if ((overallPct >= 70 && overallPct < 80) || anyHighRisk65to69) {
    overall_status = "Borderline";
  }

  const prioritizedCategories = categoryMeta
    .filter((category) => {
      if (HIGH_RISK_CATEGORIES.has(category.category_id)) {
        return category.accuracy !== null && category.accuracy < 0.8;
      }
      return category.accuracy !== null && category.accuracy < 0.7;
    })
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if (b.chapter_reinforcement_score !== a.chapter_reinforcement_score) {
        return b.chapter_reinforcement_score - a.chapter_reinforcement_score;
      }
      return a.category_id.localeCompare(b.category_id);
    })
    .slice(0, 2);

  const chapterGuidanceMap = new Map();
  const pushGuidance = (chapterId, priority, lens) => {
    const key = `${chapterId}:${priority}:${lens}`;
    if (chapterGuidanceMap.has(key)) return;
    chapterGuidanceMap.set(key, {
      chapter_id: chapterId,
      priority,
      guidance_text: makeGuidanceText(chapterId, priority, lens),
    });
  };

  prioritizedCategories.forEach((category) => {
    const mapping = CATEGORY_TO_CHAPTERS[category.category_id];
    const primaryChapterId = mapping.primary[0] ?? null;
    const secondaryChapterId = mapping.secondary[0] ?? null;
    const primaryChapterAccuracy =
      primaryChapterId === null ? null : chapterAccuracyById[primaryChapterId];

    const shouldPromotePrimary =
      category.level === "Weak" ||
      (primaryChapterAccuracy !== null && primaryChapterAccuracy < 0.7) ||
      (category.is_high_risk && category.chapter_reinforcement_score >= 0.12);

    if (shouldPromotePrimary && primaryChapterId !== null) {
      pushGuidance(primaryChapterId, "Primary", mapping.lens);
    }

    if (secondaryChapterId !== null && category.level !== "Strong") {
      pushGuidance(secondaryChapterId, "Secondary", mapping.lens);
    }
  });

  const chapter_guidance = Array.from(chapterGuidanceMap.values());

  const category_priority = categoryMeta
    .filter((category) => category.accuracy !== null)
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return a.category_id.localeCompare(b.category_id);
    })
    .map((category) => ({
      category_id: category.category_id,
      level: category.level,
      accuracy: category.accuracy,
      is_high_risk: category.is_high_risk,
      consistency_score: category.consistency_score,
      stability_score: category.stability_score,
      patterned_weakness: category.patterned_weakness,
      dominant_error_pattern: category.dominant_error_pattern,
      chapter_reinforcement_score: category.chapter_reinforcement_score,
      priority_score: category.priority_score,
      n_total: category.n_total,
      n_wrong: category.n_wrong,
    }));

  const dominantErrorPattern = pickDominantPattern(overallPatternCounts);

  return {
    attempt_id: attempt.attempt_id,
    overall_status,
    category_diagnosis,
    chapter_guidance,
    category_priority,
    analytics_meta: {
      overall_accuracy: round4(overallAccuracy),
      dominant_error_pattern: dominantErrorPattern
        ? {
            pattern_id: dominantErrorPattern,
            label: ERROR_PATTERN_LABELS[dominantErrorPattern] || dominantErrorPattern,
            miss_count: overallPatternCounts[dominantErrorPattern] || 0,
          }
        : null,
      chapter_performance: chapterPerformance.map((chapter) => ({
        chapter_id: chapter.chapter_id,
        n_total: chapter.n_total,
        n_correct: chapter.n_correct,
        accuracy: chapter.accuracy === null ? null : round4(chapter.accuracy),
      })),
    },
  };
}
