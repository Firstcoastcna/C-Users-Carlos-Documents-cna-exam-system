import { getSupabaseBrowserClient } from "../supabase/browserClient";
import { getPublicAppUrl } from "../config";

function getClient() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase browser auth is not configured.");
  }
  return supabase;
}

function normalizeAuthError(actionLabel, error) {
  const raw = error?.message || "Unable to continue.";
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("missing email") ||
    normalized.includes("missing email or phone") ||
    normalized.includes("missing password")
  ) {
    return "Please enter your email and password to continue.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Account not found or password incorrect. If you are new here, tap Create Account.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  return `${actionLabel} failed. ${raw}`;
}

export async function signUpStudent({ email, password, fullName = "" }) {
  const supabase = getClient();
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : getPublicAppUrl();
  const emailRedirectTo = `${origin}/signin`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || undefined,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    throw new Error(normalizeAuthError("Account creation", error));
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
    throw new Error(normalizeAuthError("Sign in", error));
  }

  return data;
}

export async function signOutStudent() {
  const supabase = getClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(normalizeAuthError("Sign out", error));
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
    throw new Error(normalizeAuthError("Session check", error));
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

export async function requestPasswordReset(email, redirectPath = "/reset-password") {
  const supabase = getClient();
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : getPublicAppUrl();
  const normalizedRedirectPath = String(redirectPath || "/reset-password").startsWith("/")
    ? String(redirectPath || "/reset-password")
    : `/${String(redirectPath || "reset-password")}`;
  const redirectTo = `${origin}${normalizedRedirectPath}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw new Error(normalizeAuthError("Password reset", error));
  }
  return { ok: true };
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

export async function redeemAccessCode(code, lang = "en") {
  const session = await getStudentSessionSnapshot().catch(() => null);
  if (!session?.access_token) {
    throw new Error("Please sign in before entering an access code.");
  }

  const response = await fetch("/api/backend/access-codes/redeem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      code,
      preferredLanguage: lang,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Unable to redeem access code.");
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

export async function fetchOwnerOverview() {
  return fetchAuthenticatedJson("/api/backend/admin/overview");
}

export async function fetchOwnerStudentOverviewReport(userId, lang = "en") {
  return fetchAuthenticatedJson(
    `/api/backend/reports/student-overview?lang=${encodeURIComponent(lang)}&user_id=${encodeURIComponent(userId)}`
  );
}

export async function fetchOwnerClassOverviewReport(classGroupId, lang = "en") {
  return fetchAuthenticatedJson(
    `/api/backend/reports/class-overview?lang=${encodeURIComponent(lang)}&class_group_id=${encodeURIComponent(classGroupId)}`
  );
}

async function postAuthenticatedJson(pathname, body) {
  const headers = await getAuthenticatedRequestHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetch(pathname, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Unable to post to ${pathname}.`);
  }

  return payload;
}

async function patchAuthenticatedJson(pathname, body) {
  const headers = await getAuthenticatedRequestHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetch(pathname, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Unable to update ${pathname}.`);
  }

  return payload;
}

async function deleteAuthenticatedJson(pathname) {
  const headers = await getAuthenticatedRequestHeaders();
  const response = await fetch(pathname, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Unable to delete ${pathname}.`);
  }

  return payload;
}

export async function createOwnerSchool(input) {
  return postAuthenticatedJson("/api/backend/admin/schools", input);
}

export async function createOwnerClassGroup(input) {
  return postAuthenticatedJson("/api/backend/admin/class-groups", input);
}

export async function createOwnerAccessCode(input) {
  return postAuthenticatedJson("/api/backend/admin/access-codes", input);
}

export async function createOwnerUser(input) {
  return postAuthenticatedJson("/api/backend/admin/users", input);
}

export async function deleteOwnerSchool(id) {
  return deleteAuthenticatedJson(`/api/backend/admin/schools?id=${encodeURIComponent(id)}`);
}

export async function deleteOwnerClassGroup(id) {
  return deleteAuthenticatedJson(`/api/backend/admin/class-groups?id=${encodeURIComponent(id)}`);
}

export async function clearOwnerClassEnrollments(id) {
  return patchAuthenticatedJson("/api/backend/admin/class-groups", {
    id,
    action: "clear-enrollments",
  });
}

export async function deleteOwnerAccessCode(id) {
  return deleteAuthenticatedJson(`/api/backend/admin/access-codes?id=${encodeURIComponent(id)}`);
}

export async function updateOwnerAccessCodeStatus(id, status) {
  return patchAuthenticatedJson("/api/backend/admin/access-codes", { id, status });
}
