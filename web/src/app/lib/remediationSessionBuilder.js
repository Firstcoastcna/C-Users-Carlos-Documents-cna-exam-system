import { selectRemediationQuestions } from "./remediationQuestionSelector";
import { saveRemediationSession } from "./remediationSessionStorage";

// Phase 6 — Step 6.1
// Remediation Session Builder (logic only)
// IMPORTANT: No UI, no persistence, no ResultsPayload updates.

// Canon category → chapter mapping
// This mapping is remediation-specific and must reflect the real question-bank distribution
// (category_tag × chapter_tag pools). Update only when the bank/tagging changes.

const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [1],
    secondary: [3, 5],
  },

  "Change in Condition": {
    primary: [5],
    secondary: [3, 2],
  },

  "Observation & Safety": {
    primary: [2],
    secondary: [3, 4], // tie between 3 and 4; 3 listed first
  },

  "Environment & Safety": {
    primary: [2],
    secondary: [4, 5],
  },

  "Infection Control": {
    primary: [4],
    secondary: [2, 1],
  },

  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4, 5],
  },

  "Mobility & Positioning": {
    primary: [3],
    secondary: [4, 5], // 4 and 5 tied; 4 listed first
  },

  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1, 3],
  },

  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [4, 5],
  },
};

export function buildRemediationSession({
  mode,                 // "targeted" | "focused" (mapping later to Canon Mode A/B)
  resultsPayload,        // read-only Phase 4 output (persisted)
  questionBankSnapshot,  // bank index / questions (read-only)
  priorRemediationState, // optional: used later for loop control (Step 6.5)
}) {
    // ---- Guardrails (Step 6.1) ----

  if (!resultsPayload) {
    throw new Error("buildRemediationSession: resultsPayload is required (read-only)");
  }

  if (!questionBankSnapshot) {
    throw new Error("buildRemediationSession: questionBankSnapshot is required (read-only)");
  }

  if (mode !== "targeted" && mode !== "focused") {
    throw new Error("buildRemediationSession: invalid mode");
  }

console.log(
  "REM BUILD: snapshot length",
  Array.isArray(questionBankSnapshot) ? questionBankSnapshot.length : Object.keys(questionBankSnapshot).length
);


  // NOTE:
  // - resultsPayload MUST be treated as read-only
  // - No exam analytics may be recomputed here
  // - No readiness, scoring, or persistence allowed

  // TODO (Step 6.1): Select up to 2 categories deterministically using locked Phase 5 rules.
  // TODO (Step 6.1): Allocate 10–15 questions fixed at session start.
  // TODO (Step 6.1): Source questions from Primary then Secondary chapters, respecting 2-chapter cap.
  // TODO (Step 6.1): Return a pure session object (no side effects).

    // ---- Step 6.1: Read persisted category priority (read-only) ----

  const rankedCategories = Array.isArray(resultsPayload.category_priority)
    ? resultsPayload.category_priority
    : [];

    // ---- Step 6.1: Select target categories (Phase 5 rules) ----

  const highRisk = rankedCategories.filter((c) => c.is_high_risk);
  const nonHighRisk = rankedCategories.filter((c) => !c.is_high_risk);

  const selectedCategories = [...highRisk, ...nonHighRisk]
    .slice(0, 2)
    .map((c) => c.category_id);

    // ---- Step 6.1: Lock remediation question count ----

  // Canon rule: 10–15 questions total, fixed at session start
  const TOTAL_QUESTIONS = 12; // deterministic default within allowed range

  let perCategoryCount = {};

  if (selectedCategories.length === 2) {
    const half = Math.floor(TOTAL_QUESTIONS / 2);
    perCategoryCount[selectedCategories[0]] = half;
    perCategoryCount[selectedCategories[1]] = TOTAL_QUESTIONS - half;
  } else if (selectedCategories.length === 1) {
    perCategoryCount[selectedCategories[0]] = TOTAL_QUESTIONS;
  }

    // ---- Step 6.1: Determine chapter sourcing per category ----

  const categoryChapterSources = {};

  selectedCategories.forEach((category_id) => {
    const mapping = CATEGORY_TO_CHAPTERS[category_id];
    if (!mapping) {
      throw new Error(`Missing chapter mapping for category: ${category_id}`);
    }

    // Canon rule: Primary first, then Secondary, max 2 chapters
    const chapters = [
      ...mapping.primary,
      ...mapping.secondary,
    ].slice(0, 2);

    categoryChapterSources[category_id] = chapters;
  });


  // ---- Step 6.3: Populate remediation questions ----
console.log(
  "BUILDER priorRemediationState.rotationOffset =",
  priorRemediationState?.rotationOffset
);

const rotationOffset = Number(priorRemediationState?.rotationOffset || 0);

const { selectedQuestionIds } = selectRemediationQuestions({
  selectedCategories,
  perCategoryCount,
  categoryChapterSources,
  questionBankSnapshot,
  previouslySeenQuestionIds: priorRemediationState?.seenQuestionIds || [],
  rotationOffset,
});


    // ---- Step 6.3: Create remediation session object ----

  const session = {
    session_id: `rem_${Date.now()}`,
    created_at: Date.now(),
    mode,
    results_attempt_id: resultsPayload.attempt_id,


    // Locked at session start
    selectedCategories,
    totalQuestions: TOTAL_QUESTIONS,
    perCategoryCount,
    categoryChapterSources,

    // To be filled by Step 6.2 selector
        questionIds: selectedQuestionIds,

  questionsById: Object.fromEntries(
    selectedQuestionIds.map((qid) => [qid, questionBankSnapshot.find(q => q.question_id === qid)])
  ),

    // Session flow state
    currentIndex: 0,

    // Micro-outcomes (Step 6.4)
    answers: {},

    // Status
    status: "active", // active | completed | exited
  };

  saveRemediationSession(session);

  return session;


}
