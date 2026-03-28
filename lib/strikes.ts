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
    } catch { /* fire-and-forget */ }
  }
  
  if (status === "no_show") {
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
      await admin.from("account_warnings").insert({
        user_id: booking.user_id,
        reason: "5+ No-Shows in 6 Monaten (AGB §4.4)",
        severity: "suspension",
        metadata: { trigger_booking: bookingId }
      });
    }
  }
}
