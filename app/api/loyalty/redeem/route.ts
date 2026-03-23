export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, loyaltyRedeemSchema } from "@/lib/validations";

// POST /api/loyalty/redeem — Redeem a completed barber loyalty card
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

  // Log history
  await admin
    .from("barber_loyalty_history")
    .insert({
      card_id: cardId,
      action: "redeem",
      performed_by: user.id,
    });

  // Auto-create a new active card for the customer
  await admin
    .from("barber_loyalty_cards")
    .insert({
      program_id: card.program_id,
      customer_id: card.customer_id,
      salon_id: card.salon_id,
      stamps_collected: 0,
      status: "active",
    });

  return NextResponse.json({
    redeemed: true,
    reward_type: (card.barber_loyalty_programs as any)?.reward_type,
    reward_value: (card.barber_loyalty_programs as any)?.reward_value,
  });
}
