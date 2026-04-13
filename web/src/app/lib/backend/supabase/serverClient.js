import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, hasSupabaseServerConfig } from "./config";

export function getSupabaseServerClient() {
  if (!hasSupabaseServerConfig()) return null;

  const { url, serviceRoleKey } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

