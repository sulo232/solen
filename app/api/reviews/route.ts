export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkReview } from "@/lib/automod";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createReviewSchema } from "@/lib/validations";
import { trackServerEvent } from "@/lib/posthog-server";

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

  const { booking_id, rating, comment, staff_member_id } = validated;

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Fire notification to salon (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/notify/review-posted`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_id: data.id })
  }).catch(() => {});

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

      if (stats && stats.length > 0) {
        const avg = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length;
        await admin
          .from("salons")
          .update({
            average_rating: Math.round(avg * 10) / 10,
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
