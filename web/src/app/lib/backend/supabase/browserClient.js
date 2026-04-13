import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, hasSupabaseBrowserConfig } from "./config";

let cachedClient = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) return null;
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}

