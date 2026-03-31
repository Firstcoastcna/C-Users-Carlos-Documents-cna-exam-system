const STORAGE_PREFIX = "cna:exam:question-history:";

function getHistoryKey(formId) {
  return `${STORAGE_PREFIX}${formId || "form_001"}`;
}

function normalizeHistoryMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw)
      .filter(([qid]) => qid)
      .map(([qid, count]) => [qid, Math.max(0, Number(count) || 0)])
  );
}

export function loadExamQuestionHistory(formId) {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(getHistoryKey(formId));
    if (!raw) return {};
    return normalizeHistoryMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveExamQuestionHistory(formId, historyMap) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getHistoryKey(formId), JSON.stringify(normalizeHistoryMap(historyMap)));
  } catch {
    // ignore storage quota / private mode issues
  }
}

export function recordExamQuestionUsage(formId, questionIds) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return;

  const historyMap = loadExamQuestionHistory(formId);
  questionIds.forEach((qid) => {
    if (!qid) return;
    historyMap[qid] = (historyMap[qid] || 0) + 1;
  });
  saveExamQuestionHistory(formId, historyMap);
}

export function collectOtherExamQuestionIds({
  formId,
  currentTestId,
  lang,
  maxTests = 4,
}) {
  if (typeof window === "undefined") return [];

  const ids = new Set();

  try {
    for (let testId = 1; testId <= maxTests; testId += 1) {
      if (Number(testId) === Number(currentTestId)) continue;

      const key = `cna_exam_state::${formId}::test_${testId}::${lang}`;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.question_ids)) continue;

      parsed.question_ids.forEach((qid) => {
        if (qid) ids.add(qid);
      });
    }
  } catch {
    return Array.from(ids);
  }

  return Array.from(ids);
}
