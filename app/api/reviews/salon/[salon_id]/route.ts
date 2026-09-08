export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { publicReply, publicReviewStylist } from "@/app/[locale]/_components/salon/_shared";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salon_id: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { salon_id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(salon_id)) {
    return NextResponse.json({ message: "Invalid Store", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(page * 20)) {
    return NextResponse.json({ message: "Invalid page", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const sort = searchParams.get("sort") ?? "newest";
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  // Build sort order based on param
  let orderCol = "created_at";
  let ascending = false;
  if (sort === "highest") { orderCol = "rating"; ascending = false; }
  else if (sort === "lowest") { orderCol = "rating"; ascending = true; }

  // Explicit column list (not `.select("*")`): this is a PUBLIC, unauthenticated
  // endpoint, so it must never return `user_id` (raw reviewer identity, used
  // elsewhere to derive referral codes) or `booking_id`. `booking_id` is still
  // selected here (needed to compute `is_verified` below) but stripped from
  // every item before the response is built. Column list confirmed against the
  // live snapshot (_inventory/_db-columns.json, reviews table): owner_reply and
  // score_* are unapplied migrations (schema drift) on `reviews` itself, not
  // live columns, so they are intentionally left out rather than selected as
  // dead null. `review_photos` IS a live, separate table (id, review_id,
  // photo_url, created_at, sort_order) and is joined below so paged reviews
  // (page > 1, loaded via "Mehr laden") show photos too, matching the initial
  // SSR fetch in app/[locale]/salon/[slug]/reviews/page.tsx.
  const { data, error, count } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, booking_id, profiles!user_id(display_name, avatar_url), review_replies(reply_text, is_public, created_at), review_photos(id, photo_url)",
      { count: "exact" }
    )
    .eq("salon_id", salon_id)
    .eq("is_hidden", false)
    .order(orderCol, { ascending })
    .order("sort_order", { ascending: true, foreignTable: "review_photos" })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[reviews/salon] reviews lookup failed:", error);
    return NextResponse.json({ message: "Could not load reviews", code: "DB_ERROR" }, { status: 500 });
  }

  // RLS above determines the accessible review window. The privileged lookup is
  // restricted to those exact visible IDs and this Store, and reads only the
  // relation fields needed to verify attribution. No booking data is returned.
  const stylistByReview = new Map<string, ReturnType<typeof publicReviewStylist>>();
  if (data?.length) {
    const { data: attribution, error: attributionError } = await createAdminSupabaseClient()
      .from("reviews")
      .select("id, staff_member_id, bookings(salon_id, staff_member_id), staff_members(id, name, salon_id, is_active)")
      .eq("salon_id", salon_id)
      .eq("is_hidden", false)
      .in("id", data.map((review) => review.id));
    if (attributionError) console.error("[reviews/salon] stylist lookup failed:", attributionError);
    else for (const review of attribution ?? []) {
      stylistByReview.set(review.id, publicReviewStylist(
        review as unknown as Parameters<typeof publicReviewStylist>[0], salon_id,
      ));
    }
  }

  // Add is_verified computed field (true if review has a booking_id), then drop
  // the raw booking_id itself so it never reaches the client.
  const items = (data ?? []).map((rev: any) => {
    const { booking_id, ...rest } = rev;
    return {
      ...rest,
      ...(stylistByReview.get(rev.id) ?? { staff_member_id: null, staff_members: null }),
      review_replies: publicReply(rev.review_replies),
      is_verified: !!booking_id,
    };
  });

  return NextResponse.json({ items, total: count ?? 0, page, limit });
}
