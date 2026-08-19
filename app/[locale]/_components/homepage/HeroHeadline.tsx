"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * HeroHeadline — V3-D108 (2026-05-23).
 *
 * Rotating playful slogan on every page refresh. Some variants have an
 * optional inline CTA link (e.g. a coupon slogan → a deals/search link).
 *
 * Original V3-D107 (no CTA support) preserved in git history.
 *
 * Implementation:
 *   - SLOGANS is an array of `{ headline: ReactNode, cta?: { label, href } }`
 *   - Initial render = index 0 (no hydration mismatch)
 *   - useEffect picks random index on mount → re-renders
 *   - When the picked slogan has a CTA, an inline "Check it out →" link
 *     renders below the h1 with a small ArrowRight icon
 *
 * Brief flicker on first paint as random pick happens client-side after
 * hydration. Trade-off vs forcing the whole homepage to dynamic rendering.
 */

type Slogan = {
  headline: React.ReactNode;
  cta?: { label: string; href: string };
};

const SLOGANS: Slogan[] = [
  // V3-D109 (2026-05-23) edits per user:
  //   • Removed: original "Schöner aussehen..." (slot #1) and "Lass uns buchen" (slot #6).
  //   • #3 "Cmon, book it already" — highlight moved Cmon → "book"
  //   • #4 — added "Ye" prefix + made it the highlight
  //   • #5 — highlight moved "Klar." → "30 Sek."
  //   • #7 — rewritten to "One click away" with "click" highlighted
  //   • #8 — rewritten to "Booking — so easily? Noooo way." with "Noooo" highlight
  //   • #9 — highlights now BOTH "broke?" and "Coupons" (two-span slogan)
  // Final list: 7 slogans (down from 9).

  // 1. English casual
  {
    headline: (
      <>
        Book it{"\n"}in a <span className="text-s-ink">sec.</span>
      </>
    ),
  },
  // 2. "book" is the highlight (was "Cmon")
  {
    headline: (
      <>
        Cmon, <span className="text-s-ink">book</span> it{"\n"}already.
      </>
    ),
  },
  // 3. "Ye" added + highlighted
  {
    headline: (
      <>
        <span className="text-s-ink">Ye</span>, wir sind ein{"\n"}Booking Site.
      </>
    ),
  },
  // 4. "30 Sek." is the highlight (was "Klar.")
  {
    headline: (
      <>
        Termin? Klar.{"\n"}In <span className="text-s-ink">30 Sek.</span>
      </>
    ),
  },
  // 5. NEW: "One click away" — "click" highlighted
  {
    headline: (
      <>
        One <span className="text-s-ink">click</span>
        {"\n"}away.
      </>
    ),
  },
  // 6. NEW: "Booking, so easily? Noooo way." — "Noooo" highlighted
  // (no em dash per user "stop using M dashes")
  {
    headline: (
      <>
        Booking, so easily?{"\n"}
        <span className="text-s-ink">Noooo</span> way.
      </>
    ),
  },
  // 7. Coupon slogan — TWO highlights now (broke? + Coupons) + CTA link
];

// Module-level cache for the picked index. Survives React Strict Mode's
// double-invocation of useEffect in dev (which was causing the slogan to
// SWAP once after mount, looking like "it rotates without me refreshing").
// Resets on page reload because JS modules re-execute on hard navigation.
let pickedIdx: number | null = null;

export default function HeroHeadline({ className }: { className?: string }) {
  // Initial = 0 (same server + client → no hydration mismatch).
  // useEffect runs only on client, swaps to the cached pick after mount.
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (pickedIdx === null) {
      pickedIdx = Math.floor(Math.random() * SLOGANS.length);
    }
    setIdx(pickedIdx);
  }, []);

  const slogan = SLOGANS[idx];

  return (
    <>
      <h1 className={className} style={{ whiteSpace: "pre-line" }}>
        {slogan.headline}
      </h1>
      {slogan.cta && (
        <Link
          href={slogan.cta.href}
          className="group -mt-3 mb-6 inline-flex items-center gap-1.5 font-body text-[14px] font-semibold text-s-ink transition-colors hover:text-s-ink-mid md:-mt-4 md:text-[15px]"
        >
          {slogan.cta.label}
          <ArrowRight
            size={14}
            strokeWidth={1.6}
            aria-hidden
            className="transition-transform duration-200 ease-out group-hover:translate-x-1"
          />
        </Link>
      )}
    </>
  );
}
