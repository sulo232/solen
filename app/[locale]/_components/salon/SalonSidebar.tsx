"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  MapPin,
} from "lucide-react";
import type { SalonDetail, OpenStatus } from "./_shared";
import { DAY_KEYS, withDateParam, type DayKey } from "./_shared";
import { StatusInline } from "./StatusInline";
import { RatingStars } from "../primitives";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format";

/**
 * SalonSidebar — V3-D230 (2026-05-27, austerity strip per real Fresha capture).
 *
 * Spec captured at `public/_pixel-refs/fresha/salon-sidebar/` via the
 * `fresha-section-capture` skill. Real Fresha values measured on LES MAINS
 * Basel (1440 desktop):
 *   - Sidebar card: bg white, 16px radius, NO box-shadow, padding 0 (children
 *     own padding), position static (sticky lives on a PARENT wrapper)
 *   - Salon name: 40px / 700 (we use Inter Tight per V3-D204 brand lock)
 *   - Rating "5.0": 24px / 600 ink
 *   - Reviews "(N)": 24px / 500 ACCENT color, CLICKABLE (jumps to reviews)
 *   - "Book now" CTA: 388×48, rounded-full, ink bg, white text — match
 *   - Status "Closed" word in BURNT AMBER (#B7570B), time in ink — split color
 *   - "Get directions": accent color, 16/500
 *   - Mitgliedschaft + Geschenkgutschein rows: CONDITIONAL on salon data,
 *     not unconditional
 *
 * Changes from V3-D229:
 *   - DROPPED `shadow-elevation-3` (Fresha is shadowless)
 *   - Salon name 22 → clamp(32,3vw,40)
 *   - Rating row now 24px (was 14)
 *   - "(N)" reviews count is now a button → scrolls to #section-reviews,
 *     rendered in `text-s-ink` (royal blue per our lock)
 *   - Status uses NEW StatusInline component (split-color word + time)
 *     instead of StatusPill
 *   - Mitgliedschaft only renders if salon.has_packages
 *   - Geschenkgutschein only renders if salon.has_gift_cards
 *     (defaults false-safe — fall through is no row, not broken render)
 *
 * Original V3-D229 structural change kept (always-visible, no expand-on-scroll).
 *
 * REPLACES V2-D53.3 expand-on-scroll behavior + 4 separate stacked sections.
 * User feedback was: "ur jst maiking patches that arent even fixing." The
 * fundamental issue was structure, not styling — sidebar wasn't a unified
 * salon card like Fresha's (Mina Beauty - Klusplatz pasted reference). It
 * was 3 disconnected blocks (status / contact rows / Gutscheine separate
 * card) that overflowed viewport on sticky-pin, hiding the CTA.
 *
 * New structure — single unified card, always-visible, matches Fresha:
 *   1. Salon name (h2)
 *   2. Rating row (star + 4.8 + (4))
 *   3. [Termin buchen] CTA - full-width black pill
 *   4. divider
 *   5. Status (with chevron, expands to hours)
 *   6. Address + Route
 *   7. divider
 *   8. Mitgliedschaft kaufen row → Kaufen
 *   9. Geschenkgutschein kaufen row → Kaufen
 *
 * DROPPED from previous version:
 *   - expand-on-scroll behavior (always render full card)
 *   - phone / website / instagram rows (Fresha doesn't show in sidebar)
 *   - Empfohlen pill (already in SalonHeader main column)
 *   - separate SalonBuy card below (now integrated as row 9 here)
 *
 * Sticky behavior remains on the parent (sticky top-24 in SalonDetailV3).
 * Compact-enough that the CTA stays visible when sticky-pinned.
 */
export function SalonSidebar({
  salon,
  locale,
  openStatus,
  todayKey,
}: {
  salon: SalonDetail;
  locale: string;
  /** Precomputed server-side (2026-07-04 hydration fix); never call
   * computeOpenStatus()/new Date() again here. See lib/salon-detail.ts. */
  openStatus: OpenStatus;
  todayKey: DayKey;
}) {
  const t = useTranslations("salonDetail");
  const status = openStatus;
  const [showHours, setShowHours] = React.useState(false);
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  // GAP #5: a searched date (?date=YYYY-MM-DD, forwarded from the search result the
  // user tapped) rides through to the booking picker instead of getting dropped.
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${salon.slug}/booking`, searchParams?.get("date"));

  // V3-D230: scroll to #section-reviews on rating-count click. Same anchor the
  // sticky tab nav uses. No router push — purely scroll behavior.
  const scrollToReviews = React.useCallback(() => {
    const el = document.getElementById("section-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // V3-D230: conditional buy rows; packages feature removed entirely (owner, 2026-06-11).
  // Gift cards HIDDEN from customers (owner, 2026-06-14) in favour of a Solen-wide
  // loyalty card. Flip back to true to restore the "Geschenkgutschein kaufen" row.
  const hasGiftCards = false;

  return (
    /* V3-D230 (2026-05-27): box-shadow DROPPED to match real Fresha capture
       (boxShadow: none). Flat white panel + 16px radius. Border kept for
       subtle edge on the otherwise-shadowless card. */
    <div className="rounded-2xl border border-s-border bg-white p-5 md:p-6">
      {/* 1. Salon name — V3-D230: 22 → clamp(32,3vw,40) per Fresha 40px */}
      {/* V3-D335 (T3): tracking -0.03em → -0.02em (canonical Salon-PDP H1 per LOCKFILE §2.5). */}
      <h2 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.1] tracking-[-0.02em] text-s-ink">
        {salon.name}
      </h2>

      {/* 2. Rating row — V3-D230: 14 → 24, "(N)" now button → reviews.
             Star + value via <RatingStars> (compact, no count: the count stays a
             separate clickable accent button → #section-reviews). */}
      <div className="mt-3 flex items-center gap-2">
        <strong className="font-body text-[20px] font-semibold leading-none text-s-ink md:text-[22px]">
          {salon.average_rating != null ? (
            <RatingStars value={salon.average_rating} size="lg" />
          ) : (
            "—"
          )}
        </strong>
        <button
          type="button"
          onClick={scrollToReviews}
          // 2026-05-30: links → saturated blue (s-accent), no underline (user direction; reverses V3-D335).
          className="font-body text-[18px] font-medium leading-none text-s-accent transition-[colors,transform] hover:text-s-accent-deep active:scale-[0.98] active:duration-[80ms] active:ease-glide md:text-[20px]"
        >
          {formatCount(salon.review_count, locale)}
        </button>
      </div>

      {/* 3. Primary CTA — match Fresha: ink bg + white text + 48 height + 999 radius */}
      <Link
        href={bookingHref}
        className="font-body mt-5 inline-flex w-full items-center justify-center rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {t("bookAppointment")}
      </Link>

      {/* 4. divider */}
      <div className="my-5 border-t border-s-border" />

      {/* 5. Status — V3-D230: split-color inline (word in burnt amber, time in ink)
             matches Fresha "Closed" amber + "- opens at 10:00 AM" ink pattern. */}
      <button
        type="button"
        onClick={() => setShowHours((v) => !v)}
        className="font-body -mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[15px] transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms] active:ease-glide"
        aria-expanded={showHours}
      >
        <StatusInline isOpen={status.isOpen} label={status.label} />
        {salon.opening_hours && (
          <ChevronDown
            size={15}
            strokeWidth={1.9}
            className={cn(
              "ml-auto shrink-0 text-s-ink-2 transition-transform duration-150",
              showHours && "rotate-180",
            )}
          />
        )}
      </button>

      {showHours && salon.opening_hours && (
        <ul className="mt-2 space-y-1.5 rounded-lg bg-s-bg-sunken/50 px-3 py-2.5">
          {DAY_KEYS.map((day) => {
            const h = salon.opening_hours![day];
            const isToday = day === todayKey;
            return (
              <li
                key={day}
                className={cn(
                  "font-body flex items-center justify-between text-[12px]",
                  isToday ? "font-semibold text-s-ink" : "text-s-ink-2",
                )}
              >
                <span>{t(day)}</span>
                <span>{h ? `${h.open} – ${h.close}` : t("closed")}</span>{/* em-dash-ok: pre-existing en-dash time separator, unrelated to this i18n edit */}
              </li>
            );
          })}
        </ul>
      )}

      {/* 6. Address + Route */}
      <div className="font-body mt-3 flex items-start gap-2 text-[15px] text-s-ink-2">
        <MapPin size={16} className="mt-0.5 shrink-0 text-s-ink-2" strokeWidth={1.9} />
        <div className="min-w-0 flex-1">
          <span>{fullAddress}</span>
          {" "}
          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer noopener"
            // Owner 2026-06-12: map/directions links are BLUE (Fresha uses accent here).
            className="font-medium text-s-accent transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
          >
            Route
          </a>
        </div>
      </div>

      {/* 7-8. Conditional buy rows — V3-D230: data-driven, not unconditional.
              LES MAINS has neither, Mina Beauty has both, ours renders only what
              the salon actually offers. */}
      {hasGiftCards && (
        <>
          <div className="my-5 border-t border-s-border" />
          {hasGiftCards && (
            <div>
              <BuyRow
                title="Geschenkgutschein kaufen"
                subtitle={`Machen Sie sich selbst oder jemand anderem eine Freude.`}
                href={`/${locale}/salon/${salon.slug}/gift-card`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* V3-D232 (2026-05-27): StatusInline EXTRACTED to its own file at
   `./StatusInline.tsx` so SalonHeader hero meta-row can use the same
   component. Behavior unchanged; the prop API gained `size` (sm/md/lg)
   for Fresha-parity 16px sizing in the hero meta row. */

/**
 * BuyRow — internal row primitive for Mitgliedschaft + Geschenkgutschein
 * rows in the sidebar. Title + subtitle + outline Kaufen pill on right.
 * Layer 1 chrome — matches Fresha's compact "buy option" row.
 *
 * V3-D230: sizing bumped to match Fresha proportions (15→16 title font,
 * 13→14 subtitle, pill h-9→h-10 for touch parity).
 */
function BuyRow({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-body text-[15px] font-medium text-s-ink md:text-[16px]">
          {title}
        </div>
        <div className="font-body mt-1 text-[13px] leading-snug text-s-ink-2 md:text-[14px]">
          {subtitle}
        </div>
      </div>
      <Link
        href={href}
        className="font-body shrink-0 rounded-full border border-s-ink bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-ink hover:text-white md:px-6"
      >
        Kaufen
      </Link>
    </div>
  );
}
