import { getBackendMode, isServerPersistenceEnabled } from "./config";

function notReady(methodName) {
  const mode = getBackendMode();
  throw new Error(
    `[serverPersistenceAdapter] ${methodName} is not wired yet. Current mode: ${mode}. ` +
      `Keep using local mode until auth/database routes are implemented.`
  );
}

export const serverPersistenceAdapter = {
  async loadStudentIdentity() {
    if (!isServerPersistenceEnabled()) return null;
    notReady("loadStudentIdentity");
  },

  async loadExamRecords() {
    if (!isServerPersistenceEnabled()) return [];
    notReady("loadExamRecords");
  },

  async loadPracticeRecords() {
    if (!isServerPersistenceEnabled()) return [];
    notReady("loadPracticeRecords");
  },

  async loadRemediationRecords() {
    if (!isServerPersistenceEnabled()) return [];
    notReady("loadRemediationRecords");
  },
};

