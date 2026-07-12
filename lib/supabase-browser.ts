import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";
import type { TypedSupabaseClient } from "@/lib/supabase";

/**
 * Browser-side Supabase client (safe for "use client" components).
 * Does NOT import next/headers, so it can be bundled client-side.
 * Fully typed with the generated Database schema (via the types sprint;
 * ssr 0.12 infers it natively, no cast bridge needed).
 */
export function createBrowserSupabaseClient(): TypedSupabaseClient {
  const env = getPublicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
