import type { createAdminSupabaseClient } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

export type WalkinAvailability = {
  waitMinutes: number;
  waitMinutesMax: number;
  queueLength: number;
};

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

/**
 * Live walk-in wait + queue length per salon, for the given salon ids.
 *
 * Only salons with `walkin_enabled = true` are returned; others are omitted.
 * Batched: a fixed number of queries regardless of how many ids are passed
 * (queue / active staff / service durations, all `.in(ids)`), so it stays cheap
 * on listing pages.
 *
 * Single source of truth shared by:
 *   - GET /api/walkin/availability  → "Frei in ~X Min" on search/listing cards
 *   - GET /api/walkin/nearby        → the homepage Walk-in band
 *
 * The wait is exposed as a conservative RANGE (waitMinutes–waitMinutesMax,
 * upper bound +40%) so a single number doesn't become a broken promise the
 * moment an untracked walk-up arrives (council decision).
 */
export async function getWalkinAvailability(
  admin: AdminClient,
  salonIds: string[],
): Promise<Record<string, WalkinAvailability>> {
  const ids = salonIds.map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (ids.length === 0) return {};

  // Restrict to walk-in-enabled salons (others omitted entirely).
  const { data: salons } = await admin.from("salons").select("id, walkin_enabled").in("id", ids);
  const enabledIds = (salons ?? []).filter((s) => (s as { walkin_enabled?: boolean }).walkin_enabled).map((s) => s.id);
  if (enabledIds.length === 0) return {};

  const [{ data: queue }, { data: staff }, { data: services }] = await Promise.all([
    admin.from("barber_walkin_queue").select("salon_id").in("salon_id", enabledIds).eq("status", "waiting"),
    admin.from("staff_members").select("salon_id").in("salon_id", enabledIds).eq("is_active", true),
    admin.from("services").select("salon_id, duration_minutes").in("salon_id", enabledIds).eq("is_active", true),
  ]);

  const waitingBySalon = new Map<string, number>();
  for (const q of queue ?? []) waitingBySalon.set(q.salon_id, (waitingBySalon.get(q.salon_id) ?? 0) + 1);

  const barbersBySalon = new Map<string, number>();
  for (const s of staff ?? []) barbersBySalon.set(s.salon_id, (barbersBySalon.get(s.salon_id) ?? 0) + 1);

  const durSum = new Map<string, { total: number; count: number }>();
  for (const sv of services ?? []) {
    const cur = durSum.get(sv.salon_id) ?? { total: 0, count: 0 };
    cur.total += sv.duration_minutes ?? 30;
    cur.count += 1;
    durSum.set(sv.salon_id, cur);
  }

  const out: Record<string, WalkinAvailability> = {};
  for (const id of enabledIds) {
    const waiting = waitingBySalon.get(id) ?? 0;
    const barbers = barbersBySalon.get(id) ?? 1;
    const d = durSum.get(id);
    const avgDuration = d && d.count > 0 ? Math.round(d.total / d.count) : 30;
    const wait = estimateWaitMinutes(waiting, avgDuration, barbers);
    out[id] = { waitMinutes: wait, waitMinutesMax: Math.ceil(wait * 1.4), queueLength: waiting };
  }
  return out;
}
