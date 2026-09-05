"use client";

// Grounded-in: app/[locale]/_components/salon/SalonMobileBookBar.tsx (the real sticky book
// bar this forks the RECIPE from, read in full before writing this file).
//
// Exists-check: `npm run exists "salon page"` ran this turn -> SalonMobileBookBar.tsx is the
// real, single, locked sticky-CTA implementation for this surface (hierarchy-density-06). The
// brief's own direction text for THIS letter (B) names a different, more literal Airbnb recipe
// than that lock ("the sticky bar in Airbnb's reserve recipe: from-price on the left, the pill
// button on the right"), so this is a deliberate fork into this direction's own folder, not the
// real bar reused unchanged the way FIXED items are for the other directions of this surface.
//
// CONFLICT [dated taste decision]: TASTE_LOG.md "Round 2: Salon PDP (Book CTA + title)"
// (2026-06-07) settled the sticky bar as "Clean: 'Termin buchen' + chevron, NO price... You
// book a time; the from-price depends on the service picked next, so price on this button
// misleads. Price belongs on the service list." This bar shows a from-price on purpose, because
// the current brief's own direction text for letter B literally names it ("the sticky bar in
// Airbnb's reserve recipe: from-price on the left, the pill button on the right"), matching the
// LOOK-FULL mode's licence to break a named lock and list it. Not silently resolved: flagged for
// the owner to reconcile against the 2026-06-07 call, which a mockup does not get to overrule.
//
// Direction: B, LOOK-FULL. Airbnb's Reserve button (airbnb--listing-page.md Measured table):
// radius 999px true pill, h 48px, text 16/500 white, fill = the rausch gradient
// rgb(228,28,92) to rgb(234,89,140), PIXEL-SAMPLED off the rendered button (computed
// background-color resolves transparent through 3 ancestor hops per that file's own "Not
// measured" section), so the two-stop gradient below is that same sampled approximation, not a
// separately re-measured value. Left side ("from-price") is NOT in the Airbnb capture (Airbnb's
// own bar carries no price, only the button, per the "sticky reserve bar container" row of that
// same table). Fresha's own mobile sticky bar is the one that shows a price, so this bar is a
// deliberate MERGE the brief's own direction text asked for ("from-price on the left, the pill
// button on the right"), not a 1:1 port of either single reference alone.
//
// Depicts: sticky bottom book bar -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (same
//   job: a persistent, non-obstructing bottom CTA that never snaps/parks, same booking href
//   target `/salon/{slug}/booking`, same portal-to-body + safe-area pattern)
//
// MEASURED CORRECTION (live render, 390x844): this bar is always visible (fixed position), so
// it always counts toward the first-viewport 4-size/2-weight floor. Two things were wrong
// against a live measurement, not an assumption, and both are fixed below: (1) the price and
// button were 16px, a FIFTH size beyond the direction's {12,14,22,28} first-viewport palette
// (measured via Playwright getComputedStyle, this session), so both now render at 14px, closer
// to Airbnb's own literal "16/500" than a size the type-budget floor would refuse outright; a
// FLOORS LAW floor outranks a taste axis per CLAUDE.md's precedence chain, so this is a
// compliance rounding, not an invented number. (2) `font-semibold` on this bar computed to a
// REAL 600 (not the 500 every other `font-semibold` on this page renders), because this bar is
// `ReactDOM.createPortal`-ed to `document.body`, outside the `<main>` element that carries
// `app/globals.css`'s `main :is(.font-semibold, .font-bold) { font-weight: 500 }` downgrade
// rule; every other element in this direction sits inside that `<main>` and is silently
// downgraded to 500, so this bar was a genuine THIRD weight the rest of the page never showed.
// Fixed by setting this bar's text to an explicit inline `fontWeight: 500`, which also happens
// to match Airbnb's own literal measured "16/500" more closely than the 600 this file shipped
// with before this correction.

import ReactDOM from "react-dom";
import * as React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

const INK = "#222222"; // drift-ok: LOOK-FULL, airbnb--look-recipe.md #5, matches AirbnbSections.tsx's ink

export function AirbnbReserveBar({
  locale,
  slug,
  priceFromCHF,
}: {
  locale: string;
  slug: string;
  priceFromCHF: number | null;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-[800] flex items-center justify-between gap-4 bg-white px-5 py-3 lg:hidden"
      style={{
        borderTop: "1px solid #DDDDDD", // drift-ok: LOOK-FULL, airbnb--look-recipe.md #8 exact hairline
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="min-w-0">
        {priceFromCHF != null ? (
          <>
            <div className="text-[14px]" style={{ color: "#6B6B6B" }}>
              From
            </div>
            {/* airbnb--listing-page.md Reserve-bar left slot: this direction's own merge of
                Fresha's price-shown sticky bar with Airbnb's Reserve pill, see file header.
                14px/500 (see MEASURED CORRECTION above), not 16/600. */}
            <div className="text-[14px] tabular-nums" style={{ color: INK, fontWeight: 500 }}>
              {formatPrice(priceFromCHF, locale)}
            </div>
          </>
        ) : (
          <div className="text-[14px]" style={{ color: INK, fontWeight: 500 }}>
            Muse Beauty Studio
          </div>
        )}
      </div>

      {/* airbnb--listing-page.md Measured: Reserve pill, radius 999, h 48, text 16/500 white,
          fill = rausch gradient (pixel-sampled two-stop approximation, see file header). Breaks
          two Solen locks on purpose: the ink-only commit-button colour law and the 16px
          button/chip radius law (see Conflicts in SalonPageAirbnbLook.tsx). Text rendered at
          14px/500 (see MEASURED CORRECTION above), not the literal 16/600 the class names
          below used to compute to on this portaled element. */}
      {/* Press timing: airbnb--motion.md capture (f), "larger controls (Share, Save, ...)" row,
          250ms cubic-bezier(0.2,0,0,1), the same curve/duration AirbnbHero.tsx uses for its
          own larger controls, not the framework default `transition-transform` timing. */}
      <Link
        href={`/${locale}/salon/${slug}/booking`}
        className="flex h-12 shrink-0 items-center justify-center rounded-full px-6 text-[14px] text-white active:scale-[0.97]"
        style={{
          background: "linear-gradient(90deg, rgb(228,28,92), rgb(234,89,140))",
          fontWeight: 500,
          transition: "transform 250ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        Reserve
      </Link>
    </div>,
    document.body,
  );
}
