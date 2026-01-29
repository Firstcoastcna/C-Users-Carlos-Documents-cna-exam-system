// src/app/lib/analytics/persistResultsPayloadWriteOnce.js

/**
 * LOCKED: Write-once persistence for ResultsPayload
 * Storage key: cna:results:<attempt_id>
 * - No recompute
 * - No partial writes
 * - No overwrite
 */
export function persistResultsPayloadWriteOnce(resultsPayload) {
  if (!resultsPayload || !resultsPayload.attempt_id) {
    throw new Error("persistResultsPayloadWriteOnce: missing resultsPayload.attempt_id");
  }

  const key = `cna:results:${resultsPayload.attempt_id}`;

  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      // Write-once: do nothing and fail safely
      return { ok: false, reason: "already_exists", key };
    }

    localStorage.setItem(key, JSON.stringify(resultsPayload));
    return { ok: true, reason: "saved", key };
  } catch (e) {
    return { ok: false, reason: "storage_error", key, error: String(e) };
  }
}
