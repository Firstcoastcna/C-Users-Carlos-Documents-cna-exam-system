import { getSupabaseBrowserClient } from "../supabase/browserClient";

function getClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase browser auth is not configured.");
  }
  return supabase;
}

export async function signUpStudent({ email, password, fullName = "" }) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || undefined,
      },
    },
  });

  if (error) {
    throw new Error(`Supabase sign-up failed: ${error.message}`);
  }

  return data;
}

export async function signInStudent({ email, password }) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Supabase sign-in failed: ${error.message}`);
  }

  return data;
}

export async function signOutStudent() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Supabase sign-out failed: ${error.message}`);
  }
  return { ok: true };
}

export async function getStudentSessionSnapshot() {
  const supabase = getClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Supabase auth session check failed: ${error.message}`);
  }

  return session;
}

export async function syncStudentProfile() {
  const session = await getStudentSessionSnapshot();
  if (!session?.access_token) {
    return { ok: false, error: "No active session." };
  }

  const response = await fetch("/api/backend/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to sync student profile.");
  }

  return payload;
}

export async function fetchStudentProfile() {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    return null;
  }

  const response = await fetch("/api/backend/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to load student profile.");
  }

  return payload;
}

export async function updateStudentProfile(patch) {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    return null;
  }

  const response = await fetch("/api/backend/auth/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(patch || {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to update student profile.");
  }

  return payload;
}

export async function getAuthenticatedRequestHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function fetchStudentOverviewReport(lang = "en") {
  const headers = await getAuthenticatedRequestHeaders();
  const response = await fetch(`/api/backend/reports/student-overview?lang=${encodeURIComponent(lang)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to load student overview report.");
  }

  return payload;
}

export async function fetchUserPreferences() {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    return null;
  }

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
  };
  const response = await fetch("/api/backend/user-preferences", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to load user preferences.");
  }

  return payload;
}

export async function resolveStudentEntryState() {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    return {
      status: "signin",
      session: null,
      preferences: null,
    };
  }

  const prefsPayload = await fetchUserPreferences().catch(() => null);
  const preferences = prefsPayload?.preferences || null;

  return {
    status: preferences?.accessGranted ? "ready" : "access",
    session,
    preferences,
  };
}

export async function updateUserPreferences(patch) {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
  const response = await fetch("/api/backend/user-preferences", {
    method: "PUT",
    headers,
    body: JSON.stringify(patch || {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to save user preferences.");
  }

  return payload;
}

async function fetchAuthenticatedJson(pathname) {
  const headers = await getAuthenticatedRequestHeaders();
  const response = await fetch(pathname, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Unable to load ${pathname}.`);
  }

  return payload;
}

export async function bootstrapSchoolContext() {
  return fetchAuthenticatedJson("/api/backend/schools/bootstrap-check");
}

export async function fetchSchoolContext() {
  return fetchAuthenticatedJson("/api/backend/schools/my-context");
}

export async function bootstrapDemoClassData() {
  return fetchAuthenticatedJson("/api/backend/schools/bootstrap-demo-class-data");
}

export async function fetchClassOverviewReport(lang = "en") {
  return fetchAuthenticatedJson(`/api/backend/reports/class-overview?lang=${encodeURIComponent(lang)}`);
}
