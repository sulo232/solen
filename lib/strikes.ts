import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Checks cancellation/no-show limits and issues warnings if limits exceeded.
 * ToS §3.3: 3+ salon cancellations in 30 days -> account review / strike
 * ToS §4.4: 3 no-shows in 6 mos -> warning, 5 no-shows -> suspension
 */
export async function evaluateBookingPenalties(
  bookingId: string, 
  status: "cancelled" | "no_show",
  cancelledBy: "salon" | "customer" | "admin"
) {
  const admin = createAdminSupabaseClient();
  
  // 1. Fetch booking details
  const { data: booking } = await admin
    .from("bookings")
    .select("salon_id, user_id, starts_at")
    .eq("id", bookingId)
    .single();
    
  if (!booking) return;

  if (status === "cancelled" && cancelledBy === "salon") {
    // Check salon cancellations in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // We would need an audit trail of who cancelled to be 100% accurate,
    // assuming here we just count how many times this function was called for them.
    // Instead we query recent warnings to see if we already struck them.
    const { count } = await admin
      .from("audit_log") // if audit_log exists, or we just issue a loose warning
      .select("*", { count: "exact" })
      .eq("action", "salon_cancelled_booking")
      .eq("target_id", booking.salon_id)
      .gte("created_at", thirtyDaysAgo.toISOString());
      
    // If they just hit 3
    if (count && count >= 2) {
      await admin.from("account_warnings").insert({
        salon_id: booking.salon_id,
        reason: "3+ Buchungsstornierungen in 30 Tagen (AGB §3.3)",
        severity: "strike",
        metadata: { trigger_booking: bookingId }
      });
    }
    
    // Log the cancellation action
    try {
      await admin.from("audit_log").insert({
        actor_id: booking.salon_id, // assuming salon owner
        action: "salon_cancelled_booking",
        target_type: "booking",
        target_id: booking.salon_id,
      });
    } catch (err) { console.error("[strikes] audit_log insert failed:", err); }
  }
  
  // bookings.user_id is nullable (guest bookings have no account to track strikes
  // against); narrow it here rather than passing null into .eq() below.
  if (status === "no_show" && booking.user_id) {
    // Check client no-shows in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { count } = await admin
      .from("bookings")
      .select("*", { count: "exact" })
      .eq("user_id", booking.user_id)
      .eq("status", "no_show")
      .gte("starts_at", sixMonthsAgo.toISOString());
      
    const noShowCount = (count || 0) + 1; // +1 for the current one
    
    if (noShowCount === 3) {
      await admin.from("account_warnings").insert({
        user_id: booking.user_id,
        reason: "3 No-Shows in 6 Monaten (AGB §4.4)",
        severity: "warning",
        metadata: { trigger_booking: bookingId }
      });
    } else if (noShowCount >= 5) {
      const suspensionReason = "5+ No-Shows in 6 Monaten (AGB §4.4)";
      await admin.from("account_warnings").insert({
        user_id: booking.user_id,
        reason: suspensionReason,
        severity: "suspension",
        metadata: { trigger_booking: bookingId }
      });

      // 2026-07-27: the "suspension" severity used to be write-only, no code
      // path ever consumed it, so the AGB §4.4 consequence could never fire.
      // profiles.banned_at / ban_reason IS the live gate already: checkUserBanned()
      // (lib/feature-flags.ts) reads it and is wired into booking creation across
      // app/api/bookings/*. Reuse that gate instead of inventing a second one.
      // .is("banned_at", null) makes this idempotent: a later 6th/7th no-show
      // re-checks the count but never clobbers an existing ban date/reason (e.g.
      // one set manually by an admin) with a fresh timestamp.
      await admin
        .from("profiles")
        .update({ banned_at: new Date().toISOString(), ban_reason: suspensionReason })
        .eq("id", booking.user_id)
        .is("banned_at", null);
    }
  }
}
