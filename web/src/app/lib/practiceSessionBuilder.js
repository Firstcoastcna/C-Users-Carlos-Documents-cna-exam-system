import { loadAllPracticeSessions, savePracticeSession } from "./practiceSessionStorage";
import {
  loadAllPracticeSessionRecords,
  savePracticeSessionRecord,
} from "./practiceSessionPersistence";

function shuffle(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDifficultyBucket(question) {
  const raw = Number(question?.difficulty_tag ?? question?.difficulty ?? 2);
  if (raw <= 1) return "easy";
  if (raw >= 3) return "challenging";
  return "moderate";
}

function buildPracticeDifficultyPlan(count) {
  if (count <= 1) return ["moderate"];
  if (count === 2) return ["easy", "moderate"];
  if (count === 3) return ["easy", "moderate", "challenging"];
  if (count === 4) return ["easy", "moderate", "moderate", "challenging"];
  if (count === 5) return ["easy", "moderate", "moderate", "challenging", "moderate"];
  if (count === 6) return ["easy", "moderate", "moderate", "challenging", "moderate", "easy"];

  const plan = [];
  const easyCount = Math.max(1, Math.round(count * 0.2));
  const challengingCount = Math.max(1, Math.round(count * 0.2));
  const moderateCount = Math.max(1, count - easyCount - challengingCount);

  for (let i = 0; i < easyCount; i += 1) plan.push("easy");
  for (let i = 0; i < moderateCount; i += 1) plan.push("moderate");
  for (let i = 0; i < challengingCount; i += 1) plan.push("challenging");

  return shuffle(plan);
}

function pickPracticeQuestions(unseen, seen, count, rng = Math.random) {
  const targetCount = Math.max(1, Math.min(Number(count || 10), unseen.length + seen.length));
  const orderedPool = [...shuffle(unseen, rng), ...shuffle(seen, rng)];
  const plan = buildPracticeDifficultyPlan(targetCount);
  const picked = [];
  const usedIds = new Set();

  const takeMatching = (bucketName) => {
    const index = orderedPool.findIndex(
      (question) =>
        !usedIds.has(question.question_id) && getDifficultyBucket(question) === bucketName
    );
    if (index < 0) return null;
    const question = orderedPool[index];
    usedIds.add(question.question_id);
    picked.push(question);
    return question;
  };

  plan.forEach((bucketName) => {
    takeMatching(bucketName);
  });

  for (const question of orderedPool) {
    if (picked.length >= targetCount) break;
    if (usedIds.has(question.question_id)) continue;
    usedIds.add(question.question_id);
    picked.push(question);
  }

  return picked;
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

function buildSeenQuestionIds(lang = null) {
  const allSessions = loadAllPracticeSessions();
  const seen = new Set();
  allSessions.forEach((session) => {
    if (lang && session?.lang && session.lang !== lang) return;
    (session?.questionIds || []).forEach((qid) => seen.add(qid));
  });
  return seen;
}

async function buildSeenQuestionIdsRecord(lang = null, options = {}) {
  const allSessions = await loadAllPracticeSessionRecords(lang, options);
  const seen = new Set();
  allSessions.forEach((session) => {
    if (lang && session?.lang && session.lang !== lang) return;
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
  lang = null,
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

  const seenQuestionIds = buildSeenQuestionIds(lang);
  const unseen = [];
  const seen = [];

  normalizedBank.forEach((question) => {
    if (seenQuestionIds.has(question.question_id)) seen.push(question);
    else unseen.push(question);
  });

  const picked = pickPracticeQuestions(unseen, seen, questionCount);

  if (!picked.length) {
    throw new Error("buildPracticeSession: unable to select questions for practice");
  }

  const questionIds = picked.map((question) => question.question_id);
  const questionsById = Object.fromEntries(picked.map((question) => [question.question_id, question]));

  const session = {
    session_id: `practice_${Date.now()}`,
    created_at: Date.now(),
    lang: lang || null,
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

export async function buildPracticeSessionRecord({
  mode,
  questionCount,
  selectedChapter = null,
  selectedCategory = null,
  questionBankSnapshot,
  lang = null,
  forceServer = false,
  serverUser = null,
}) {
  if (!questionBankSnapshot) {
    throw new Error("buildPracticeSessionRecord: questionBankSnapshot is required");
  }

  if (!["chapter", "category", "mixed"].includes(mode)) {
    throw new Error("buildPracticeSessionRecord: invalid mode");
  }

  if (mode === "chapter" && !selectedChapter) {
    throw new Error("buildPracticeSessionRecord: selectedChapter is required for chapter mode");
  }

  if (mode === "category" && !selectedCategory) {
    throw new Error("buildPracticeSessionRecord: selectedCategory is required for category mode");
  }

  const normalizedBank = normalizeQuestionBank(questionBankSnapshot).filter((question) =>
    matchesMode(question, mode, selectedChapter, selectedCategory)
  );

  if (!normalizedBank.length) {
    throw new Error("buildPracticeSessionRecord: no questions available for this practice setup");
  }

  const seenQuestionIds = await buildSeenQuestionIdsRecord(lang, { forceServer, serverUser });
  const unseen = [];
  const seen = [];

  normalizedBank.forEach((question) => {
    if (seenQuestionIds.has(question.question_id)) seen.push(question);
    else unseen.push(question);
  });

  const picked = pickPracticeQuestions(unseen, seen, questionCount);

  if (!picked.length) {
    throw new Error("buildPracticeSessionRecord: unable to select questions for practice");
  }

  const questionIds = picked.map((question) => question.question_id);
  const questionsById = Object.fromEntries(picked.map((question) => [question.question_id, question]));

  const session = {
    session_id: `practice_${Date.now()}`,
    created_at: Date.now(),
    lang: lang || null,
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

  await savePracticeSessionRecord(session, { forceServer, serverUser });
  return session;
}
