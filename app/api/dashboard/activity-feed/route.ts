export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/activity-feed?salon_id=...&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Verify ownership or admin
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", salonId)
    .single();

  const isOwner = salon?.owner_id === session.user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent bookings
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, status, created_at, starts_at")
    .eq("salon_id", salonId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Fetch recent reviews
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, rating, created_at")
    .eq("salon_id", salonId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Fetch recent conversations (unread or new)
  const { data: messages } = await admin
    .from("conversations")
    .select("id, created_at, last_message_at")
    .eq("salon_id", salonId)
    .gte("last_message_at", since)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  // Merge and sort all events
  const events: { type: string; id: string; created_at: string; meta?: Record<string, unknown> }[] = [
    ...(bookings ?? []).map((b) => ({
      type: b.status === "cancelled" ? "booking_cancelled" : "booking_new",
      id: b.id,
      created_at: b.created_at,
      meta: { status: b.status, starts_at: b.starts_at },
    })),
    ...(reviews ?? []).map((r) => ({
      type: "review_new",
      id: r.id,
      created_at: r.created_at,
      meta: { rating: r.rating },
    })),
    ...(messages ?? []).map((m) => ({
      type: "message_new",
      id: m.id,
      created_at: m.last_message_at ?? m.created_at,
      meta: {},
    })),
  ];

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ events: events.slice(0, limit) });
}
