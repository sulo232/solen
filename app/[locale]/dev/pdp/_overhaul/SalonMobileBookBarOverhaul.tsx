"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonMobileBookBar.tsx (real,
// unmodified). `npm run exists` (2026-07-24) confirms SalonMobileBookBar is the single sticky
// mobile book CTA. This copy fixes the research's "bar overlaps/slides behind the footer"
// finding: the real bar is permanently `fixed bottom-0`, and the layout's `<main isolate>`
// traps its z-30 below the footer's own `relative z-[1]` stacking context, so it never stops
// before the newsletter/footer band. This copy watches the real `<footer>` with an
// IntersectionObserver and switches from FIXED (floating while scrolling content) to ABSOLUTE
// (parked, inside a reserved band placed just above the footer in PdpOverhaul.tsx) the instant
// the footer becomes reachable, so it never overlaps and never slides under it.

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { withDateParam } from "../../../_components/salon/_shared";

export function SalonMobileBookBarOverhaul({ locale, slug }: { locale: string; slug: string }) {
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));
  const [parked, setParked] = React.useState(false);

  React.useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      ([entry]) => setParked(entry.isIntersecting),
      { root: null, threshold: 0 }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Identical treatment classes in both states; only positioning differs.
  const treatment =
    "left-0 right-0 z-30 bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']";
  return (
    <div className={`${parked ? "absolute bottom-0" : "fixed bottom-0"} ${treatment}`}>
      <Link
        href={bookingHref}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black active:bg-black"
      >
        Book appointment
        <ChevronRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
