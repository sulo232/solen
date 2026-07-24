"use client";

import * as React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { withDateParam } from "./_shared";

/**
 * mockup-ok: SalonMobileBookBar, 2026-07-24 PORT (ref
 * _overhaul/SalonMobileBookBarOverhaul.tsx). Sticky bottom mobile CTA, per Fresha
 * pattern, a prominent full-width button anchored to the bottom of the viewport,
 * always visible while scrolling, never parking/snapping (owner: "it doesn't move
 * from there").
 *
 * Portaled straight to document.body (SSR-guarded via a mounted flag): the root
 * layout's `<main id="main-content" isolate>` traps a plain fixed child inside its
 * own stacking context, so the page's later `<footer>` sibling was painting over this
 * bar regardless of z-index. Portaling escapes that trap. z-[800] is ABOVE the cookie
 * consent banner (`z-tooltip` = 700 in tailwind.config.js), which otherwise painted
 * over the bar at page bottom.
 *
 * Hidden on desktop (`lg:hidden`), desktop uses SalonSidebar instead.
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

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  // V3-D202 (A20): drop bg-white/95 backdrop-blur-md → bg-white per drift-detox.
  // V3-D442 (round 2): gradient content-fade above the bar instead of a hard
  // top border (CONTROL_ELEVATION: sticky bar on white = flat, no border/shadow).
  return ReactDOM.createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[800] bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <Link
        href={bookingHref}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black active:bg-black"
      >
        Termin buchen
        <ChevronRight size={16} strokeWidth={2.5} />
      </Link>
    </div>,
    document.body,
  );
}
