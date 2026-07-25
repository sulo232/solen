export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminSupabaseClient();
    
    // Fetch profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch owned salons
    const { data: salons } = await admin
      .from("salons")
      .select("*")
      .eq("owner_id", user.id);

    // Fetch bookings (as customer)
    const { data: bookings } = await admin
      .from("bookings")
      .select("*, booking_services(*)")
      .eq("user_id", user.id);

    // Fetch reviews (explicit column list, not "*": reviews is a sensitive
    // table per no-select-star-sensitive.py; this is a self-export so every
    // column is still returned, just spelled out for schema-drift safety).
    // Round 10 Y3: salon_response / salon_response_at dropped from this list ,
    // retired columns (see _design-system/REMOVED.md), permanently null, review
    // replies now live in review_replies keyed by review_id, not on this row.
    const { data: reviews } = await admin
      .from("reviews")
      .select(
        "admin_response, admin_response_at, booking_id, comment, created_at, flag_reason, id, is_flagged, is_hidden, rating, salon_id, staff_member_id, user_id, walkin_queue_id",
      )
      .eq("user_id", user.id);

    // Fetch favorites
    const { data: favorites } = await admin
      .from("favorites")
      .select("*")
      .eq("user_id", user.id);

    // Fetch user credits
    const { data: userCredits } = await admin
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id);

    // Fetch credit redemptions
    const { data: creditRedemptions } = await admin
      .from("credit_redemptions")
      .select("*")
      .eq("user_id", user.id);

    // Fetch notifications
    const { data: notifications } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    // Fetch notification preferences
    const { data: notificationPreferences } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id);

    // Fetch user preferences (explicit column list, not "*": user_preferences
    // is a sensitive table per no-select-star-sensitive.py)
    const { data: userPreferences } = await admin
      .from("user_preferences")
      .select(
        "avg_booking_interval_days, booking_intervals, created_at, dismissed_nudges, favorite_quartier_ids, favorite_service_slugs, last_booked_service, last_nudge_sent_at, quartier_visit_counts, updated_at, user_id, view_preference, welcome_step",
      )
      .eq("user_id", user.id);

    // Fetch loyalty status
    const { data: loyaltyStatus } = await admin
      .from("loyalty_status")
      .select("*")
      .eq("user_id", user.id);

    // Fetch referrals (as referrer or referred; explicit column list, not "*":
    // referrals is a sensitive table per no-select-star-sensitive.py)
    const { data: referrals } = await admin
      .from("referrals")
      .select(
        "code, completed_at, created_at, id, max_uses, referral_code, referred_user_id, referrer_id, reward_amount, status",
      )
      .or(`referrer_id.eq.${user.id},referred_user_id.eq.${user.id}`);

    // Fetch discovery saves
    const { data: discoverySaves } = await admin
      .from("discovery_saves")
      .select("*")
      .eq("user_id", user.id);

    // Fetch discovery collections
    const { data: discoveryCollections } = await admin
      .from("discovery_collections")
      .select("*")
      .eq("user_id", user.id);

    // Fetch discovery comments
    const { data: discoveryComments } = await admin
      .from("discovery_comments")
      .select("*")
      .eq("user_id", user.id);

    // Fetch recurring booking rules
    const { data: recurringBookingRules } = await admin
      .from("recurring_booking_rules")
      .select("*")
      .eq("user_id", user.id);

    // Fetch push subscriptions
    const { data: pushSubscriptions } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id);

    // Fetch voucher redemptions
    const { data: voucherRedemptions } = await admin
      .from("voucher_redemptions")
      .select("*")
      .eq("user_id", user.id);

    // Fetch tips
    const { data: tips } = await admin
      .from("tips")
      .select("*")
      .eq("user_id", user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile,
      salons: salons || [],
      bookings: bookings || [],
      reviews: reviews || [],
      favorites: favorites || [],
      user_credits: userCredits || [],
      credit_redemptions: creditRedemptions || [],
      notifications: notifications || [],
      notification_preferences: notificationPreferences || [],
      user_preferences: userPreferences || [],
      loyalty_status: loyaltyStatus || [],
      referrals: referrals || [],
      discovery_saves: discoverySaves || [],
      discovery_collections: discoveryCollections || [],
      discovery_comments: discoveryComments || [],
      recurring_booking_rules: recurringBookingRules || [],
      push_subscriptions: pushSubscriptions || [],
      voucher_redemptions: voucherRedemptions || [],
      tips: tips || []
    };

    // Log the export action
    const recordCount =
      (salons?.length || 0) +
      (bookings?.length || 0) +
      (reviews?.length || 0) +
      (favorites?.length || 0) +
      (userCredits?.length || 0) +
      (creditRedemptions?.length || 0) +
      (notifications?.length || 0) +
      (notificationPreferences?.length || 0) +
      (userPreferences?.length || 0) +
      (loyaltyStatus?.length || 0) +
      (referrals?.length || 0) +
      (discoverySaves?.length || 0) +
      (discoveryCollections?.length || 0) +
      (discoveryComments?.length || 0) +
      (recurringBookingRules?.length || 0) +
      (pushSubscriptions?.length || 0) +
      (voucherRedemptions?.length || 0) +
      (tips?.length || 0);
    await logAuditEvent(req, user.id, "account.data_export", "user", user.id, { record_count: recordCount });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="solen-data-export-${user.id}.json"`,
      },
    });

  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
