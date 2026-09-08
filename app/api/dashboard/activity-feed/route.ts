export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/dashboard/activity-feed?salon_id=...&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (calendar) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "calendar");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

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

  // Merge and sort all events. created_at (and, for messages, last_message_at) are nullable
  // columns; an event without a real timestamp can't be placed in the feed, so it's skipped
  // rather than backfilled with a fabricated date.
  const events: { type: string; id: string; created_at: string; meta?: Record<string, unknown> }[] = [
    ...(bookings ?? []).flatMap((b) => (b.created_at ? [{
      type: b.status === "cancelled" ? "booking_cancelled" : "booking_new",
      id: b.id,
      created_at: b.created_at,
      meta: { status: b.status, starts_at: b.starts_at },
    }] : [])),
    ...(reviews ?? []).flatMap((r) => (r.created_at ? [{
      type: "review_new",
      id: r.id,
      created_at: r.created_at,
      meta: { rating: r.rating },
    }] : [])),
    ...(messages ?? []).flatMap((m) => {
      const created_at = m.last_message_at ?? m.created_at;
      return created_at ? [{
        type: "message_new",
        id: m.id,
        created_at,
        meta: {},
      }] : [];
    }),
  ];

  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ events: events.slice(0, limit) });
}
