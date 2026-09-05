"use client";

// exists-check: net-new. `npm run exists "bookings list"` -> BookingsList.tsx (the real
// three-tab component) and this surface's own scaffold, neither of which renders a
// single-scroll hero-plus-timeline layout.
//
// Grounded-in: components-legacy/booking/BookingsList.tsx (the real screen this direction
// restructures: same seed customer's bookings, same three status buckets, same locked
// EmptyState for the genuinely-empty case), components-legacy/booking/BookingCard.tsx
// (the anatomy kept, reused directly by TimelineRow.tsx on expand).
//
// registered-component-ok: EmptyState (components-legacy/ui/EmptyState.tsx) is imported
// and used as-is for the one genuinely-empty branch (no bookings at all); HeroBooking and
// TimelineRow are this direction's own net-new pieces, cited in their own files.
//
// Depicts: hero booking card -> ./HeroBooking.tsx (this direction's own file).
// Depicts: timeline of remaining bookings -> ./TimelineRow.tsx (this direction's own file).
// Depicts: empty state (no bookings at all) -> components-legacy/ui/EmptyState.tsx, real component.
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import EmptyState from "@/components-legacy/ui/EmptyState";
import type { SeedBookingBuckets } from "./getBookingsC";
import { HeroBooking } from "./HeroBooking";
import { TimelineRow } from "./TimelineRow";

interface BookingsListDirectionCProps {
  buckets: SeedBookingBuckets;
  locale: string;
}

export function BookingsListDirectionC({ buckets, locale }: BookingsListDirectionCProps) {
  const t = useTranslations("bookingsList");
  const tUi = useTranslations("bookingsListUi");
  const tCard = useTranslations("bookingCard");

  const total = buckets.upcoming.length + buckets.past.length + buckets.cancelled.length;
  const next = buckets.upcoming[0] ?? null;
  const timeline = [...buckets.upcoming.slice(1), ...buckets.past, ...buckets.cancelled];

  if (total === 0) {
    return (
      <div className="bg-white pb-16">
        <EmptyState icon={Calendar} title={t("noBookings")} message={tUi("emptyUpcoming")} />
      </div>
    );
  }

  return (
    <div className="bg-white pb-16">
      {next ? (
        <HeroBooking
          booking={next}
          locale={locale}
          nextUpLabel="Next up"
          withLabel="with"
          directionsLabel="Directions"
          rescheduleLabel={tCard("reschedule")}
          cancelLabel={tCard("cancel")}
        />
      ) : (
        <div className="mx-4 mt-4">
          <EmptyState icon={Calendar} title={t("noBookings")} message={tUi("emptyUpcoming")} />
        </div>
      )}

      {timeline.length > 0 && (
        <div className="mt-6">
          <p className="px-4 pb-2 text-[12px] font-normal text-s-ink-2">Also on your calendar</p>
          <div className="border-t border-s-border">
            {timeline.map((booking) => (
              <TimelineRow key={booking.id} booking={booking} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
