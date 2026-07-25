export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, reviewRespondSchema } from "@/lib/validations";
import { getAppUrl, getServerEnv } from "@/lib/env";

// Round 10 Y3: the single write path for salon-owner replies (unified onto the
// review_replies table, see _design-system/REMOVED.md for the retired duplicate
// route + columns). PATCH creates or edits (upsert, one reply per review, matching
// review_replies' UNIQUE(review_id)); DELETE removes it. Both share this ownership
// check (inline, matching the codebase's actual convention per _docs/BACKEND.md
// section 1, not the unused lib/auth/require.ts helpers).
async function requireOwnedReview(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  reviewId: string,
  userId: string,
) {
  const { data: review } = await admin
    .from("reviews")
    .select("salon_id")
    .eq("id", reviewId)
    .single();
  if (!review) {
    return { salonId: null, errorResponse: NextResponse.json({ error: "Review not found" }, { status: 404 }) };
  }
  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", review.salon_id)
    .single();
  if (!salon || salon.owner_id !== userId) {
    return { salonId: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { salonId: review.salon_id as string, errorResponse: null };
}

// PATCH /api/reviews/[id]/respond: salon owner creates or edits their reply
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { salonId, errorResponse } = await requireOwnedReview(admin, id, user.id);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(reviewRespondSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const replyText = validated.reply_text.trim();

  const { error } = await admin
    .from("review_replies")
    .upsert({
      review_id: id,
      salon_id: salonId,
      reply_text: replyText,
      is_public: true,
    }, { onConflict: "review_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire notification to customer (fire-and-forget)
  let baseUrl: string;
  try {
    baseUrl = getAppUrl();
  } catch {
    baseUrl = "http://localhost:3000";
  }
  fetch(`${baseUrl}/api/notify/review-replied`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": getServerEnv().CRON_SECRET ?? "" },
    body: JSON.stringify({ review_id: id, reply_text: replyText })
  }).catch((err) => console.error("[ReviewRespond] failed to send review-replied notification:", err));

  return NextResponse.json({ ok: true });
}

// DELETE /api/reviews/[id]/respond: salon owner deletes their own reply
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const disabled = await checkFeatureEnabled("reviews");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { errorResponse } = await requireOwnedReview(admin, id, user.id);
  if (errorResponse) return errorResponse;

  const { error } = await admin.from("review_replies").delete().eq("review_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
