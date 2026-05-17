import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, getServerEnv } from "@/lib/env";

// NOTE: `Database` type from `@/lib/database.types` is intentionally NOT applied
// to the clients below. Adopting it globally surfaced ~2000 typecheck errors
// against pre-existing untyped queries — that's a dedicated migration sprint,
// not a single foundation pass. Use the typed client per-route by doing:
//   `const supabase = (await createServerSupabaseClient()) as SupabaseClient<Database>;`
// or by typing query results inline with `.maybeSingle<{ field: string }>()`.

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
  } catch {
    // Fall through — cookieStore stays null, auth will be anonymous
  }
  return createServerClient(
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
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user from the session cookie (no network call).
 * Use this in API routes instead of supabase.auth.getUser() which makes
 * a network request to Supabase that can timeout on Vercel Edge.
 */
export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}

/**
 * Admin Supabase client — uses service_role key. Server-side only.
 * Bypasses RLS. Only for Edge Functions and trusted server operations.
 */
export function createAdminSupabaseClient() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();
  return createServerClient(
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
  );
}

/**
 * Browser Supabase client — singleton for Client Components.
 * Safe to call multiple times (returns same instance).
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  const publicEnv = getPublicEnv();
  browserClient = createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return browserClient;
}
