export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, reviewReplySchema } from "@/lib/validations";

// POST /api/reviews/reply — Salon owner replies to a review
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(reviewReplySchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { review_id, reply_text, is_public } = validated;

  // Verify the review exists and user owns the salon
  const { data: review } = await supabase
    .from("reviews")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", review_id)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const salonOwner = (review.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can reply to reviews" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("review_replies")
    .insert({
      review_id,
      salon_id: review.salon_id,
      reply_text,
      is_public: is_public !== false, // default true
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Reply already exists for this review" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reply: data }, { status: 201 });
}
