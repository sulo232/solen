export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, loyaltyStampSchema } from "@/lib/validations";
import { verifyLoyaltyQRToken } from "@/lib/barber/loyalty-qr";
import { getServerEnv } from "@/lib/env";

// POST /api/loyalty/stamp — Verify HMAC token and award stamp
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(loyaltyStampSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const secret = getServerEnv().LOYALTY_HMAC_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

  // Verify HMAC token
  const result = verifyLoyaltyQRToken(validated.token, secret);
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or tampered token" }, { status: 403 });
  }

  const { salonId, customerId, cardId } = result;

  const admin = createAdminSupabaseClient();

  // Verify the scanning user owns this salon (staff verification)
  const { data: salon } = await admin
    .from("salons").select("id").eq("id", salonId).eq("owner_id", user.id).single();
  if (!salon) {
    return NextResponse.json({ error: "Not your salon" }, { status: 403 });
  }

  // Get card and program
  const { data: card } = await admin
    .from("barber_loyalty_cards")
    .select("*, barber_loyalty_programs(stamps_required)")
    .eq("id", cardId)
    .eq("customer_id", customerId)
    .eq("status", "active")
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found or inactive" }, { status: 404 });
  }

  const stampsRequired = (card.barber_loyalty_programs as any)?.stamps_required ?? 10;

  if (card.stamps_collected >= stampsRequired) {
    return NextResponse.json({ error: "Card already complete" }, { status: 400 });
  }

  // Increment stamps
  const newStamps = card.stamps_collected + 1;
  const isComplete = newStamps >= stampsRequired;

  await admin
    .from("barber_loyalty_cards")
    .update({
      stamps_collected: newStamps,
      status: isComplete ? "completed" : "active",
    })
    .eq("id", cardId);

  // Log history
  await admin
    .from("barber_loyalty_history")
    .insert({
      card_id: cardId,
      action: "stamp",
      performed_by: user.id,
    });

  return NextResponse.json({
    stamped: true,
    stamps_collected: newStamps,
    stamps_required: stampsRequired,
    is_complete: isComplete,
  });
}
