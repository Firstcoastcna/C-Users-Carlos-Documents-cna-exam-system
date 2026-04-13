// Phase 6 — Step 6.4
// Remediation Answer Recording (logic only)
// IMPORTANT: No analytics recomputation, no exam scoring, no persistence here.

import { loadRemediationSession, saveRemediationSession } from "./remediationSessionStorage";
import { loadRemediationSessionRecord, saveRemediationSessionRecord } from "./remediationSessionPersistence";

export function recordRemediationAnswer({
  session,
  questionId,
  selectedAnswerId, // "A" | "B" | "C" | "D" (or null)
  bankById, // read-only bank index: { [question_id]: question }
  mode = "select", // "select" | "submit"
}) {
  if (!session || typeof session !== "object") {
    throw new Error("recordRemediationAnswer: session is required");
  }
  if (!questionId) {
    throw new Error("recordRemediationAnswer: questionId is required");
  }
  if (!bankById || typeof bankById !== "object") {
    throw new Error("recordRemediationAnswer: bankById is required");
  }

  const q = bankById[questionId];
  if (!q) {
    throw new Error(`recordRemediationAnswer: question not found in bankById for ${questionId}`);
  }

  const correct = q.correct_answer;
  if (!correct) {
    throw new Error(`recordRemediationAnswer: missing correct_answer for ${questionId}`);
  }

  const prev = (session.answers || {})[questionId] || null;

  // If already submitted, do NOT allow changes (prevents "change after seeing correct answer")
  if (prev && prev.submitted) {
    return session; // no-op
  }

  // Selection is stored, but not scored until submit
  if (mode === "select") {
    const nextAnswers = {
      ...(session.answers || {}),
      [questionId]: {
        selected_answer_id: selectedAnswerId ?? null,
        submitted: false,
        is_correct: null, // not scored yet
      },
    };

    return {
      ...session,
      answers: nextAnswers,
    };
  }

  // Submit: must have a selected answer (use passed value if provided, otherwise existing selection)
  const finalSelected = selectedAnswerId ?? (prev ? prev.selected_answer_id : null) ?? null;
  if (!finalSelected) {
    return session; // no-op (UI will prevent submit when nothing selected)
  }

  const isCorrect = finalSelected === correct;

  const nextAnswers = {
    ...(session.answers || {}),
    [questionId]: {
      selected_answer_id: finalSelected,
      submitted: true,
      is_correct: isCorrect,
    },
  };

  return {
    ...session,
    answers: nextAnswers,
  };
}

export async function applyRemediationAnswerAndPersist({
  session_id,
  questionId,
  selectedAnswerId,
  bankById,
  mode = "select",
  forceServer = false,
  serverUser = null,
}) {
  const session = await loadRemediationSessionRecord(session_id, { forceServer, serverUser });
  if (!session) {
    throw new Error(`applyRemediationAnswerAndPersist: session not found for ${session_id}`);
  }

  const updated = recordRemediationAnswer({
    session,
    questionId,
    selectedAnswerId,
    bankById,
    mode,
  });

  await saveRemediationSessionRecord(updated, { forceServer, serverUser });
  return updated;
}

// ----------------------------
// Phase 6 — Completion + Summary (logic only)
// ----------------------------

export function computeRemediationSubmittedCounts(session) {
  const ids = session?.questionIds || [];
  const answers = session?.answers || {};
  let submitted_total = 0;
  let submitted_correct = 0;

  ids.forEach((qid) => {
    const a = answers[qid];
    if (a && a.submitted) {
      submitted_total += 1;
      if (a.is_correct === true) submitted_correct += 1;
    }
  });

  return { submitted_total, submitted_correct };
}

export function computeRemediationMicroOutcome(session) {
  const { submitted_total, submitted_correct } = computeRemediationSubmittedCounts(session);
  if (submitted_total === 0) return "Stabilizing";

  const acc = submitted_correct / submitted_total;

  // Same thresholds your page.js already uses
  if (acc >= 0.8) return "Resolved";
  if (acc >= 0.7) return "Improving";
  return "Stabilizing";
}

/**
 * Marks the session as completed ONLY when you decide criteria is met in UI.
 * - No exam analytics recompute
 * - No resultsPayload mutation
 */
export async function finalizeRemediationSessionCompletion({
  session_id,
  results_attempt_id,
  selectedCategories,
  forceServer = false,
  serverUser = null,
}) {
  const session = await loadRemediationSessionRecord(session_id, { forceServer, serverUser });
  if (!session) {
    throw new Error(`finalizeRemediationSessionCompletion: session not found for ${session_id}`);
  }

  const { submitted_total, submitted_correct } = computeRemediationSubmittedCounts(session);
  const microOutcome = computeRemediationMicroOutcome(session);

  const next = {
    ...session,
    status: "completed",
    completed_at: Date.now(),

    // Persist loop/gating inputs
    results_attempt_id: results_attempt_id ?? session.results_attempt_id ?? null,
    selectedCategories: selectedCategories ?? session.selectedCategories ?? [],

    submitted_total,
    submitted_correct,
    microOutcome,
  };

  await saveRemediationSessionRecord(next, { forceServer, serverUser });
  return next;
}

export async function markRemediationSessionExited({ session_id, forceServer = false, serverUser = null }) {
  const session = await loadRemediationSessionRecord(session_id, { forceServer, serverUser });
  if (!session) return null;

  // Do not overwrite completion
  if (session.status === "completed") return session;

  const next = {
    ...session,
    status: "exited",
    exited_at: Date.now(),
  };

  await saveRemediationSessionRecord(next, { forceServer, serverUser });
  return next;
}

