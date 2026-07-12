export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getActiveSalonId } from "@/lib/active-salon";

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = await getActiveSalonId(supabase, user.id);
  if (!salonId) return NextResponse.json({ notifications: [], unread_count: 0 });

  const notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    link: string;
    created_at: string;
    read: boolean;
  }> = [];

  // Cancellation requests (bookings with status = cancelled_by_customer)
  // bookings has no service_name or customer_id column (both phantom, caught by strict typing); the
  // service name comes via the services relation (same pattern as every other bookings query in this
  // codebase, e.g. app/api/bookings/route.ts, app/api/dashboard/today/route.ts). customer_id was never
  // read below, so it's dropped rather than renamed to the real user_id column.
  const { data: cancellations } = await supabase
    .from("bookings")
    .select("id, created_at, services(name_de)")
    .eq("salon_id", salonId)
    .eq("status", "cancelled_by_customer")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  (cancellations ?? []).forEach((b) => {
    notifications.push({
      id: `cancel-${b.id}`,
      type: "cancellation",
      title: "Stornierungsanfrage",
      body: b.services?.name_de ?? "Termin wurde storniert",
      link: "/dashboard/bookings",
      created_at: b.created_at ?? new Date().toISOString(),
      read: false,
    });
  });

  // Pending reviews (unread reviews in last 7 days)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, created_at, rating")
    .eq("salon_id", salonId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is("salon_response", null)
    .order("created_at", { ascending: false })
    .limit(5);

  (reviews ?? []).forEach((r) => {
    notifications.push({
      id: `review-${r.id}`,
      type: "review",
      title: "Neue Bewertung",
      body: `${r.rating} Sterne Noch keine Antwort`,
      link: "/dashboard/reviews",
      created_at: r.created_at ?? new Date().toISOString(),
      read: false,
    });
  });

  // Walk-in alerts (waiting queue items older than 30 min)
  // barber_walkin_queue has no created_at column (phantom, caught by strict typing); joined_at is
  // the real equivalent (established convention, e.g. app/api/walkin/queue/route.ts,
  // app/api/walkin/queue/status/route.ts).
  const { data: queue } = await supabase
    .from("barber_walkin_queue")
    .select("id, joined_at, customer_name")
    .eq("salon_id", salonId)
    .eq("status", "waiting")
    .lte("joined_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order("joined_at", { ascending: true })
    .limit(3);

  (queue ?? []).forEach((q) => {
    notifications.push({
      id: `walkin-${q.id}`,
      type: "walkin",
      title: "Walk-in wartet",
      body: `${q.customer_name} wartet seit über 30 Minuten`,
      link: "/dashboard/barber-ops",
      created_at: q.joined_at ?? new Date().toISOString(),
      read: false,
    });
  });

  // Sort by created_at descending
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    notifications: notifications.slice(0, 15),
    unread_count: notifications.length,
  });
}

// PATCH — mark all as read (no-op for now, just returns success)
export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ success: true });
}
