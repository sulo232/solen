import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient, type TypedSupabaseClient } from "@/lib/supabase";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Resolves the caller of an API route from EITHER auth source this app now
 * has to accept, in the same return-or-response shape lib/auth/require.ts
 * already uses:
 *
 *  - web: the Supabase session COOKIE, via next/headers
 *    (createServerSupabaseClient), unchanged from today. No Authorization
 *    header at all falls straight into this branch, guest if there is no
 *    cookie session, exactly as before.
 *  - iOS (solen-mobile): an `Authorization: Bearer <access_token>` header.
 *    The React Native app holds a Supabase session but has no cookie jar, so
 *    it sends the access token instead. Without this branch a logged-in
 *    iOS customer's booking silently fell through to the guest path
 *    (user_id NULL, invisible on their own appointments list, ban check
 *    skipped, rate-limited by IP instead of user id, see
 *    app/api/bookings/route.ts).
 *
 * A Bearer token is ALWAYS verified against the Supabase Auth server via
 * `auth.getUser(token)`, the same pattern already used at
 * app/api/salons/[slug]/gallery/route.ts:57,63, never trusted as a raw
 * client-supplied claim. A present-but-invalid/expired Bearer token returns
 * the 401 `NextResponse` directly; it must NEVER fall through to the guest
 * branch below (that would let anyone route a garbage token straight to the
 * caller's DB client).
 *
 * The `supabase` client returned for a verified Bearer caller carries the
 * token on every subsequent request via `global.headers.Authorization`, so
 * PostgREST resolves the correct `auth.uid()` for RLS. A client built from
 * only the anon key, with no token attached, would see `auth.uid()` NULL and
 * `bookings_insert_auth` would reject the insert, the whole point of this
 * helper is lost without it.
 */
export async function resolveRequestUser(
  request: NextRequest
): Promise<{ user: User | null; supabase: TypedSupabaseClient } | NextResponse> {
  // Same header-parsing shape as app/api/salons/[slug]/gallery/route.ts:57.
  const bearerToken = request.headers.get("Authorization")?.split("Bearer ")[1];

  if (!bearerToken) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { user, supabase };
  }

  // Bearer path: a fresh client scoped to this one token (never shared across
  // requests, matching createServerClient's own contract), no cookies.
  const publicEnv = getPublicEnv();
  const bearerClient = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    }
  );

  const { data: { user }, error } = await bearerClient.auth.getUser(bearerToken);
  if (error || !user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  return { user, supabase: bearerClient };
}
