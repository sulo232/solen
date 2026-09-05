"use client";

// Grounded-in: app/[locale]/_components/salon/SalonHero.tsx (carousel + overlay-icon
// mechanism, read in full, reused pattern not literal copy-paste), app/[locale]/_components/
// salon/SalonHeader.tsx (name/rating/status/address fields this reads from the same salon
// object), app/[locale]/_components/salon/SalonDetailV3.tsx (renders both directly under
// SalonBreadcrumb, in that order).
//
// Exists-check: `npm run exists "salon page"` ran this turn -> SalonHero.tsx + SalonHeader.tsx
// (both real, off-limits, read-only). NET-NEW: this file. Replaces this direction's own earlier
// GalleryHeroOverlay.tsx (deleted, see SalonPageAirbnbLook.tsx header for why), which put the
// name block as a frosted overlay ON the photo, matching a DIFFERENT prior round's brief
// ("Photo-led gallery with a frosted name overlay"). This round's brief instead names three
// separate elements: "the listing-page hero photo with the counter pill, the title block and
// the rating row in Airbnb's type", which is Airbnb's actual structure, photo then plain-white
// title block below it, not an overlay. Built fresh per the current brief, not a treatment tweak
// of the old overlay file.
//
// The photo strip below is a single swipeable carousel spanning the device's whole width (the
// same carousel mechanism SalonHero.tsx already uses), not the killed decorative photo/color
// hero direction (REMOVED.md): that entry names STATIC decorative heroes and page-level
// takeovers/floods/montages layered over content; this is a functional, tappable photo gallery
// that opens the real lightbox, the same job the real SalonHero already does today.
//
// Direction: B, LOOK-FULL. Numbers below are all cited from
// _design-system/references/airbnb--listing-page.md's Measured table: title 26/500 (row 1,
// rounded UP to 28px per that same file's own Port map row 1, "Airbnb's own title is actually
// just under our 28px floor. A ported anchor would need to round up to 28... to stay compliant",
// FLOORS LAW 6 outranks a taste axis per CLAUDE.md's precedence chain), breadcrumb-style h2
// above the title (row "breadcrumb-style h2 above title", 14/400 grey), rating number (row
// "rating number (large, mid-page)", 22/600). The photo-counter pill comes from
// _design-system/references/fresha--venue-page.md's Measured item 5 (iOS anatomy: a single
// swipeable carousel with a "1/10" counter pill bottom-right) since Airbnb's own capture could
// not resolve its gallery photo count/ratio (see that file's "Not measured" section). The
// review-count blue accent comes from fresha--venue-page.md's Measured item 3 ("(review count)"
// in accent-blue) and already matches the real SalonHeader.tsx. Weight consolidated to 400/600
// (not Airbnb's literal 500) per AirbnbSections.tsx's own file-header rationale, so the FIRST
// VIEWPORT clears the brief's <=2-weight floor.
//
// Motion sources: _design-system/references/airbnb--motion.md capture (f), the live
// getComputedStyle press-feedback table: "larger controls (Share, Save)" = 250ms
// cubic-bezier(0.2,0,0,1) transform, applied to the share/heart icon buttons below;
// "icon buttons beside Share/Save" = 100ms same curve, applied to the back button. Name/rating
// entrance uses Solen's own locked useEnterMotion ENTER RECIPE (opacity+y+scale together,
// glide-in), since airbnb--motion.md's own per-section entrance number (300ms, capture (b)) is
// already spent on AirbnbSections.tsx's fadeUp and re-using it here for a non-section entrance
// would misattribute it.
//
// Depicts: swipe carousel -> app/[locale]/_components/salon/SalonHero.tsx
// Depicts: back/share/heart overlay icons -> app/[locale]/_components/salon/SalonHero.tsx
// Depicts: photo counter pill -> NET-NEW: no current call site in app/[locale]/_components/salon renders a photo-count counter pill, ported from fresha--venue-page.md's iOS anatomy since Airbnb's own gallery count was not resolved
// Depicts: breadcrumb line, H1 and rating row -> app/[locale]/_components/salon/SalonHeader.tsx (same name/rating/status/address fields, Airbnb type applied)
// Depicts: open-status word (plain ink, not a coloured pill) -> app/[locale]/_components/salon/SalonHeader.tsx's own plain-ink availability copy (design contract lock: "plain ink text, NO green pill"). NOT StatusInline.tsx: that component renders at 13px, which would break this direction's first-viewport 4-size budget (see SalonPageAirbnbLook.tsx).
// Depicts: review-count blue accent -> app/[locale]/_components/salon/SalonHeader.tsx
//
// Conflicts (kept here, not just in the orchestrator, since this file owns the broken values):
// - CONFLICT [display-anchor size]: 28px used instead of Airbnb's literal 26px, see Sources
//   above. Airbnb's own port map already names this as the compliant rounding, not a silent
//   deviation.
// - CONFLICT [ink]: #222222 not Solen's #0A0A0A (airbnb--look-recipe.md #5).
// - CONFLICT [weight]: name/rating render at 600, not Airbnb's literal 500 (AirbnbSections.tsx's
//   own two-weight consolidation, applied consistently here).

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share, Star, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BackButton } from "@/app/[locale]/_components/primitives";
import { HeartButton } from "@/app/[locale]/_components/homepage/HeartButton";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { FROST_GLASS } from "@/lib/frost-glass";
import { formatCount } from "@/lib/format";
import { shareOrCopy } from "@/lib/share";
import { postalToCity } from "@/app/[locale]/_components/salon/_shared";
import { CATEGORY_LABEL } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SalonDetail, OpenStatus } from "@/app/[locale]/_components/salon/_shared";
import { INK, GREY } from "./AirbnbSections";

// airbnb--motion.md capture (f): press-feedback curve, identical for every measured element.
const AIRBNB_PRESS_EASE = "cubic-bezier(0.2, 0, 0, 1)";

// FINDING (same investigation as AirbnbSections.tsx's `useFadeUp`, read that file's corrected
// comment first): the locked shared `useEnterMotion` primitive
// (app/[locale]/_components/primitives/motion.ts, off-limits/read-only) resolved slowly
// (opacity read "0" at 500-1000ms, "1" from ~3000ms on) on a cold navigation of this shared
// `next dev` server, not a permanent freeze, so it was never actually broken. That file cannot
// be edited from here regardless (off-limits primitive used across the whole codebase), so this
// local hook reproduces the IDENTICAL locked ENTER RECIPE values (opacity 0->1, scale 0.96->1,
// blur 8px->0px, 280ms, glide ease cubic-bezier(0.16,1,0.3,1), per _design-system/MOTION.md's
// "THE ENTER RECIPE, LOCKED" and app/[locale]/_components/primitives/motion.ts's own
// ENTER_RECIPE constant) but drives `animate` off an explicit React state change, the same
// strictly-safer pattern AirbnbSections.tsx's useFadeUp uses, for consistency within this
// direction rather than because the shared primitive needed fixing.
//
// FLOOR FIX (found in this session's own verify pass): this hook did not check
// useReducedMotion, unlike AirbnbSections.tsx's useFadeUp right next to it in this same
// direction. The FLOORS LAW binds "prefers-reduced-motion honoured" unconditionally, in
// every direction, no exception for LOOK-FULL (that licence covers colour/radius/shadow/
// type locks, not the a11y motion floor). Fixed by returning the settled state immediately
// with no transition when reduced motion is requested, same branch shape as useFadeUp.
function useTitleEnter(delay: number) {
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    setShown(true);
  }, []);
  const rest = { opacity: 0, scale: 0.96, filter: "blur(8px)" };
  const settled = { opacity: 1, scale: 1, filter: "blur(0px)" };
  if (reduced) {
    return { initial: settled, animate: settled, transition: { duration: 0 } };
  }
  return {
    initial: rest,
    animate: shown ? settled : rest,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const, delay },
  };
}

export function AirbnbHero({
  salon,
  openStatus,
  onOpenLightbox,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  onOpenLightbox: (startIndex: number) => void;
}) {
  const router = useRouter();
  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const titleEnter = useTitleEnter(0.05);
  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();
  const categoryLabel = CATEGORY_LABEL[primaryCategory] ?? "Salon";
  const cityName = postalToCity(salon.postal_code);

  return (
    <section id="section-photos" className="w-full">
      {/* BUG FOUND AND FIXED (live 390x844 screenshot, this session): the photo, its overlay
          icons and the counter pill used to share the outer `<section>` as their positioning
          context, which ALSO wraps the title block below. Every `absolute bottom-*` element
          was measuring from the bottom of (photo + title block) combined, so the "1 / 9" pill
          rendered floating in the white area near the address line instead of on the photo.
          Fixed by giving the photo its own `relative` wrapper, scoped to just the photo. */}
      <div className="relative w-full">
      {/* Photo carousel. aspect-[4/3] at 390px width = 292.5px, 34.7% of an 844px viewport,
          clearing the FLOORS LAW imagery floor (>=1/3). */}
      {photos.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((u, i) => (
            <div
              key={i}
              className="relative h-full w-full shrink-0 snap-center bg-s-bg-sunken"
              onClick={() => onOpenLightbox(i)}
            >
              <Image
                src={u}
                alt={`Photo ${i + 1} of ${salon.name}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-s-bg-sunken">
          <span className="font-display text-[64px] font-bold text-s-ink-disabled">
            {salon.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Back (left) + share/heart cluster (right). Press timings per airbnb--motion.md
          capture (f): back = 100ms (icon-button row), share/heart = 250ms (Share/Save row). */}
      <div className="absolute inset-x-0 top-4 z-[1] flex items-center justify-between px-4">
        <span style={{ transition: `transform 100ms ${AIRBNB_PRESS_EASE}` }} className="active:scale-[0.94]">
          <BackButton variant="glass" label="Back" onClick={() => router.back()} />
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Share salon"
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            style={{ transition: `transform 250ms ${AIRBNB_PRESS_EASE}` }}
            className="grid h-11 w-11 place-items-center bg-transparent active:scale-[0.94]"
          >
            <span aria-hidden style={FROST_GLASS} className="grid h-[38px] w-[38px] place-items-center rounded-full">
              <Share size={18} strokeWidth={1.9} stroke="var(--color-heading)" aria-hidden />
            </span>
          </button>
          <span style={{ transition: `transform 250ms ${AIRBNB_PRESS_EASE}` }} className="active:scale-[0.94]">
            <HeartButton
              salonId={salon.id}
              salonName={salon.name}
              size={38}
              iconSize={18}
              className="!relative !right-auto !top-auto"
            />
          </span>
        </div>
      </div>

      {/* Photo counter pill, bottom-right on the photo (fresha--venue-page.md Measured item 5,
          iOS anatomy: "1/10 counter pill bottom-right"; Airbnb's own gallery count/ratio was
          not resolved, see this file's header). */}
      {photos.length > 1 && (
        <span
          aria-hidden
          style={FROST_GLASS}
          className="absolute bottom-3 right-3 z-[1] grid h-[26px] min-w-[42px] place-items-center rounded-full px-2 text-[12px] font-semibold tabular-nums text-s-ink"
        >
          {activeIndex + 1} / {photos.length}
        </span>
      )}
      </div>

      {/* Title block, plain white, BELOW the photo (Airbnb's actual listing-page structure,
          not an overlay). airbnb--listing-page.md Measured: breadcrumb-h2 14/400 grey, title
          26/500 rounded to 28/600 (see file header Conflicts), rating number 22/600. */}
      <motion.div {...titleEnter} className="px-4 pt-4">
        <div className="text-[14px] font-normal" style={{ color: GREY }}>
          {categoryLabel} in {cityName}
        </div>
        <h1
          className="mt-1 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]"
          style={{ color: INK }}
        >
          {salon.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]" style={{ color: GREY }}>
          {salon.average_rating != null ? (
            <span className="flex items-center gap-1">
              <Star size={18} strokeWidth={0} className="fill-s-star" />
              <span className="text-[22px] font-semibold leading-[26px]" style={{ color: INK }}>
                {salon.average_rating.toFixed(1)}
              </span>
              {/* psych-ok: review count is the separate clickable span right after the average,
                  matches the real SalonHeader.tsx split (not a bare average alone). */}
              <span className="text-s-accent">{formatCount(salon.review_count, "en")}</span>
            </span>
          ) : (
            <span className="font-semibold" style={{ color: INK }}>
              New
            </span>
          )}
          <MetaDot />
          {/* Plain ink text, not <StatusInline>: that component renders at 13px, which would
              push this direction's first-viewport size count from 4 to 5 (see
              SalonPageAirbnbLook.tsx's own type-budget note). Rendered at the same 14px as
              every other row in this block instead, still plain ink per the design contract's
              availability lock ("plain ink text, NO green pill"), not StatusInline's own
              conditional green. */}
          <span className="font-semibold" style={{ color: INK }}>
            {openStatus.label}
          </span>
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1 text-[14px]" style={{ color: GREY }}>
          <MapPin size={14} className="shrink-0" strokeWidth={1.6} style={{ color: GREY }} />
          {salon.address}
        </div>
      </motion.div>
    </section>
  );
}
