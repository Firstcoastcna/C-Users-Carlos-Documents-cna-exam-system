export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function hasSupabaseBrowserConfig() {
  const config = getSupabaseConfig();
  return !!(config.url && config.anonKey);
}

export function hasSupabaseServerConfig() {
  const config = getSupabaseConfig();
  return !!(config.url && config.serviceRoleKey);
}

export function getSupabaseConfigSnapshot() {
  return {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

