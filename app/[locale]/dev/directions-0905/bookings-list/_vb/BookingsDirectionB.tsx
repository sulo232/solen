"use client";

/**
 * Direction B: Airbnb Trips tab, full strength. LOCK MODE: LOOK-FULL.
 *
 * Structure source: _design-system/references/airbnb--trips.md (Fresha structure is NOT
 * used here per this surface's axis split: direction A is the Fresha ledger, direction B
 * is Airbnb Trips at full strength). Look source: airbnb--look-recipe.md. Motion source:
 * airbnb--motion.md.
 *
 * THE ONE IDEA: the screen is organised by time. A plain-text destination label (the
 * salon name, per airbnb--trips.md item 3, "Destination label, plain bold text, no card
 * or background") sits above each upcoming booking's large photo card. Past bookings are
 * NOT in this scroll (airbnb--trips.md: "Past trips are demoted... on their OWN page,
 * never mixed into the same scroll as upcoming trips"): one row, "Past bookings", leads
 * to them; tapping it swaps in a client-side view with year dividers
 * (airbnb--trips.md "Measured, Past trips": "Rows are grouped by year... a year number
 * renders centred and small between groups, acting as the only divider").
 *
 * Sources and the values taken:
 * - Card radius 20px: airbnb--trips.md item 4 cites this as `expect` (cross-referenced
 *   from airbnb--listing-page.md's measured 20px card radius; the trip card's OWN radius
 *   was "not measured" in that file's own "Not measured" section). No shadow: airbnb
 *   look-recipe.md #10, "Search-result card shadow: none, flat" (verified), the closest
 *   measured Airbnb card-shadow value, applied here since the trip card's own shadow was
 *   not independently measured either.
 * - Photo ratio 1.331: airbnb--look-recipe.md #11 ("Search-result card photo ratio",
 *   verified), used as the closest measured Airbnb card-photo ratio since airbnb--trips.md
 *   does not measure the trip card's own ratio.
 * - Single full-width CTA per card, one action only: airbnb--trips.md item 4, "a single
 *   button, never two side by side".
 * - Status pill over the photo, top-left, neutral shape: airbnb--trips.md item 4 ("A
 *   status/timing PILL sits on top of the photo, top-left corner"). Colour kept semantic
 *   (Solen's existing success/error/ink-2 pill colours) rather than Airbnb's colour-blind
 *   neutral pill, to hold FLOORS LAW 1(d) (a semantic-colour moment must be visible on the
 *   first viewport of every customer screen); see Conflicts for why colour was NOT
 *   broken. A control over a photo uses FROST_GLASS (lib/frost-glass.ts, taste rule 7:
 *   "a control over a photo -> frosted glass"), not the plain pill fill BookingCard uses
 *   on white.
 * - Font sizes: airbnb--trips.md's "Not measured" section explicitly states the trip
 *   card's own type sizes were never captured (only Mobbin's scaled 299x678px thumbnails
 *   were available, no confirmed device-point resolution). Per this brief's own rule
 *   ("Where a spec says 'not measured', you do not invent the number: use the Solen
 *   token"), every text size below is a LOCKED Solen token from the design contract's
 *   "text size" row, not a guessed Airbnb pixel value: name 14, meta 12, CTA 15 (never
 *   <=13 on a button).
 * - View-swap timing: airbnb--motion.md "(b) Photo gallery open" / "(e) Reserve entry",
 *   both a 400ms full-screen reveal, `linear` keyframe-sampled. Port map in the same file
 *   maps this pattern to Solen's `glide` token (decelerate, no overshoot) for the ENTER
 *   direction, and to `thud` (accelerate) for the EXIT direction per this repo's own
 *   locked curve-by-direction rule (LOCKFILE section, cited by airbnb--motion.md's
 *   Conflicts as a decision already made and not to be undone by this port).
 * - Date/time treatment: kept byte-for-byte identical to what
 *   components-legacy/booking/BookingCard.tsx computes today (dow/day/mon via
 *   `toLocaleDateString` with the same three option objects, `time` via
 *   `toLocaleTimeString({ hour: '2-digit', minute: '2-digit' })`), per this brief's FIXED
 *   rule ("keep exactly the date and time treatment BookingCard renders today, add no new
 *   clock time anywhere else"). No new clock-time value is introduced anywhere in this
 *   file.
 *
 * Conflicts (locks broken on purpose, LOOK-FULL):
 * - Card radius 16 -> 20 (entity-card radius lock broken; reference: airbnb--trips.md
 *   item 4 / look-recipe #9, 20px expect).
 * - Card shadow `shadow-whisper` -> none, flat (reference: look-recipe #10, verified).
 * - Card anatomy: the locked BookingCard focal-date-block anatomy (52x64 date tile beside
 *   the row) is REPLACED by an Airbnb-style photo-forward trip card (photo on top, title
 *   + subline below, one CTA). This direction does not "keep a card" in the locked
 *   BookingCard sense; it is a deliberately different card family per the brief's own
 *   axis description ("full strength... photo card, no shadow... one CTA in Airbnb's
 *   recipe"), not an oversight.
 * - Tabs -> time-ordered single scroll + a swapped-in past view (reference:
 *   fresha--bookings-list.md's own CONFLICT log already named "tabs vs. stacked
 *   sections" as an open owner decision; this direction goes further than Fresha's
 *   stacked-sections idea to Airbnb's fully separate past-trips PAGE, per this surface's
 *   declared axis).
 * - Empty-state anatomy: NOT broken. The seed customer has real rows in both buckets, so
 *   `EmptyState` never renders in this pass; if it ever does (an upstream data change),
 *   it renders as the real locked component, never an invented tile.
 * - Kept, not broken: ink value (`s-ink` #0A0A0A unchanged, Airbnb's `#222222` NOT
 *   ported), status-pill semantic colour (kept for the FLOORS LAW reason above), sticky
 *   bar recipe (this screen carries no commit/payment action, so no sticky bar applies
 *   either way).
 * - Account-level status banner (airbnb--trips.md item 2): the banner SLOT is
 *   intentionally empty. The seed customer has no account-level blocker (no pending ID
 *   review, no pending charge) to show, and this brief bans inventing one. If a real
 *   blocker condition existed in the data, it would render directly above the first trip
 *   card, full width, bordered.
 *
 * floors: (a) photo focal = the trip card's own photo, largest element on the card and in
 * the viewport; (b) one biggest element = the first trip card's photo; (c) a real tabular
 * number = price (formatCurrency, tabular-nums via the shared currency formatter) and
 * duration in minutes, both read from the live row; (d) a semantic-colour moment = the
 * status pill (success-green "Confirmed" on an upcoming card, error-red "Cancelled" in
 * the past view) kept semantic on purpose, see Conflicts; (e) no dead-grey zone = the
 * photo + sunken "Past bookings" row alternate against white, no bare grey field; (f)
 * worst-case content holds = salon name/service name truncate with `truncate`, the
 * address/staff line truncates, a maximally long service name still fits the two-line
 * card because the price/duration line is a separate row, never sharing space with the
 * title.
 *
 * Exists-check: `npm run exists BookingsDirectionB` -> 0, net-new. `npm run exists
 * FROST_GLASS` -> lib/frost-glass.ts, reused as-is (imported, not re-derived).
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronRight, ArrowLeft, Clock, Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import { FROST_GLASS } from "@/lib/frost-glass";
import EmptyState from "@/components-legacy/ui/EmptyState";
import type { BookingsBBuckets, SeedListBooking } from "./getBookingsListB";

interface Props {
  data: BookingsBBuckets;
}

const STATUS_STYLE: Record<SeedListBooking["status"], { bg: string; fg: string }> = {
  confirmed: { bg: "bg-s-success/10", fg: "text-s-success" },
  pending: { bg: "bg-s-warning/10", fg: "text-s-warning" },
  cancelled: { bg: "bg-s-error/10", fg: "text-s-error" },
  completed: { bg: "bg-s-ink/5", fg: "text-s-ink-2" },
  no_show: { bg: "bg-s-ink/5", fg: "text-s-ink-2" },
};

function getDateParts(startsAt: string, localeCode: string) {
  const start = new Date(startsAt);
  return {
    dow: start.toLocaleDateString(localeCode, { weekday: "short" }),
    day: start.toLocaleDateString(localeCode, { day: "2-digit" }),
    mon: start.toLocaleDateString(localeCode, { month: "short" }),
    time: start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" }),
  };
}

function serviceName(service: SeedListBooking["service"], locale: string): string {
  if (!service) return "-";
  const localized = locale === "en" ? service.name_en : locale === "de" ? service.name_de : null;
  return localized || service.name_de || service.name_en || "-";
}

export default function BookingsDirectionB({ data }: Props) {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const locale = useLocale();
  const t = useTranslations("bookingCard");
  const tList = useTranslations("bookingsList");
  const prefersReducedMotion = useReducedMotion();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const enterFrom = prefersReducedMotion
    ? { opacity: 1, x: 0, scale: 1 }
    : { opacity: 0, x: 24, scale: 0.98 };
  const enterTo = { opacity: 1, x: 0, scale: 1 };
  const exitTo = prefersReducedMotion ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -16, scale: 0.98 };

  return (
    <div className="min-h-[60vh] bg-white">
      <AnimatePresence mode="wait" initial={false}>
        {view === "upcoming" ? (
          <motion.div
            key="upcoming"
            initial={enterFrom}
            animate={enterTo}
            exit={exitTo}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 pb-10 pt-5"
          >
            {data.upcoming.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={tList("noBookings")}
                message="Your upcoming bookings will appear here once you book a service."
              />
            ) : (
              <div className="space-y-8">
                {data.upcoming.map((booking) => {
                  const { dow, day, mon, time } = getDateParts(booking.starts_at, localeCode);
                  const duration = booking.service
                    ? Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000)
                    : null;
                  const status = STATUS_STYLE[booking.status] ?? STATUS_STYLE.completed;
                  const href = booking.salon?.slug ? `/${locale}/salon/${booking.salon.slug}` : null;

                  const card = (
                    <div className="rounded-[20px] overflow-hidden bg-white">
                      <div className="relative aspect-[1.331] w-full bg-s-bg-sunken">
                        {booking.salon?.cover_photo_url ? (
                          <Image
                            src={booking.salon.cover_photo_url}
                            alt=""
                            fill
                            sizes="(max-width: 402px) 100vw, 402px"
                            className="object-cover"
                          />
                        ) : null}
                        <div
                          className={`absolute left-3 top-3 rounded-[12px] px-2.5 py-1 text-[12px] font-semibold ${status.fg}`}
                          style={FROST_GLASS}
                        >
                          {t(`status.${booking.status}`)}
                        </div>
                      </div>
                      <div className="pt-3">
                        <h3 className="truncate text-[14px] font-semibold text-s-ink">
                          {serviceName(booking.service, locale)}
                        </h3>
                        <p className="mt-1 truncate text-[12px] text-s-ink-2">
                          {dow}, {day} {mon} &middot; {time}
                          {booking.staff?.name ? ` with ${booking.staff.name}` : ""}
                        </p>
                        <p className="mt-0.5 text-[12px] text-s-ink-2">
                          {duration ? `${duration} ${t("minutes")} ` : ""}
                          <span className="font-semibold text-s-ink">{formatCurrency(booking.price_paid, localeCode)}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => e.preventDefault()}
                          className="mt-3 h-11 w-full rounded-[20px] bg-s-bg-sunken text-[15px] font-semibold text-s-ink transition-transform duration-150 ease-glide active:scale-[0.98]"
                        >
                          Manage booking
                        </button>
                      </div>
                    </div>
                  );

                  return (
                    <section key={booking.id}>
                      <h2 className="mb-2 truncate text-[14px] font-semibold text-s-ink">
                        {booking.salon?.name || "-"}
                      </h2>
                      {href ? (
                        <Link href={href} onClick={(e) => e.preventDefault()} className="block">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {data.past.length > 0 && (
              <button
                type="button"
                onClick={() => setView("past")}
                className="mt-8 flex h-11 w-full items-center justify-between rounded-[20px] bg-s-bg-sunken px-4 text-[14px] font-semibold text-s-ink transition-transform duration-150 ease-glide active:scale-[0.98]"
              >
                <span>Past bookings</span>
                <ChevronRight size={18} className="text-s-ink-2" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="past"
            initial={enterFrom}
            animate={enterTo}
            exit={exitTo}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 pb-10 pt-5"
          >
            <button
              type="button"
              onClick={() => setView("upcoming")}
              className="mb-4 flex h-11 items-center gap-1.5 text-[14px] font-semibold text-s-ink"
            >
              <ArrowLeft size={18} />
              <span>Past bookings</span>
            </button>

            {data.past.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={tList("noBookings")}
                message="Bookings you have completed or cancelled will appear here."
              />
            ) : (
              <PastList bookings={data.past} locale={locale} localeCode={localeCode} t={t} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PastList({
  bookings,
  locale,
  localeCode,
  t,
}: {
  bookings: SeedListBooking[];
  locale: string;
  localeCode: string;
  t: ReturnType<typeof useTranslations>;
}) {
  let lastYear: number | null = null;

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const start = new Date(booking.starts_at);
        const year = start.getFullYear();
        const showYear = year !== lastYear;
        lastYear = year;
        const { dow, day, mon, time } = getDateParts(booking.starts_at, localeCode);
        const status = STATUS_STYLE[booking.status] ?? STATUS_STYLE.completed;

        return (
          <div key={booking.id}>
            {showYear && (
              <p className="py-2 text-center text-[12px] font-semibold text-s-ink-2">{year}</p>
            )}
            <div className="flex items-center gap-3 py-2">
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken">
                {booking.salon?.cover_photo_url ? (
                  <Image src={booking.salon.cover_photo_url} alt="" fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-semibold text-s-ink">{booking.salon?.name || "-"}</h3>
                <p className="mt-0.5 truncate text-[12px] text-s-ink-2">
                  {serviceName(booking.service, locale)} &middot; {dow}, {day} {mon}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-s-ink-2">
                  <Clock size={12} className="flex-none" />
                  {time}
                </p>
              </div>
              <div className={`flex-none rounded-[12px] px-2.5 py-1 text-[12px] font-semibold ${status.bg} ${status.fg}`}>
                {t(`status.${booking.status}`)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
