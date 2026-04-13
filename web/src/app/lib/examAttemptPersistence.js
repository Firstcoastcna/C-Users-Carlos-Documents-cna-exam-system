import { isServerPersistenceEnabled } from "./backend/config";
import {
  loadAllServerExamAttempts,
  loadServerExamAttempt,
  saveServerExamAttempt,
} from "./backend/serverExamAttemptStorage";

function shouldUseServerPersistence(options = {}) {
  return options.forceServer || isServerPersistenceEnabled();
}

export async function saveExamAttemptRecord(attempt, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return saveServerExamAttempt(attempt, options);
  }
  return attempt;
}

export async function loadExamAttemptRecord(attemptId, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadServerExamAttempt(attemptId, options);
  }
  return null;
}

export async function loadAllExamAttemptRecords(lang = null, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadAllServerExamAttempts(lang, options);
  }
  return [];
}
