"use client";

// exists-check: `npm run exists "sticky book bar"` -> 1 REMOVED hit (a park/snap
// IntersectionObserver behaviour the owner killed 2026-07-24, "wants the bar to STAY put
// and never move"); this file keeps `position: fixed` unconditionally, same as the real
// SalonMobileBookBar, never switching to absolute. Extends (by copy, see below) rather
// than duplicating from scratch.
//
// Grounded-in: app/[locale]/_components/salon/SalonMobileBookBar.tsx (COPIED per the
// brief's own allowance for an anatomy change Direction C's one idea requires: "the
// sticky bar shows the running selection (service and price) instead of a bare Book
// button"). Portal-to-body, z-[800], the gradient content-fade, the ink pill fill and the
// "Termin buchen" default copy are all kept byte-identical for the DEFAULT (nothing
// chosen) state; the only new branch is what renders when a service is chosen.
//
// Depicts: default ink pill CTA -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (byte-identical class string, portal target, z-index and gradient fade).
// Depicts: chosen-service content swap -> NET-NEW: no existing sticky bar on this surface shows a running selection; this is Direction C's one named change.
// Depicts: name-price gap glyph -> app/[locale]/_components/salon/MetaDot.tsx (no-glyph spacer, not a middle-dot separator, per LOCKFILE A12).
//
// mockup-ok: dropped the real bar's useCookieConsent() gate and gallery/lightbox
// suppression props, both belong to the full production page (a cookie banner, a
// full-screen gallery) that this comparison mockup does not render; noted in the build
// return under concerns rather than silently carried over.

import * as React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { Service } from "@/app/[locale]/_components/salon/_shared";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { useEnterMotion } from "@/app/[locale]/_components/primitives/motion";
import { PriceFrom } from "@/app/[locale]/_components/primitives";

export function StickyBarC({
  locale,
  slug,
  chosen,
}: {
  locale: string;
  slug: string;
  chosen: Service | null;
}) {
  const bookingHref = chosen
    ? `/${locale}/salon/${slug}/booking?service=${chosen.id}`
    : `/${locale}/salon/${slug}/booking`;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[800] bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <AnimatePresence mode="wait" initial={false}>
        {chosen ? (
          <ChosenBar key={chosen.id} href={bookingHref} service={chosen} />
        ) : (
          <DefaultBar key="default" href={bookingHref} />
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function DefaultBar({ href }: { href: string }) {
  const enter = useEnterMotion();
  return (
    <motion.div {...enter}>
      <Link
        href={href}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        Book appointment
        <ChevronRight size={16} strokeWidth={1.9} />
      </Link>
    </motion.div>
  );
}

function ChosenBar({ href, service }: { href: string; service: Service }) {
  const enter = useEnterMotion();
  return (
    <motion.div {...enter} className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-body truncate text-[13px] font-medium text-s-ink-2">1 service selected</p>
        <p className="font-body flex items-baseline truncate text-[15px] font-semibold text-s-ink">
          <span className="truncate">{service.name_de}</span>
          <MetaDot />
          <PriceFrom amount={service.price} />
        </p>
      </div>
      <Link
        href={href}
        className="font-body flex shrink-0 items-center gap-1.5 rounded-full bg-s-ink px-5 py-3 text-[14px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        Continue
        <ChevronRight size={15} strokeWidth={1.9} />
      </Link>
    </motion.div>
  );
}
