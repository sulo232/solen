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
  const { data: { user } } = await supabase.auth.getUser();
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
  if (!salonId || !customerId || !cardId) {
    return NextResponse.json({ error: "Invalid or tampered token" }, { status: 403 });
  }

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

  if (card.stamps >= stampsRequired) {
    return NextResponse.json({ error: "Card already complete" }, { status: 400 });
  }

  // Increment stamps. stamps_collected -> stamps: the real column name (barber_loyalty_cards
  // has no stamps_collected column; that name exists only on the unrelated barber_loyalty_history
  // table, supabase/migrations/073_barber_foundation.sql).
  const newStamps = card.stamps + 1;
  const isComplete = newStamps >= stampsRequired;

  await admin
    .from("barber_loyalty_cards")
    .update({
      stamps: newStamps,
      status: isComplete ? "completed" : "active",
    })
    .eq("id", cardId);

  // NOTE (typed-DB pass, 2026-07-11): this used to insert into barber_loyalty_history with
  // columns { card_id, action, performed_by } which do not exist on that table (live schema is
  // a completion-record shape: card_id, salon_id, customer_id, stamps_collected, reward_type,
  // reward_value, completed_at, redeemed_at, all NOT NULL except reward_value/redeemed_at). That
  // insert has never been able to succeed against the live schema (its error was discarded, so
  // this was a pre-existing silent no-op, not a regression here). Left removed rather than
  // guessing a completed_at/reward_type value: flagged for a product/schema decision.

  return NextResponse.json({
    stamped: true,
    stamps_collected: newStamps,
    stamps_required: stampsRequired,
    is_complete: isComplete,
  });
}
