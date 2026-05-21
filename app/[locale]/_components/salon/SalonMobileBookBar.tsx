"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-s-border bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <Link
        href={`/${locale}/salon/${slug}/booking`}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-brand py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-s-brand-mid active:bg-s-brand-deep"
      >
        Termin buchen
        <ChevronRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
