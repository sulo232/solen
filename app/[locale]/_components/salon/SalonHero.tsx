"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share } from "lucide-react";
import { HeartButton } from "../homepage/HeartButton";
import { BackButton } from "../primitives";
import type { SalonDetail } from "./_shared";
import { cn } from "@/lib/utils";
// V3-D420: FROST_GLASS promoted to a shared util (canonical "A" recipe, control-over-photo).
// Was a local const here (V3-D72); consolidated so SaveHeart / card overlays stop re-deriving it.
import { FROST_GLASS } from "@/lib/frost-glass";
import { shareOrCopy } from "@/lib/share";
import ReportButton from "@/components-legacy/discovery/ReportButton";
import { useTranslations } from "next-intl";

/**
 * SalonHero — V2-D53.3 (2026-05-11).
 *
 * Splits responsively per Fresha pattern:
 *   • Mobile: single full-bleed cover photo with overlay icons (back, share, heart)
 *   • Desktop: 3-photo gallery in a 2-col grid (1 large left ⅔ + 2 small right ⅓ stacked)
 *     with a "Alle Fotos ansehen" pill bottom-right that opens the Lightbox.
 *
 * Fallback chain:
 *   • 0 photos: placeholder block with salon's initial
 *   • 1 photo: single cover (both mobile + desktop)
 *   • 2 photos: side-by-side on desktop
 *   • 3+ photos: Fresha 3-pattern (1 large + 2 small)
 *
 * Layout shells follow the body container width (`max-w-[1180px]`) so the
 * gallery doesn't blow past the orchestrator's grid on desktop.
 */
export function SalonHero({
  salon,
  onOpenLightbox,
  onOpenGallery,
}: {
  salon: SalonDetail;
  onOpenLightbox: (startIndex: number) => void;
  onOpenGallery: () => void;
}) {
  const tBack = useTranslations("common");
  const router = useRouter();
  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  // Swipeable mobile hero (2026-06-09, owner-requested): native horizontal scroll-snap
  // carousel; the live photo index drives the "n / N" counter. Tap a photo to open the
  // lightbox. Desktop keeps the Fresha 3-photo grid below.
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
              // B4 load win: next/image for responsive srcset + AVIF/WebP + priority preload
              // on the LCP photo. Wrapper div carries the flex/snap sizing + view-transition-name
              // (fill images are position:absolute, so they can't own the flex-item sizing).
              <div
                key={i}
                className="relative h-full w-full shrink-0 snap-center bg-s-bg-sunken"
                style={i === 0 ? { viewTransitionName: `vt-salon-${salon.slug}` } : undefined}
                onClick={onOpenGallery}
              >
                <Image
                  src={u}
                  alt={`Foto ${i + 1} von ${salon.name}`}
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

        {/* V2-D53.3 polish: outline-only icons over the cover photo —
            no white pill backgrounds. White stroke + drop-shadow keeps
            them legible on any photo. Matches HeartButton's pattern so
            back/share/heart read as one consistent icon group. */}
        <BackButton
          variant="glass"
          aria-label={tBack("back")}
          label="Zurück"
          onClick={() => router.back()}
          className="absolute left-4 top-4"
        />

        <div className="absolute right-4 top-4 flex items-center gap-3">
          <button
            type="button"
            aria-label="Salon teilen"
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            className="group grid h-11 w-11 place-items-center bg-transparent focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
          >
            <span aria-hidden style={FROST_GLASS} className="grid h-[38px] w-[38px] place-items-center rounded-full transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]">
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
          {/* mockup-ok: net-new report affordance (owner ask 2026-07-25), reusing
              ReportButton's "frost" variant, a verbatim copy of the Share button's own
              frosted-glass over-photo chrome above. */}
          <ReportButton type="salon" targetId={salon.id} variant="frost" />
        </div>

        {photos.length > 1 && (
          <>
            {/* DS-10 bottom gradient band (LOCKFILE §11): dots survive bright photos,
                the photo itself stays clean. Replaces the lone "n / N" counter chip
                (owner-approved every-state PDP mockup, 2026-06-11). */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent"
            />
            {/* §16.2 gallery position dots — active stretches to 18px. Swiping the
                photos drives them; tapping a photo still opens the lightbox, so the
                gesture is never the only way in (§16.1 duality). */}
            <div
              className="absolute inset-x-0 bottom-8 z-[1] flex justify-center gap-[5px]"
              role="tablist"
              aria-label={`Foto ${activeIndex + 1} von ${photos.length}`}
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

      {/* DESKTOP — 3-photo gallery (or fallback) */}
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
    // V3-D202 (A2): rounded-none → rounded-card-lg token; opacity → s-ink-disabled.
    // V3-D336 (T4 conservative): rounded-card-lg → rounded-none on hero placeholder per LOCKFILE §11 non-negotiable "all images use border-radius 0 (flush rectangles)".
    return (
      <div className="grid aspect-[16/7] w-full place-items-center bg-s-bg-sunken">
        <span className="font-display text-[140px] font-bold text-s-ink-disabled">
          {salonName.charAt(0)}
        </span>
      </div>
    );
  }

  if (photos.length === 1) {
    // layout-geometry-09: this hero frame (and the 66/33/33 split frames below) still default
    // to CSS object-position:center (blind center), unlike SalonImageGallery's square grid /
    // SalonPortfolio's square grid, which both now use the owner-approved object-top crop anchor
    // (TASTE_LOG.md:326, ig4, 2026-07-16). Hero frames are a different aspect ratio (16:7 / 2:1)
    // and the single most prominent above-the-fold photo, so generalizing the same object-top
    // value here without a fresh owner look is a visible imagery-treatment change on the highest-
    // traffic surface, not a same-shape apply like the two grids above; left as object-cover
    // (unchanged) pending that decision, flagged instead of silently changed.
    return (
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative block aspect-[16/7] w-full overflow-hidden rounded-none bg-s-bg-sunken transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide"
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
            className="relative overflow-hidden bg-s-bg-sunken transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide"
          >
            <Image src={u} alt={`${salonName} – Foto ${i + 1}`} fill sizes="(max-width: 1180px) 50vw, 590px" className="object-cover" priority={i === 0} /> {/* copy-ok em-dash-ok */}
          </button>
        ))}
      </div>
    );
  }

  // 3+ photos - Fresha pattern: 1 large left (col-span-2 row-span-2) + 2 small right
  return (
    <div className="relative grid aspect-[16/7] w-full grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-none">
      <button
        type="button"
        onClick={onOpenGallery}
        className={cn("relative col-span-2 row-span-2 overflow-hidden bg-s-bg-sunken transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide")}
      >
        <Image src={photos[0]} alt={salonName} fill sizes="(max-width: 1180px) 66vw, 786px" className="object-cover" priority /> {/* copy-ok */}
      </button>
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative overflow-hidden bg-s-bg-sunken transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide"
      >
        <Image src={photos[1]} alt={`${salonName} – Foto 2`} fill sizes="(max-width: 1180px) 33vw, 393px" className="object-cover" /> {/* copy-ok em-dash-ok */}
      </button>
      <button
        type="button"
        onClick={onOpenGallery}
        className="relative overflow-hidden bg-s-bg-sunken transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide"
      >
        <Image src={photos[2]} alt={`${salonName} – Foto 3`} fill sizes="(max-width: 1180px) 33vw, 393px" className="object-cover" /> {/* copy-ok em-dash-ok */}
        {photos.length > 3 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onOpenGallery();
            }}
            className="font-body absolute bottom-3 right-3 z-[1] rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-s-ink shadow-md transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
          >
            Alle Fotos ansehen
          </span>
        )}
      </button>
    </div>
  );
}
