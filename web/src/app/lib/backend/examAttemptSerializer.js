export function toExamAttemptIndexEntry(attempt) {
  if (!attempt?.attempt_id) return null;
  return {
    attempt_id: attempt.attempt_id,
    test_id: Number(attempt.test_id || 0),
    lang: attempt.lang || null,
    mode: attempt.mode || "exam",
    score: Number.isFinite(attempt.score) ? attempt.score : null,
    completed_at: attempt.completed_at || null,
    created_at: attempt.created_at || null,
    updated_at: attempt.updated_at || null,
  };
}

export function toServerExamAttemptRecord(attempt) {
  if (!attempt?.attempt_id) {
    throw new Error("toServerExamAttemptRecord: attempt.attempt_id is required");
  }

  const statePayload = {
    exam_form_id: attempt.exam_form_id || null,
    index: Number(attempt.index || 0),
    summaryPage: Number(attempt.summaryPage || 1),
    summaryFilter: attempt.summaryFilter || "all",
    endAtMs: Number.isFinite(attempt.endAtMs) ? attempt.endAtMs : null,
    pausedRemainingSec: Number.isFinite(attempt.pausedRemainingSec) ? attempt.pausedRemainingSec : null,
  };

  return {
    id: attempt.attempt_id,
    testId: Number(attempt.test_id || attempt.testId || 0),
    lang: attempt.lang || null,
    mode: attempt.mode || "exam",
    score: Number.isFinite(attempt.score) ? attempt.score : null,
    completedAt: attempt.completedAt || attempt.completed_at || null,
    deliveredQuestionIds: Array.isArray(attempt.question_ids) ? attempt.question_ids : [],
    answersByQid: attempt.answersByQid || {},
    reviewByQid: attempt.reviewByQid || {},
    resultsPayload: {
      state: statePayload,
      final: attempt.resultsPayload || null,
    },
  };
}

export function fromServerExamAttemptRecord(record) {
  if (!record) return null;

  const state = record.results_payload?.state || {};
  const finalResults = record.results_payload?.final || null;

  return {
    attempt_id: record.id,
    test_id: Number(record.test_id || 0),
    lang: record.lang || null,
    mode: record.mode || "exam",
    score: Number.isFinite(record.score) ? record.score : null,
    completed_at: record.completed_at || null,
    question_ids: Array.isArray(record.delivered_question_ids) ? record.delivered_question_ids : [],
    answersByQid: record.answers_by_qid || {},
    reviewByQid: record.review_by_qid || {},
    exam_form_id: state.exam_form_id || null,
    index: Number(state.index || 0),
    summaryPage: Number(state.summaryPage || 1),
    summaryFilter: state.summaryFilter || "all",
    endAtMs: Number.isFinite(state.endAtMs) ? state.endAtMs : null,
    pausedRemainingSec: Number.isFinite(state.pausedRemainingSec) ? state.pausedRemainingSec : null,
    resultsPayload: finalResults,
    completed_at: record.completed_at || null,
    created_at: record.created_at || null,
    updated_at: record.updated_at || null,
  };
}
