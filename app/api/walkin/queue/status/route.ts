export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";
import { recentAvgServiceMinutes } from "@/lib/barber/walkin-ticket";
import { findQueueEntryByToken } from "@/lib/walkin/authz";

// GET /api/walkin/queue/status?token={tracking_token}
// Public — anonymous clients poll this every 30s to track their queue position.
// No auth required; tracking_token is the identity proof.
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Single guest gate: resolve the entry by its tracking token (see lib/walkin/authz).
  const entry = await findQueueEntryByToken<{
    id: string; customer_name: string; ticket_code: string; position: number; status: string;
    estimated_wait_minutes: number; joined_at: string; called_at: string | null;
    started_at: string | null; completed_at: string | null; salon_id: string;
    assigned_barber_id: string | null; preferred_barber_id: string | null; service_id: string | null;
  }>(
    admin,
    token,
    "id, customer_name, ticket_code, position, status, estimated_wait_minutes, joined_at, called_at, started_at, completed_at, salon_id, assigned_barber_id, preferred_barber_id, service_id",
  );

  if (!entry) {
    return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
  }

  // Count how many people are ahead (waiting, not in_chair)
  const { count: ahead } = await admin
    .from("barber_walkin_queue")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", entry.salon_id)
    .eq("status", "waiting")
    .lt("position", entry.position);

  // Live ETA: recompute from the CURRENT queue depth + the salon's recent measured pace, so
  // the wait drops as the line moves — instead of the frozen creation-time estimate.
  const aheadCount = ahead ?? 0;
  let estimatedWaitMinutes = 0;
  if (entry.status === "waiting") {
    const { data: staff } = await admin
      .from("staff_members").select("id").eq("salon_id", entry.salon_id).eq("is_active", true);
    const avg = await recentAvgServiceMinutes(admin, entry.salon_id);
    // `|| 1`, not `?? 1`: 0 active staff must still estimate against 1 chair, else wait shows 0.
    estimatedWaitMinutes = estimateWaitMinutes(aheadCount, avg, staff?.length || 1);
  }

  // Recipient + context for the tip screen and "bei <Barber>" labels. Best-effort; on any miss
  // the tip page falls back to a generic recipient, never blocks the status poll.
  const barberId = entry.assigned_barber_id ?? entry.preferred_barber_id;
  const [staffRes, svcRes, salonRes] = await Promise.all([
    barberId
      ? admin.from("staff_members").select("name, avatar_url, average_rating, review_count").eq("id", barberId).maybeSingle()
      : Promise.resolve({ data: null as any }),
    entry.service_id
      ? admin.from("services").select("name_de, name_en, name_fr, name_it, price, duration_minutes").eq("id", entry.service_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
    admin.from("salons").select("name, slug, address, cover_photo_url, gallery_urls, latitude, longitude").eq("id", entry.salon_id).maybeSingle(),
  ]);

  // The row's customer_name is dual-purpose by design (lib/barber/walkin-ticket.ts,
  // lib/walkin/join.ts): every insert path falls back to the ticket code itself ("A01")
  // whenever no real name was captured ("staff call the number, not a name"), and only
  // holds an actual customer name once a caller passes one in. Comparing against
  // ticket_code (never exposed to the client) is how we tell the two apart without ever
  // presenting a ticket code as a fabricated first name.
  // As of 2026-09: the customer self-join paths (the free join in lib/walkin/join.ts, the
  // pay-first ticket in lib/barber/walkin-ticket.ts's createWalkinTicket, and the one-tap
  // ExpressMenu flow) never capture a name, so firstName is null there. The ONE live path
  // that does capture a real typed name is the dashboard's cash walk-in: WalkInModal.tsx
  // posts to /api/bookings/walk-in, which calls createCashWalkinTicket (lib/barber/
  // walkin-ticket.ts) and writes staff's typed customer_name straight into this same
  // barber_walkin_queue row when staff bothers to type one (it's an optional field, so it
  // still falls back to the ticket code when left blank). So firstName is populated only for
  // walk-ins added that way; every other join method reads null here.
  const hasCapturedName = !!entry.customer_name && entry.customer_name !== entry.ticket_code;
  const firstName = hasCapturedName ? (entry.customer_name.trim().split(/\s+/)[0] || null) : null;

  return NextResponse.json({
    id: entry.id,
    customerName: entry.customer_name,
    firstName,
    position: entry.position,
    status: entry.status,
    estimatedWaitMinutes,
    aheadCount,
    joinedAt: entry.joined_at,
    calledAt: entry.called_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
    recipientName: (staffRes.data as any)?.name ?? null,
    recipientPhoto: (staffRes.data as any)?.avatar_url ?? null,
    recipientRating: (staffRes.data as any)?.average_rating ?? null,
    recipientReviewCount: (staffRes.data as any)?.review_count ?? null,
    // This public token route has no request locale (no ?locale param, no session to read a
    // profile from), so serviceName keeps the de -> en fallback the caller already had; the
    // raw name_fr/name_it are exposed alongside it so the /queue/[token] page can pick by its
    // own next-intl locale once that follow-up lands (out of this route's scope).
    serviceName: (svcRes.data as any)?.name_de ?? (svcRes.data as any)?.name_en ?? null,
    serviceNameDe: (svcRes.data as any)?.name_de ?? null,
    serviceNameEn: (svcRes.data as any)?.name_en ?? null,
    serviceNameFr: (svcRes.data as any)?.name_fr ?? null,
    serviceNameIt: (svcRes.data as any)?.name_it ?? null,
    servicePrice: (svcRes.data as any)?.price ?? null,
    serviceDuration: (svcRes.data as any)?.duration_minutes ?? null,
    salonName: (salonRes.data as any)?.name ?? null,
    salonSlug: (salonRes.data as any)?.slug ?? null,
    salonAddress: (salonRes.data as any)?.address ?? null,
    salonPhoto: (salonRes.data as any)?.cover_photo_url ?? null,
    salonPhotos: (salonRes.data as any)?.gallery_urls ?? null, // swipeable hero gallery (PDP-style)
    salonLat: (salonRes.data as any)?.latitude ?? null,
    salonLng: (salonRes.data as any)?.longitude ?? null,
  });
}
