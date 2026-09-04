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

    // Every query below chains .throwOnError(): on a PostgREST error the query promise
    // REJECTS instead of resolving to `{ data: null, error }`, so it is caught by the
    // try/catch at the bottom of this function (500 + console.error) instead of the
    // error being silently ignored and the section rendered as an empty "complete" array.

    // Fetch profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .throwOnError();

    // Fetch owned salons
    const { data: salons } = await admin
      .from("salons")
      .select("*")
      .eq("owner_id", user.id)
      .throwOnError();

    // Fetch bookings (as customer), with the booked service. There is no `booking_services`
    // table in the live schema (_inventory/_db-columns.json has no such key) , the old select
    // embedded a relation that does not exist, which PostgREST rejects, and the unchecked
    // error meant `bookings` always fell through to `[]` below: every export silently reported
    // zero bookings. The real relation is bookings.service_id -> services.id, the same shape
    // BOOKING_SELECT uses in app/[locale]/confirmation/page.tsx and app/api/bookings/route.ts.
    // Every column is spelled out (not "*") because bookings is a sensitive table per
    // no-select-star-sensitive.py.
    const { data: bookings } = await admin
      .from("bookings")
      .select(
        "access_token_expires_at, access_token_hash, acquisition_source, anonymized_at, applied_tier, arrived_at, attributed_search_event_id, bundle_id, cancel_link_used_at, cancellation_reason, cancelled_at, completed_at, confirm_link_used_at, consumed_at, created_at, crm_photo_url, customer_note, deposit_amount, ends_at, estimated_price, extras_addons, extras_bleaching, fee_charge_claimed_at, fee_charge_intent_id, fee_charge_kind, fee_charge_status, fee_charged_amount, final_price, gcal_event_id, group_booking_id, guest_email, guest_name, guest_phone, id, is_express_rebook, is_first_visit, is_recurring, member_discount_reserved, net_amount, outlook_event_id, paid_amount, paid_via, payment_intent_id, payment_status, platform_fee, policy_accepted_at, policy_snapshot, price_confirmed_at, price_increase_approved, price_increase_requested_at, price_paid, promo_code, promo_counted_at, promo_use_released, promo_use_reserved, rebooked_from_id, recurring_group_id, reference_code, referral_code, refunded_amount, remaining_at_salon, reschedule_requested_at, reschedule_status, reschedule_to, review_prompt_sent, salon_id, service_id, service_revenue, slot_id, sms_sent_1h, sms_sent_24h, staff_member_id, starts_at, status, stripe_customer_id, stripe_payment_method_id, stripe_setup_intent_id, tier_discount_amount, updated_at, user_id, vat_amount, vat_rate, voucher_code, walkin_queue_id, services(id, name_de, name_en, duration_minutes, price)",
      )
      .eq("user_id", user.id)
      .throwOnError();

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
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch favorites
    const { data: favorites } = await admin
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch user credits
    const { data: userCredits } = await admin
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch credit redemptions
    const { data: creditRedemptions } = await admin
      .from("credit_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch notifications
    const { data: notifications } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch notification preferences
    const { data: notificationPreferences } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch user preferences (explicit column list, not "*": user_preferences
    // is a sensitive table per no-select-star-sensitive.py)
    const { data: userPreferences } = await admin
      .from("user_preferences")
      .select(
        "avg_booking_interval_days, booking_intervals, created_at, dismissed_nudges, favorite_quartier_ids, favorite_service_slugs, last_booked_service, last_nudge_sent_at, quartier_visit_counts, updated_at, user_id, view_preference, welcome_step",
      )
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch loyalty status
    const { data: loyaltyStatus } = await admin
      .from("loyalty_status")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch referrals (as referrer or referred; explicit column list, not "*":
    // referrals is a sensitive table per no-select-star-sensitive.py)
    const { data: referrals } = await admin
      .from("referrals")
      .select(
        "code, completed_at, created_at, id, max_uses, referral_code, referred_user_id, referrer_id, reward_amount, status",
      )
      .or(`referrer_id.eq.${user.id},referred_user_id.eq.${user.id}`)
      .throwOnError();

    // Fetch discovery saves
    const { data: discoverySaves } = await admin
      .from("discovery_saves")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch discovery collections
    const { data: discoveryCollections } = await admin
      .from("discovery_collections")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch discovery comments
    const { data: discoveryComments } = await admin
      .from("discovery_comments")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch recurring booking rules
    const { data: recurringBookingRules } = await admin
      .from("recurring_booking_rules")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch push subscriptions
    const { data: pushSubscriptions } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch voucher redemptions
    const { data: voucherRedemptions } = await admin
      .from("voucher_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // Fetch tips
    const { data: tips } = await admin
      .from("tips")
      .select("*")
      .eq("user_id", user.id)
      .throwOnError();

    // privacy-compliance-02: salon-authored client records about this user.
    // These are personal data ABOUT the data subject (GDPR Art. 15 / nFADP
    // Art. 25 right of access), not just data the user typed themselves, so
    // they belong in the export even though a salon staffer wrote the row.
    // Same 13 tables the erasure cron (process-deletions/route.ts) already
    // treats as this user's personal data; export must match that list.

    // Fetch client notes (explicit column list, not "*": client_notes is a
    // sensitive table per no-select-star-sensitive.py). Includes BOTH
    // note_type values ("booking" and "permanent") since the export
    // endpoint bypasses the customer-facing RLS partition intentionally,
    // the right of access covers data about the subject regardless of who
    // wrote it or which app surface would normally show it.
    const { data: clientNotes } = await admin
      .from("client_notes")
      .select("booking_id, created_at, created_by, customer_id, id, note, note_type, salon_id, updated_at")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: consultationNotes } = await admin
      .from("consultation_notes")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: clientFormulas } = await admin
      .from("client_formulas")
      .select("*")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: nailClientPreferences } = await admin
      .from("nail_client_preferences")
      .select("*")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: handChartNotes } = await admin
      .from("hand_chart_notes")
      .select("*")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: barberCutHistory } = await admin
      .from("barber_cut_history")
      .select("*")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: clientPhotos } = await admin
      .from("client_photos")
      .select("*")
      .eq("customer_id", user.id)
      .throwOnError();

    const { data: spaTreatmentOutcomes } = await admin
      .from("spa_treatment_outcomes")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: waxingSensitivityLog } = await admin
      .from("waxing_sensitivity_log")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: wellnessJournals } = await admin
      .from("wellness_journals")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: makeupFaceCharts } = await admin
      .from("makeup_face_charts")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: bridalWorkflows } = await admin
      .from("bridal_workflows")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

    const { data: fadeBlueprints } = await admin
      .from("fade_blueprints")
      .select("*")
      .eq("client_id", user.id)
      .throwOnError();

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
      tips: tips || [],
      client_notes: clientNotes || [],
      consultation_notes: consultationNotes || [],
      client_formulas: clientFormulas || [],
      nail_client_preferences: nailClientPreferences || [],
      hand_chart_notes: handChartNotes || [],
      barber_cut_history: barberCutHistory || [],
      client_photos: clientPhotos || [],
      spa_treatment_outcomes: spaTreatmentOutcomes || [],
      waxing_sensitivity_log: waxingSensitivityLog || [],
      wellness_journals: wellnessJournals || [],
      makeup_face_charts: makeupFaceCharts || [],
      bridal_workflows: bridalWorkflows || [],
      fade_blueprints: fadeBlueprints || []
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
      (tips?.length || 0) +
      (clientNotes?.length || 0) +
      (consultationNotes?.length || 0) +
      (clientFormulas?.length || 0) +
      (nailClientPreferences?.length || 0) +
      (handChartNotes?.length || 0) +
      (barberCutHistory?.length || 0) +
      (clientPhotos?.length || 0) +
      (spaTreatmentOutcomes?.length || 0) +
      (waxingSensitivityLog?.length || 0) +
      (wellnessJournals?.length || 0) +
      (makeupFaceCharts?.length || 0) +
      (bridalWorkflows?.length || 0) +
      (fadeBlueprints?.length || 0);
    await logAuditEvent(req, user.id, "account.data_export", "user", user.id, { record_count: recordCount });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="solen-data-export-${user.id}.json"`,
      },
    });

  } catch (error) {
    // Every query below chains .throwOnError(), so a PostgREST error on ANY section
    // (bad column, bad relation, RLS denial) lands here instead of resolving to
    // `{ data: null, error }` and silently falling through `X || []` into a "complete"
    // export that is actually missing a section , which is the exact defect this
    // route shipped with (booking_services does not exist; bookings was always []).
    console.error("[profile export] export failed:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
