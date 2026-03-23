export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";

// POST /api/reviews/[id]/flag
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reason } = body;
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  // 1. Fetch review to confirm existence and get salon_id
  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .select("id, salon_id")
    .eq("id", params.id)
    .single();

  if (reviewErr || !review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // 2. Authorize: only the salon owner can flag it
  const { data: salon, error: salonErr } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", review.salon_id)
    .single();

  if (salonErr || !salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden. Not the salon owner." }, { status: 403 });
  }

  // 3. Flag the review
  // Admin dashboard checks for `is_flagged` = true OR moderation_status = 'under_review'
  // We'll update both for backwards/forwards compatibility based on the migrations
  const { data: updated, error: updateErr } = await supabase
    .from("reviews")
    .update({ 
      is_flagged: true,
      flag_reason: reason,
      moderation_status: 'under_review'
    })
    .eq("id", params.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: updated });
}
