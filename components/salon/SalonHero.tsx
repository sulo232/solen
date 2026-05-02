"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import PhotoLightbox from "@/components/ui/PhotoLightbox";
import ImageFallback from "@/components/ui/ImageFallback";

/**
 * SalonHero — Q52 (locked 2026-05-02) salon detail hero.
 *
 * Replaces the V5-era 5-photo Airbnb grid + carousel-with-dots with the
 * locked Q52 anatomy:
 *   - Single full-bleed hero photo (~50% viewport height; users skip
 *     carousels per UX research, auto-rotate is a11y-hostile)
 *   - Bottom-fade overlay carrying eyebrow + Anton headline (caller
 *     provides via overlayContent prop — typically the Q48 SignatureLockup)
 *   - Below the photo: thumbnail strip of N visible (3 default) + `+N`
 *     overflow tile
 *   - Tap any thumbnail or `+N` → fullscreen gallery (Q52 D-on-tap pattern,
 *     opens the existing PhotoLightbox sheet — Phase 7 may upgrade this to
 *     a dedicated /salon/[slug]/gallery sub-page route with Q35 morph)
 *
 * NO carousel hero. NO auto-rotate. NO dot indicators.
 *
 * Caller is responsible for the SignatureLockup + meta strip rendering
 * BELOW this component (Q52 says hero only carries photo + bottom-fade
 * eyebrow/Anton; meta `★ rating · distance · open-state` is below).
 */
interface SalonHeroProps {
  photos: string[];
  salonName: string;
  /** Optional ReactNode rendered inside the bottom-fade gradient overlay
   *  (typically a SignatureLockup with eyebrow `<KATEGORIE> · <distance>` +
   *  Anton headline = salon name in white). */
  overlayContent?: React.ReactNode;
  /** Number of thumbnails to show in the strip (default 3). Anything beyond
   *  this becomes a `+N` overflow tile that also opens the lightbox. */
  thumbnailCount?: number;
}

export default function SalonHero({
  photos,
  salonName,
  overlayContent,
  thumbnailCount = 3,
}: SalonHeroProps) {
  const t = useTranslations("salonDetail");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const visibleThumbs = photos.slice(1, 1 + thumbnailCount);
  const overflowCount = Math.max(0, photos.length - 1 - thumbnailCount);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  return (
    <>
      <section
        id="section-fotos"
        className="scroll-mt-[100px] mb-6"
        aria-label={`${salonName} Fotos`}
      >
        {/* Single full-bleed hero photo — ~50% viewport height per Q52 */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[16px] overflow-hidden bg-s-bg-sunken">
          {photos[0] ? (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="absolute inset-0 w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              aria-label={`${salonName} — Foto öffnen`}
            >
              <Image
                src={photos[0]}
                alt={`${salonName} — Foto 1`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
              {/* Bottom-fade overlay — anchors the eyebrow + Anton headline.
                  Q52: amber eyebrow contrasts on dark gradient; Anton in white. */}
              {overlayContent && (
                <div className="absolute inset-x-0 bottom-0 px-5 sm:px-7 pt-16 pb-6"
                     style={{ background: "linear-gradient(to top, rgba(26,18,9,.85) 0%, rgba(26,18,9,.55) 45%, transparent 100%)" }}
                >
                  <div className="text-white">{overlayContent}</div>
                </div>
              )}
            </button>
          ) : (
            <ImageFallback salonName={salonName} className="absolute inset-0" />
          )}
        </div>

        {/* Thumbnail strip — N visible + `+N` overflow */}
        {photos.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleThumbs.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLightbox(i + 1)}
                className="relative shrink-0 w-[88px] h-[64px] sm:w-[110px] sm:h-[80px] rounded-[10px] overflow-hidden border border-s-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 transition-transform duration-150 hover:scale-[1.03]"
                aria-label={`Foto ${i + 2} öffnen`}
              >
                <Image
                  src={photo}
                  alt={`${salonName} — Foto ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="110px"
                />
              </button>
            ))}
            {overflowCount > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(1 + thumbnailCount)}
                className="relative shrink-0 w-[88px] h-[64px] sm:w-[110px] sm:h-[80px] rounded-[10px] overflow-hidden border border-s-ink/[0.06] bg-s-bg-sunken flex items-center justify-center font-heading text-[14px] uppercase text-s-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 transition-transform duration-150 hover:scale-[1.03]"
                aria-label={t("showAllPhotos", { count: photos.length })}
              >
                +{overflowCount}
              </button>
            )}
          </div>
        )}
      </section>

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        altPrefix={salonName}
      />
    </>
  );
}
