import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Canonical auth helpers for API routes + server actions.
 *
 * Pre-2026-05-16 every route inlined the same getSession + profile.role check
 * (~230 occurrences). Now: one helper per role tier, returns either the
 * authenticated user/context OR a `NextResponse` the caller must return.
 *
 * Why "return-or-response" pattern instead of throwing:
 *   - Edge runtime tolerates `return new Response()` everywhere
 *   - Caller controls status code mapping (no global exception handler)
 *   - Cleaner than try/catch in every route
 *   - Works with Next.js route handler return-type contract
 *
 * Usage:
 *   export async function POST(req: NextRequest) {
 *     const auth = await requireAuth();
 *     if (auth instanceof NextResponse) return auth;
 *     const { user, supabase } = auth;
 *     // ... proceed with user.id
 *   }
 *
 *   export async function GET(req: NextRequest) {
 *     const auth = await requireAdmin();
 *     if (auth instanceof NextResponse) return auth;
 *     const { user, supabase, admin } = auth;
 *     // ... proceed
 *   }
 */

import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;
type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

/**
 * Requires an authenticated user. Returns either:
 *   - `{ user, supabase }` if authed
 *   - `NextResponse` (401) if not
 *
 * Per CLAUDE.md Rule 25: uses getSession (cookie-only, no network) not getUser
 * (which adds a network call to Supabase that can time out on Edge).
 */
export async function requireAuth(): Promise<
  { user: User; supabase: SupabaseClient } | NextResponse
> {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
  return { user, supabase };
}

/**
 * Requires an authenticated admin (profile.role = 'admin').
 * Returns `{ user, supabase, admin }` OR a 401/403 NextResponse.
 *
 * The `admin` field is a service-role-key Supabase client, ready for
 * RLS-bypassing operations the route needs after the role check passes.
 */
export async function requireAdmin(): Promise<
  { user: User; supabase: SupabaseClient; admin: AdminSupabaseClient } | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: UserRole }>();

  if (profileError) {
    console.error("[requireAdmin] failed to load profile:", profileError, { userId: user.id });
    return NextResponse.json(
      { error: "Unable to verify role", code: "ROLE_CHECK_FAILED" },
      { status: 503 }
    );
  }

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", code: "NOT_ADMIN" },
      { status: 403 }
    );
  }

  return { user, supabase, admin: createAdminSupabaseClient() };
}

/**
 * Requires the authenticated user to own a specific salon.
 * Returns `{ user, supabase, salon }` OR 401/403 NextResponse.
 *
 * Pass the salon_id to validate against `salons.owner_id`.
 */
export async function requireSalonOwner(
  salonId: string
): Promise<
  | {
      user: User;
      supabase: SupabaseClient;
      salon: { id: string; owner_id: string };
    }
  | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, owner_id")
    .eq("id", salonId)
    .maybeSingle<{ id: string; owner_id: string | null }>();

  if (salonError || !salon) {
    return NextResponse.json(
      { error: "Salon not found", code: "SALON_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (salon.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden", code: "NOT_OWNER" },
      { status: 403 }
    );
  }

  return { user, supabase, salon: { id: salon.id, owner_id: salon.owner_id! } };
}

/**
 * Requires the authenticated user to have a specific role (or one of several).
 * For roles other than admin/owner where `requireAdmin` / `requireSalonOwner`
 * aren't a fit.
 */
export async function requireRole(
  roles: UserRole | UserRole[]
): Promise<
  { user: User; supabase: SupabaseClient; role: UserRole } | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: UserRole }>();

  if (profileError) {
    console.error("[requireRole] failed to load profile:", profileError, { userId: user.id });
    return NextResponse.json(
      { error: "Unable to verify role", code: "ROLE_CHECK_FAILED" },
      { status: 503 }
    );
  }

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!profile || !allowed.includes(profile.role)) {
    return NextResponse.json(
      { error: "Forbidden", code: "ROLE_MISMATCH" },
      { status: 403 }
    );
  }

  return { user, supabase, role: profile.role };
}
