export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { generateLoyaltyQRToken } from "@/lib/barber/loyalty-qr";
import QRCode from "qrcode";

// GET /api/loyalty/qr/[cardId] — Generate QR code SVG for loyalty stamp
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
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

  const { cardId } = await params;

  const admin = createAdminSupabaseClient();

  // Verify card belongs to user
  const { data: card } = await admin
    .from("barber_loyalty_cards")
    .select("id, customer_id, salon_id, program_id, status")
    .eq("id", cardId)
    .eq("customer_id", user.id)
    .eq("status", "active")
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found or inactive" }, { status: 404 });
  }

  const secret = process.env.LOYALTY_HMAC_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

  const token = generateLoyaltyQRToken(card.salon_id, user.id, cardId, secret);
  const stampUrl = `https://www.solen.ch/loyalty/stamp?token=${encodeURIComponent(token)}`;

  const svg = await QRCode.toString(stampUrl, { type: "svg", margin: 2 });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
