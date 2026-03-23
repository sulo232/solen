export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, reviewRespondSchema } from "@/lib/validations";

// PATCH /api/reviews/[id]/respond — salon owner only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Get the review to find the salon
  const { data: review } = await admin
    .from("reviews")
    .select("salon_id")
    .eq("id", id)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  // Verify caller owns the salon
  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", review.salon_id)
    .single();

  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(reviewRespondSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_response } = validated;

  const { error } = await admin
    .from("review_replies")
    .upsert({
      review_id: id,
      salon_id: review.salon_id,
      reply_text: salon_response.trim(),
      is_public: true,
    }, { onConflict: "review_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire notification to customer (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/notify/review-replied`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_id: id, reply_text: salon_response.trim() })
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
