// Exists-check: `npm run exists directions-0905-r3` (run this session) returned this screen's own
// three candidate route scaffolds (a, b, c, all pre-existing) plus a dozen sibling round-3 routes
// for five other screens, and seven older round-2 look-system items already on the graveyard
// list (unrelated: a grey-band canvas system, killed home structures, a killed set of empty
// bookings/saved/search directions, a killed search heading line, a killed review count, a killed
// component-isolation preview route, a killed service-row button harness). None of them is this
// file's own gap: `page.tsx` in this folder already imports `./BookingsListB` (written a build
// earlier) but the file itself was never created, so the route 404s on render today. This file is
// that missing piece, not a new route or a new decision.
//
// Grounded-in: _design-system/references/fresha--bookings-list.md ("Measured (ordered element
// list, iOS, top to bottom)" items 1-5: page header, "Upcoming" + count, the bordered Upcoming
// card, "Past" + count, the compact Past row; its own Philosophy section, "Upcoming gets the
// visual weight ... Past shrinks to a thumbnail row", is this screen's placement authority) and
// _design-system/references/airbnb--trips.md item 4 (on-photo timing pill, neutral fill, the look
// source) plus _plans/R3_ONE_SYSTEM.md CANDIDATE B table and its RECOMMENDATION section (the
// card-edge rule: photo -> shadow/no-border, no photo -> hairline/no-shadow, never both). Also
// read in full: this screen's own previous-round LIFT view (`BookingsListLift.tsx`, the sibling
// round-2 folder for this exact screen), the page shell, the "next appointment first, one scroll,
// no tabs" structure, the "More bookings" bucket naming and its own reasoning, the resolveCovers
// salon-cover-swap pattern and the 125px bottom-nav spacer, all kept unchanged below.
//
// Depicts: page structure, one scroll, next appointment first, no tabs -> BookingsListLift.tsx (STRUCTURE kept, his locked pick per that file's own header: "a date-led list, no tabs, one scroll, the next appointment first")
// Depicts: next-appointment card -> ./NextAppointmentCardB.tsx (Card variant="photo", candidate b)
// Depicts: rest-of-list row -> ./BookingRowB.tsx (Card variant="entity", candidate b)
// Depicts: the filled-ink empty-state CTA -> ./EmptyBookingsAction.tsx composed inside components-legacy/ui/EmptyState.tsx (registered, never hand-rolled)
// Depicts: page anchor + section heading -> ../../_kit SectionTitle.tsx (as="anchor" 28px for "Bookings", as="heading" 18px for "More bookings")
// Depicts: salon-cover resolution -> ./coverPhoto.ts (re-exports the real cover-swap helper the confirmation RULE view already built this session, never duplicated)
//
// ROOT_CAUSES.md Part 3.3 fix-list items, and the line implementing each:
//   1. Next-appointment unit under a named height ceiling (roughly 340px, roughly 40% of the
//      844px fold, date/time run near y=280): implemented in NextAppointmentCardB.tsx (photo
//      fixed at 160px, down from the previous round's 286px 5/4 ratio; see this builder's own
//      "measured" line below for the number this build actually renders).
//   2. On-photo timing pill: NextAppointmentCardB.tsx's <TimingPill> call, neutral fill, relative
//      copy only.
//   3. Salon name promoted to 18px/500, date+time as one 14px/500 run: NextAppointmentCardB.tsx's
//      salon-name span + <DateLine>.
//   4. Reminder line, bell glyph, "Reminder 24 hours before": NextAppointmentCardB.tsx's closing
//      <Meta> row.
//   5. Page anchor "Bookings" to 28px/500 so its ratio to 14px body clears the 1.8x floor (28/14 =
//      2.0x), and "More bookings" stays 18px/500 so the two no longer read as pixel-identical:
//      implemented BELOW, <SectionTitle as="anchor"> for "Bookings" and <SectionTitle as="heading">
//      for "More bookings".
//   6. One separator between the when-group and the what-group: NextAppointmentCardB.tsx's own
//      header explains this is now a LINE BREAK (DateLine on its own row, the duration/price/
//      service Meta line below it), not an added dot glyph; MetaDot (the locked no-glyph gap)
//      still spaces facts WITHIN the what-group line only.
//
// Orchestrator decision (2) applied: the empty-state CTA is filled ink on this state (4-of-4 per
// the states-row lock), via <EmptyBookingsAction>, not an outline default with no action at all.
//
// Stays, per ROOT_CAUSES.md Part 3.3 "Stays": the two side-by-side actions (Get directions,
// Manage) on the next appointment only; the stacked "Bookings"/"More bookings" sections in one
// scroll; the seeded salon cover photo (swapped through the cover-photo helper above) reused
// across rows for the same salon; the pale-green/pale-red StatusBadge recipes (candidate b keeps
// candidate a's pastel treatment, per systems.ts); page margin 16px each side (SPACING.pageMargin).
//
// measured: Playwright, 390x844, dpr 3, /en/dev/directions-0905-r3/bookings-list/b, fresh load,
// networkidle + 800ms. Filled in after this build's own run (see this builder's closing report
// for the numeric readout: fold sizes/weights, next-appointment card height and %-of-fold,
// date/time run's y position, container border/shadow counts, photo share).
//
// floors (the six-item finished-screen pass, CLAUDE.md FLOORS LAW 1): (a) photographic focal =
// the next-appointment card's cover photo, the largest single element in the first viewport; (b)
// one clearly biggest element = that same photo; (c) tabular/real number = every <Price> row
// (BookingRowB) and the formatCurrency call inside NextAppointmentCardB's meta line, both real
// price_paid values off the live seed row, never invented; (d) semantic-colour moment =
// StatusBadge's confirmed (green) badge on the next appointment and, when the seed customer has
// one, a cancelled (red) badge among "More bookings"; (e) no dead-grey zone = white page end to
// end, candidate b drops the sunken tray entirely (systems.ts "b".deltas.card.usesTray = false),
// edge-visibility comes from each card's own photo-aware border/shadow; (f) worst-case content =
// salon name and service name both truncate (`truncate`/`min-w-0`) on every row, tested against
// the live seed set's own real longest values, never a synthetic string.
//
// system: b (CANDIDATE B, LIFT REFINED, _plans/R3_ONE_SYSTEM.md). <KitProvider system="b"> wraps
// the whole tree once, here; every Card/Pill/StatusBadge/PrimaryButton/SecondaryButton underneath
// reads its delta from that one provider.

import EmptyState from "@/components-legacy/ui/EmptyState";
import { Calendar } from "lucide-react";
import { KitProvider, SectionTitle } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";
import { getAlternateCoverPhoto } from "./coverPhoto";
import { NextAppointmentCardB } from "./NextAppointmentCardB";
import { BookingRowB } from "./BookingRowB";
import { EmptyBookingsAction } from "./EmptyBookingsAction";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

function byStartsAtDesc(a: LoadedBooking, b: LoadedBooking): number {
  return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
}

// Resolves each distinct salon's cover photo once (bookings repeat salons), swapping out the
// banned greyscale seed image for a different REAL photo of the same salon via
// getAlternateCoverPhoto (imported through ./coverPhoto.ts, never duplicated). Never a hardcoded
// src; a salon whose gallery has no alternate keeps its own cover.
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

interface Props {
  locale: string;
  upcoming: LoadedBooking[];
  past: LoadedBooking[];
}

export async function BookingsListB({ locale, upcoming, past }: Props) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";

  const next = upcoming[0] ?? null;
  // Everything that is not the next appointment: any further upcoming bookings plus the whole
  // past/cancelled bucket, one continuous list, most recent first (date-led, his locked pick).
  const rest = [...upcoming.slice(1), ...past].sort(byStartsAtDesc);

  const isEmpty = !next && rest.length === 0;
  const covers = await resolveCovers([...(next ? [next] : []), ...rest]);
  const coverFor = (b: LoadedBooking) => (b.salon ? covers.get(b.salon.id) ?? b.salon.cover_photo_url ?? null : null);

  return (
    <KitProvider system="b">
      <div className="mx-auto w-full max-w-[560px] bg-white px-4 py-6">
        <SectionTitle as="anchor" className="mb-3">
          Bookings
        </SectionTitle>

        {isEmpty ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            message="Book your first treatment to see it here"
            action={<EmptyBookingsAction locale={locale} />}
          />
        ) : (
          <>
            {next && (
              <NextAppointmentCardB
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
                    false label on a row that has not happened yet (the previous round's own
                    reasoning, kept unchanged). */}
                <SectionTitle as="heading" className="mb-3">
                  More bookings
                </SectionTitle>
                <div className="flex flex-col gap-3">
                  {rest.map((booking) => (
                    <BookingRowB
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

        {/* HideInBooking strips the header + bottom nav on every /dev path; this reproduces the
            125px the real bottom nav would occupy, same as the previous round's base. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
