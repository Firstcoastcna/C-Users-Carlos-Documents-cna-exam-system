import { getPublicAppUrl } from "./config";
import { getAuthenticatedRequestHeaders } from "./auth/browserAuth";
import {
  fromServerExamAttemptRecord,
  toExamAttemptIndexEntry,
  toServerExamAttemptRecord,
} from "./examAttemptSerializer";

function buildExamAttemptsQuery(query = "", serverUser = null) {
  const params = new URLSearchParams(query);
  if (serverUser) params.set("server_user", serverUser);
  const text = params.toString();
  return text ? `?${text}` : "";
}

function getExamAttemptsUrl(query = "", serverUser = null) {
  const base = typeof window !== "undefined" ? "" : getPublicAppUrl();
  return `${base}/api/backend/exam-attempts${buildExamAttemptsQuery(query, serverUser)}`;
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || fallbackMessage);
  }
  return payload;
}

export async function saveServerExamAttempt(attempt, options = {}) {
  if (!attempt?.attempt_id) {
    throw new Error("saveServerExamAttempt: attempt.attempt_id is required");
  }

  const body = toServerExamAttemptRecord(attempt);
  const headers = await getAuthenticatedRequestHeaders({ "Content-Type": "application/json" });

  const response = await fetch(getExamAttemptsUrl("", options.serverUser || null), {
    method: "PUT",
    headers,
    body: JSON.stringify({
      ...body,
      serverUser: options.serverUser || null,
    }),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to save server exam attempt.");
  return fromServerExamAttemptRecord(payload.attempt);
}

export async function loadServerExamAttempt(attemptId, options = {}) {
  if (!attemptId) return null;

  const response = await fetch(
    getExamAttemptsUrl(`attempt_id=${encodeURIComponent(attemptId)}`, options.serverUser || null),
    {
      method: "GET",
      headers: await getAuthenticatedRequestHeaders(),
      cache: "no-store",
    }
  );

  const payload = await parseResponse(response, "Unable to load server exam attempt.");
  return fromServerExamAttemptRecord(payload.attempt);
}

export async function loadAllServerExamAttempts(lang = null, options = {}) {
  const query = lang ? `lang=${encodeURIComponent(lang)}` : "";
  const response = await fetch(getExamAttemptsUrl(query, options.serverUser || null), {
    method: "GET",
    headers: await getAuthenticatedRequestHeaders(),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to list server exam attempts.");
  return Array.isArray(payload.attempts)
    ? payload.attempts
        .map((attempt) => toExamAttemptIndexEntry(fromServerExamAttemptRecord(attempt)))
        .filter(Boolean)
    : [];
}
