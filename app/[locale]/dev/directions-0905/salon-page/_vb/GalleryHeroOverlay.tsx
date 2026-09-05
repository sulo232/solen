"use client";

// Exists-check: `npm run exists directions-0905` -> DirectionFrame (reused, not forked).
// `npm run exists SalonHero` -> app/[locale]/_components/salon/SalonHero.tsx (real,
// off-limits, read-only). This file is a NEW component, not an edit of SalonHero: per
// the brief's "COPY that component into your own _v<letter>/ folder, rename it, and
// change the copy" instruction, this borrows SalonHero's mobile scroll-snap carousel
// mechanism (reused pattern, not a literal copy-paste) and changes the anatomy.
//
// Direction: the salon name/rating/status/address block that SalonHeader normally
// renders BELOW the hero, in white, now sits ON the photo's bottom edge as a
// frosted-glass panel, and a "1 / N" counter pill is added next to the dot indicators.
//
// Grounded-in: app/[locale]/_components/salon/SalonHero.tsx (carousel + overlay-icon
// mechanism), app/[locale]/_components/salon/SalonHeader.tsx (name/rating/status/address
// copy and tokens), rendered by app/[locale]/_components/salon/SalonDetailV3.tsx and
// app/[locale]/salon/[slug]/page.tsx.
//
// Depicts: swipe carousel -> app/[locale]/_components/salon/SalonHero.tsx
// Depicts: back/share/heart overlay icons -> app/[locale]/_components/salon/SalonHero.tsx
// Depicts: gradient band + dot indicators -> app/[locale]/_components/salon/SalonHero.tsx
// Depicts: name/rating/status/address copy and tokens -> app/[locale]/_components/salon/SalonHeader.tsx
// Depicts: frosted-glass name panel over the photo -> NET-NEW: this direction's brief names that placement as its one idea
// Depicts: 1/N counter pill -> NET-NEW: no current call site renders a photo-count counter pill
//
// Conflicts:
// - CONFLICT [counter pill vs an existing dated SalonHero decision]: SalonHero.tsx's own
//   code comment records that a lone "n / N" counter chip was removed in favour of
//   dots-only on an owner-approved call ("DS-10 bottom gradient band... Replaces the lone
//   'n / N' counter chip"). This direction's brief explicitly names "dot indicator and
//   counter" together as the one idea to build, so both are built here as instructed;
//   flagged for the owner to reconcile against that earlier call, not silently resolved.
// - CONFLICT [frosted-glass body copy]: FROST_GLASS (lib/frost-glass.ts) is documented as
//   a control-elevation treatment for icon buttons over a photo, not previously used to
//   carry an H1 + meta text block. The brief names this exact placement ("the name block
//   sitting over the gallery's bottom edge on frosted glass"), so it is built as asked;
//   flagged because it is a new application of an existing token, not a pre-approved copy.
//
// Airbnb source note: airbnb--listing-page.md's own "Not measured" section states the
// gallery photo count/aspect ratio was NOT resolved live (the hero paints via a
// background-image div, not a paintable <img>, so getBoundingClientRect returned 0x0).
// No invented Airbnb pixel value is used here. The aspect ratio below (4:5) is a Solen
// judgment call sized only off the FLOORS LAW imagery floor (>=1/3 of a 390x844
// viewport), not an Airbnb measurement, said plainly rather than mislabeled as
// "measured". airbnb--motion.md does not exist on disk (checked, absent); entrance
// timing below uses Solen's own locked ENTER RECIPE
// (app/[locale]/_components/primitives/motion.ts) instead of an unmeasured Airbnb number.

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { BackButton, RatingStars } from "@/app/[locale]/_components/primitives";
import { HeartButton } from "@/app/[locale]/_components/homepage/HeartButton";
import { StatusInline } from "@/app/[locale]/_components/salon/StatusInline";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { FROST_GLASS } from "@/lib/frost-glass";
import { formatCount } from "@/lib/format";
import { shareOrCopy } from "@/lib/share";
import { useEnterMotion } from "@/app/[locale]/_components/primitives/motion";
import type { SalonDetail, OpenStatus } from "@/app/[locale]/_components/salon/_shared";

export function GalleryHeroOverlay({
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

  const nameEnter = useEnterMotion(0);
  const chromeEnter = useEnterMotion(0.06);

  return (
    <section id="section-photos" className="relative w-full">
      {photos.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        // Never expected to render for muse-beauty-studio (9 real photos); same fallback
        // idiom as SalonHero.tsx, sized to the nearest locked type-scale role (64px).
        <div className="grid aspect-[4/5] w-full place-items-center bg-s-bg-sunken">
          <span className="font-display text-[64px] font-bold text-s-ink-disabled">
            {salon.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Back (left) + share/heart/counter cluster (right), same frosted-glass icon
          idiom SalonHero already uses over a photo. */}
      <motion.div {...chromeEnter} className="absolute inset-x-0 top-4 z-[1] flex items-center justify-between px-4">
        <BackButton variant="glass" label="Back" onClick={() => router.back()} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Share salon"
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            className="group grid h-11 w-11 place-items-center bg-transparent"
          >
            <span
              aria-hidden
              style={FROST_GLASS}
              className="grid h-[38px] w-[38px] place-items-center rounded-full transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]"
            >
              <Share size={18} strokeWidth={1.9} stroke="var(--color-heading)" aria-hidden />
            </span>
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            size={38}
            iconSize={18}
            className="!relative !right-auto !top-auto"
          />
          {photos.length > 1 && (
            <span
              aria-hidden
              style={FROST_GLASS}
              className="grid h-[38px] min-w-[46px] place-items-center rounded-full px-2 text-[12px] font-semibold tabular-nums text-s-ink"
            >
              {activeIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      </motion.div>

      {/* Dot indicators, centred just above the frosted name panel, still on the photo. */}
      {photos.length > 1 && (
        <div
          className="absolute inset-x-0 z-[1] flex justify-center gap-[5px]"
          style={{ bottom: "132px" }}
          role="tablist"
          aria-label={`Photo ${activeIndex + 1} of ${photos.length}`}
        >
          {photos.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={
                i === activeIndex
                  ? "h-[6px] w-[18px] rounded-full bg-white transition-all duration-200 ease-glide"
                  : "h-[6px] w-[6px] rounded-full bg-white/55 transition-all duration-200 ease-glide"
              }
            />
          ))}
        </div>
      )}

      {/* Gradient band under the frosted panel so the panel's own edge still reads
          against a bright photo, same DS-10 idiom SalonHero uses for its dots. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-black/25 to-transparent"
      />

      {/* Frosted-glass name block, sitting ON the gallery's bottom edge (this
          direction's one idea). Same copy/tokens as SalonHeader, moved here. */}
      <motion.div
        {...nameEnter}
        style={FROST_GLASS}
        className="absolute inset-x-0 bottom-0 z-[1] px-4 pb-4 pt-5"
      >
        <h1 className="font-display text-[clamp(30px,2.8vw,34px)] font-semibold leading-[1.1] tracking-[-0.02em] text-s-ink">
          {salon.name}
        </h1>
        <div className="font-body mt-2 space-y-1.5 text-[14px] text-s-ink-2 md:text-[15px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {salon.average_rating != null ? (
              <strong className="font-semibold text-s-ink">
                <RatingStars value={salon.average_rating} size="md" />{/* psych-ok: count is the separate clickable span right after (matches real SalonHeader.tsx split, not a bare average) */}
              </strong>
            ) : (
              <strong className="font-semibold text-s-ink">&mdash;</strong>
            )}
            <span className="text-s-accent">{formatCount(salon.review_count, "en")}</span>
            <MetaDot />
            <StatusInline isOpen={openStatus.isOpen} label={openStatus.label} size="md" />
          </div>
          <div className="inline-flex items-center gap-1 text-s-ink-2">
            <MapPin size={14} className="shrink-0 text-s-ink-2" strokeWidth={1.6} />
            {salon.address}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
