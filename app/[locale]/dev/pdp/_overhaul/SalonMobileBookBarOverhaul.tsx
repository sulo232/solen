"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonMobileBookBar.tsx (real,
// unmodified). `npm run exists` (2026-07-24) confirms SalonMobileBookBar is the single sticky
// mobile book CTA.
// ROUND 3 (S5, owner verbatim: "not a snapping, but like it stays there, it doesn't move from
// there"): the earlier R5 fix watched the footer with an IntersectionObserver and switched the
// bar from fixed to absolute the instant it became reachable, which read as a visible snap/jump.
// The owner likes the PLACEMENT (bottom, always there), not the park motion, so the observer and
// the fixed<->absolute toggle are removed entirely: the bar is now permanently `fixed bottom-0`,
// no transform/position animation, it never moves.
// ROUND 4 (C2, owner-measured root cause): the bar still disappeared at page bottom. Proven cause
// - app/[locale]/layout.tsx's `<main id="main-content" ... isolate>` creates a stacking context
// that traps this fixed bar, and the page's `<footer>` (a later sibling of that isolated main,
// z-index:1) paints on top of the whole isolated context regardless of the bar's own z-index.
// Fix: portal the bar to document.body so it is a direct child of body, outside every stacking
// context the page tree creates. SSR-guarded (mount before portalling); still permanently
// `fixed inset-x-0 bottom-0`, no observer, no fixed/absolute switching, no position/transform
// animation.
// ROUND 5 (owner-measured, "it overlaps and goes away" x2): even portalled to body, the bar was
// still covered at page bottom by the cookie consent banner, which renders `fixed z-tooltip`
// (app/[locale]/_components/primitives/CookieConsent.tsx, shipped, not touched here) and
// tailwind.config.js defines `tooltip: 700`. z-50 < 700, so the cookie card painted over the bar.
// Raised to z-[800] (above the 700 cookie layer) so this is a deliberate number, not a mystery
// one; document.elementFromPoint at the bar's centre now resolves inside the bar at both page
// top and fully scrolled bottom.

import * as React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { withDateParam } from "../../../_components/salon/_shared";

export function SalonMobileBookBarOverhaul({ locale, slug }: { locale: string; slug: string }) {
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[800] bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <Link
        href={bookingHref}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black active:bg-black"
      >
        Book appointment
        <ChevronRight size={16} strokeWidth={2.5} />
      </Link>
    </div>,
    document.body,
  );
}
