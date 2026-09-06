// Exists-check: `npm run exists bookings-list` -> the round-1 comparison route, its three
// direction folders, the real BookingsList.tsx (components-legacy/booking), read below. No
// round-2 lift folder for this surface existed before this file. `npm run exists kit` -> the
// round-2 _kit module (imported below, never re-derived).
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx
// and its loadBookingsA.ts (IMPORTED, not copied, per the task brief), the real customer
// surface app/[locale]/profile/bookings/page.tsx -> components-legacy/booking/BookingsList.tsx.
//
// Depicts: page structure, one scroll, next appointment first, no tabs -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (STRUCTURE kept: this is his locked pick, "Direction A: a date-led list, no tabs, one scroll, the next appointment first"; only the LOOK and the three named screen deltas below change).
// Depicts: next-appointment card anatomy -> NET-NEW: no existing component renders a lifted photo-flush booking card with footer actions, this compact shape is specified in _plans/R2_LOOK_SYSTEMS.md Part B SYSTEM 1 and built fresh in NextAppointmentCard.tsx.
// Depicts: rest-of-list row anatomy -> NET-NEW: no existing component renders a 48px-thumbnail lifted row with a status badge, specified in the same R2_LOOK_SYSTEMS.md line and built fresh in BookingRow.tsx.
// Depicts: status badge on every row that has one -> ../../_kit/StatusBadge.tsx (the kit's own transcription of components-legacy/booking/BookingCard.tsx:84-90,138).
// Depicts: data loading (upcoming/past buckets, column list) -> app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (IMPORTED below, never re-implemented).
//
// Sources:
// - Structure: his own literal pick (task brief), which is also what round-1 direction A
//   already built (Fresha's own stacked-sections anatomy, fresha--bookings-list.md Measured
//   #2-5: one scroll, "Upcoming"/"Past" labels, actions live ON the row they belong to).
// - Look: SYSTEM 1 LIFT (_plans/R2_LOOK_SYSTEMS.md Part B): every card is a shadowed white
//   card with no border and no hairline. The line this file follows literally, quoted in
//   full: "the next appointment is one lifted card with the photo flush at its top and Get
//   directions plus Manage inside its footer; past bookings are smaller lifted cards with a
//   48px square thumbnail and no buttons."
// - Screen deltas (his three verbatim changes, task brief): (1) Get directions + Manage render
//   ONLY on the next appointment, every other row (remaining upcoming + past + cancelled)
//   drops both; (2) the next-appointment unit is measured against round 1's and comes in
//   visibly smaller (see NextAppointmentCard.tsx header for the two numbers); (3) every row
//   that carries a status (all of them) renders the kit StatusBadge, so past/cancelled rows
//   read differently from the confirmed upcoming one by badge colour + icon, not by omission.
//
// Conflicts (locks kept):
// - kept: salon photo ratio 5/4 (R2_LOOK_SYSTEMS.md A7, "it does not move"); the compactness
//   gain therefore comes entirely from the content block and footer, never the photo, see
//   NextAppointmentCard.tsx.
// - kept: page margin 16px each side (SPACING.pageMargin, LOCKFILE §7 lock), not Fresha's or
//   Airbnb's own margins.
// - kept: EmptyState's locked filled-ink CTA on the sunken tray for both empty branches
//   (design contract "states" row), unmodified, same as round 1.
// - not carried: round 1's per-card Manage disclosure menu redesign; this pass reuses the
//   identical Reschedule/Cancel inline disclosure (kept, not a look-system concern).
//
// floors: (a) photographic focal = the next-appointment card's 5/4 cover photo, the largest
// element in the first viewport; (b) one clearly biggest element = that same photo; (c)
// tabular/real number = every Price row (tabular-nums, real price_paid from the seed row); (d)
// semantic colour moment = StatusBadge's confirmed (green) badge on the next appointment and,
// when the seed customer has one, the cancelled (red) badge among the rest of the list; (e) no
// dead-grey zone = white page throughout, LIFT drops the tray entirely, edge visibility comes
// from each card's own shadow (LOCKFILE §17.2 case per A7); (f) worst-case content = salon
// name and service name both truncate on every row, tested against the live seed set's real
// longest values, never a synthetic string.
//
// system: LIFT. "The lifted white card is the only grouping device on the screen, so nothing
// carries a border and nothing carries a hairline; a soft shadow and the gap between cards do
// all the work." (_plans/R2_LOOK_SYSTEMS.md, SYSTEM 1). Wrapped in <KitProvider system="lift">
// once at the top; every Card below reads its border/shadow delta from there.

import EmptyState from "@/components-legacy/ui/EmptyState";
import { Calendar } from "lucide-react";
import { KitProvider, SectionTitle } from "../../_kit";
import { loadBookingsA, type LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";
import { getAlternateCoverPhoto } from "../../confirmation/_rule/getAlternateCoverPhoto";
import { NextAppointmentCard } from "./NextAppointmentCard";
import { BookingRow } from "./BookingRow";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

function byStartsAtDesc(a: LoadedBooking, b: LoadedBooking): number {
  return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
}

// Resolves each distinct salon's cover photo once (bookings repeat salons), swapping out the
// banned greyscale seed image (photo-1560066984, R2_LOOK_SYSTEMS.md A8 / CONFLICT C10) for a
// different REAL photo of the same salon via getAlternateCoverPhoto (imported above, not
// duplicated: the confirmation/_rule builder already solved this exact swap this session,
// reading the salon's own gallery_urls column through the same admin client seedBooking.ts
// uses). Never a hardcoded src; a salon whose gallery has no alternate keeps its own cover.
async function resolveCovers(bookings: LoadedBooking[]): Promise<Map<string, string | null>> {
  const covers = new Map<string, string | null>();
  await Promise.all(
    bookings.map(async (b) => {
      const salon = b.salon;
      if (!salon || covers.has(salon.id)) return;
      covers.set(salon.id, await getAlternateCoverPhoto(salon.id, salon.cover_photo_url));
    }),
  );
  return covers;
}

export async function BookingsListLift({ locale }: { locale: string }) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const { upcoming, past } = await loadBookingsA();

  const next = upcoming[0] ?? null;
  // Everything that is not the next appointment: any further upcoming bookings plus the whole
  // past/cancelled bucket, one continuous list, most recent first (date-led, per his pick).
  const rest = [...upcoming.slice(1), ...past].sort(byStartsAtDesc);

  const isEmpty = !next && rest.length === 0;
  const covers = await resolveCovers([...(next ? [next] : []), ...rest]);
  const coverFor = (b: LoadedBooking) => (b.salon ? covers.get(b.salon.id) ?? b.salon.cover_photo_url ?? null : null);

  return (
    <KitProvider system="lift">
      <div className="mx-auto w-full max-w-[560px] bg-white px-4 py-6">
        <SectionTitle as="heading" className="mb-3">
          Bookings
        </SectionTitle>

        {isEmpty ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            message="Book your first treatment to see it here"
          />
        ) : (
          <>
            {next && (
              <NextAppointmentCard
                booking={next}
                locale={locale}
                localeCode={localeCode}
                coverUrl={coverFor(next)}
              />
            )}

            {rest.length > 0 && (
              <div className="mt-8">
                {/* Named "More bookings", not "Past": this bucket can hold a second future
                    confirmed booking too (the seed customer has two), so "Past" would be a
                    false label on a row that has not happened yet. */}
                <SectionTitle as="heading" className="mb-3">
                  More bookings
                </SectionTitle>
                <div className="flex flex-col gap-3">
                  {rest.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      locale={locale}
                      localeCode={localeCode}
                      coverUrl={coverFor(booking)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* HideInBooking strips the header + bottom nav on every /dev path; this reproduces
            the 125px the real bottom nav would occupy, per the task brief. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
