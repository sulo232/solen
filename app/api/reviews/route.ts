export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkReview } from "@/lib/automod";
import { applyRateLimit, generalLimiter, bearerVerifyLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createReviewSchema } from "@/lib/validations";
import { trackServerEvent } from "@/lib/posthog-server";
import { getAppUrl, getServerEnv } from "@/lib/env";
import { resolveRequestUser } from "@/lib/auth/request-user";

export async function POST(request: NextRequest) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  // resolveRequestUser (lib/auth/request-user.ts) resolves the caller from EITHER the web
  // session cookie, unchanged, or an iOS `Authorization: Bearer <token>` header, itself
  // verified server-side against the Supabase Auth server. Verifying a Bearer token costs a
  // network round trip that any caller can force with a garbage header and no credentials,
  // so it is throttled by IP BEFORE the resolve, and only when a header is actually present,
  // same ordering as app/api/bookings/route.ts POST.
  if (request.headers.get("Authorization")) {
    const authFlood = await applyRateLimit(bearerVerifyLimiter, { ip: getClientIp(request) });
    if (authFlood) return authFlood;
  }
  const resolvedUser = await resolveRequestUser(request);
  if (resolvedUser instanceof NextResponse) return resolvedUser;
  const { user, supabase } = resolvedUser;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createReviewSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { booking_id, salon_id, rating: rawRating, comment, staff_member_id, score_ergebnis, score_atmosphaere, score_preis_leistung, attributes } = validated;

  // If all 3 sub-ratings provided, compute weighted overall rating (half-star granularity)
  const rating = (score_ergebnis && score_atmosphaere && score_preis_leistung)
    ? Math.round((score_ergebnis * 0.5 + score_atmosphaere * 0.25 + score_preis_leistung * 0.25) * 2) / 2
    : rawRating;

  // Owner decision 4, 2026-08-09 ("4B like google maps"): signed-in is the ONLY requirement to
  // rate. There is no visit check here and none left in RLS either (migration
  // 20260809120000_reviews_open_rating_no_visit_check). Two shapes reach this point:
  //   booking_id , a rating written off a real appointment. The booking must still belong to the
  //                caller, otherwise anyone could attach their rating to a stranger's booking and
  //                burn that booking's one review slot. Its STATUS is no longer checked: a caller
  //                with no booking at all may now rate, so demanding "completed" from a caller who
  //                does have one gated nothing and only produced a confusing 400.
  //   salon_id   , a rating with no appointment. The salon must exist, so a rating cannot be filed
  //                against a made-up id.
  let resolvedSalonId: string;

  if (booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("user_id, salon_id")
      .eq("id", booking_id)
      .single();

    if (!booking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    if (booking.user_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
    resolvedSalonId = booking.salon_id;

    // One review per booking (also enforced by the reviews_booking_id_key unique index).
    const { data: existing } = await supabase.from("reviews").select("id").eq("booking_id", booking_id).maybeSingle();
    if (existing) return NextResponse.json({ message: "Already reviewed", code: "REVIEW_EXISTS" }, { status: 409 });
  } else {
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("id", salon_id!)
      .maybeSingle();

    if (!salon) return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
    resolvedSalonId = salon.id;

    // One appointment-free rating per person per salon. This is NOT a visit check: it never asks
    // whether the caller has been here, and a rating from someone who never booked counts toward
    // the score exactly like any other. It only stops ONE account from posting the same salon's
    // rating over and over and owning its average alone. It is the same one-per-target bound the
    // booking path has always had, re-keyed to the salon because there is no booking to key on,
    // and the same bound Google Maps applies to the reference he named.
    const { data: existingOpen } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("salon_id", resolvedSalonId)
      .is("booking_id", null)
      .is("walkin_queue_id", null)
      .limit(1)
      .maybeSingle();
    if (existingOpen) return NextResponse.json({ message: "Already reviewed", code: "REVIEW_EXISTS" }, { status: 409 });
  }

  // Auto-moderation check
  const modResult = await checkReview({
    comment: comment ?? "",
    rating,
    user_id: user.id,
    salon_id: resolvedSalonId,
  });

  // Phantom-column fix: score_ergebnis / score_atmosphaere / score_preis_leistung are declared
  // in supabase/migrations/20260324_review_dimensions.sql but the live `reviews` table has no
  // such columns (confirmed via a direct select: 42703 "column reviews.score_ergebnis does not
  // exist"), i.e. that migration was never applied. Writing them here made every review
  // submission fail. The weighted `rating` above still folds these sub-scores in; only the raw
  // per-dimension columns are dropped from the insert since they don't exist to write to.
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      salon_id: resolvedSalonId,
      user_id: user.id,
      booking_id: booking_id ?? null,
      rating,
      comment: comment ?? null,
      staff_member_id: staff_member_id ?? null,
      is_flagged: modResult.flagged,
      is_hidden: modResult.hidden,
      flag_reason: modResult.reason,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Persist confirmed amenity attributes (salon review). Non-fatal: the review stands either way.
  if (attributes && attributes.length > 0 && data?.id) {
    const rows = attributes.map((key) => ({ review_id: data.id, attribute_key: key }));
    const { error: attrErr } = await supabase.from("review_attributes").insert(rows);
    if (attrErr) console.error("[reviews] review_attributes insert failed:", attrErr);
  }

  // Auto-delete the review_prompt notification for this booking now that the review is in.
  // Non-fatal: the review row stands either way. Uses admin client to bypass RLS. Booking path
  // only: the prompt is keyed by booking_id, so an appointment-free rating has no prompt to clear.
  if (booking_id) {
    const admin = createAdminSupabaseClient();
    admin
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "review_prompt")
      .eq("data->>booking_id", booking_id)
      .then(({ error: delErr }) => {
        if (delErr) console.error("[reviews] review_prompt notification delete failed:", delErr);
      });
  }

  // Fire notification to salon (fire-and-forget)
  let baseUrl: string;
  try {
    baseUrl = getAppUrl();
  } catch {
    baseUrl = "http://localhost:3000";
  }
  fetch(`${baseUrl}/api/notify/review-posted`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": getServerEnv().CRON_SECRET ?? "" },
    body: JSON.stringify({ review_id: data.id })
  }).catch((err) => console.error("[ReviewsRoute] failed to send review-posted notification:", err));

  if (data) {
    await trackServerEvent(user.id, "review_submitted", {
      salon_id: resolvedSalonId,
      rating: rating,
      review_id: data.id,
    });

    // Recomputed over ALL visible reviews for the salon. Appointment-free ratings are in this set
    // and weigh exactly the same as booking-linked ones, per owner decision 4.
    try {
      const admin = createAdminSupabaseClient();
      const { data: stats } = await admin
        .from("reviews")
        .select("rating")
        .eq("salon_id", resolvedSalonId)
        .eq("is_hidden", false);

      if (stats) {
        const avg = stats.length > 0 ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length : null;
        await admin
          .from("salons")
          .update({
            average_rating: avg !== null ? Math.round(avg * 100) / 100 : null,
            review_count: stats.length,
          })
          .eq("id", resolvedSalonId);
      }
    } catch (err) {
      console.error("Failed to recalculate average rating:", err);
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
