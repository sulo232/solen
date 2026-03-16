import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — singleton for Client Components.
 * Safe to call multiple times (returns same instance).
 * Kept separate from lib/supabase.ts to avoid bundling server-only next/headers.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
