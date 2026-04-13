import { getPublicAppUrl } from "./config";
import { getAuthenticatedRequestHeaders } from "./auth/browserAuth";
import {
  fromServerRemediationSessionRecord,
  toRemediationSessionIndexEntry,
  toServerRemediationSessionRecord,
} from "./remediationSessionSerializer";

function buildRemediationSessionsQuery(query = "", serverUser = null) {
  const params = new URLSearchParams(query);
  if (serverUser) params.set("server_user", serverUser);
  const text = params.toString();
  return text ? `?${text}` : "";
}

function getRemediationSessionsUrl(query = "", serverUser = null) {
  const base = typeof window !== "undefined" ? "" : getPublicAppUrl();
  return `${base}/api/backend/remediation-sessions${buildRemediationSessionsQuery(query, serverUser)}`;
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || fallbackMessage);
  }
  return payload;
}

export async function saveServerRemediationSession(session, options = {}) {
  if (!session?.session_id) {
    throw new Error("saveServerRemediationSession: session.session_id is required");
  }

  const body = toServerRemediationSessionRecord(session);
  const headers = await getAuthenticatedRequestHeaders({ "Content-Type": "application/json" });

  const response = await fetch(getRemediationSessionsUrl("", options.serverUser || null), {
    method: "PUT",
    headers,
    body: JSON.stringify({
      ...body,
      serverUser: options.serverUser || null,
    }),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to save server remediation session.");
  return fromServerRemediationSessionRecord(payload.session);
}

export async function loadServerRemediationSession(sessionId, options = {}) {
  if (!sessionId) return null;

  const response = await fetch(
    getRemediationSessionsUrl(`session_id=${encodeURIComponent(sessionId)}`, options.serverUser || null),
    {
      method: "GET",
      headers: await getAuthenticatedRequestHeaders(),
      cache: "no-store",
    }
  );

  const payload = await parseResponse(response, "Unable to load server remediation session.");
  return fromServerRemediationSessionRecord(payload.session);
}

export async function loadAllServerRemediationSessions(lang = null, options = {}) {
  const query = lang ? `lang=${encodeURIComponent(lang)}` : "";
  const response = await fetch(getRemediationSessionsUrl(query, options.serverUser || null), {
    method: "GET",
    headers: await getAuthenticatedRequestHeaders(),
    cache: "no-store",
  });

  const payload = await parseResponse(response, "Unable to list server remediation sessions.");
  return Array.isArray(payload.sessions)
    ? payload.sessions
        .map((session) => toRemediationSessionIndexEntry(fromServerRemediationSessionRecord(session)))
        .filter(Boolean)
    : [];
}
