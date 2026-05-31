"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import type { SalonDetail } from "./_shared";

/**
 * SalonLocation — V3-D389 (2026-05-31, Fresha 1:1 PDP capture).
 *
 * Standalone "Standort" section: map, then address + directions.
 *
 * The map is a STATIC Mapbox image (no mapbox-gl, no gesture trap) wrapped in a
 * link — tapping opens Google Maps for real panning + directions. Replaces the
 * old interactive mini-map whose cooperative two-finger gesture felt "stuck".
 */
export function SalonLocation({ salon }: { salon: SalonDetail }) {
  const hasCoords = Boolean(salon.latitude && salon.longitude);
  if (!salon.address && !hasCoords) return null;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  // Static map: clean light style + ink pin, centered on the salon. @2x for retina.
  const staticMap =
    hasCoords && token
      ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+0a0a0a(${salon.longitude},${salon.latitude})/${salon.longitude},${salon.latitude},14,0/600x300@2x?access_token=${token}`
      : null;

  return (
    <section id="section-location">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Standort
      </h2>

      {staticMap && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="In Google Maps öffnen"
          className="group relative mt-5 block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-s-border md:aspect-[2/1]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={staticMap}
            alt={`Karte: ${salon.address}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </a>
      )}

      {/* Street stays plain ink; "In Maps öffnen" is the link BESIDE it (no blue street). */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[14px]">
        <span className="inline-flex items-center gap-1.5 text-s-ink-2">
          <MapPin size={14} className="shrink-0 text-s-ink-3" strokeWidth={2} />
          {salon.address}
        </span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-1 font-medium text-s-ink transition-opacity hover:opacity-70"
        >
          <Navigation size={13} className="text-s-ink-2 transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
          In Maps öffnen
        </a>
      </div>
    </section>
  );
}
