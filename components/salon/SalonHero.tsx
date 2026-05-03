"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, Share2, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import PhotoLightbox from "@/components/ui/PhotoLightbox";
import ImageFallback from "@/components/ui/ImageFallback";

/**
 * SalonHero — Q52 (locked 2026-05-02 + Phase 9 top-controls extension 2026-05-03).
 *
 * Replaces the V5-era 5-photo Airbnb grid + carousel-with-dots with the
 * locked Q52 anatomy:
 *   - Single full-bleed hero photo (~50% viewport height; users skip
 *     carousels per UX research, auto-rotate is a11y-hostile)
 *   - Top-of-photo controls per Q52: back button (left, 28px circle white-95% bg),
 *     share + heart (right, same treatment). Heart uses #FF4A6B literal love-red
 *     per Q36/SOLEN_UI #5b, NOT brand token. Renders only when handlers passed.
 *   - Optional `topBadges` (Solen Favorit / Top bewertet etc.) — small
 *     Anton-uppercase chips above the salon name in the bottom-fade overlay.
 *   - Optional `offPeakBadge` — small chip top-left INSIDE the photo (above
 *     back button isn't possible — slotted just under the back button column).
 *   - Bottom-fade overlay carrying eyebrow + Anton headline (caller provides
 *     via overlayContent prop — typically the Q48 SignatureLockup).
 *   - Below the photo: thumbnail strip of N visible (3 default) + `+N` overflow tile
 *   - Tap any thumbnail or `+N` → fullscreen gallery (PhotoLightbox)
 *
 * NO carousel hero. NO auto-rotate. NO dot indicators.
 *
 * Caller is responsible for the meta strip BELOW this component (Q52 says
 * hero only carries photo + bottom-fade eyebrow/Anton; meta `★ rating ·
 * distance · open-state` is below).
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
  /** Optional back-button handler. When provided, renders the back chip
   *  (28px circle white-95% bg, ChevronLeft) at top-left of the photo. */
  onBack?: () => void;
  /** Optional share-button handler. When provided, renders share chip top-right. */
  onShare?: () => void;
  /** Optional favorite toggle. When provided, renders heart chip top-right.
   *  Heart fills with #FF4A6B love-red when isFavorited per SOLEN_UI #5b. */
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
  /** Optional small chip rendered top-left INSIDE the photo (under the back
   *  button column) — typically off-peak deal text like "−40% Heute". */
  offPeakBadge?: { text: string; tone?: "brand" | "amber" };
  /** Optional auto-badges (Solen Favorit, Top bewertet, etc.) rendered
   *  above the headline inside the bottom-fade overlay. */
  topBadges?: { text: string }[];
}

export default function SalonHero({
  photos,
  salonName,
  overlayContent,
  thumbnailCount = 3,
  onBack,
  onShare,
  onFavoriteToggle,
  isFavorited = false,
  offPeakBadge,
  topBadges,
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
              {(overlayContent || (topBadges && topBadges.length > 0)) && (
                <div className="absolute inset-x-0 bottom-0 px-5 sm:px-7 pt-16 pb-6"
                     style={{ background: "linear-gradient(to top, rgba(26,18,9,.85) 0%, rgba(26,18,9,.55) 45%, transparent 100%)" }}
                >
                  <div className="text-white">
                    {/* Auto-badges (Solen Favorit, Top bewertet) above the headline */}
                    {topBadges && topBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {topBadges.map((b) => (
                          <span
                            key={b.text}
                            className="font-heading uppercase text-white"
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.04em",
                              padding: "3px 8px",
                              borderRadius: 99,
                              background: "rgba(255,255,255,0.18)",
                              backdropFilter: "blur(6px)",
                              WebkitBackdropFilter: "blur(6px)",
                            }}
                          >
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                    {overlayContent}
                  </div>
                </div>
              )}
            </button>
          ) : (
            <ImageFallback salonName={salonName} className="absolute inset-0" />
          )}

          {/* Top-of-photo controls — Q52 spec.
              Rendered OUTSIDE the photo button so they're not part of the
              "open photo" tap target. z-[3] sits above the bottom-fade overlay. */}
          {(onBack || onShare || onFavoriteToggle || offPeakBadge) && (
            <div className="absolute inset-x-0 top-0 z-[3] pointer-events-none">
              <div className="flex items-start justify-between p-3 sm:p-4">
                {/* LEFT column: back button + optional off-peak badge below */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      aria-label={t("backToList") || "Zurück"}
                      className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.92] hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
                      style={{
                        width: 36,
                        height: 36,
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 8px rgba(26,18,9,0.18)",
                      }}
                    >
                      <ChevronLeft size={18} className="text-s-ink" aria-hidden />
                    </button>
                  )}
                  {offPeakBadge && (
                    <span
                      className="font-body font-bold uppercase"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        padding: "5px 10px",
                        borderRadius: 99,
                        background: offPeakBadge.tone === "amber" ? "#F3A864" : "#1B4D1B",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 8px rgba(26,18,9,0.18)",
                      }}
                    >
                      {offPeakBadge.text}
                    </span>
                  )}
                </div>

                {/* RIGHT column: share + heart */}
                <div className="flex items-start gap-2 pointer-events-auto">
                  {onShare && (
                    <button
                      type="button"
                      onClick={onShare}
                      aria-label={t("shareProfile") || "Teilen"}
                      className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.92] hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
                      style={{
                        width: 36,
                        height: 36,
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 8px rgba(26,18,9,0.18)",
                      }}
                    >
                      <Share2 size={16} className="text-s-ink" aria-hidden />
                    </button>
                  )}
                  {onFavoriteToggle && (
                    <button
                      type="button"
                      onClick={onFavoriteToggle}
                      aria-pressed={isFavorited}
                      aria-label={isFavorited ? (t("removeFromFavorites") || "Aus Favoriten entfernen") : (t("addToFavorites") || "Zu Favoriten")}
                      className="flex items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.92] hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
                      style={{
                        width: 36,
                        height: 36,
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 8px rgba(26,18,9,0.18)",
                      }}
                    >
                      {/* Q36 + SOLEN_UI #5b: heart save state uses literal #FF4A6B love-red, NOT brand. */}
                      <Heart
                        size={16}
                        strokeWidth={2}
                        style={isFavorited ? { fill: "#FF4A6B", color: "#FF4A6B" } : { fill: "transparent", color: "#1A1209" }}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
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
