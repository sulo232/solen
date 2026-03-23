export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/dashboard/clients?category=barbershop — Get clients for salon owner
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "No salon" }, { status: 404 });

  const category = req.nextUrl.searchParams.get("category");

  // Get distinct customers from bookings
  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id, starts_at, staff_member_id, staff_members(name)")
    .eq("salon_id", salon.id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false });

  if (!bookings?.length) {
    return NextResponse.json({ clients: [], salon_id: salon.id });
  }

  // Group by customer
  const clientMap = new Map<string, {
    id: string;
    last_cut_date: string | null;
    preferred_barber: string | null;
    visit_count: number;
  }>();

  for (const b of bookings) {
    if (!b.user_id) continue;
    const existing = clientMap.get(b.user_id);
    if (!existing) {
      clientMap.set(b.user_id, {
        id: b.user_id,
        last_cut_date: b.starts_at,
        preferred_barber: (b.staff_members as any)?.name ?? null,
        visit_count: 1,
      });
    } else {
      existing.visit_count++;
    }
  }

  const customerIds = Array.from(clientMap.keys());

  // Get profiles
  const { data: profiles } = await admin
    .from("public_profiles")
    .select("id, display_name, avatar_url")
    .in("id", customerIds);

  // Get loyalty stamps count (barber)
  let loyaltyMap = new Map<string, number>();
  if (category === "barbershop") {
    const { data: cards } = await admin
      .from("barber_loyalty_cards")
      .select("customer_id, stamps_collected")
      .eq("salon_id", salon.id);
    for (const card of cards ?? []) {
      loyaltyMap.set(card.customer_id, (loyaltyMap.get(card.customer_id) ?? 0) + card.stamps_collected);
    }
  }

  const clients = customerIds.map((id) => {
    const client = clientMap.get(id)!;
    const profile = profiles?.find((p) => p.id === id);
    return {
      id,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      last_cut_date: client.last_cut_date,
      preferred_barber: client.preferred_barber,
      visit_count: client.visit_count,
      loyalty_stamps: loyaltyMap.get(id) ?? 0,
    };
  });

  return NextResponse.json({ clients, salon_id: salon.id });
}
