"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonMobileBookBar.tsx (real,
// unmodified). `npm run exists` (2026-07-24) confirms SalonMobileBookBar is the single sticky
// mobile book CTA.
// ROUND 3 (S5, owner verbatim: "not a snapping, but like it stays there, it doesn't move from
// there"): the earlier R5 fix watched the footer with an IntersectionObserver and switched the
// bar from fixed to absolute the instant it became reachable, which read as a visible snap/jump.
// The owner likes the PLACEMENT (bottom, always there), not the park motion, so the observer and
// the fixed<->absolute toggle are removed entirely: the bar is now permanently `fixed bottom-0`,
// no transform/position animation, it never moves. Clearance from the footer/newsletter is
// handled by reserved bottom padding on the page (PdpOverhaul.tsx `<main>`) instead of a runtime
// park , see that file's comment for the room-to-scroll reasoning.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { withDateParam } from "../../../_components/salon/_shared";

export function SalonMobileBookBarOverhaul({ locale, slug }: { locale: string; slug: string }) {
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
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
