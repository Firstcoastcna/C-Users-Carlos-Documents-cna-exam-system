import {
  deleteRemediationSession as deleteLocalRemediationSession,
  loadAllRemediationSessions as loadAllLocalRemediationSessions,
  loadRemediationSession as loadLocalRemediationSession,
  saveRemediationSession as saveLocalRemediationSession,
} from "./remediationSessionStorage";
import { isServerPersistenceEnabled } from "./backend/config";
import {
  loadAllServerRemediationSessions,
  loadServerRemediationSession,
  saveServerRemediationSession,
} from "./backend/serverRemediationSessionStorage";

function shouldUseServerPersistence(options = {}) {
  return options.forceServer || isServerPersistenceEnabled();
}

export async function saveRemediationSessionRecord(session, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return saveServerRemediationSession(session, options);
  }
  saveLocalRemediationSession(session);
  return session;
}

export async function loadRemediationSessionRecord(sessionId, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadServerRemediationSession(sessionId, options);
  }
  return loadLocalRemediationSession(sessionId);
}

export async function loadAllRemediationSessionRecords(lang = null, options = {}) {
  if (shouldUseServerPersistence(options)) {
    return loadAllServerRemediationSessions(lang, options);
  }
  const sessions = loadAllLocalRemediationSessions();
  if (!lang) return sessions;
  return sessions.filter((item) => !item?.lang || item.lang === lang);
}

export function deleteRemediationSessionRecord(sessionId) {
  deleteLocalRemediationSession(sessionId);
}
