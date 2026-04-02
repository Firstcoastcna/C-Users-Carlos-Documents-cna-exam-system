// Phase 6 — Step 6.3
// Remediation Session Storage (localStorage)
// IMPORTANT: Separate from exam attempts and analytics.

const STORAGE_PREFIX = "cna:remediation:";

function slimQuestionForStorage(q) {
  if (!q || typeof q !== "object") return q;

  // Keep ONLY what the remediation page needs to render question/options/rationale.
  // (Do NOT store any large bank snapshot or extra fields.)
  return {
    question_id: q.question_id,
    category_tag: q.category_tag,
    chapter_tag: q.chapter_tag,
    correct_answer: q.correct_answer,
    variants: q.variants, // needed for multilingual stem/options + rationale
  };
}

function makeSessionForIdStorage(session) {
  // Full session for /remediation?session_id=... needs questionsById,
  // but we store it compact.
  const next = { ...session };

  if (next.questionsById && typeof next.questionsById === "object") {
    const slim = {};
    for (const [qid, q] of Object.entries(next.questionsById)) {
      slim[qid] = slimQuestionForStorage(q);
    }
    next.questionsById = slim;
  }

  return next;
}

function makeSessionIndexEntry(session) {
  // Index list must be SMALL: never store questionsById or answers here.
  return {
    session_id: session.session_id,
    created_at: session.created_at,
    completed_at: session.completed_at,
    completion_ts: session.completion_ts,
    lang: session.lang || null,
    results_attempt_id: session.results_attempt_id,
    selectedCategories: session.selectedCategories || [],
    status: session.status,
    submitted_correct: session.submitted_correct,
    submitted_total: session.submitted_total,
    microOutcome: session.microOutcome,
  };
}


  const LIST_KEY = "cna:remediation:sessions";
const MAX_SESSIONS_TO_KEEP = 20;

function toIndexEntry(session) {
  if (!session) return null;

  return {
    session_id: session.session_id,
    created_at: session.created_at || Date.now(),
    completed_at: session.completed_at || null,
    lang: session.lang || null,

    // loop control / gating fields
    status: session.status || "active",
    results_attempt_id: session.results_attempt_id || null,
    selectedCategories: Array.isArray(session.selectedCategories) ? session.selectedCategories : [],

    // scoring summary
    submitted_correct: Number.isFinite(session.submitted_correct) ? session.submitted_correct : null,
    submitted_total: Number.isFinite(session.submitted_total) ? session.submitted_total : null,
    microOutcome: session.microOutcome || null,

    // IMPORTANT: needed for “seenQuestionIds” + rotation
    questionIds: Array.isArray(session.questionIds) ? session.questionIds : [],
  };
}

function cleanupOldSessionsIfNeeded(existingList) {
  const arr = Array.isArray(existingList) ? [...existingList] : [];

  // Sort oldest -> newest by created_at
  arr.sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));

  // If over limit, delete oldest session payload keys too
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

export function saveRemediationSession(session) {
  if (!session || !session.session_id) {
    throw new Error("saveRemediationSession: session.session_id is required");
  }

  // 0) Read current list first (so we can clean up BEFORE saving if needed)
  let arr = [];
  try {
    const raw = localStorage.getItem(LIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    arr = Array.isArray(parsed) ? parsed : [];
  } catch {
    arr = [];
  }

  // Normalize legacy entries (some may be full sessions) into index entries
  arr = arr
    .map((x) => (x && x.questionIds && x.questionsById ? toIndexEntry(x) : x))
    .map((x) => (x && x.session_id ? x : null))
    .filter(Boolean);

  // Pre-clean to reduce quota risk
  arr = cleanupOldSessionsIfNeeded(arr);

  // 1) Save full session by id (required for /remediation?session_id=...)
  const key = STORAGE_PREFIX + session.session_id;

  try {
    localStorage.setItem(key, JSON.stringify(session));
  } catch (e) {
    // If quota exceeded, aggressively delete oldest and retry once
    try {
      arr = cleanupOldSessionsIfNeeded(arr.slice(0, Math.max(0, arr.length - 5)));
      localStorage.setItem(LIST_KEY, JSON.stringify(arr));
      localStorage.setItem(key, JSON.stringify(session));
    } catch {
      throw e;
    }
  }

  // 2) Update index list with a SMALL entry (not the full session)
  try {
    const entry = toIndexEntry(session);

    const idx = arr.findIndex((s) => s && s.session_id === session.session_id);
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);

    // Keep list bounded
    arr = cleanupOldSessionsIfNeeded(arr);

    localStorage.setItem(LIST_KEY, JSON.stringify(arr));
  } catch {
    // never crash
  }
}

export function loadAllRemediationSessions() {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Return as-is (index entries). Some old installs may still have full sessions.
    return parsed
      .map((x) => (x && x.questionIds && x.questionsById ? toIndexEntry(x) : x))
      .filter((x) => x && x.session_id);
  } catch {
    return [];
  }
}


  export function loadRemediationSession(session_id) {
  if (!session_id) return null;

  const key = STORAGE_PREFIX + session_id;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteRemediationSession(session_id) {
  if (!session_id) return;

  const key = STORAGE_PREFIX + session_id;
  localStorage.removeItem(key);

  try {
    const listKey = "cna:remediation:sessions";
    const raw = localStorage.getItem(listKey);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;

    const next = list.filter((s) => s && s.session_id !== session_id);
    localStorage.setItem(listKey, JSON.stringify(next));
  } catch {
    // ignore
  }
}


