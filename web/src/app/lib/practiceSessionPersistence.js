import {
  loadAllPracticeSessions as loadAllLocalPracticeSessions,
  loadPracticeSession as loadLocalPracticeSession,
  savePracticeSession as saveLocalPracticeSession,
} from "./practiceSessionStorage";
import { isServerPersistenceEnabled } from "./backend/config";
import {
  loadAllServerPracticeSessions,
  loadServerPracticeSession,
  saveServerPracticeSession,
} from "./backend/serverPracticeSessionStorage";

function shouldUseServerPersistence(options = {}) {
  return options.forceServer || isServerPersistenceEnabled();
}

export async function savePracticeSessionRecord(session, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return saveServerPracticeSession(session, options);
  }
  saveLocalPracticeSession(session);
  return session;
}

export async function loadPracticeSessionRecord(sessionId, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadServerPracticeSession(sessionId, options);
  }
  return loadLocalPracticeSession(sessionId);
}

export async function loadAllPracticeSessionRecords(lang = null, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadAllServerPracticeSessions(lang, options);
  }
  const sessions = loadAllLocalPracticeSessions();
  if (!lang) return sessions;
  return sessions.filter((item) => !item?.lang || item.lang === lang);
}
