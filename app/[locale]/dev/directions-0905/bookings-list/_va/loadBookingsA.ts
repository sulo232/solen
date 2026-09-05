/**
 * Grounded-in: app/api/bookings/user/route.ts (the EXACT column list and the three tab
 * predicates this loader mirrors: upcoming = confirmed + starts_at >= now; past =
 * completed/confirmed/no_show + starts_at < now; cancelled = status = 'cancelled'),
 * scripts/seed-voucher-credit-test-data.ts (the admin.auth.admin.listUsers() pattern for
 * resolving a seed customer's auth id by email, since `profiles` in this project is keyed
 * by the auth user id and this dev route needs the REAL kunde@solen.ch rows, never a
 * hardcoded booking).
 *
 * Exists-check: `npm run exists loadBookings` -> 0, net-new. `npm run exists
 * bookings-list` -> the scaffold page + the real BookingsList component, both reused
 * (the scaffold is edited only for the `v==='a'` branch; BookingsList itself is read for
 * its query shape, not imported, since this direction's anatomy is genuinely different).
 *
 * Server-only, dev-gated route (../../layout.tsx). Uses the admin client to bypass RLS
 * for the SAME justification app/[locale]/dev/_shared/seedSalon.ts already uses: this
 * never runs on a real request path, only inside /dev/directions-0905/bookings-list.
 * Never fabricates a booking; if the seed customer genuinely has zero rows in a bucket,
 * that bucket is returned empty and the real EmptyState primitive renders.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const CUSTOMER_EMAIL = "kunde@solen.ch";

// The SAME column list app/api/bookings/user/route.ts selects, so this direction reads
// off the identical shape the real BookingsList / BookingCard consume.
const BOOKING_SELECT = `
  id, user_id, salon_id, service_id, slot_id,
  starts_at, ends_at, price_paid, status, created_at,
  is_first_visit, is_recurring,
  sms_sent_24h, sms_sent_1h, review_prompt_sent,
  salon:salons(id, slug, name, address, average_rating, review_count, cover_photo_url),
  service:services(id, name_de, name_en, duration_minutes, price),
  staff:staff_members(id, name, avatar_url)
`;

export interface LoadedBooking {
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
    duration_minutes: number;
    price: number;
  } | null;
}

export interface BookingsABuckets {
  upcoming: LoadedBooking[];
  /** Past (completed/confirmed-past/no_show) merged with cancelled, sorted starts_at
   * DESC, exactly as this direction's "one scroll, Past label" anatomy calls for
   * (brief: "the cancelled one among them with its status"). */
  past: LoadedBooking[];
}

let cache: BookingsABuckets | null = null;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function loadBookingsA(): Promise<BookingsABuckets> {
  if (cache) return cache;

  const supabase = createAdminSupabaseClient();

  const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (userErr) {
    console.error("[directions-0905/bookings-list/_va] listUsers failed:", userErr);
    cache = { upcoming: [], past: [] };
    return cache;
  }
  const customer = userList.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!customer) {
    console.error(`[directions-0905/bookings-list/_va] ${CUSTOMER_EMAIL} not found.`);
    cache = { upcoming: [], past: [] };
    return cache;
  }

  const now = new Date().toISOString();

  const [{ data: upcomingRows, error: upErr }, { data: pastRows, error: pastErr }, { data: cancelledRows, error: cancErr }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("user_id", customer.id)
        .eq("status", "confirmed")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true }),
      supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("user_id", customer.id)
        .in("status", ["completed", "confirmed", "no_show"])
        .lt("starts_at", now)
        .order("starts_at", { ascending: false })
        .range(0, 99),
      supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("user_id", customer.id)
        .eq("status", "cancelled")
        .order("starts_at", { ascending: false })
        .range(0, 99),
    ]);

  if (upErr) console.error("[directions-0905/bookings-list/_va] upcoming query failed:", upErr);
  if (pastErr) console.error("[directions-0905/bookings-list/_va] past query failed:", pastErr);
  if (cancErr) console.error("[directions-0905/bookings-list/_va] cancelled query failed:", cancErr);

  const normalize = (rows: unknown[] | null): LoadedBooking[] =>
    (rows ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        salon_id: row.salon_id as string,
        service_id: row.service_id as string,
        slot_id: row.slot_id as string,
        starts_at: row.starts_at as string,
        ends_at: row.ends_at as string,
        price_paid: Number(row.price_paid ?? 0),
        status: row.status as LoadedBooking["status"],
        salon: unwrapOne(row.salon as never),
        service: unwrapOne(row.service as never),
      };
    });

  const upcoming = normalize(upcomingRows as unknown[] | null);
  const past = [...normalize(pastRows as unknown[] | null), ...normalize(cancelledRows as unknown[] | null)].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  cache = { upcoming, past };
  return cache;
}
