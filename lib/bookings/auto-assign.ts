// Phase E (2026-06-03): staff auto-assignment + per-stylist daily limit for "any staff" bookings.
// Consumes the salon's SchedulingTab settings (auto_assign_method / daily_limit_enabled /
// daily_limit) that were persisted but never enforced. Used by POST /api/bookings when the
// customer books with no specific staff (staff_member_id = null).
//
// SAFETY: opt-in. A salon on the defaults ('manual' + limit off) never reaches this — the caller
// keeps the previous "first available slot" behaviour. Any internal error falls back to the first
// candidate, so the engine can never block an otherwise-valid booking.

type SlotRow = { id: string; staff_member_id: string | null; starts_at: string; salon_id?: string } & Record<string, unknown>;
// Minimal shape of the supabase query builder we use (avoids a hard dep on the generated types).
type DbClient = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

// Bookings that occupy capacity for the daily limit (cancelled / no_show release it).
const ACTIVE_STATUSES = ["pending", "pending_approval", "confirmed", "completed"];

/**
 * Count a staff member's active bookings on a given YYYY-MM-DD (UTC day bounds).
 *
 * REQUIRES an admin (service-role) client. This aggregates bookings across ALL users for the
 * salon; a caller's RLS session client only sees its own rows (customer's own bookings, or a
 * salon owner's), which would undercount and make the per-stylist daily cap effectively never
 * trigger (mirrors the service-role mandate in lib/bookings/claim-slot.ts). Read-only: no
 * INSERT/UPDATE here, so passing the admin client introduces no RLS-bypass write risk.
 */
export async function countStaffBookingsOnDay(
  db: DbClient,
  salonId: string,
  staffId: string,
  day: string,
): Promise<number> {
  const { count } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("staff_member_id", staffId)
    .gte("starts_at", `${day}T00:00:00`)
    .lte("starts_at", `${day}T23:59:59.999`)
    .in("status", ACTIVE_STATUSES);
  return count ?? 0;
}

/**
 * Choose the best candidate slot for an "any staff" booking:
 *   • least_busy  — the stylist with the fewest bookings that day
 *   • round_robin — the least-recently-assigned stylist (never-booked first)
 *   • manual/other — the first candidate (previous behaviour)
 * Honors the per-stylist daily limit (drops capped stylists; returns null if ALL are capped so the
 * caller can reject). Falls back to the first candidate on any error.
 *
 * REQUIRES an admin (service-role) client. The day-count and round-robin queries aggregate
 * bookings across ALL users for the salon; a caller's RLS session client only sees its own rows,
 * which would undercount and skew the least_busy/round_robin balance onto a garbage subset
 * (mirrors the service-role mandate in lib/bookings/claim-slot.ts). Read-only: no INSERT/UPDATE
 * here, so passing the admin client introduces no RLS-bypass write risk.
 */
export async function pickSlotForAnyStaff(
  db: DbClient,
  candidateSlots: SlotRow[],
  opts: { method: string; dailyLimitOn: boolean; dailyLimit: number; salonId: string; day: string },
): Promise<SlotRow | null> {
  if (!candidateSlots.length) return null;
  try {
    // One representative slot per stylist (first by the caller's starts_at ordering).
    const byStaff = new Map<string, SlotRow>();
    for (const s of candidateSlots) {
      if (s.staff_member_id && !byStaff.has(s.staff_member_id)) byStaff.set(s.staff_member_id, s);
    }
    let staffIds = [...byStaff.keys()];
    if (staffIds.length === 0) return candidateSlots[0]; // unstaffed slots → first

    // Day counts for every candidate stylist (single query).
    const { data: dayRows } = await db
      .from("bookings")
      .select("staff_member_id")
      .eq("salon_id", opts.salonId)
      .in("staff_member_id", staffIds)
      .gte("starts_at", `${opts.day}T00:00:00`)
      .lte("starts_at", `${opts.day}T23:59:59.999`)
      .in("status", ACTIVE_STATUSES);
    const dayCount = new Map<string, number>(staffIds.map((id) => [id, 0]));
    for (const r of (dayRows ?? []) as { staff_member_id: string }[]) {
      dayCount.set(r.staff_member_id, (dayCount.get(r.staff_member_id) ?? 0) + 1);
    }

    // Daily limit: drop capped stylists; if that leaves nobody, signal "all full".
    if (opts.dailyLimitOn) {
      const under = staffIds.filter((id) => (dayCount.get(id) ?? 0) < opts.dailyLimit);
      if (under.length === 0) return null;
      staffIds = under;
    }

    if (opts.method === "least_busy") {
      staffIds.sort((a, b) => (dayCount.get(a) ?? 0) - (dayCount.get(b) ?? 0));
      return byStaff.get(staffIds[0]) ?? candidateSlots[0];
    }

    if (opts.method === "round_robin") {
      // Least-recently assigned: oldest most-recent booking first; never-booked ("") sorts first.
      const { data: recent } = await db
        .from("bookings")
        .select("staff_member_id, starts_at")
        .eq("salon_id", opts.salonId)
        .in("staff_member_id", staffIds)
        .order("starts_at", { ascending: false })
        .limit(200);
      const lastSeen = new Map<string, string>();
      for (const r of (recent ?? []) as { staff_member_id: string; starts_at: string }[]) {
        if (!lastSeen.has(r.staff_member_id)) lastSeen.set(r.staff_member_id, r.starts_at);
      }
      staffIds.sort((a, b) => String(lastSeen.get(a) ?? "").localeCompare(String(lastSeen.get(b) ?? "")));
      return byStaff.get(staffIds[0]) ?? candidateSlots[0];
    }

    // manual / unknown → first candidate.
    return byStaff.get(staffIds[0]) ?? candidateSlots[0];
  } catch (err) {
    console.error("[auto-assign] pickSlotForAnyStaff failed; using first slot:", err);
    return candidateSlots[0];
  }
}
