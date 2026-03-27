export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/salon/clients?salon_id=xxx — List clients who have booked at this salon
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership or admin
  const { data: salon } = await supabase.from("salons").select("id, owner_id").eq("id", salonId).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (salon.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get unique customers from bookings with their last visit and count
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("user_id, starts_at")
    .eq("salon_id", salonId)
    .not("user_id", "is", null)
    .order("starts_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by user_id
  const clientMap = new Map<string, { user_id: string; last_visit: string; total_bookings: number }>();
  for (const b of bookings ?? []) {
    if (!b.user_id) continue;
    const existing = clientMap.get(b.user_id);
    if (existing) {
      existing.total_bookings++;
    } else {
      clientMap.set(b.user_id, { user_id: b.user_id, last_visit: b.starts_at, total_bookings: 1 });
    }
  }

  const clientIds = Array.from(clientMap.keys());
  if (clientIds.length === 0) return NextResponse.json({ clients: [] });

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, display_name, avatar_url")
    .in("id", clientIds);

  // Fetch tags
  const { data: allTags } = await supabase
    .from("client_tags")
    .select("customer_id, tag, color")
    .eq("salon_id", salonId)
    .in("customer_id", clientIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const tagMap = new Map<string, { tag: string; color: string }[]>();
  for (const t of allTags ?? []) {
    const list = tagMap.get(t.customer_id) ?? [];
    list.push({ tag: t.tag, color: t.color });
    tagMap.set(t.customer_id, list);
  }

  // Fetch RFM segments (may not exist yet if migration hasn't run)
  let rfmMap = new Map<string, { segment_tag: string; total_spent: number }>();
  try {
    const { data: rfm } = await supabase
      .from("client_rfm_segments")
      .select("client_id, segment_tag, total_spent")
      .eq("salon_id", salonId)
      .in("client_id", clientIds);
    if (rfm) {
      rfmMap = new Map(rfm.map((r: { client_id: string; segment_tag: string; total_spent: number }) => [r.client_id, { segment_tag: r.segment_tag, total_spent: r.total_spent }]));
    }
  } catch { /* view may not exist yet */ }

  const clients = Array.from(clientMap.values()).map((c) => {
    const p = profileMap.get(c.user_id);
    const rfm = rfmMap.get(c.user_id);
    return {
      user_id: c.user_id,
      display_name: p?.display_name ?? "Unbekannt",
      avatar_url: p?.avatar_url ?? null,
      last_visit: c.last_visit,
      total_bookings: c.total_bookings,
      tags: tagMap.get(c.user_id) ?? [],
      segment_tag: rfm?.segment_tag ?? "Regulär",
      total_spent: rfm?.total_spent ?? 0,
    };
  });

  // Sort by last visit desc
  clients.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());

  return NextResponse.json({ clients });
}
