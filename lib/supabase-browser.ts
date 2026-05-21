import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Browser-side Supabase client — safe for "use client" components.
 * Does NOT import next/headers, so it can be bundled client-side.
 *
 * Database typing intentionally omitted; adoption is per-call via inline
 * generics on `.select()` / `.maybeSingle<T>()` / `.returns<T>()`.
 */
export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
