export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkReview } from "@/lib/automod";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createReviewSchema } from "@/lib/validations";
import { trackServerEvent } from "@/lib/posthog-server";
import { getAppUrl, getServerEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const { data: validated, error: valError } = validateBody(createReviewSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { booking_id, rating: rawRating, comment, staff_member_id, score_ergebnis, score_atmosphaere, score_preis_leistung, attributes } = validated;

  // If all 3 sub-ratings provided, compute weighted overall rating (half-star granularity)
  const rating = (score_ergebnis && score_atmosphaere && score_preis_leistung)
    ? Math.round((score_ergebnis * 0.5 + score_atmosphaere * 0.25 + score_preis_leistung * 0.25) * 2) / 2
    : rawRating;

  // Verify booking belongs to user and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("user_id, salon_id, status")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  if (booking.status !== "completed") return NextResponse.json({ message: "Booking is not completed", code: "BOOKING_NOT_COMPLETED" }, { status: 400 });

  // Check no existing review
  const { data: existing } = await supabase.from("reviews").select("id").eq("booking_id", booking_id).maybeSingle();
  if (existing) return NextResponse.json({ message: "Already reviewed", code: "REVIEW_EXISTS" }, { status: 409 });

  // Auto-moderation check
  const modResult = await checkReview({
    comment: comment ?? "",
    rating,
    user_id: user.id,
    salon_id: booking.salon_id,
  });

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      salon_id: booking.salon_id,
      user_id: user.id,
      booking_id,
      rating,
      comment: comment ?? null,
      staff_member_id: staff_member_id ?? null,
      is_flagged: modResult.flagged,
      is_hidden: modResult.hidden,
      flag_reason: modResult.reason,
      score_ergebnis: score_ergebnis ?? null,
      score_atmosphaere: score_atmosphaere ?? null,
      score_preis_leistung: score_preis_leistung ?? null,
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
  // Non-fatal: the review row stands either way. Uses admin client to bypass RLS.
  {
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
    trackServerEvent(user.id, "review_submitted", {
      salon_id: booking.salon_id,
      rating: rating,
      review_id: data.id,
    });

    try {
      const admin = createAdminSupabaseClient();
      const { data: stats } = await admin
        .from("reviews")
        .select("rating")
        .eq("salon_id", booking.salon_id)
        .eq("is_hidden", false);

      if (stats) {
        const avg = stats.length > 0 ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length : null;
        await admin
          .from("salons")
          .update({
            average_rating: avg !== null ? Math.round(avg * 100) / 100 : null,
            review_count: stats.length,
          })
          .eq("id", booking.salon_id);
      }
    } catch (err) {
      console.error("Failed to recalculate average rating:", err);
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
