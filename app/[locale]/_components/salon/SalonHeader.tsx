"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { MapPin, Share } from "lucide-react";
import { RatingStars } from "../primitives";
import { HeartButton } from "../homepage/HeartButton";
import { StatusInline } from "./StatusInline";
import type { SalonDetail, OpenStatus } from "./_shared";
import { shareOrCopy } from "@/lib/share";
import ReportButton from "@/components-legacy/discovery/ReportButton";
import { formatCount } from "@/lib/format";
import { useTranslations } from "next-intl";

/**
 * SalonHeader — V3-D232 (2026-05-27, hero austerity strip per Fresha capture).
 *
 * Spec captured at `public/_pixel-refs/fresha/salon-hero/SPEC.md`. Real Fresha
 * values measured on LES MAINS Basel @ 1440 desktop. Major restructure from
 * V2-D53.3:
 *
 *   DROPPED (3 things Fresha doesn't have):
 *     - Category eyebrow "COIFFEUR" (Fresha shows category in breadcrumb only)
 *     - EMPFOHLEN featured pill (Fresha never surfaces featured in hero)
 *     - Last-minute discount pill (Fresha doesn't have it; lives on SalonCard
 *       in the listing surface, not on PDP hero)
 *
 *   CHANGED (to match Fresha anatomy):
 *     - H1 bumped 30 → clamp(28, 3.5vw, 40) — Fresha measures 48 desktop;
 *       40 feels proportional in our narrower content area + with the row
 *       collapse below
 *     - Meta row now ALL inline (rating + (N) + status + address + directions),
 *       separated by `•` bullets. Was 3 stacked rows + 1 pill row = 4 levels;
 *       now ONE wrap-row.
 *     - "(N)" reviews count is now a `<button>` in `text-s-ink`,
 *       clicks scroll to `#section-reviews` (matches Fresha purple-clickable)
 *     - Address is now a `<button>` (clickable, scrolls to map / about)
 *     - StatusPill replaced with `StatusInline` (split-color word + time)
 *       — matches Fresha "Closed" amber + "- opens at" muted ink pattern
 *     - Meta row sizes bumped 13/14 → 14/15 (Fresha uses 16; we land between)
 *
 *   KEPT (Solen primitive locks):
 *     - Yellow star `#FFC32B` (universal-color rating)
 *     - Inter Tight display, Hanken Grotesk body
 *     - Share + Heart cluster top-right of title row on desktop (mobile has
 *       them on the photo overlay). Could move to top-right of GALLERY per
 *       Fresha; deferred to keep this round surgical.
 */
export function SalonHeader({
  salon,
  openStatus,
}: {
  salon: SalonDetail;
  /** Precomputed server-side (2026-07-04 hydration fix); never call
   * computeOpenStatus()/new Date() again here. See lib/salon-detail.ts. */
  openStatus: OpenStatus;
}) {
  const t = useTranslations("salonDetail");
  const status = openStatus;
  const fullAddress = salon.address;
  const locale = useLocale();

  // V3-D232: scroll to reviews on (N) click. Same anchor SalonSidebar uses.
  const scrollToReviews = React.useCallback(() => {
    const el = document.getElementById("section-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Tap the open/closed status → jump to the opening-hours section.
  const scrollToHours = React.useCallback(() => {
    const el = document.getElementById("section-hours");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Tap the address → jump to the location/map section (directions live there now).
  const scrollToLocation = React.useCallback(() => {
    const el = document.getElementById("section-location");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <header className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* H1 — V3-D232: 30 → clamp(28,3.5vw,40). Fresha is 48 but our
              content column is narrower (sidebar takes 340px on desktop);
              40 feels proportional. */}
          {/* V3-D335 (T3): tracking -0.03em → -0.02em (canonical per §2.5). */}
          {/* RANGE LAW A2 (2026-07-25): 22/26 was literally the Page H2 recipe, not a
              display anchor; the salon name (the subject of the page) rendered smaller
              than the 28px NEVER-AGAIN floor and never owned its own screen. Promoted to
              the LOCKFILE §2 "Salon-PDP H1 (salon name in hero)" row (30px mobile, 34px
              desktop, 600 weight, leading 1.1), a literal already reserved for this exact
              element, not invented here. Weight stays 600 (A1 "keep 600 for the salon
              name"). */}
          <h1 className="font-display text-[clamp(30px,2.8vw,34px)] font-semibold leading-[1.1] tracking-[-0.02em] text-s-ink">
            {salon.name}
          </h1>

          {/* Meta — stacked rows for a clear order, NO separator dots:
              (1) rating  (2) open status → taps to opening hours  (3) address
              as the link itself (blue) → directions. */}
          <div className="font-body mt-3 space-y-1.5 text-[14px] text-s-ink-2 md:text-[15px]">
            {/* Rating — star + value via <RatingStars> (compact, no count: the
                count stays a separate clickable accent button → #section-reviews). */}
            <div className="flex items-center gap-1.5">
              {salon.average_rating != null ? (
                <strong className="font-semibold text-s-ink">
                  <RatingStars value={salon.average_rating} size="md" />
                </strong>
              ) : (
                <strong className="font-semibold text-s-ink">—</strong>
              )}
              <button
                type="button"
                onClick={scrollToReviews}
                aria-label={t("showNReviews", { count: salon.review_count })}
                className="text-s-accent transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {formatCount(salon.review_count, locale)}
              </button>
            </div>

            {/* Open status — tap to jump to the opening hours */}
            <button
              type="button"
              onClick={scrollToHours}
              aria-label={t("showOpeningHours")}
              className="block text-left transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
            >
              <StatusInline isOpen={status.isOpen} label={status.label} size="md" />
            </button>

            {/* Address — the link itself opens directions (no separate "Wegbeschreibung") */}
            <button
              type="button"
              onClick={scrollToLocation}
              aria-label={t("showLocation")}
              className="inline-flex items-center gap-1 text-left text-s-ink-2 transition-[colors,transform] hover:text-s-ink active:scale-[0.98] active:duration-[80ms] active:ease-glide"
            >
              <MapPin size={14} className="shrink-0 text-s-ink-2" strokeWidth={1.6} />
              {fullAddress}
            </button>
          </div>
        </div>

        {/* Desktop-only share + heart cluster.
            V3-D232 NOTE: Fresha anchors these top-right of the GALLERY, not
            inline with the H1 row. Deferred relocation to keep this round
            surgical. Current placement still works visually — they sit at
            the top-right of the title block. */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <button
            type="button"
            aria-label={t("shareProfile")}
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-transform hover:scale-105 active:scale-95 active:duration-[80ms] active:ease-glide"
          >
            <Share size={18} strokeWidth={1.9} className="text-s-ink" aria-hidden />
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            tone="dark"
            className="!relative !right-auto !top-auto"
          />
          {/* mockup-ok: net-new report affordance (owner ask 2026-07-25), reusing
              ReportButton's "header" variant, a verbatim copy of the Share button's own
              chrome above (h-11 w-11 white bordered circle). */}
          <ReportButton type="salon" targetId={salon.id} variant="header" />
        </div>
      </div>
    </header>
  );
}
