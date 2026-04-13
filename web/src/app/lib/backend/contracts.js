/**
 * Shared persistence contracts for the future server-backed version.
 *
 * These are intentionally framework-light for now so we can build the backend
 * in parallel without changing the live local-storage app yet.
 */

/**
 * @typedef {Object} StudentIdentity
 * @property {string} userId
 * @property {string} email
 * @property {string} fullName
 */

/**
 * @typedef {Object} ExamRecord
 * @property {string} attemptId
 * @property {number} testId
 * @property {string} lang
 * @property {string} mode
 * @property {string[]} deliveredQuestionIds
 * @property {Object.<string, string>} answersByQid
 * @property {Object.<string, boolean>} reviewByQid
 * @property {number | null} score
 */

/**
 * @typedef {Object} PracticeRecord
 * @property {string} sessionId
 * @property {string} lang
 * @property {string} status
 * @property {"chapter" | "category" | "mixed"} mode
 * @property {number} questionCount
 */

/**
 * @typedef {Object} RemediationRecord
 * @property {string} sessionId
 * @property {string} lang
 * @property {string} status
 * @property {string[]} categories
 * @property {number} questionCount
 */

/**
 * @typedef {Object} AppPersistenceAdapter
 * @property {(userId: string) => Promise<StudentIdentity | null>} loadStudentIdentity
 * @property {(userId: string) => Promise<ExamRecord[]>} loadExamRecords
 * @property {(userId: string) => Promise<PracticeRecord[]>} loadPracticeRecords
 * @property {(userId: string) => Promise<RemediationRecord[]>} loadRemediationRecords
 */

export const CONTRACT_VERSION = 1;

