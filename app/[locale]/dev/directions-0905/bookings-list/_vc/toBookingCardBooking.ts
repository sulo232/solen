// exists-check: net-new. No existing file maps a loader row into
// components-legacy/booking/BookingCard.tsx's exported `Booking` type; every other
// direction/mockup that renders BookingCard reads it off the real `/api/bookings/user`
// response shape directly, which already matches, whereas this loader (getBookingsC.ts)
// selects a slightly wider/typed column set for this direction's own hero+timeline use.
// This one small adapter is the seam between the two, not a duplicate of either.
import type { Booking } from "@/components-legacy/booking/BookingCard";
import type { SeedBookingRow } from "./getBookingsC";

/** Maps this direction's loader row onto BookingCard's own `Booking` prop type, so the
 * timeline row's expanded state can render the REAL, locked BookingCard component
 * (FIXED requirement: "the real BookingCard ... with its anatomy kept"), never a redrawn
 * copy. Every field is real data from the row; nullable DB columns (average_rating,
 * review_count, address) fall back to a real, non-misleading default (0 / ""), never a
 * fabricated value. */
export function toBookingCardBooking(row: SeedBookingRow): Booking {
  return {
    id: row.id,
    user_id: row.user_id,
    salon_id: row.salon_id,
    service_id: row.service_id,
    slot_id: row.slot_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    price_paid: row.price_paid,
    status: row.status,
    salon: row.salon
      ? {
          id: row.salon.id,
          slug: row.salon.slug ?? undefined,
          name: row.salon.name,
          address: row.salon.address ?? "",
          average_rating: row.salon.average_rating ?? 0,
          review_count: row.salon.review_count ?? 0,
          cover_photo_url: row.salon.cover_photo_url ?? null,
        }
      : undefined,
    service: row.service
      ? {
          id: row.service.id,
          name_de: row.service.name_de,
          name_en: row.service.name_en ?? "",
          name_fr: row.service.name_fr ?? undefined,
          name_it: row.service.name_it ?? undefined,
          duration_minutes: row.service.duration_minutes ?? 0,
          price: row.service.price ?? row.price_paid,
        }
      : undefined,
    staff: row.staff
      ? {
          id: row.staff.id,
          name: row.staff.name ?? "",
          avatar_url: row.staff.avatar_url ?? null,
        }
      : undefined,
  };
}
