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
import { hasPermission, type PermissionKey, type StaffPermissions } from "@/lib/staff-permissions";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;
type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

/**
 * Requires an authenticated user. Returns either:
 *   - `{ user, supabase }` if authed
 *   - `NextResponse` (401) if not
 *
 * Uses getUser() (verifies the JWT against the Supabase Auth server) rather
 * than getSession() (trusts the client-supplied cookie without verifying its
 * signature). getUser() fails CLOSED, returning null on any verification
 * failure. This app deploys on Netlify Node functions, not Vercel Edge, so
 * the extra network round-trip is safe.
 */
export async function requireAuth(): Promise<
  { user: User; supabase: SupabaseClient } | NextResponse
> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
 * Requires the authenticated user to have access to one area of a salon's staff
 * dashboard, either as the salon's owner (always full access) or as an active
 * staff member whose `staff_members.permissions` grants that specific area.
 *
 * Returns `{ user, supabase, salon, via }` OR 404/403 NextResponse. `via` says
 * which case matched ("owner" or "staff"), and carries `staffId` for the staff
 * case so a caller can scope a query to that specific staff row.
 *
 * DEFAULT IS REFUSE: an absent grant for `area` refuses access. This is the
 * opposite default from `canEditOwnSchedule` in
 * app/api/staff/my-schedule/route.ts, which defaults an absent
 * `can_edit_schedule` key to ALLOWED, deliberately, because that route governs
 * a staff member editing their OWN hours and the owner's dashboard toggle
 * already shows that switch as on by default. This gate governs access to
 * someone else's salon data, not the caller's own row, so an absent grant is
 * refused rather than assumed on. That is a decision, not an inconsistency.
 */
export async function requireSalonAccess(
  salonId: string,
  area: PermissionKey
): Promise<
  | {
      user: User;
      supabase: SupabaseClient;
      salon: { id: string; owner_id: string };
      via: "owner";
    }
  | {
      user: User;
      supabase: SupabaseClient;
      salon: { id: string; owner_id: string };
      via: "staff";
      staffId: string;
    }
  | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  // Same query shape as requireSalonOwner, reused rather than re-derived.
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

  if (salon.owner_id === user.id) {
    return { user, supabase, salon: { id: salon.id, owner_id: salon.owner_id }, via: "owner" };
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff_members")
    .select("id, permissions")
    .eq("salon_id", salonId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle<{ id: string; permissions: StaffPermissions | null }>();

  if (staffError || !staff || !hasPermission(staff.permissions, area)) {
    return NextResponse.json(
      { error: "Forbidden", code: "NOT_AUTHORIZED_FOR_AREA" },
      { status: 403 }
    );
  }

  return {
    user,
    supabase,
    salon: { id: salon.id, owner_id: salon.owner_id! },
    via: "staff",
    staffId: staff.id,
  };
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
