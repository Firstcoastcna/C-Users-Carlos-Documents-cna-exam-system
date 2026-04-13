export function getBackendMode() {
  const raw = process.env.NEXT_PUBLIC_APP_STORAGE_MODE || process.env.APP_STORAGE_MODE || "local";
  return String(raw).trim().toLowerCase();
}

export function isServerPersistenceEnabled() {
  return getBackendMode() === "server";
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getBackendConfigSnapshot() {
  return {
    mode: getBackendMode(),
    serverPersistenceEnabled: isServerPersistenceEnabled(),
    publicAppUrl: getPublicAppUrl(),
  };
}
