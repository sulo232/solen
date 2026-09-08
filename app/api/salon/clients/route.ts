export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSalonAccess } from "@/lib/auth/require";
import { createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/salon/clients?salon_id=xxx: List clients who have booked at this salon
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (clients = clients & CRM) instead of the old
  // owner-or-admin compare. The owner path is unchanged: same owner_id
  // === user.id comparison, just made inside the shared gate.
  const accessResult = await requireSalonAccess(salonId, "clients");
  if (accessResult instanceof NextResponse) return accessResult;
  const { user } = accessResult;

  // P9-2 RLS fix: bookings_select_own is owner-only, so a granted staff
  // caller reading through the session client got silently empty results
  // past the gate. Resource I/O runs on the admin client from here on,
  // every query still scoped to the gated salonId.
  const admin = createAdminSupabaseClient();

  // Get unique customers from bookings with their last visit and count
  const { data: bookings, error } = await admin
    .from("bookings")
    .select("user_id, starts_at, price_paid, status")
    .eq("salon_id", salonId)
    .not("user_id", "is", null)
    .order("starts_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by user_id
  const clientMap = new Map<string, { user_id: string; last_visit: string; total_bookings: number; spent: number }>();
  for (const b of bookings ?? []) {
    if (!b.user_id) continue;
    // Live "total spent" = sum of price_paid for completed bookings — used as the fallback
    // when client_rfm_segments hasn't been computed for this salon yet (else it shows CHF 0).
    const paid = b.status === "completed" ? Number(b.price_paid ?? 0) : 0;
    const existing = clientMap.get(b.user_id);
    if (existing) {
      existing.total_bookings++;
      existing.spent += paid;
    } else {
      clientMap.set(b.user_id, { user_id: b.user_id, last_visit: b.starts_at, total_bookings: 1, spent: paid });
    }
  }

  const clientIds = Array.from(clientMap.keys());
  if (clientIds.length === 0) return NextResponse.json({ clients: [] });

  // Fetch profiles
  const { data: profiles } = await admin
    .from("public_profiles")
    .select("id, display_name, avatar_url")
    .in("id", clientIds);

  // Fetch tags
  const { data: allTags } = await admin
    .from("client_tags")
    .select("customer_id, tag, color")
    .eq("salon_id", salonId)
    .in("customer_id", clientIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const tagMap = new Map<string, { tag: string; color: string }[]>();
  for (const t of allTags ?? []) {
    const list = tagMap.get(t.customer_id) ?? [];
    list.push({ tag: t.tag, color: t.color ?? "" });
    tagMap.set(t.customer_id, list);
  }

  // Fetch RFM segments (may not exist yet if migration hasn't run). client_rfm_segments is a
  // phantom table/view (caught by strict typing, npm run exists: 0 matches), so the typed client
  // can't express this select; the untyped client keeps the existing try/catch fallback behavior.
  let rfmMap = new Map<string, { segment_tag: string; total_spent: number }>();
  try {
    const untyped: SupabaseClient = admin;
    const { data: rfm } = await untyped
      .from("client_rfm_segments")
      .select("client_id, segment_tag, total_spent")
      .eq("salon_id", salonId)
      .in("client_id", clientIds);
    if (rfm) {
      rfmMap = new Map(rfm.map((r: { client_id: string; segment_tag: string; total_spent: number }) => [r.client_id, { segment_tag: r.segment_tag, total_spent: r.total_spent }]));
    }
  } catch (err) { console.error("[salon/clients] RFM segments lookup failed (view may not exist yet):", err); }

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
      total_spent: rfm?.total_spent ?? c.spent,
    };
  });

  // Sort by last visit desc
  clients.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());

  return NextResponse.json({ clients });
}
