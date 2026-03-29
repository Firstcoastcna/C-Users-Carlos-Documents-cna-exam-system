import { loadAllPracticeSessions, savePracticeSession } from "./practiceSessionStorage";

function shuffle(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeQuestionBank(questionBankSnapshot) {
  return Array.isArray(questionBankSnapshot)
    ? questionBankSnapshot
    : Object.values(questionBankSnapshot || {});
}

function matchesMode(question, mode, selectedChapter, selectedCategory) {
  if (!question?.question_id) return false;
  if (mode === "chapter") return Number(question.chapter_tag) === Number(selectedChapter);
  if (mode === "category") return String(question.category_tag) === String(selectedCategory);
  return true;
}

function buildSeenQuestionIds() {
  const allSessions = loadAllPracticeSessions();
  const seen = new Set();
  allSessions.forEach((session) => {
    (session?.questionIds || []).forEach((qid) => seen.add(qid));
  });
  return seen;
}

export function buildPracticeSession({
  mode,
  questionCount,
  selectedChapter = null,
  selectedCategory = null,
  questionBankSnapshot,
}) {
  if (!questionBankSnapshot) {
    throw new Error("buildPracticeSession: questionBankSnapshot is required");
  }

  if (!["chapter", "category", "mixed"].includes(mode)) {
    throw new Error("buildPracticeSession: invalid mode");
  }

  if (mode === "chapter" && !selectedChapter) {
    throw new Error("buildPracticeSession: selectedChapter is required for chapter mode");
  }

  if (mode === "category" && !selectedCategory) {
    throw new Error("buildPracticeSession: selectedCategory is required for category mode");
  }

  const normalizedBank = normalizeQuestionBank(questionBankSnapshot).filter((question) =>
    matchesMode(question, mode, selectedChapter, selectedCategory)
  );

  if (!normalizedBank.length) {
    throw new Error("buildPracticeSession: no questions available for this practice setup");
  }

  const seenQuestionIds = buildSeenQuestionIds();
  const unseen = [];
  const seen = [];

  normalizedBank.forEach((question) => {
    if (seenQuestionIds.has(question.question_id)) seen.push(question);
    else unseen.push(question);
  });

  const ordered = [...shuffle(unseen), ...shuffle(seen)];
  const picked = ordered.slice(0, Math.min(Number(questionCount || 10), ordered.length));

  if (!picked.length) {
    throw new Error("buildPracticeSession: unable to select questions for practice");
  }

  const questionIds = picked.map((question) => question.question_id);
  const questionsById = Object.fromEntries(picked.map((question) => [question.question_id, question]));

  const session = {
    session_id: `practice_${Date.now()}`,
    created_at: Date.now(),
    status: "active",
    mode,
    selectedChapter: selectedChapter ? Number(selectedChapter) : null,
    selectedCategory: selectedCategory || null,
    totalQuestions: questionIds.length,
    questionIds,
    questionsById,
    currentIndex: 0,
    answers: {},
    submitted_correct: 0,
    submitted_total: 0,
  };

  savePracticeSession(session);
  return session;
}
