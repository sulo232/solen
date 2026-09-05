/**
 * Grounded-in: app/api/bookings/user/route.ts (the exact column list and the three tab
 * predicates this loader mirrors: upcoming = confirmed + starts_at >= now; past =
 * completed/confirmed/no_show + starts_at < now; cancelled = status = 'cancelled'),
 * scripts/seed-voucher-credit-test-data.ts (the admin.auth.admin.listUsers() pattern for
 * resolving the seed customer's auth id by email, used identically here to
 * ../_va/loadBookingsA.ts's own copy of the same pattern, independently written for this
 * direction's own folder per the "each direction owns its own loader" rule).
 *
 * Exists-check: `npm run exists getBookingsListB` -> 0, net-new. `npm run exists
 * "bookings/user"` -> app/api/bookings/user/route.ts, the query mirrored above.
 * `npm run exists bookings-list` -> the shared scaffold page + the real BookingsList
 * component (read for its query/anatomy, not imported: direction B's card anatomy is a
 * deliberate Airbnb-Trips port, not the locked BookingCard).
 *
 * Server-only, dev-gated route (../../layout.tsx). Admin client bypasses RLS for the same
 * justification `_shared/seedBooking.ts` already uses: this never runs on a real request
 * path, only inside /dev/directions-0905/bookings-list. Never fabricates a booking; a
 * genuinely empty bucket stays empty and the real EmptyState primitive renders it.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const CUSTOMER_EMAIL = "kunde@solen.ch";

// Same column list app/api/bookings/user/route.ts selects, plus staff (name) for the
// Airbnb-trip-card "with {staff}" subline, which the real card also has available
// (staff:staff_members(...)) but does not currently render.
const BOOKING_SELECT = `
  id, user_id, salon_id, service_id, slot_id,
  starts_at, ends_at, price_paid, status, created_at,
  salon:salons(id, slug, name, address, cover_photo_url),
  service:services(id, name_de, name_en, duration_minutes, price),
  staff:staff_members(id, name)
`;

export interface SeedListBooking {
  id: string;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no_show";
  salon: { slug: string | null; name: string; address: string | null; cover_photo_url: string | null } | null;
  service: { name_de: string; name_en: string | null; duration_minutes: number; price: number } | null;
  staff: { name: string } | null;
}

export interface BookingsBBuckets {
  upcoming: SeedListBooking[];
  /** Past (completed / confirmed-past / no_show) merged with cancelled, sorted starts_at
   * DESC. Direction B shows both inside the SAME "Past bookings" swapped-in view (brief:
   * "the cancelled booking appears wherever the direction shows past bookings, with its
   * status"), grouped by year inside the component. */
  past: SeedListBooking[];
}

let cache: BookingsBBuckets | null = null;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getBookingsListB(): Promise<BookingsBBuckets> {
  if (cache) return cache;

  const supabase = createAdminSupabaseClient();

  const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (userErr) {
    console.error("[directions-0905/bookings-list/_vb] listUsers failed:", userErr);
    cache = { upcoming: [], past: [] };
    return cache;
  }
  const customer = userList.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!customer) {
    console.error(`[directions-0905/bookings-list/_vb] ${CUSTOMER_EMAIL} not found.`);
    cache = { upcoming: [], past: [] };
    return cache;
  }

  const now = new Date().toISOString();

  const [
    { data: upcomingRows, error: upErr },
    { data: pastRows, error: pastErr },
    { data: cancelledRows, error: cancErr },
  ] = await Promise.all([
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

  if (upErr) console.error("[directions-0905/bookings-list/_vb] upcoming query failed:", upErr);
  if (pastErr) console.error("[directions-0905/bookings-list/_vb] past query failed:", pastErr);
  if (cancErr) console.error("[directions-0905/bookings-list/_vb] cancelled query failed:", cancErr);

  const normalize = (rows: unknown[] | null): SeedListBooking[] =>
    (rows ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id as string,
        starts_at: row.starts_at as string,
        ends_at: row.ends_at as string,
        price_paid: Number(row.price_paid ?? 0),
        status: row.status as SeedListBooking["status"],
        salon: unwrapOne(row.salon as never),
        service: unwrapOne(row.service as never),
        staff: unwrapOne(row.staff as never),
      };
    });

  const upcoming = normalize(upcomingRows as unknown[] | null);
  const past = [...normalize(pastRows as unknown[] | null), ...normalize(cancelledRows as unknown[] | null)].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  cache = { upcoming, past };
  return cache;
}
