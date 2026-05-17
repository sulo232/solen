"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { SalonDetail } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonAbout — V2-D53.3 (2026-05-11).
 *
 * About paragraph (bilingual EN + DE concatenated) followed by the
 * location section. Map is rendered as a placeholder block for now —
 * real Mapbox integration is gated on `NEXT_PUBLIC_MAPBOX_TOKEN` (deferred
 * per user "all full except the map").
 *
 * Placeholder design:
 *   • Light gray block sized to match a real map (~aspect-[16/9])
 *   • Compass icon + "Karte folgt" caption in the center
 *   • Below: address + Get directions purple link
 *
 * When the env var lands, swap the placeholder div for a `<Map />`
 * component using react-map-gl. Marker = black pill with salon rating.
 */
export function SalonAbout({ salon }: { salon: SalonDetail }) {
  const deText = salon.about_text_de ?? salon.description_de;
  const enText = salon.about_text_en ?? salon.description_en;

  // Render both if available AND distinct; otherwise just one
  const showBoth = Boolean(deText && enText && deText !== enText);

  if (!deText && !enText && !salon.address) return null;

  // V2-D53.3 fix #8 (R2-G1): salon.address already includes city, don't append postal.
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <section id="section-about">
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
        Über uns
      </h2>

      <div className="mt-4 max-w-3xl space-y-4 text-[14px] leading-relaxed text-s-ink-2 md:text-[15px]">
        {enText && (
          <p className="whitespace-pre-line">{enText}</p>
        )}
        {deText && (!enText || showBoth) && (
          <p className={cn("whitespace-pre-line", enText && "text-s-ink-3")}>
            {deText}
          </p>
        )}
      </div>

      {/* Map placeholder + location */}
      <MapPlaceholder
        rating={salon.average_rating}
        salonName={salon.name}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
        <MapPin size={14} className="text-s-ink-3" strokeWidth={2} />
        <span className="font-body text-s-ink-2">{fullAddress}</span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="font-body font-semibold text-s-brand hover:underline"
        >
          Wegbeschreibung
        </a>
      </div>
    </section>
  );
}

function MapPlaceholder({
  rating,
  salonName,
}: {
  rating: number | null;
  salonName: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-s-border">
      <div
        className="relative grid aspect-[16/9] w-full place-items-center bg-gradient-to-br from-s-bg-sunken via-white to-s-bg-sunken"
        aria-label={`Karte für ${salonName}`}
      >
        {/* Decorative grid lines to suggest a map */}
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A8B89A" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
        </svg>

        {/* Center pin with rating */}
        <div className="relative flex flex-col items-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-s-ink text-white shadow-[0_4px_16px_rgba(0,0,0,0.20)]">
            <span className="font-body text-[12px] font-bold">
              {rating?.toFixed(1) ?? "—"}
            </span>
          </div>
          <span className="font-body mt-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-s-ink-3 shadow-sm">
            Interaktive Karte folgt
          </span>
        </div>
      </div>
    </div>
  );
}
