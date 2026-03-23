export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/loyalty/cards/[cardId] — Get single barber loyalty card with history
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

  const { data: card, error } = await admin
    .from("barber_loyalty_cards")
    .select("*, barber_loyalty_programs(name, stamps_required, reward_type, reward_value, reward_service_id)")
    .eq("id", cardId)
    .eq("customer_id", user.id)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Get stamp history
  const { data: history } = await admin
    .from("barber_loyalty_history")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ card, history: history ?? [] });
}
