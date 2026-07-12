export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, loyaltyRedeemSchema } from "@/lib/validations";

// POST /api/loyalty/redeem — Redeem a completed barber loyalty card
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
  const { data: validated, error: validationError } = validateBody(loyaltyRedeemSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const cardId = validated.card_id;

  const admin = createAdminSupabaseClient();

  // Verify salon ownership (only salon staff can redeem)
  const { data: card } = await admin
    .from("barber_loyalty_cards")
    .select("*, barber_loyalty_programs(salon_id, reward_type, reward_value, reward_service_id)")
    .eq("id", cardId)
    .eq("status", "completed")
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found or not completed" }, { status: 404 });
  }

  const salonId = (card.barber_loyalty_programs as any)?.salon_id;

  const { data: salon } = await admin
    .from("salons").select("id").eq("id", salonId).eq("owner_id", user.id).single();
  if (!salon) {
    return NextResponse.json({ error: "Not your salon" }, { status: 403 });
  }

  // Mark card as redeemed
  await admin
    .from("barber_loyalty_cards")
    .update({ status: "redeemed" })
    .eq("id", cardId);

  // NOTE (typed-DB pass, 2026-07-11): this used to insert into barber_loyalty_history with
  // columns { card_id, action, performed_by } which do not exist on that table (live schema is
  // a completion-record shape: card_id, salon_id, customer_id, stamps_collected, reward_type,
  // reward_value, completed_at, redeemed_at, all NOT NULL except reward_value/redeemed_at). That
  // insert has never been able to succeed against the live schema (its error was discarded, so
  // this was a pre-existing silent no-op, not a regression here). Left removed rather than
  // guessing a completed_at/stamps_collected value: flagged for a product/schema decision.

  // Auto-create a new active card for the customer. qr_token is NOT NULL UNIQUE with no DB
  // default (supabase/migrations/073_barber_foundation.sql) and was previously omitted, so this
  // insert also always failed silently; the QR flow itself never reads this column back (it
  // recomputes an HMAC token from salonId/customerId/cardId on the fly, see
  // app/api/loyalty/qr/[cardId]/route.ts), so a random unique value satisfies the constraint
  // without inventing any business value. stamps_collected -> stamps: the real column name
  // (supabase/migrations/073_barber_foundation.sql line 96); stamps_collected does not exist on
  // barber_loyalty_cards (it exists on the unrelated barber_loyalty_history table).
  await admin
    .from("barber_loyalty_cards")
    .insert({
      program_id: card.program_id,
      customer_id: card.customer_id,
      salon_id: card.salon_id,
      stamps: 0,
      status: "active",
      qr_token: randomUUID(),
    });

  return NextResponse.json({
    redeemed: true,
    reward_type: (card.barber_loyalty_programs as any)?.reward_type,
    reward_value: (card.barber_loyalty_programs as any)?.reward_value,
  });
}
