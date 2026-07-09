import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

/**
 * Compare-and-swap claim of an availability slot. THE single place the CAS pattern lives, so
 * every booking-write path (create, reschedule, express-rebook, recurring) stays consistent.
 *
 * Flips a slot to 'booked' ONLY if it is still 'available'. This is the atomic guard against
 * two concurrent requests booking the same slot: the `prevent_double_booking` GIST constraint
 * only rejects two DIFFERENT overlapping slots for a staff member, and there is no unique
 * constraint on bookings.slot_id, so the same slot_id could otherwise be claimed twice.
 *
 * MUST be called with a SERVICE-ROLE client. availability_slots UPDATE is owner-only under RLS
 * (`slots_manage_owner`), so a booking customer's own session client silently matches 0 rows on
 * this write, which would make every claim look like a lost race. (Council 2026-07-07.)
 *
 * @param admin   service-role client (createAdminSupabaseClient()).
 * @param slotId  availability_slots.id to claim.
 * @param fields  extra columns to set alongside status:'booked' (e.g. booking_id, booked_by,
 *                and ends_at for a widened bundle window). `status` is set by this helper.
 * @returns claimed=true if THIS call won the slot; error carries any Postgrest error (e.g. a
 *          23P01 GIST exclusion from a widened bundle window) for the caller to branch on.
 */
export async function claimSlot(
  admin: SupabaseClient,
  slotId: string,
  fields: Record<string, unknown> = {}
): Promise<{ claimed: boolean; error: PostgrestError | null }> {
  const { data, error } = await admin
    .from("availability_slots")
    .update({ status: "booked", ...fields })
    .eq("id", slotId)
    .eq("status", "available")
    .select("id");
  return { claimed: !!data && data.length > 0, error };
}
