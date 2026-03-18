import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";

// GET /api/loyalty — Get user's stamp cards with progress
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Get all active loyalty cards from salons user has visited
  const { data: cards } = await supabase
    .from("loyalty_cards")
    .select("id, salon_id, stamps_needed, reward_text, salons(name, slug, cover_photo_url)")
    .eq("is_active", true);

  if (!cards || cards.length === 0) {
    return NextResponse.json({ cards: [] });
  }

  // Get user's stamps grouped by card
  const { data: stamps } = await supabase
    .from("loyalty_stamps")
    .select("loyalty_card_id, stamped_at")
    .eq("customer_id", user.id)
    .in("loyalty_card_id", cards.map((c) => c.id))
    .order("stamped_at", { ascending: true });

  const stampsByCard = new Map<string, number>();
  for (const s of stamps ?? []) {
    stampsByCard.set(s.loyalty_card_id, (stampsByCard.get(s.loyalty_card_id) ?? 0) + 1);
  }

  const result = cards
    .map((card) => ({
      ...card,
      stamps_collected: stampsByCard.get(card.id) ?? 0,
      is_complete: (stampsByCard.get(card.id) ?? 0) >= card.stamps_needed,
    }))
    .filter((c) => c.stamps_collected > 0); // Only show cards with stamps

  return NextResponse.json({ cards: result });
}
