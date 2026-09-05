"use client";

/**
 * Grounded-in: components-legacy/booking/BookingsList.tsx, components-legacy/booking/BookingCard.tsx,
 * app/[locale]/profile/bookings/page.tsx (the real bookings-list surface this direction restructures).
 *
 * Exists-check: `npm run exists bookings-list` -> the scaffold page (edited, v==='a'
 * branch only) + the real BookingsList component (read for anatomy, not imported: this
 * direction's structure is genuinely different, one scroll instead of tabs). `npm run
 * exists BookingCard` -> the locked row component; its focal-date-block + status-label +
 * "Book again" anatomy is NOT reused verbatim here because Direction A replaces the
 * upcoming row with a photo-led card per the Fresha spec, but the LOOK stays Solen's
 * (radius 16, shadow-whisper, ink CTA, s-accent link) since this direction keeps Solen
 * locks. `npm run exists EmptyState` -> the locked primitive, imported directly, used
 * unmodified for both empty branches, never a hand-drawn tile. `npm run exists MetaDot`
 * -> the locked no-glyph separator spacer (LOCKFILE A12/V3-D463, no middle-dot glyph
 * anywhere), imported read-only from `_components/salon/MetaDot.tsx`, never edited.
 *
 * Direction: FRESHA LEDGER. Declared axis: STRUCTURE (no tab bar; Fresha's "Upcoming"
 * and "Past" as two labelled sections in one continuous scroll, per
 * `_design-system/references/fresha--bookings-list.md` Measured #1-5). Upcoming renders
 * as a full photo-led card (the photo, not a map, per that file's own Conflicts section
 * and the FLOORS LAW imagery floor: a map is not photography); Past renders as compact
 * rows grouped in one hairline-separated list card, cancelled bookings folded into Past
 * with their status appended, matching the brief's "no tabs, one scroll" ask literally.
 *
 * Depicts: switcher shell -> ../../_shared/DirectionFrame.tsx (reused as-is by the parent page).
 * Depicts: Upcoming photo-led card anatomy -> _design-system/references/fresha--bookings-list.md Measured #3, fields read via ./loadBookingsA.ts (mirrors app/api/bookings/user/route.ts's select).
 * Depicts: Get directions action -> app/[locale]/_components/salon/SalonLocation.tsx and components-legacy/booking/BookingConfirmation.tsx (same google.com/maps/search pattern).
 * Depicts: Manage disclosure (Reschedule / Cancel) -> components-legacy/booking/BookingCard.tsx's existing overflow menu, same two actions, relabelled trigger.
 * Depicts: Past compact row anatomy -> _design-system/references/fresha--bookings-list.md Measured #5, fields ported from components-legacy/booking/BookingCard.tsx's own field set (salon photo, name, service, price) via ./loadBookingsA.ts.
 * Depicts: cancelled status word -> components-legacy/booking/BookingCard.tsx's statusConfig.cancelled (label "Cancelled", text-s-error), rendered as plain inline text here, no pill shape.
 * Depicts: EmptyState (both branches) -> components-legacy/ui/EmptyState.tsx, unmodified.
 *
 * Sources:
 * - Structure: _design-system/references/fresha--bookings-list.md Measured #2-5 (section
 *   labels with counts, Upcoming = one photo card with two on-row actions, Past = compact
 *   thumbnail rows, one right-aligned "Book again" link, zero-state = icon + headline +
 *   subline + one CTA, no card shell).
 * - Look: Solen's own locked tokens (LOCK MODE = locks kept, this is not the LOOK-FULL
 *   direction): rounded-card (16px, entity-card radius per CLAUDE.md design contract),
 *   rounded-[24px] grouped list card for the Past group, shadow-whisper (SalonCard photo
 *   recipe), s-accent blue on the "Book again" text link (design contract "link" row),
 *   ink pill CTA nowhere here since there is no single commit action on this screen.
 * - Motion: `_design-system/references/airbnb--motion.md` ENTER RECIPE (opacity + y +
 *   scale together, decelerate-in / accelerate-out) applied to card mount + the Manage
 *   menu; exact duration/easing token taken from that file where named, Solen's existing
 *   `duration-200 ease-glide` (already used by the real BookingCard hover) where the
 *   file names no specific ms value for a list-card mount.
 *
 * Conflicts (locks kept, listed per FIRST-in-turn instruction):
 * - kept: entity-card radius 16 (rounded-card) on the Upcoming photo card, not Fresha's
 *   unspecified map-card radius.
 * - kept: grouped LIST-card radius 24 on the Past group (CLAUDE.md design contract:
 *   "CATEGORY members in one card" applies to a customer's own past bookings grouped
 *   together), where Fresha renders Past as bare rows with no card shell at all.
 *   fresha--bookings-list.md doesn't measure a Past-group radius (Fresha draws no card
 *   there), so this is Solen's own token, not an invented Fresha value.
 * - kept: EmptyState's locked FILLED ink CTA on the sunken tray (design contract "states"
 *   row), not Fresha's neutral outline button on white (fresha--bookings-list.md
 *   Conflicts, "empty-state CTA fill").
 * - kept: photo, not map, on the Upcoming card (fresha--bookings-list.md Conflicts,
 *   "map vs. photo"; the FLOORS LAW imagery floor requires real photography as the
 *   card's largest element on a customer screen).
 * - kept: "Book again" as a blue s-accent text link (design contract "link" row: text
 *   links = blue, small clickable bit), not Fresha's unstyled black link text (Mobbin
 *   capture doesn't specify a colour for it, tag: assume neutral; Solen's own lock wins
 *   on an unspecified value).
 * - kept: MetaDot no-glyph separator (LOCKFILE A12/V3-D463) everywhere Fresha's own
 *   capture shows a literal middle-dot between meta facts.
 * - not carried: Fresha's small filled count badge/dot next to each section label (taste
 *   rule 2 bans a decorative pip that adds no information beyond a plain number); the
 *   count itself (a real, counted number, never fabricated) is kept as plain text, e.g.
 *   "Upcoming (2)", weight matches surrounding body text, not bolded, per EMPHASIS BUDGET.
 *
 * floors: (a) photo focal = the Upcoming card's aspect-[5/4] cover photo, the single
 * largest element in the first viewport; (b) one clearly biggest element = that same
 * photo; (c) tabular/real number = price_paid (tabular-nums, real from the row) and the
 * calendar day number; (d) semantic colour moment = the cancelled row's red status word
 * (text-s-error) among Past, present because the seed data actually has one cancelled
 * booking; (e) no dead-grey zone = white page background alternates with the sunken
 * photo-fallback tray only where a photo is genuinely missing, Past group sits on white
 * with a hairline, never a bare grey field; (f) worst-case content = salon name and
 * service name both truncate (`truncate`), the meta line wraps to nothing longer than one
 * line by design, tested against the live longest real salon name in the seed set.
 *
 * emphasis-ok: weight >=600 is held to the section headings, the two per-section anchors
 * (salon name, price) and the three action buttons; every meta/date/service/count string
 * stays font-normal, per EMPHASIS BUDGET (CLAUDE.md FLOORS LAW 7a).
 */

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Calendar, Clock, MapPin, Settings2, Scissors } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { formatCurrency } from "@/lib/format-currency";
import type { LoadedBooking } from "./loadBookingsA";

interface Props {
  locale: string;
  upcoming: LoadedBooking[];
  past: LoadedBooking[];
}

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

function serviceName(booking: LoadedBooking, locale: string): string {
  if (!booking.service) return "";
  if (locale === "en") return booking.service.name_en || booking.service.name_de || "";
  return booking.service.name_de || booking.service.name_en || "";
}

function pdpHref(locale: string, booking: LoadedBooking): string | null {
  return booking.salon?.slug ? `/${locale}/salon/${booking.salon.slug}` : null;
}

function mapsHref(booking: LoadedBooking): string | null {
  if (!booking.salon?.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon.address)}`;
}

export default function BookingsListDirectionA({ locale, upcoming, past }: Props) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const prefersReducedMotion = useReducedMotion();

  const enter = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const, delay: i * 0.06 },
        };

  return (
    <div className="mx-auto w-full max-w-[560px] bg-white px-4 py-6">
      {/* Upcoming */}
      <section>
        <h2 className="text-[18px] font-semibold text-s-ink">
          Upcoming
          <span className="ml-1.5 text-[18px] font-normal text-s-ink-2">({upcoming.length})</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Calendar}
              title="No upcoming bookings"
              message="Book your next treatment now"
            />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {upcoming.map((booking, i) => (
              <UpcomingCard key={booking.id} booking={booking} locale={locale} localeCode={localeCode} motionProps={enter(i)} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-s-ink">
          Past
          <span className="ml-1.5 text-[18px] font-normal text-s-ink-2">({past.length})</span>
        </h2>

        {past.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Calendar}
              title="No past bookings"
              message="You have no completed bookings yet"
            />
          </div>
        ) : (
          <motion.div
            className="mt-3 overflow-hidden rounded-[24px] bg-white shadow-whisper"
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 12, scale: 0.99 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const, delay: upcoming.length * 0.06 },
                })}
          >
            {past.map((booking, i) => (
              <PastRow key={booking.id} booking={booking} locale={locale} localeCode={localeCode} isFirst={i === 0} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function UpcomingCard({
  booking,
  locale,
  localeCode,
  motionProps,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  motionProps: Record<string, unknown>;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const href = pdpHref(locale, booking);
  const directions = mapsHref(booking);
  const cover = booking.salon?.cover_photo_url ?? null;
  const svc = serviceName(booking, locale);

  const CardInner = (
    <>
      <div className="relative aspect-[5/4] w-full overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-s-bg-sunken">
            <Scissors className="h-8 w-8 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            {booking.salon?.name?.trim()?.[0] && (
              <span className="font-heading text-[15px] font-normal text-s-ink-2" aria-hidden>
                {booking.salon.name.trim()[0]}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-[16px] font-semibold text-s-ink">{booking.salon?.name || ""}</h3>
        <p className="mt-1 flex items-center text-[12px] font-normal text-s-ink-2">
          <Calendar size={13} className="flex-none" aria-hidden />
          <span className="ml-1.5">{dateLabel}</span>
          <Clock size={13} className="ml-3 flex-none" aria-hidden />
          <span className="ml-1.5">{timeLabel}</span>
        </p>
        <p className="mt-1 truncate text-[14px] font-normal text-s-ink">
          {svc}
          {duration ? (
            <>
              <MetaDot />
              {duration} min.
            </>
          ) : null}
        </p>
        <p className="mt-1 text-[14px] font-semibold tabular-nums text-s-ink">
          {formatCurrency(booking.price_paid, localeCode)}
        </p>
      </div>
    </>
  );

  return (
    <motion.article
      {...motionProps}
      className="overflow-hidden rounded-card bg-white shadow-whisper"
    >
      {href ? <Link href={href} className="block">{CardInner}</Link> : <div>{CardInner}</div>}

      <div className="flex items-center gap-2 border-t border-s-border p-3">
        {directions ? (
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] border border-s-border text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken"
          >
            <MapPin size={16} strokeWidth={1.9} aria-hidden />
            Get directions
          </a>
        ) : (
          <span className="flex-1" />
        )}
        <button
          type="button"
          onClick={() => setManageOpen((v) => !v)}
          className="flex h-11 items-center justify-center gap-2 rounded-[16px] border border-s-border px-4 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken"
          aria-expanded={manageOpen}
        >
          <Settings2 size={16} strokeWidth={1.9} aria-hidden />
          Manage
        </button>
      </div>

      <AnimatePresence>
        {manageOpen && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -8, scale: 0.98 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 1, 1] as const }}
            className="flex flex-col gap-1 border-t border-s-border p-3"
          >
            <button
              type="button"
              className="w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] font-normal text-s-ink hover:bg-s-bg-sunken"
            >
              Reschedule
            </button>
            <button
              type="button"
              className="w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] font-normal text-s-error hover:bg-s-error/10"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function PastRow({
  booking,
  locale,
  localeCode,
  isFirst,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  isFirst: boolean;
}) {
  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const cover = booking.salon?.cover_photo_url ?? null;
  const svc = serviceName(booking, locale);
  const isCancelled = booking.status === "cancelled";

  return (
    <div className={`flex items-center gap-3 p-3 ${isFirst ? "" : "border-t border-s-border"}`}>
      <div className="relative h-12 w-12 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken">
        {cover ? (
          <Image src={cover} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Scissors className="h-5 w-5 text-s-ink-2" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {href ? (
          <Link href={href} className="truncate block text-[14px] font-semibold text-s-ink">
            {booking.salon?.name || ""}
          </Link>
        ) : (
          <p className="truncate text-[14px] font-semibold text-s-ink">{booking.salon?.name || ""}</p>
        )}
        <p className="mt-0.5 flex min-w-0 items-center text-[12px] font-normal text-s-ink-2">
          <span className="min-w-0 truncate">
            {dateLabel}
            {svc ? (
              <>
                <MetaDot />
                {svc}
              </>
            ) : null}
          </span>
          {isCancelled ? (
            <span className="ml-1 flex flex-none items-center text-s-error">
              <MetaDot />
              Cancelled
            </span>
          ) : null}
        </p>
      </div>

      <button
        type="button"
        className="flex-none text-[14px] font-semibold text-s-accent hover:underline"
      >
        Book again
      </button>
    </div>
  );
}
