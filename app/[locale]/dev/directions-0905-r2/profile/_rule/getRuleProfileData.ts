/**
 * Exists-check: `npm run exists profile` (run this session) surfaces the real loader this file
 * builds on, `getProfileDataC` at app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts,
 * plus the sibling _va/_vb loaders for the same surface. No round-2 profile loader existed
 * before this file (only an empty `profile/_lift/` directory, no files). `npm run exists kit`
 * confirms the round-2 kit already exists and is imported (not re-derived) by the sibling file.
 *
 * Depicts: identity, next appointment, favorites/wallet/vouchers/stamps counts -> imports
 * getProfileDataC from app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts verbatim
 * (not copied: this file calls it, per the task brief's "import its loader and its data path;
 * do not copy files"). The ONE genuinely new query below is the booking's own `status` column,
 * which ProfileCData's shape does not expose (its query selects it but the mapped return type
 * drops it, since Direction C never needed to render it). The kit's StatusBadge (grounded in
 * components-legacy/booking/BookingCard.tsx's real statusConfig map) needs a real status value
 * to render honestly, not an assumed one, so this file adds the smallest possible supplemental
 * read: one column, by the same booking id the base loader already resolved. This is not a
 * duplicate of getProfileDataC's own bookings query (that one joins salon/service/staff and
 * picks the soonest upcoming row; this one is a single-column lookup by a known id), and it does
 * not touch or restructure that shared round-1 file, per the brief's "your files only" scope for
 * this folder.
 *
 * Grounded-in: app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts (the base loader,
 * imported unchanged) and lib/supabase.ts's createAdminSupabaseClient (the same admin-client
 * pattern that file, loadProfileB.ts and getBookingsC.ts all already use for this same
 * dev-route-gated, seed-customer read).
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getProfileDataC, type ProfileCData } from "@/app/[locale]/dev/directions-0905/profile/_vc/getProfileC";

export type RuleAppointmentStatus = "confirmed" | "pending";

export interface RuleProfileData extends ProfileCData {
  /** Real status of `nextAppointment`, or null when there is no next appointment, or the
   * genuine query failed (withhold-on-unknown, the same pattern this loader's own `wallet`
   * field already uses; never a guessed default). */
  nextAppointmentStatus: RuleAppointmentStatus | null;
}

export async function getRuleProfileData(locale: string): Promise<RuleProfileData> {
  const base = await getProfileDataC(locale);

  if (!base.nextAppointment) {
    return { ...base, nextAppointmentStatus: null };
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", base.nextAppointment.bookingId)
    .maybeSingle<{ status: string | null }>();

  if (error) {
    console.error("[profile/_rule] next-appointment status lookup failed:", error.message);
  }

  const status: RuleAppointmentStatus | null =
    data?.status === "confirmed" || data?.status === "pending" ? data.status : null;

  return { ...base, nextAppointmentStatus: status };
}
