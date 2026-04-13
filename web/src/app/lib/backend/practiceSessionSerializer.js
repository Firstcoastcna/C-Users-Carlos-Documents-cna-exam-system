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

export function toPracticeSessionIndexEntry(session) {
  if (!session?.session_id) return null;
  return {
    session_id: session.session_id,
    created_at: session.created_at || Date.now(),
    completed_at: session.completed_at || null,
    lang: session.lang || null,
    status: session.status || "active",
    mode: session.mode || "mixed",
    selectedChapter: session.selectedChapter || null,
    selectedCategory: session.selectedCategory || null,
    questionIds: Array.isArray(session.questionIds) ? session.questionIds : [],
    submitted_correct: Number.isFinite(session.submitted_correct) ? session.submitted_correct : null,
    submitted_total: Number.isFinite(session.submitted_total) ? session.submitted_total : null,
  };
}

export function toStoredPracticeSession(session) {
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

export function toServerPracticeSessionRecord(session) {
  const storedSession = toStoredPracticeSession(session);
  return {
    id: storedSession.session_id,
    lang: storedSession.lang || null,
    mode: storedSession.mode || "mixed",
    questionCount: Number(storedSession.totalQuestions || storedSession.questionIds?.length || 0),
    status: storedSession.status || "active",
    payload: storedSession,
  };
}

export function fromServerPracticeSessionRecord(record) {
  if (!record) return null;
  return {
    ...(record.payload || {}),
    session_id: record.id,
    lang: record.lang || record.payload?.lang || null,
    mode: record.mode || record.payload?.mode || "mixed",
    status: record.status || record.payload?.status || "active",
    totalQuestions: Number(record.question_count || record.payload?.totalQuestions || record.payload?.questionIds?.length || 0),
    created_at: record.payload?.created_at || record.created_at || null,
    updated_at: record.payload?.updated_at || record.updated_at || null,
  };
}

