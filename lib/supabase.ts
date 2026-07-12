import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

// Types sprint (workstream 17, 2026-07-11): the generated `Database` type IS now
// applied to every client below, so a phantom column/table is a COMPILE error
// instead of a silent runtime null (this repo's recorded #1 failure mode).
// lib/database.types.ts is regenerated from the LIVE schema (recipe:
// _rules/DB_SCHEMA.md section 7); regenerate it after every applied migration.
//
// The `as unknown as SupabaseClient<Database>` on each return is a TYPE-ONLY
// bridge: the installed @supabase/ssr (0.5.2) predates supabase-js 2.99's type
// machinery, so its own generics collapse most row types to `never`. The ssr
// factories just wrap supabase-js createClient at runtime, so asserting the
// supabase-js client type restores full correct inference with zero runtime
// change. Remove the casts when @supabase/ssr is upgraded to >=0.6.

/** The one typed client shape every query in the app infers from. */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server-side Supabase client — use in Server Components, API routes, and Edge Functions.
 * Reads/writes auth cookies automatically via next/headers.
 */
export async function createServerSupabaseClient() {
  const publicEnv = getPublicEnv();
  const { cookies } = await import("next/headers");
  // cookies() itself can throw "The string did not match the expected pattern"
  // when the raw Cookie header contains characters the parser rejects (e.g. long JWTs).
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch (err) {
    // Fall through, cookieStore stays null, auth will be anonymous
    console.error("[supabase] cookies() parse failed (malformed Cookie header):", err);
  }
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (!cookieStore) return [];
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet: any[]) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore!.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component, safe to ignore
          }
        },
      },
    }
  ) as unknown as TypedSupabaseClient;
}

/**
 * Get the authenticated user, verified server-side against the Supabase Auth
 * server (auth.getUser()). Unlike auth.getSession(), this does not trust the
 * client-supplied cookie's JWT claims blindly, it fails CLOSED (returns
 * null) if the token cannot be verified. This app deploys on Netlify Node
 * functions (not Vercel Edge), so the extra network round-trip is safe.
 */
export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user: user ?? null };
}

/**
 * Admin Supabase client — uses service_role key. Server-side only.
 * Bypasses RLS. Only for Edge Functions and trusted server operations.
 */
export function createAdminSupabaseClient() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll(cookiesToSet: any[]) {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  ) as unknown as TypedSupabaseClient;
}

// The browser client lives in lib/supabase-browser.ts (safe for "use client"
// bundles). The duplicate createBrowserSupabaseClient that used to live here
// was removed 2026-07-12 (council dedup finding; its last importer was the
// owner-killed TOSUpdateBanner, REMOVED.md line 27).
