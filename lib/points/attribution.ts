// exists-check: net-new. The phase-1 search→book attribution wire (_tasks/SEARCH_BOOK_POINTS_SPEC.md):
// links a booking to the search_events click that led to it. EXTENDS live tables search_events +
// bookings; reuses the solen_se_sid session + the search clicked_type→salon resolution. NOT a dup of
// lib/bookings/* (slot/guest/reference logic) or lib/discovery-algorithm.ts (item ranking).
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTRIBUTION_WINDOW_MIN } from "@/lib/points/weights";

// Plain (un-generic) client on purpose: the live DB has attributed_search_event_id +
// acquisition_source, but the generated Database types lag (drift) — a loosely-typed client accepts
// the update without a cast. Regenerate lib/database.types.ts to tighten this later.
type LooseClient = SupabaseClient;

type ClickRow = { id: string; clicked_type: string | null; clicked_id: string | null; created_at: string };

/**
 * Best-effort LAST-TOUCH attribution. If a recent click in this search session led to the booked
 * salon, flip search_events.booked + stamp the booking (attributed_search_event_id + acquisition_source
 * = 'search'). Returns the matched search_events id, or null. No-op when there's no session row
 * (e.g. no consent), no recent click, or no click that resolves to THIS salon.
 *
 * clicked_type → salon resolution: 'salon' = clicked_id; 'service' = services.salon_id;
 * 'stylist' = staff_members.salon_id (the same mapping /api/search/event validates clicks against).
 */
export async function attributeBookingToSearch(
  admin: LooseClient,
  opts: { sessionId: string; salonId: string; bookingId: string },
): Promise<string | null> {
  const { sessionId, salonId, bookingId } = opts;
  if (!sessionId || !salonId || !bookingId) return null;

  const sinceISO = new Date(Date.now() - ATTRIBUTION_WINDOW_MIN * 60_000).toISOString();

  // Recent CLICKS in this session, newest first (last-touch wins). Index: idx_search_events_session_created.
  const { data: rows } = await admin
    .from("search_events")
    .select("id, clicked_type, clicked_id, created_at")
    .eq("session_id", sessionId)
    .not("clicked_id", "is", null)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(10);
  const events = (rows ?? []) as ClickRow[];
  if (!events.length) return null;

  // Batch-resolve service + stylist clicks to their salon, then walk newest→oldest for the booked salon.
  const serviceIds = events.filter((e) => e.clicked_type === "service" && e.clicked_id).map((e) => e.clicked_id as string);
  const stylistIds = events.filter((e) => e.clicked_type === "stylist" && e.clicked_id).map((e) => e.clicked_id as string);

  const svcSalon = new Map<string, string>();
  const stySalon = new Map<string, string>();
  if (serviceIds.length) {
    const { data } = await admin.from("services").select("id, salon_id").in("id", serviceIds);
    (data ?? []).forEach((s: { id: string; salon_id: string | null }) => { if (s.salon_id) svcSalon.set(s.id, s.salon_id); });
  }
  if (stylistIds.length) {
    const { data } = await admin.from("staff_members").select("id, salon_id").in("id", stylistIds);
    (data ?? []).forEach((s: { id: string; salon_id: string | null }) => { if (s.salon_id) stySalon.set(s.id, s.salon_id); });
  }

  const salonOf = (e: ClickRow): string | null => {
    if (!e.clicked_id) return null;
    if (e.clicked_type === "salon") return e.clicked_id;
    if (e.clicked_type === "service") return svcSalon.get(e.clicked_id) ?? null;
    if (e.clicked_type === "stylist") return stySalon.get(e.clicked_id) ?? null;
    return null;
  };

  const match = events.find((e) => salonOf(e) === salonId);
  if (!match) return null;

  // Close the loop. Best-effort writes; the caller wraps this in try/catch so a failure here never
  // breaks the booking. search_events flips booked=true; the booking stores the back-link + source.
  await admin.from("search_events").update({ booked: true }).eq("id", match.id);
  await admin.from("bookings").update({ attributed_search_event_id: match.id, acquisition_source: "search" }).eq("id", bookingId);

  return match.id;
}
