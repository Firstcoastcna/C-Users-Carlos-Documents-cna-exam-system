function slimQuestionForStorage(question) {
  if (!question || typeof question !== "object") return question;
  return {
    question_id: question.question_id,
    category_tag: question.category_tag,
    chapter_tag: question.chapter_tag,
    correct_answer: question.correct_answer,
    variants: question.variants,
  };
}

export function toRemediationSessionIndexEntry(session) {
  if (!session?.session_id) return null;
  return {
    session_id: session.session_id,
    created_at: session.created_at || null,
    completed_at: session.completed_at || null,
    lang: session.lang || null,
    results_attempt_id: session.results_attempt_id || null,
    selectedCategories: Array.isArray(session.selectedCategories) ? session.selectedCategories : [],
    status: session.status || "active",
    submitted_correct: Number.isFinite(session.submitted_correct) ? session.submitted_correct : null,
    submitted_total: Number.isFinite(session.submitted_total) ? session.submitted_total : null,
    microOutcome: session.microOutcome || null,
    questionIds: Array.isArray(session.questionIds) ? session.questionIds : [],
  };
}

export function toStoredRemediationSession(session) {
  const storedSession = { ...session };
  if (storedSession.questionsById && typeof storedSession.questionsById === "object") {
    const slim = {};
    Object.entries(storedSession.questionsById).forEach(([qid, question]) => {
      slim[qid] = slimQuestionForStorage(question);
    });
    storedSession.questionsById = slim;
  }
  return storedSession;
}

export function toServerRemediationSessionRecord(session) {
  if (!session?.session_id) {
    throw new Error("toServerRemediationSessionRecord: session.session_id is required");
  }

  const storedSession = toStoredRemediationSession(session);
  return {
    id: storedSession.session_id,
    lang: storedSession.lang || null,
    status: storedSession.status || "active",
    categories: Array.isArray(storedSession.selectedCategories) ? storedSession.selectedCategories : [],
    questionCount: Number(storedSession.totalQuestions || storedSession.questionIds?.length || 0),
    payload: storedSession,
  };
}

export function fromServerRemediationSessionRecord(record) {
  if (!record) return null;
  return {
    ...(record.payload || {}),
    session_id: record.id,
    lang: record.lang || record.payload?.lang || null,
    status: record.status || record.payload?.status || "active",
    selectedCategories: Array.isArray(record.categories)
      ? record.categories
      : (record.payload?.selectedCategories || []),
    totalQuestions: Number(record.question_count || record.payload?.totalQuestions || record.payload?.questionIds?.length || 0),
    created_at: record.payload?.created_at || record.created_at || null,
    updated_at: record.payload?.updated_at || record.updated_at || null,
  };
}
