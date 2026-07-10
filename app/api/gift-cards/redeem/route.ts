export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

// POST /api/gift-cards/redeem (2026-07-10): disabled.
//
// Gift cards are a killed/hidden feature (see memory: project_killed_features).
// This endpoint had zero callers, took a client-supplied code + amount, and
// unconditionally decremented gift_cards.remaining_amount for ANY authenticated
// user with no ownership tie and no booking/purchase behind it: any session
// holder could drain any other person's stored balance, an unauthenticated
// value-drain hole (no check that the caller was ever tied to the card). Kept
// as a stub instead of deleted so re-enabling requires deliberately restoring
// real logic, not just an accidental re-route.
export async function POST() {
  return NextResponse.json(
    { error: "Gift card redemption is not available." },
    { status: 410 }
  );
}
