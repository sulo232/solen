"use client";

import * as React from "react";
import { MapPin, Share, Star } from "lucide-react";
import { HeartButton } from "../homepage/HeartButton";
import { StatusInline } from "./StatusInline";
import type { SalonDetail } from "./_shared";
import { computeOpenStatus } from "./_shared";

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
 *     - "(N)" reviews count is now a `<button>` in `text-s-accent`,
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
export function SalonHeader({ salon }: { salon: SalonDetail }) {
  const status = computeOpenStatus(salon.opening_hours);
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // V3-D232: scroll to reviews on (N) click. Same anchor SalonSidebar uses.
  const scrollToReviews = React.useCallback(() => {
    const el = document.getElementById("section-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // V3-D232: scroll to about/contact on address click — opens the location
  // context. Fresha's address-button likely opens a map modal; we route to
  // the about-section anchor which contains the static map placeholder.
  const scrollToAbout = React.useCallback(() => {
    const el = document.getElementById("section-about");
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
          <h1 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.05] tracking-[-0.02em] text-s-ink">
            {salon.name}
          </h1>

          {/* Meta row — V3-D232: ONE inline wrap-row, `•` bullets between groups.
              Was 3 stacked rows + pill row. Now matches Fresha's structure. */}
          <div className="font-body mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-s-ink-2 md:text-[15px]">
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} fill="#FFC32B" stroke="none" />
              <strong className="font-semibold text-s-ink">
                {salon.average_rating?.toFixed(1) ?? "—"}
              </strong>
              <button
                type="button"
                onClick={scrollToReviews}
                aria-label={`${salon.review_count} Bewertungen anzeigen`}
                // V3-D335 (overnight T3): decorative accent link → ink underline per LOCKFILE §1.5.
                className="font-medium text-s-ink underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                ({salon.review_count.toLocaleString("de-CH")})
              </button>
            </span>

            <Dot />

            <StatusInline isOpen={status.isOpen} label={status.label} size="md" />

            <Dot />

            <span className="inline-flex items-center gap-1">
              <MapPin size={14} className="shrink-0 text-s-ink-3" strokeWidth={2} />
              <button
                type="button"
                onClick={scrollToAbout}
                aria-label="Standort anzeigen"
                className="text-left text-s-ink-2 transition-colors hover:text-s-ink"
              >
                {fullAddress}
              </button>
            </span>

            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              // V3-D335 (overnight T3): decorative accent link → ink underline per §1.5.
              className="font-medium text-s-ink underline underline-offset-2 hover:no-underline"
            >
              Wegbeschreibung
            </a>
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
            aria-label="Salon teilen"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator
                  .share({ title: salon.name, url: window.location.href })
                  .catch(() => {});
              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-transform hover:scale-105 active:scale-95"
          >
            <Share size={18} strokeWidth={2.25} className="text-s-ink" aria-hidden />
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            tone="dark"
            className="!relative !right-auto !top-auto"
          />
        </div>
      </div>
    </header>
  );
}

function Dot() {
  return <span className="text-s-ink-3" aria-hidden>·</span>;
}
