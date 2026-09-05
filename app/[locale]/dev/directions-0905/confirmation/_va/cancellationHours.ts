// Exists-check: `npm run exists "free_cancel_hours"` -> 0 route/component matches (it is a
// DB column read directly by app/api/bookings/route.ts, app/api/bookings/[id]/cancel/route.ts
// and PayConfirmStep.tsx, none of which expose a reusable loader); `grep '"free_cancel_hours"'
// _inventory/_db-columns.json` -> present (live column, supabase/migrations/022_cancellation_policy.sql,
// `ALTER TABLE salons ADD COLUMN IF NOT EXISTS free_cancel_hours INT DEFAULT 24`). getSeedBooking.ts
// (shared, read-only per this surface's brief) does not select this column, so this direction
// reads it itself, same admin-client, dev-only pattern seedBooking.ts already uses.
//
// Real DB read, never fabricated: the cancellation term rendered on this mockup (trust floor,
// hierarchy-density-05) is the salon's own live free_cancel_hours value, defaulting to the same
// 24h the real API routes default to when the column is null.
//
// Contradiction found and surfaced, not silently resolved either way: the live `salons` table
// carries BOTH `free_cancel_hours` (migration 022) AND `cancellation_window_hours` (migration
// 068, still present per `_inventory/_db-columns.json`). `PayConfirmStep.tsx:144` (the real,
// currently-shipping booking-flow step immediately before this confirmation screen) displays
// `cancellation_window_hours`, but `app/api/bookings/[id]/cancel/route.ts`'s own dated comment
// (SP-AC) says the CHARGE logic's canonical columns are `cancellation_fee_type` /
// `cancellation_fee_value` / `free_cancel_hours`, and calls `cancellation_window_hours` an "old"
// read whose backing columns it claims are "ABSENT live", which the live column snapshot
// contradicts (both columns are present). This reads `free_cancel_hours` because it is what
// actually gates whether a cancellation is charged; if it differs from `cancellation_window_hours`
// on a real row, the number PayConfirmStep shows the customer one step earlier may not match what
// actually happens on cancel. Not fixed here (outside this mockup's scope), reported to the
// orchestrator in this builder's return.
import { createAdminSupabaseClient } from "@/lib/supabase";

const cache = new Map<string, number>();

export async function getFreeCancelHours(salonId: string): Promise<number> {
  if (!salonId) return 24;
  const cached = cache.get(salonId);
  if (cached != null) return cached;

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("free_cancel_hours")
    .eq("id", salonId)
    .maybeSingle();

  const hours = (data as { free_cancel_hours?: number | null } | null)?.free_cancel_hours ?? 24;
  cache.set(salonId, hours);
  return hours;
}
