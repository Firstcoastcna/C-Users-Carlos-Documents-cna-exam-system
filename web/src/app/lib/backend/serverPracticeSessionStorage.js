import { getPublicAppUrl } from "./config";
import { getAuthenticatedRequestHeaders } from "./auth/browserAuth";
import {
  fromServerPracticeSessionRecord,
  toPracticeSessionIndexEntry,
  toServerPracticeSessionRecord,
} from "./practiceSessionSerializer";

function buildPracticeSessionsQuery(query = "", serverUser = null) {
  const params = new URLSearchParams(query);
  if (serverUser) params.set("server_user", serverUser);
  const text = params.toString();
  return text ? `?${text}` : "";
}

function getPracticeSessionsUrl(query = "", serverUser = null) {
  const base = typeof window !== "undefined" ? "" : getPublicAppUrl();
  return `${base}/api/backend/practice-sessions${buildPracticeSessionsQuery(query, serverUser)}`;
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || fallbackMessage);
  }
  return payload;
}

export async function saveServerPracticeSession(session, options = {}) {
  if (!session?.session_id) {
    throw new Error("saveServerPracticeSession: session.session_id is required");
  }

  const body = toServerPracticeSessionRecord(session);
  const headers = await getAuthenticatedRequestHeaders({ "Content-Type": "application/json" });

  const response = await fetch(getPracticeSessionsUrl("", options.serverUser || null), {
    method: "PUT",
    headers,
    body: JSON.stringify({
      ...body,
      serverUser: options.serverUser || null,
    }),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to save server practice session.");
  return fromServerPracticeSessionRecord(payload.session);
}

export async function loadServerPracticeSession(sessionId, options = {}) {
  if (!sessionId) return null;

  const response = await fetch(
    getPracticeSessionsUrl(`session_id=${encodeURIComponent(sessionId)}`, options.serverUser || null),
    {
      method: "GET",
      headers: await getAuthenticatedRequestHeaders(),
      cache: "no-store",
    }
  );

  const payload = await parseResponse(response, "Unable to load server practice session.");
  return fromServerPracticeSessionRecord(payload.session);
}

export async function loadAllServerPracticeSessions(lang = null, options = {}) {
  const query = lang ? `lang=${encodeURIComponent(lang)}` : "";
  const response = await fetch(getPracticeSessionsUrl(query, options.serverUser || null), {
    method: "GET",
    headers: await getAuthenticatedRequestHeaders(),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to list server practice sessions.");
  return Array.isArray(payload.sessions)
    ? payload.sessions.map((session) => toPracticeSessionIndexEntry(fromServerPracticeSessionRecord(session))).filter(Boolean)
    : [];
}
