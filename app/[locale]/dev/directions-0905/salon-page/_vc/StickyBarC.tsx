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
// "Book appointment" default copy are all kept byte-identical for the DEFAULT (nothing
// chosen) state; the only new branch is what renders when a service is chosen.
//
// Two DIFFERENT motions on purpose, so a Playwright video of two taps proves two distinct
// behaviours, not one animation played twice (the brief's own two named cases):
//   1. REVEAL (nothing chosen -> a service, or a service -> nothing / deselect): the shipped
//      ENTER RECIPE verbatim (app/[locale]/_components/primitives/motion.ts,
//      ENTER_DURATION=0.28s, GLIDE_EASE, opacity 0->1 + scale 0.96->1 + blur 8px->0px), the
//      literal recipe the brief names ("service name and price slide up with the ENTER
//      RECIPE"). Note: the locked recipe's own three properties are opacity+scale+blur, no
//      y-translate exists in the exported primitive (checked app/[locale]/_components/
//      primitives/motion.ts before writing this; "slide up" in the brief is not a literal
//      instruction to invent a y-offset the locked recipe doesn't have, so none is added).
//      Exit runs the SAME duration on `thud` (accelerate) per THE CURVE RULE
//      (motion.ts:173, "entering = glide, exiting = thud"), blur omitted on exit only: this
//      bar is `position: fixed`, and motion.ts's own useStepSwapMotion doc (lines 188-199)
//      names the exact hazard, an animated non-`none` `filter` establishes a containing
//      block for `position: fixed` DESCENDANTS. Neither DefaultBar nor ChosenBar contains a
//      fixed descendant of its own, so the enter-side blur is safe (verified by reading
//      both components below); the exit side drops it anyway as the cheaper, zero-risk copy
//      of the same discipline that primitive already applies.
//   2. SWAP (a chosen service -> a DIFFERENT chosen service, the brief's "second tap"): a
//      plain opacity cross-fade, no scale, no blur, at 300ms. This duration is READ, not
//      invented: _design-system/references/airbnb--motion.md's Measured section (f) records
//      Airbnb's `background-color`/`border-color`/`color` "swap" transition (its own label,
//      "outline-to-filled swap") at 300ms; its Port map table maps that exact row to Solen's
//      `glide` token ("Reasonable fit, sits at the top of Solen's in-place-flip range"), so
//      GLIDE_EASE (imported, not re-typed) is reused at that file's suggested 300ms rather
//      than the shipped recipe's 280ms, keeping the two motions numerically distinct as well
//      as texturally distinct (a fade only, vs a fade+scale+blur reveal).
//
// isSwap is computed by the PARENT (DirectionC.tsx), which is the one place that knows the
// PREVIOUS chosen id (a ref, read before its own effect updates it), not derived here from
// props alone.
//
// Depicts: default ink pill CTA -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (byte-identical class string, portal target, z-index and gradient fade).
// Depicts: chosen-service content swap -> NET-NEW: no existing sticky bar on this surface shows a running selection; this is Direction C's one named change.
// Depicts: name-price gap glyph -> app/[locale]/_components/salon/MetaDot.tsx (no-glyph spacer, not a middle-dot separator, per LOCKFILE A12).
// Depicts: swap-tier structure (enter/center/exit variants, distinct transitions per phase) -> app/[locale]/_components/primitives/motion.ts's useStepSwapMotion (same shape, different numbers: that primitive is for a whole-screen step swap, this is a same-size in-place content swap, so its own 0.99/260ms pair is not reused verbatim, only its enter/center/exit STRUCTURE is).
//
// mockup-ok: dropped the real bar's useCookieConsent() gate and gallery/lightbox
// suppression props, both belong to the full production page (a cookie banner, a
// full-screen gallery) that this comparison mockup does not render; noted in the build
// return under concerns rather than silently carried over.

import * as React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { Service } from "@/app/[locale]/_components/salon/_shared";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { ENTER_DURATION, GLIDE_EASE } from "@/app/[locale]/_components/primitives/motion";
import { PriceFrom } from "@/app/[locale]/_components/primitives";
import { localizedField } from "@/lib/i18n/localized-field";
import { useLocale } from "next-intl";

// LOCKFILE §4's fourth easing token (cited via _design-system/references/airbnb--motion.md's
// own port table, "Solen's four locked easing tokens"); not exported by motion.ts, so
// re-declared here at the identical locked value rather than imported.
const THUD_EASE = [0.7, 0, 0.84, 0] as const;
// Measured Airbnb swap duration, see header comment case 2.
const SWAP_DURATION = 0.3;

const REVEAL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.96, filter: "blur(8px)", transition: { duration: ENTER_DURATION, ease: GLIDE_EASE } },
  center: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: ENTER_DURATION, ease: GLIDE_EASE } },
  exit: { opacity: 0, scale: 0.96, filter: "blur(0px)", transition: { duration: ENTER_DURATION, ease: THUD_EASE } },
};

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, transition: { duration: SWAP_DURATION, ease: GLIDE_EASE } },
  center: { opacity: 1, transition: { duration: SWAP_DURATION, ease: GLIDE_EASE } },
  exit: { opacity: 0, transition: { duration: SWAP_DURATION, ease: THUD_EASE } },
};

const REDUCED_VARIANTS: Variants = {
  enter: { opacity: 1, scale: 1, filter: "blur(0px)" },
  center: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

export function StickyBarC({
  locale,
  slug,
  chosen,
  isSwap,
}: {
  locale: string;
  slug: string;
  chosen: Service | null;
  isSwap: boolean;
}) {
  const bookingHref = chosen
    ? `/${locale}/salon/${slug}/booking?service=${chosen.id}`
    : `/${locale}/salon/${slug}/booking`;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const variants = isSwap ? SWAP_VARIANTS : REVEAL_VARIANTS;

  return ReactDOM.createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[800] bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <AnimatePresence mode="wait" initial={false}>
        {chosen ? (
          <ChosenBar key={chosen.id} href={bookingHref} service={chosen} variants={variants} />
        ) : (
          <DefaultBar key="default" href={bookingHref} variants={REVEAL_VARIANTS} />
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function DefaultBar({ href, variants }: { href: string; variants: Variants }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? REDUCED_VARIANTS : variants} initial="enter" animate="center" exit="exit">
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

function ChosenBar({ href, service, variants }: { href: string; service: Service; variants: Variants }) {
  const reduce = useReducedMotion();
  const locale = useLocale();
  // Same English rule as ServicesLead.tsx: resolve through the de/en fallback chain rather
  // than reading service.name_de unconditionally (the real page's pre-existing gap).
  const serviceName = localizedField(service as unknown as Record<string, unknown>, "name", locale);
  return (
    <motion.div
      variants={reduce ? REDUCED_VARIANTS : variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex items-center gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="font-body truncate text-[13px] font-medium text-s-ink-2">1 service selected</p>
        <p className="font-body flex items-baseline truncate text-[15px] font-semibold text-s-ink">
          <span className="truncate">{serviceName}</span>
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
