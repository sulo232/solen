"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { withDateParam } from "./_shared";

/**
 * SalonMobileBookBar — V2-D53.3 (2026-05-11).
 *
 * Sticky bottom mobile CTA. Per Fresha pattern, a prominent button anchored
 * to the bottom of the viewport, always visible while scrolling.
 *
 * Variant chosen: FULL-WIDTH bottom bar (not floating bottom-right pill)
 * because Solen's mobile target audience benefits from edge-to-edge tap
 * target. Fresha shows a floating black button; we use a full-width
 * emerald bar matching the Solen action-color rule (V2-D49j).
 *
 * Hidden on desktop (`md:hidden`) — desktop uses SalonSidebar instead.
 */
export function SalonMobileBookBar({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  // GAP #5: a searched date (?date=YYYY-MM-DD, forwarded from the search result the
  // user tapped) rides through to the booking picker instead of getting dropped.
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));
  return (
    // V3-D202 (A20): drop bg-white/95 backdrop-blur-md → bg-white per drift-detox.
    // V3-D442 (round 2): gradient content-fade above the bar instead of a hard
    // top border (CONTROL_ELEVATION: sticky bar on white = flat, no border/shadow).
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <Link
        href={bookingHref}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black active:bg-black"
      >
        Termin buchen
        <ChevronRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
