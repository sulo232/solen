/**
 * Exists-check: `npm run exists cancellation` -> lib/cancellation-policy.ts (fee-math only,
 * no salon-row loader), CancelBookingSheet.tsx (`free_cancel_hours` field on ITS OWN adapter
 * type, not a data loader), PayConfirmStep.tsx (`salon.cancellation_window_hours ?? 24`, reads
 * an already-fetched salon row, not a standalone loader). No existing dev/directions-0905
 * loader fetches `salons.cancellation_window_hours` by id; `seedBooking.ts`'s own BOOKING_SELECT
 * does not select it (confirmed by reading that file), so it is fetched separately here rather
 * than editing the shared, off-limits seedBooking.ts. Net-new, small, single-purpose.
 *
 * Server-only, admin client, dev-only route (same acceptable-bypass note seedBooking.ts and
 * seedSalon.ts already document for this folder).
 *
 * Grounded-in: `app/api/salons/[slug]/route.ts` and `PayConfirmStep.tsx:144` both read
 * `cancellation_window_hours` off the salons row with the same `?? 24` fallback (the column is
 * nullable; 24h is the product default used elsewhere, not invented here).
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

export interface CancellationInfo {
  /** Hours before the appointment that cancellation stays free. Real DB value, falls back to
   *  the same 24h product default PayConfirmStep.tsx already uses when the column is null. */
  freeCancelHours: number;
}

export async function getCancellationInfo(salonId: string): Promise<CancellationInfo> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("cancellation_window_hours")
    .eq("id", salonId)
    .maybeSingle();

  return {
    freeCancelHours: data?.cancellation_window_hours ?? 24,
  };
}
