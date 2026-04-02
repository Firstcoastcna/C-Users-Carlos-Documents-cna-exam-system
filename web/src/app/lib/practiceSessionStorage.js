const STORAGE_PREFIX = "cna:practice:";
const LIST_KEY = "cna:practice:sessions";
const MAX_SESSIONS_TO_KEEP = 24;

function slimQuestionForStorage(q) {
  if (!q || typeof q !== "object") return q;
  return {
    question_id: q.question_id,
    category_tag: q.category_tag,
    chapter_tag: q.chapter_tag,
    correct_answer: q.correct_answer,
    variants: q.variants,
  };
}

function toIndexEntry(session) {
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

function cleanupOldSessions(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  arr.sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));

  while (arr.length > MAX_SESSIONS_TO_KEEP) {
    const oldest = arr.shift();
    if (oldest?.session_id) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + oldest.session_id);
      } catch {}
    }
  }

  return arr;
}

export function savePracticeSession(session) {
  if (!session?.session_id) {
    throw new Error("savePracticeSession: session.session_id is required");
  }

  let list = [];
  try {
    const raw = localStorage.getItem(LIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    list = Array.isArray(parsed) ? parsed : [];
  } catch {
    list = [];
  }

  const storedSession = { ...session };
  if (storedSession.questionsById && typeof storedSession.questionsById === "object") {
    const slim = {};
    Object.entries(storedSession.questionsById).forEach(([qid, q]) => {
      slim[qid] = slimQuestionForStorage(q);
    });
    storedSession.questionsById = slim;
  }

  localStorage.setItem(STORAGE_PREFIX + session.session_id, JSON.stringify(storedSession));

  const entry = toIndexEntry(session);
  const idx = list.findIndex((item) => item?.session_id === session.session_id);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);

  localStorage.setItem(LIST_KEY, JSON.stringify(cleanupOldSessions(list.filter(Boolean))));
}

export function loadPracticeSession(sessionId) {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sessionId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadAllPracticeSessions() {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.session_id) : [];
  } catch {
    return [];
  }
}
