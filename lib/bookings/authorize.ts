import type { NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { readGuestCookie, verifyAccessToken } from "@/lib/bookings/guest-access";

/**
 * Central booking authorization — master plan §10a / §10b.7.
 *
 * THE single resolver every booking sub-route must call. Today auth is copy-pasted and
 * inconsistent: `/api/bookings/[id]` does `isOwner || isSalonOwner` (no admin, no
 * guest); `/api/bookings/[id]/refund` is salon-owner-only; `/api/bookings/[id]/report`
 * is reporter-only via `.eq("user_id", user.id)`. One resolver removes the per-route
 * holes and is the only place that understands guests.
 *
 * SP-2 SHIPS the resolver and wires the guest-access endpoints onto it. SP-3 wires the
 * refund/appeal routes; migrating the remaining six sub-routes is a tracked follow-up.
 */

export type BookingActor = "guest" | "customer" | "salon" | "admin";

/** The booking row, fetched once (service-role) so callers don't refetch. Kept as an
 *  open record — the global `Database` type is intentionally NOT applied to the clients
 *  (see `lib/supabase.ts`); callers narrow fields they read. */
export type BookingRow = Record<string, any>;

export interface BookingActorResult {
  actor: BookingActor | null;
  booking: BookingRow | null; // null only when the booking id doesn't exist
  userId: string | null; // set for customer / salon / admin; null for guest / none
}

const NONE: BookingActorResult = { actor: null, booking: null, userId: null };

/**
 * Resolve who is acting on a booking. Resolution order (first match wins), all against
 * ONE service-role fetch of the booking:
 *   1. session present + booking.user_id === session.user.id   → 'customer'
 *   2. session present + profiles.role === 'admin'             → 'admin'
 *   3. session present + salons.owner_id === session.user.id   → 'salon'
 *   4. else read the guest cookie for THIS bookingId, verifyAccessToken vs
 *      booking.access_token_hash (+ expiry)                    → 'guest'
 *   5. none                                                    → { actor: null }
 *
 * NEVER matches on reference_code (display only, §10b.7).
 *
 * Failure-shape guidance for callers (§10b.7): a `null` actor from an UNAUTHENTICATED /
 * guest requester maps to a uniform 404 (no enumeration); only map an authenticated-
 * but-not-entitled user to 403 (their session already proves they exist). When
 * `booking` is null the id simply doesn't exist → 404.
 */
export async function resolveBookingActor(
  req: NextRequest,
  bookingId: string,
): Promise<BookingActorResult> {
  if (!bookingId) return NONE;

  // Single service-role fetch of the row every branch reads from.
  const admin = createAdminSupabaseClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return NONE; // unknown id → caller returns 404

  // Session (customer / salon / admin). getSession() reads the cookie, no network call.
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    // 1. Booking owner (logged-in customer).
    if (booking.user_id && booking.user_id === user.id) {
      return { actor: "customer", booking, userId: user.id };
    }

    // 2. Platform admin.
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "admin") {
      return { actor: "admin", booking, userId: user.id };
    }

    // 3. Salon owner of the booking's salon.
    if (booking.salon_id) {
      const { data: salon } = await admin
        .from("salons")
        .select("owner_id")
        .eq("id", booking.salon_id)
        .maybeSingle();
      if (salon?.owner_id === user.id) {
        return { actor: "salon", booking, userId: user.id };
      }
    }

    // Authenticated but not entitled → no guest fallthrough for a logged-in user.
    return { actor: null, booking, userId: null };
  }

  // 4. No session → guest cookie path. The cookie is booking-bound: a cookie minted for
  //    a DIFFERENT booking can't authorize this one (no cross-booking replay).
  const cookie = readGuestCookie(req);
  if (
    cookie &&
    cookie.bookingId === bookingId &&
    verifyAccessToken(cookie.raw, booking.access_token_hash ?? null, booking.access_token_expires_at ?? null)
  ) {
    return { actor: "guest", booking, userId: null };
  }

  // 5. Nobody.
  return { actor: null, booking, userId: null };
}
