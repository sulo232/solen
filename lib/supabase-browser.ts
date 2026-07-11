import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";
import type { TypedSupabaseClient } from "@/lib/supabase";

/**
 * Browser-side Supabase client (safe for "use client" components).
 * Does NOT import next/headers, so it can be bundled client-side.
 * Fully typed with the generated Database schema (types sprint, 2026-07-11).
 * The cast is the same type-only ssr@0.5.2 bridge documented in lib/supabase.ts.
 */
export function createBrowserSupabaseClient(): TypedSupabaseClient {
  const env = getPublicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as unknown as TypedSupabaseClient;
}
