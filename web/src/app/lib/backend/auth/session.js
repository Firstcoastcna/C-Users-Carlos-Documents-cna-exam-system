import { getBackendMode } from "../config";
import { getSupabaseBrowserClient } from "../supabase/browserClient";
import { getSupabaseServerClient } from "../supabase/serverClient";
import { getSupabaseConfigSnapshot, hasSupabaseBrowserConfig } from "../supabase/config";

export function getAuthConfig() {
  return {
    mode: getBackendMode(),
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authBaseUrl: process.env.AUTH_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    provider: hasSupabaseBrowserConfig() ? "supabase" : "unconfigured",
    supabase: getSupabaseConfigSnapshot(),
  };
}

function normalizeSupabaseUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || null,
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      null,
    rawUser: user,
  };
}

export async function getServerStudentSession(request = null) {
  const supabase = getSupabaseServerClient();
  if (!supabase || !request) return null;

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!bearerToken) return null;

  const { data, error } = await supabase.auth.getUser(bearerToken);
  if (error) {
    throw new Error(`Supabase auth getUser failed: ${error.message}`);
  }

  return normalizeSupabaseUser(data?.user || null);
}

export async function getBrowserStudentSession() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Supabase auth session check failed: ${error.message}`);
  }

  return session;
}
