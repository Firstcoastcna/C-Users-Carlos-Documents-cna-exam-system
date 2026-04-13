// src/app/lib/finalizeAttemptAnalytics.js

import { computeResultsPayload } from "./analytics/computeResultsPayload";
import { persistResultsPayloadWriteOnce } from "./analytics/persistResultsPayloadWriteOnce";

/**
 * Finalize analytics for an ended attempt (submitted or time_expired).
 * Non-UI helper: compute + write-once persist.
 */
export function finalizeAttemptAnalytics({
  attemptId,
  endStatus, // "submitted" | "time_expired"
  deliveredQuestionIds,
  answersByQid,
  bankById,
}) {
  if (!attemptId) return { ok: false, reason: "missing_attempt_id" };
  if (endStatus !== "submitted" && endStatus !== "time_expired") {
    return { ok: false, reason: "invalid_end_status" };
  }

  // Build QuestionAttempt[] from current exam state
  const questionAttempts = deliveredQuestionIds.map((qid) => ({
    question_id: qid,
    selected_answer_id: answersByQid[qid] ?? null,
  }));

  // Build contentTags snapshot (question_id → category_id, chapter_id)
  const contentTags = {};
  deliveredQuestionIds.forEach((qid) => {
    const q = bankById[qid];
    if (!q) return;
    contentTags[qid] = {
      category_id: q.category_tag,
      chapter_id: q.chapter_tag,
      prometric_signal: q?.variants?.en?.rationale?.prometric_signal || "",
      cue_type_tag: q.cue_type_tag ?? null,
      judgment_move_tag: q.judgment_move_tag ?? null,
      skill_domain_tag: q.skill_domain_tag ?? null,
      difficulty_tag: q.difficulty_tag ?? q.difficulty ?? null,
    };
  });

  // Build correct-answer map
  const bankCorrectByQid = {};
  deliveredQuestionIds.forEach((qid) => {
    const q = bankById[qid];
    if (!q) return;
    bankCorrectByQid[qid] = q.correct_answer;
  });

  const attempt = {
    attempt_id: attemptId,
    status: endStatus,
  };

  try {
    const resultsPayload = computeResultsPayload({
      attempt,
      questionAttempts,
      contentTags,
      bankCorrectByQid,
    });

    persistResultsPayloadWriteOnce(resultsPayload);
    return { ok: true, resultsPayload };
  } catch (e) {
    return { ok: false, reason: "exception", error: String(e?.message || e) };
  }
}
