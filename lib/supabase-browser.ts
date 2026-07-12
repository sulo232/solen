import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";
import type { TypedSupabaseClient } from "@/lib/supabase";

/**
 * Browser-side Supabase client (safe for "use client" components).
 * Does NOT import next/headers, so it can be bundled client-side.
 * Fully typed with the generated Database schema (types sprint, 2026-07-11;
 * ssr upgraded to 0.12 on 2026-07-12, no cast bridge needed).
 */
export function createBrowserSupabaseClient(): TypedSupabaseClient {
  const env = getPublicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
