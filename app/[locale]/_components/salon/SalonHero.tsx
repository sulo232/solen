"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share } from "lucide-react";
import { HeartButton } from "../homepage/HeartButton";
import type { SalonDetail } from "./_shared";
import { cn } from "@/lib/utils";

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
}: {
  salon: SalonDetail;
  onOpenLightbox: (startIndex: number) => void;
}) {
  const router = useRouter();
  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  return (
    <section id="section-photos" className="w-full">
      {/* MOBILE — full-bleed cover with overlay nav */}
      <div className="relative md:hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-s-bg-sunken">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[0]}
              alt={`Foto von ${salon.name}`}
              className="h-full w-full object-cover"
              loading="eager"
              onClick={() => photos[0] && onOpenLightbox(0)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="font-display text-[120px] font-black text-s-ink-3/30">
                {salon.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* V2-D53.3 polish: outline-only icons over the cover photo —
            no white pill backgrounds. White stroke + drop-shadow keeps
            them legible on any photo. Matches HeartButton's pattern so
            back/share/heart read as one consistent icon group. */}
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => router.back()}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center bg-transparent transition-transform hover:scale-110 active:scale-95"
        >
          <ArrowLeft
            size={24}
            strokeWidth={2.25}
            stroke="rgba(255, 255, 255, 0.95)"
            style={{
              filter:
                "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.3))",
            }}
            aria-hidden
          />
        </button>

        <div className="absolute right-4 top-4 flex items-center gap-3">
          <button
            type="button"
            aria-label="Salon teilen"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: salon.name, url: window.location.href }).catch(() => {});
              }
            }}
            className="grid h-10 w-10 place-items-center bg-transparent transition-transform hover:scale-110 active:scale-95"
          >
            <Share
              size={22}
              strokeWidth={2.25}
              stroke="rgba(255, 255, 255, 0.95)"
              style={{
                filter:
                  "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.3))",
              }}
              aria-hidden
            />
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            className="!relative !right-auto !top-auto"
          />
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => onOpenLightbox(0)}
            className="font-body absolute bottom-4 right-4 rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-semibold text-s-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            Alle Fotos ansehen ({photos.length})
          </button>
        )}
      </div>

      {/* DESKTOP — 3-photo gallery (or fallback) */}
      <div className="hidden md:block">
        <DesktopGallery photos={photos} salonName={salon.name} onOpenLightbox={onOpenLightbox} />
      </div>
    </section>
  );
}

function DesktopGallery({
  photos,
  salonName,
  onOpenLightbox,
}: {
  photos: string[];
  salonName: string;
  onOpenLightbox: (i: number) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/7] w-full place-items-center rounded-3xl bg-s-bg-sunken">
        <span className="font-display text-[140px] font-black text-s-ink-3/25">
          {salonName.charAt(0)}
        </span>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpenLightbox(0)}
        className="block aspect-[16/7] w-full overflow-hidden rounded-3xl bg-s-bg-sunken"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt={salonName} className="h-full w-full object-cover" loading="eager" />
      </button>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid aspect-[16/7] w-full grid-cols-2 gap-2 overflow-hidden rounded-3xl">
        {photos.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => onOpenLightbox(i)}
            className="overflow-hidden bg-s-bg-sunken"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`${salonName} – Foto ${i + 1}`} className="h-full w-full object-cover" loading="eager" />
          </button>
        ))}
      </div>
    );
  }

  // 3+ photos — Fresha pattern: 1 large left (col-span-2 row-span-2) + 2 small right
  return (
    <div className="relative grid aspect-[16/7] w-full grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
      <button
        type="button"
        onClick={() => onOpenLightbox(0)}
        className={cn("col-span-2 row-span-2 overflow-hidden bg-s-bg-sunken")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt={salonName} className="h-full w-full object-cover" loading="eager" />
      </button>
      <button
        type="button"
        onClick={() => onOpenLightbox(1)}
        className="overflow-hidden bg-s-bg-sunken"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[1]} alt={`${salonName} – Foto 2`} className="h-full w-full object-cover" loading="eager" />
      </button>
      <button
        type="button"
        onClick={() => onOpenLightbox(2)}
        className="relative overflow-hidden bg-s-bg-sunken"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[2]} alt={`${salonName} – Foto 3`} className="h-full w-full object-cover" loading="eager" />
        {photos.length > 3 && (
          <span className="font-body absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-s-ink shadow-md">
            Alle Fotos ansehen
          </span>
        )}
      </button>
    </div>
  );
}
