import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — safe for "use client" components.
 * Does NOT import next/headers, so it can be bundled client-side.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
