/**
 * Exists-check: `npm run exists "bookings list"` -> BookingsList.tsx (the real component)
 * and this same page's own scaffold; no prior loader read a REAL booking set for the
 * bookings-list direction comparison. `npm run exists seedBooking` -> one loader,
 * ../_shared/seedBooking.ts, which loads exactly ONE confirmed booking for the
 * CONFIRMATION mockups (a different seed customer resolution: any confirmed+paid
 * booking, not tied to one email). This surface's brief names a fixed seed customer
 * (kunde@solen.ch) and needs the CUSTOMER'S FULL SET across three tabs, which
 * seedBooking.ts does not provide, so this is a net-new loader, not a duplicate.
 *
 * Grounded-in: app/api/bookings/user/route.ts (the exact `bookings` select list and the
 * exact per-tab status/date rule this loader mirrors: upcoming = status 'confirmed' AND
 * starts_at >= now; past = status in [completed, confirmed, no_show] AND starts_at < now;
 * cancelled = status 'cancelled'), components-legacy/booking/BookingCard.tsx (the `Booking`
 * shape this loader's rows are mapped to match), ../_shared/seedBooking.ts (the
 * server-only + admin-client + per-process-cache pattern this file follows).
 *
 * Server-only, dev-route-gated (bookings-list/page.tsx lives under
 * app/[locale]/dev/directions-0905/, gated the same way every sibling direction is).
 * Uses the service-role admin client to read the SEED CUSTOMER's real, live bookings by
 * email (kunde@solen.ch, per the task brief), the same justification seedBooking.ts and
 * seedSalon.ts already use: this never runs in a real request path.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const CUSTOMER_EMAIL = "kunde@solen.ch";

// Field list widened beyond what this direction's OWN hero/timeline render (average_rating,
// review_count, price, name_fr/it, staff avatar/id) so the row can also satisfy the real
// `Booking` type components-legacy/booking/BookingCard.tsx exports (used verbatim for the
// timeline row's expanded detail, see BookingsListDirectionC.tsx), with every field REAL,
// never a filled-in placeholder.
const BOOKINGS_SELECT = `id, user_id, salon_id, service_id, slot_id, starts_at, ends_at,
  price_paid, status,
  salon:salons(id, slug, name, address, average_rating, review_count, cover_photo_url),
  service:services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
  staff:staff_members(id, name, avatar_url)`;

export interface SeedBookingRow {
  id: string;
  user_id: string;
  salon_id: string;
  service_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no_show";
  salon: {
    id: string;
    slug: string | null;
    name: string;
    address: string | null;
    average_rating: number | null;
    review_count: number | null;
    cover_photo_url: string | null;
  } | null;
  service: {
    id: string;
    name_de: string;
    name_en: string | null;
    name_fr: string | null;
    name_it: string | null;
    duration_minutes: number | null;
    price: number | null;
  } | null;
  staff: { id: string; name: string | null; avatar_url: string | null } | null;
}

export interface SeedBookingBuckets {
  /** Ascending by starts_at (soonest first), status 'confirmed' and starts_at >= now. */
  upcoming: SeedBookingRow[];
  /** Descending by starts_at (most recent first), matching /api/bookings/user's own order. */
  past: SeedBookingRow[];
  /** Descending by starts_at, status 'cancelled'. */
  cancelled: SeedBookingRow[];
}

type RawRow = {
  id: string;
  user_id: string | null;
  salon_id: string | null;
  service_id: string | null;
  slot_id: string | null;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  status: string | null;
  salon: unknown;
  service: unknown;
  staff: unknown;
};

let cache: SeedBookingBuckets | null = null;

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

function mapRow(row: RawRow): SeedBookingRow {
  return {
    id: row.id,
    user_id: row.user_id ?? "",
    salon_id: row.salon_id ?? "",
    service_id: row.service_id ?? "",
    slot_id: row.slot_id ?? "",
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    price_paid: row.price_paid,
    status: (row.status as SeedBookingRow["status"]) ?? "completed",
    salon: one(row.salon),
    service: one(row.service),
    staff: one(row.staff),
  };
}

/**
 * The seed customer's real bookings, bucketed the same way BookingsList.tsx's three tabs
 * bucket them (mirrors /api/bookings/user's per-tab filter, run once against ALL rows
 * instead of three separate requests since this mockup renders every bucket on one
 * screen). Returns empty buckets, never fabricated rows, if the seed customer or their
 * bookings genuinely cannot be found.
 */
export async function getSeedBookingsForCustomer(): Promise<SeedBookingBuckets> {
  if (cache) return cache;

  const empty: SeedBookingBuckets = { upcoming: [], past: [], cancelled: [] };
  const supabase = createAdminSupabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", CUSTOMER_EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error("[bookings-list/_vc] profile lookup failed:", profileError);
    return empty;
  }
  if (!profile) {
    console.error(`[bookings-list/_vc] no profile found for ${CUSTOMER_EMAIL}`);
    return empty;
  }

  const { data: rows, error } = await supabase
    .from("bookings")
    .select(BOOKINGS_SELECT)
    .eq("user_id", profile.id)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("[bookings-list/_vc] bookings query failed:", error);
    return empty;
  }

  const now = Date.now();
  const upcoming: SeedBookingRow[] = [];
  const past: SeedBookingRow[] = [];
  const cancelled: SeedBookingRow[] = [];

  for (const raw of (rows ?? []) as unknown as RawRow[]) {
    const mapped = mapRow(raw);
    const startsMs = new Date(mapped.starts_at).getTime();
    if (mapped.status === "cancelled") {
      cancelled.push(mapped);
    } else if (mapped.status === "confirmed" && startsMs >= now) {
      upcoming.push(mapped);
    } else if (
      (mapped.status === "completed" || mapped.status === "confirmed" || mapped.status === "no_show") &&
      startsMs < now
    ) {
      past.push(mapped);
    }
    // Any other status (e.g. 'pending') is out of scope for this mockup's three buckets,
    // matching the real /api/bookings/user route which only ever serves these three tabs.
  }

  // Query was ascending; upcoming stays ascending (soonest first, matches the real
  // 'upcoming' tab's own order), past/cancelled are reversed to descending (most recent
  // first, matches the real 'past'/'cancelled' tabs' own order).
  cache = { upcoming, past: past.reverse(), cancelled: cancelled.reverse() };
  return cache;
}
