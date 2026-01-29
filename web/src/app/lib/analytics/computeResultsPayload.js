// src/app/lib/analytics/computeResultsPayload.js

/**
 * LOCKED CONTRACT: computeResultsPayload
 * - Runs ONLY when attempt.status is "submitted" or "time_expired"
 * - Pure computation (no UI, no localStorage, no router)
 * - Output: ResultsPayload { attempt_id, overall_status, category_diagnosis[], chapter_guidance[] }
 */

// Canon category identifiers (must match your frozen snapshot category_id values)
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

// High-risk override group (Canon)
const HIGH_RISK_CATEGORIES = new Set([
  "Scope of Practice & Reporting",
  "Change in Condition",
  "Infection Control",
]);

// Category → Chapter mapping table v1 (Canon)
const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [2],
    secondary: [5, 1],
    lens: "Is this within my role, or do I observe and report?",
  },
  "Change in Condition": {
    primary: [5],
    secondary: [3, 4],
    lens: "What is different from this resident’s baseline?",
  },
  "Observation & Safety": {
    primary: [3],
    secondary: [5, 4],
    lens: "What should I notice to prevent harm right now?",
  },
  "Environment & Safety": {
    primary: [1],
    secondary: [3],
    lens: "Is the physical space safe and supportive?",
  },
  "Infection Control": {
    primary: [2],
    secondary: [4, 3],
    lens: "What prevents contamination or spread of germs?",
  },
  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4],
    lens: "Am I supporting comfort, dignity, and independence?",
  },
  "Mobility & Positioning": {
    primary: [3],
    secondary: [4],
    lens: "Is the resident being moved safely and correctly?",
  },
  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1],
    lens: "How should I respond verbally and emotionally?",
  },
  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [3, 5],
    lens: "Am I preserving choice, privacy, and respect?",
  },
};

export function computeResultsPayload({ attempt, questionAttempts, contentTags, bankCorrectByQid }) {
  if (!attempt || !attempt.attempt_id) {
    throw new Error("computeResultsPayload: missing attempt.attempt_id");
  }

  const status = attempt.status;
  if (status !== "submitted" && status !== "time_expired") {
    throw new Error(
      `computeResultsPayload: illegal status "${status}" (must be submitted or time_expired)`
    );
  }

  // ----------------------------
  // Validate inputs
  // ----------------------------
  if (!Array.isArray(questionAttempts)) {
    throw new Error("computeResultsPayload: questionAttempts must be an array");
  }
  if (!contentTags || typeof contentTags !== "object") {
    throw new Error("computeResultsPayload: contentTags must be an object mapping question_id -> tags");
  }
  if (!bankCorrectByQid || typeof bankCorrectByQid !== "object") {
    throw new Error("computeResultsPayload: bankCorrectByQid must be an object mapping question_id -> correct_answer_id");
  }

  // ----------------------------
  // Score each question (post-exam only)
  // ----------------------------
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

    const is_correct = selected !== null && selected === correct;

    return {
      question_id: qid,
      selected_answer_id: selected,
      is_correct,
    };
  });

  const totalQuestions = scored.length;
  const correctCount = scored.reduce((acc, x) => acc + (x.is_correct ? 1 : 0), 0);
  const overall_accuracy = totalQuestions === 0 ? 0 : correctCount / totalQuestions;

  // ----------------------------
  // Category aggregates + diagnosis (must include all 9 categories)
  // ----------------------------
  const catTotals = {};
  const catCorrect = {};

  CANON_CATEGORIES.forEach((c) => {
    catTotals[c] = 0;
    catCorrect[c] = 0;
  });

  scored.forEach((row) => {
    const qid = row.question_id;
    const tags = contentTags[qid];
    if (!tags) {
      throw new Error(`computeResultsPayload: missing contentTags for question_id ${qid}`);
    }
    const category_id = tags.category_id;
    if (!category_id) {
      throw new Error(`computeResultsPayload: missing category_id in contentTags for question_id ${qid}`);
    }
    if (!(category_id in catTotals)) {
      throw new Error(`computeResultsPayload: unknown category_id "${category_id}" for question_id ${qid}`);
    }

    catTotals[category_id] += 1;
    if (row.is_correct) catCorrect[category_id] += 1;
  });

  const categoryMeta = CANON_CATEGORIES.map((category_id) => {
    const n_total = catTotals[category_id];
    const n_correct = catCorrect[category_id];

    const accuracy = n_total === 0 ? null : n_correct / n_total;

    // Internal tri-level (used later for prioritization rules)
    let level = "Developing";
    if (accuracy === null) level = "Strong"; // avoid false weakness; blueprint should prevent 0 coverage
    else if (accuracy >= 0.8) level = "Strong";
    else if (accuracy >= 0.7) level = "Developing";
    else level = "Weak";

    const isHighRisk = HIGH_RISK_CATEGORIES.has(category_id);
    const highRiskFlag = isHighRisk && accuracy !== null && accuracy < 0.7;

    // Tracking Spine output label enum:
    // If high-risk and <70% => "High-Risk Flag"
    // Else if >=80% => "Strength"
    // Else => "Weakness"
    const label = highRiskFlag ? "High-Risk Flag" : accuracy !== null && accuracy >= 0.8 ? "Strength" : "Weakness";

    return { category_id, label, level, accuracy };
  });

  const category_diagnosis = categoryMeta.map(({ category_id, label }) => ({
    category_id,
    label,
  }));

// ----------------------------
  // Overall readiness status (Canon)
  // ----------------------------
  const overallPct = overall_accuracy * 100;

  const highRiskAccuracies = categoryMeta
    .filter((c) => HIGH_RISK_CATEGORIES.has(c.category_id))
    .map((c) => c.accuracy)
    .filter((a) => a !== null);

  const anyHighRiskBelow70 = highRiskAccuracies.some((a) => a < 0.7);
  const anyHighRisk65to69 = highRiskAccuracies.some((a) => a >= 0.65 && a < 0.7);
  const anyHighRiskBelow65 = highRiskAccuracies.some((a) => a < 0.65);

  let overall_status = "Borderline";

  if (overallPct >= 80 && !anyHighRiskBelow70) {
    overall_status = "On Track";
  } else if (overallPct < 70 || anyHighRiskBelow65) {
    overall_status = "High Risk";
  } else if ((overallPct >= 70 && overallPct < 80) || anyHighRisk65to69) {
    overall_status = "Borderline";
  }

  // ----------------------------
  // Chapter guidance assembly (Canon)
  // ----------------------------

  // Prioritization tiers (deterministic, Canon-locked)
  const prioritizedCategories = categoryMeta
    .filter((c) => {
      if (HIGH_RISK_CATEGORIES.has(c.category_id)) {
        return c.accuracy !== null && c.accuracy < 0.8;
      }
      return c.accuracy !== null && c.accuracy < 0.7;
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2); // max 2 categories

  const chapter_guidance = [];

  prioritizedCategories.forEach((cat) => {
    const mapping = CATEGORY_TO_CHAPTERS[cat.category_id];
    if (!mapping) {
      throw new Error(
        `computeResultsPayload: missing CATEGORY_TO_CHAPTERS mapping for ${cat.category_id}`
      );
    }

    // Weak → Primary then Secondary
    if (cat.level === "Weak") {
      mapping.primary.slice(0, 1).forEach((ch) => {
        chapter_guidance.push({
          chapter_id: ch,
          priority: "Primary",
          guidance_text: `Review Chapter ${ch} (primary) — ${mapping.lens}`,
        });
      });

      mapping.secondary.slice(0, 1).forEach((ch) => {
        chapter_guidance.push({
          chapter_id: ch,
          priority: "Secondary",
          guidance_text: `Review Chapter ${ch} (secondary) — ${mapping.lens}`,
        });
      });
    }

    // Developing → Secondary only
    if (cat.level === "Developing") {
      mapping.secondary.slice(0, 1).forEach((ch) => {
        chapter_guidance.push({
          chapter_id: ch,
          priority: "Secondary",
          guidance_text: `Review Chapter ${ch} (secondary) — ${mapping.lens}`,
        });
      });
    }
  });

  // Placeholder output (Phase 4.1 will fill real logic next)
  return {
    attempt_id: attempt.attempt_id,
    overall_status,
    category_diagnosis,
    chapter_guidance,
  };
}
