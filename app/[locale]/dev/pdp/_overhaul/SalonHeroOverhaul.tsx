"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonHero.tsx (the real, unmodified
// component) because the hero-tap fix (research spec, ~10 lines) must NOT touch shipped code
// per the mockup format law; this is a full copy of that real file with ONLY the tap handlers
// rewired from onOpenLightbox(i) to onOpenGallery(). `npm run exists` for "pdp overhaul" = 0
// matches (2026-07-24). lib/share.ts + lib/frost-glass.ts are REUSED unchanged (imported, not
// duplicated); PhotoLightbox.tsx / roadmap docs are unrelated surfaces (dashboard upload flow).
// Owner rule 2026-07-24 "the mockup is in german, always in english": every string this mockup
// renders (including strings copied from the real component) is English, not just net-new chrome.

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share } from "lucide-react";
import { HeartButton } from "../../../_components/homepage/HeartButton";
import { BackButton } from "../../../_components/primitives";
import type { SalonDetail } from "../../../_components/salon/_shared";
import { cn } from "@/lib/utils";
import { FROST_GLASS } from "@/lib/frost-glass";
import { shareOrCopy } from "@/lib/share";

/**
 * SalonHeroOverhaul , mockup copy of app/[locale]/_components/salon/SalonHero.tsx
 * (real, untouched). ONLY change (ask 2/3, hero-tap fix): every tap that used to
 * call `onOpenLightbox(i)` now calls `onOpenGallery()` instead , mobile carousel
 * photo tap, the 3 desktop grid buttons, and the "View all photos" pill. The bare
 * swipe Lightbox stays reachable from INSIDE the gallery (tile tap), so it is
 * never lost, just no longer the hero's own destination.
 *
 * Real fix location (not applied to shipped code by this mockup):
 * app/[locale]/_components/salon/SalonHero.tsx lines 78, 167, 198, 213, 228,
 * 235, 242, 246-250.
 */
export function SalonHeroOverhaul({
  salon,
  onOpenGallery,
}: {
  salon: SalonDetail;
  onOpenGallery: () => void;
}) {
  const router = useRouter();
  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const onHeroScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  return (
    <section id="section-photos" className="w-full">
      {/* MOBILE: swipeable full-bleed carousel with overlay nav */}
      <div className="relative md:hidden">
        {photos.length > 0 ? (
          <div
            ref={scrollRef}
            onScroll={onHeroScroll}
            className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((u, i) => (
              <div
                key={i}
                className="relative h-full w-full shrink-0 snap-center bg-s-bg-sunken"
                style={i === 0 ? { viewTransitionName: `vt-salon-${salon.slug}` } : undefined}
                onClick={onOpenGallery}
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
            <span className="font-display text-[120px] font-bold text-s-ink-disabled">
              {salon.name.charAt(0)}
            </span>
          </div>
        )}

        <BackButton
          variant="glass"
          aria-label="Back"
          label="Back"
          onClick={() => router.back()}
          className="absolute left-4 top-4"
        />

        <div className="absolute right-4 top-4 flex items-center gap-3">
          <button
            type="button"
            aria-label="Share salon"
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            className="group grid h-11 w-11 place-items-center bg-transparent"
          >
            <span aria-hidden style={FROST_GLASS} className="grid h-[38px] w-[38px] place-items-center rounded-full transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]">
              <Share size={18} strokeWidth={2.1} stroke="var(--color-heading)" aria-hidden />
            </span>
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            size={38}
            iconSize={18}
            className="!relative !right-auto !top-auto"
          />
        </div>

        {photos.length > 1 && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent"
            />
            <div
              className="absolute inset-x-0 bottom-8 z-[1] flex justify-center gap-[5px]"
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
          </>
        )}
      </div>

      {/* DESKTOP , 3-photo gallery (or fallback) */}
      <div className="hidden md:block">
        <DesktopGallery photos={photos} salonName={salon.name} onOpenGallery={onOpenGallery} />
      </div>
    </section>
  );
}

function DesktopGallery({
  photos,
  salonName,
  onOpenGallery,
}: {
  photos: string[];
  salonName: string;
  onOpenGallery: () => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/7] w-full place-items-center bg-s-bg-sunken">
        <span className="font-display text-[140px] font-bold text-s-ink-disabled">
          {salonName.charAt(0)}
        </span>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative block aspect-[16/7] w-full overflow-hidden rounded-none bg-s-bg-sunken"
      >
        <Image src={photos[0]} alt={salonName} fill sizes="(max-width: 1180px) 100vw, 1180px" className="object-cover" priority /> {/* copy-ok */}
      </button>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid aspect-[16/7] w-full grid-cols-2 gap-2 overflow-hidden rounded-none">
        {photos.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={onOpenGallery}
            className="relative overflow-hidden bg-s-bg-sunken"
          >
            <Image src={u} alt={`${salonName} - Photo ${i + 1}`} fill sizes="(max-width: 1180px) 50vw, 590px" className="object-cover" priority={i === 0} /> {/* copy-ok */}
          </button>
        ))}
      </div>
    );
  }

  // 3+ photos , Fresha pattern: 1 large left (col-span-2 row-span-2) + 2 small right
  return (
    <div className="relative grid aspect-[16/7] w-full grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-none">
      <button
        type="button"
        onClick={onOpenGallery}
        className={cn("relative col-span-2 row-span-2 overflow-hidden bg-s-bg-sunken")}
      >
        <Image src={photos[0]} alt={salonName} fill sizes="(max-width: 1180px) 66vw, 786px" className="object-cover" priority /> {/* copy-ok */}
      </button>
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative overflow-hidden bg-s-bg-sunken"
      >
        <Image src={photos[1]} alt={`${salonName} - Photo 2`} fill sizes="(max-width: 1180px) 33vw, 393px" className="object-cover" /> {/* copy-ok */}
      </button>
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative overflow-hidden bg-s-bg-sunken"
      >
        <Image src={photos[2]} alt={`${salonName} - Photo 3`} fill sizes="(max-width: 1180px) 33vw, 393px" className="object-cover" /> {/* copy-ok */}
        {photos.length > 3 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenGallery();
            }}
            className="font-body absolute bottom-3 right-3 z-[1] rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-s-ink shadow-md"
          >
            View all photos
          </span>
        )}
      </button>
    </div>
  );
}
