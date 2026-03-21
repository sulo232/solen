export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";

// POST /api/gift-cards/redeem — Deduct amount from gift card at checkout
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { code, amount } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Gift card code required" }, { status: 400 });
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
  }

  // Find active gift card
  const { data: card } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (!card) return NextResponse.json({ error: "Gift card not found or inactive" }, { status: 404 });

  // Check expiry
  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    return NextResponse.json({ error: "Gift card has expired" }, { status: 410 });
  }

  // Check balance
  if (card.remaining_amount < amount) {
    return NextResponse.json({
      error: `Insufficient balance. Remaining: ${card.remaining_amount}`,
      remaining_amount: card.remaining_amount,
    }, { status: 400 });
  }

  // Deduct amount (optimistic lock via remaining_amount check)
  const newRemaining = card.remaining_amount - amount;
  const { error } = await supabase
    .from("gift_cards")
    .update({
      remaining_amount: newRemaining,
      is_active: newRemaining > 0,
    })
    .eq("id", card.id)
    .eq("remaining_amount", card.remaining_amount); // optimistic lock

  if (error) return NextResponse.json({ error: "Redemption failed — try again" }, { status: 409 });

  return NextResponse.json({
    data: {
      deducted: amount,
      remaining_amount: newRemaining,
      card_depleted: newRemaining <= 0,
    },
  });
}
