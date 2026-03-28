export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Dashboard batch endpoint — runs multiple sub-requests in parallel instead of
 * waterfall fetches from the client.
 *
 * POST body: { salonId: string; requests: string[] }
 * where requests is an array of keys like:
 *   "bookings_today" | "revenue_month" | "reviews_pending" | "walkin_queue" | "activity_feed"
 */

type BatchKey = "bookings_today" | "revenue_month" | "reviews_pending" | "walkin_queue" | "activity_feed";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { salonId, requests } = body as { salonId: string; requests: BatchKey[] };
  if (!salonId || !Array.isArray(requests)) {
    return NextResponse.json({ error: "salonId and requests required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const results: Record<string, unknown> = {};

  await Promise.all(
    requests.map(async (key) => {
      try {
        switch (key) {
          case "bookings_today": {
            const { count } = await admin
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("salon_id", salonId)
              .gte("starts_at", `${today}T00:00:00`)
              .lte("starts_at", `${today}T23:59:59`);
            results[key] = { count: count ?? 0 };
            break;
          }
          case "revenue_month": {
            const { data } = await admin
              .from("bookings")
              .select("price_paid")
              .eq("salon_id", salonId)
              .eq("status", "completed")
              .gte("starts_at", monthStart);
            const total = (data ?? []).reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
            results[key] = { total };
            break;
          }
          case "reviews_pending": {
            const { count } = await admin
              .from("reviews")
              .select("id", { count: "exact", head: true })
              .eq("salon_id", salonId)
              .is("reply", null);
            results[key] = { count: count ?? 0 };
            break;
          }
          case "walkin_queue": {
            const { data } = await admin
              .from("barber_walkin_queue")
              .select("id, status")
              .eq("salon_id", salonId)
              .in("status", ["waiting", "in_chair"]);
            results[key] = { waiting: (data ?? []).filter((r) => r.status === "waiting").length, in_chair: (data ?? []).filter((r) => r.status === "in_chair").length };
            break;
          }
          case "activity_feed": {
            const [bookingsRes, reviewsRes] = await Promise.all([
              admin.from("bookings").select("id, starts_at, status, created_at").eq("salon_id", salonId).order("created_at", { ascending: false }).limit(5),
              admin.from("reviews").select("id, rating, created_at").eq("salon_id", salonId).order("created_at", { ascending: false }).limit(5),
            ]);
            const bookingItems = (bookingsRes.data ?? []).map((b) => ({ type: "booking", ...b }));
            const reviewItems = (reviewsRes.data ?? []).map((r) => ({ type: "review", ...r }));
            const feed = [...bookingItems, ...reviewItems].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ).slice(0, 8);
            results[key] = { feed };
            break;
          }
        }
      } catch {
        results[key] = { error: "failed" };
      }
    })
  );

  return NextResponse.json({ results });
}
