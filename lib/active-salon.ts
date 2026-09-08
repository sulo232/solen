import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { hasPermission, type PermissionKey, type StaffPermissions } from "@/lib/staff-permissions";

/**
 * Active-salon resolution for multi-salon owners (V3, salon switcher).
 *
 * Background: ~40 owner API routes used to resolve "the owner's salon" with
 * `.eq("owner_id", user.id).single()`, which 406/PGRST116-errored for owners
 * with more than one salon (403 "no salon" as a result). The stopgap made
 * them pick the OLDEST salon. This helper supersedes that: it honours an
 * explicit selection (the `solen_active_salon` cookie, set by the switcher)
 * when the selected salon is actually owned by the user, and otherwise falls
 * back to the oldest owned salon, so behaviour is identical to the stopgap
 * when no cookie is set (fully back-compatible, purely additive).
 *
 * P9-2 fix (2026-09-05): an optional `area` composes a STAFF fallback onto the
 * owner resolution above, so this one helper can gate the routes that already
 * call it instead of each one hand-rolling the requireSalonAccess check. The
 * owner path is untouched (checked first, unconditionally); `area` only ever
 * ADDS a second way to resolve a salon id, for a caller who owns none, by
 * checking their `staff_members` row's permission for that area. Same
 * refuse-by-default semantics as `requireSalonAccess` in lib/auth/require.ts
 * (an absent grant refuses), same permission vocabulary (`hasPermission` from
 * lib/staff-permissions.ts), so both entry points read the same rule.
 */
export const ACTIVE_SALON_COOKIE = "solen_active_salon";

/**
 * Returns the id of the owner's active salon, or null if they own none (and,
 * when `area` is passed, no staff row grants that area either).
 * - cookie-selected salon, IF it is owned by `userId`
 * - else the oldest owned salon (created_at asc)
 * - else, IF `area` is passed, the salon of an active staff row for `userId`
 *   that grants `area`; `area: "any"` matches an active staff row regardless
 *   of its permissions (belonging, not authorization).
 */
export async function getActiveSalonId(
  supabase: SupabaseClient,
  userId: string,
  area?: PermissionKey | "any",
): Promise<string | null> {
  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_SALON_COOKIE)?.value ?? null;

  // RLS FIX (verify-auth-rollout): these lookups used to run on the caller's
  // session client (the `supabase` param above, kept only so existing
  // callers don't need to change). `salons_select_active`
  // (`is_active = true OR auth.uid() = owner_id`) never blocked the owner
  // paths below (owner_id always equals auth.uid() there), but the staff
  // fallback's own `staff_members` row plus getActiveSalon's follow-up salon
  // row read (below) could 404 a real staff member out of an INACTIVE salon.
  // Admin client bypasses RLS for all of it; the owner_id / user_id /
  // permissions comparisons are unchanged.
  const admin = createAdminSupabaseClient();

  if (selected) {
    const { data } = await admin
      .from("salons")
      .select("id")
      .eq("id", selected)
      .eq("owner_id", userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: oldest } = await admin
    .from("salons")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (oldest?.id) return oldest.id;

  if (area) {
    if (selected) {
      const { data: selectedStaff, error } = await admin
        .from("staff_members")
        .select("salon_id, permissions")
        .eq("user_id", userId)
        .eq("salon_id", selected)
        .eq("is_active", true)
        .maybeSingle<{ salon_id: string; permissions: StaffPermissions | null }>();
      if (error) return null;
      if (selectedStaff) {
        return area === "any" || hasPermission(selectedStaff.permissions, area)
          ? selectedStaff.salon_id : null;
      }
    }
    const { data: staff, error: staffError } = await admin
      .from("staff_members")
      .select("salon_id, permissions")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ salon_id: string; permissions: StaffPermissions | null }>();
    // "any" answers "which salon does this person belong to", not "may they do X":
    // any active staff row admits, regardless of what its permissions grant. Used
    // by callers (e.g. GET /api/profile) that need the salon id itself, not
    // authorization for a specific area; every area-gated caller still passes a
    // real PermissionKey and gets the hasPermission check unchanged.
    if (!staffError && staff && (area === "any" || hasPermission(staff.permissions, area))) return staff.salon_id;
  }

  return null;
}

/**
 * Convenience: returns the active salon ROW (selected columns) for an owner, or
 * null if they own none. Drop-in replacement for the stopgap pattern
 * `.from("salons").select(cols).eq("owner_id", uid).order("created_at").limit(1).maybeSingle()`.
 * Same `area` staff fallback as `getActiveSalonId` above, including `"any"`.
 */
export async function getActiveSalon<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns = "*",
  area?: PermissionKey | "any",
): Promise<T | null> {
  const id = await getActiveSalonId(supabase, userId, area);
  if (!id) return null;
  // RLS FIX (verify-auth-rollout): same trap as getActiveSalonId above, on
  // the row read this function adds after resolving the id, so it needs its
  // own admin client rather than the caller's `supabase`.
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("salons")
    .select(columns)
    .eq("id", id)
    .maybeSingle();
  return (data as T) ?? null;
}
