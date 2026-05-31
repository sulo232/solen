"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { SalonDetail } from "./_shared";

/**
 * SalonLocation — V3-D389 (2026-05-31, Fresha 1:1 PDP capture).
 *
 * Standalone "Standort" section, split OUT of SalonAbout (which now holds the
 * description only). Fresha's venue page keeps location as its own labeled
 * block — map, then address + directions — separate from the About text and
 * from Opening times. This mirrors that 1:1.
 *
 * The map is the REAL MapView (the search-map primitive) in mini-map mode
 * (enhanced=false → cooperative two-finger gestures so the page still scrolls
 * past it), centered on the salon — replacing the old "Karte folgt" placeholder.
 */
const MapView = dynamic(() => import("@/components-legacy/MapView"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-s-bg-sunken md:aspect-[2/1]" />
  ),
});

export function SalonLocation({ salon }: { salon: SalonDetail }) {
  const hasCoords = Boolean(salon.latitude && salon.longitude);
  if (!salon.address && !hasCoords) return null;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;

  return (
    <section id="section-location">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Standort
      </h2>

      {hasCoords && (
        <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-s-border md:aspect-[2/1]">
          <MapView
            salons={
              [
                {
                  id: salon.id,
                  name: salon.name,
                  slug: salon.slug,
                  address: salon.address,
                  average_rating: salon.average_rating,
                  longitude: salon.longitude,
                  latitude: salon.latitude,
                },
              ] as never
            }
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
        <MapPin size={14} className="text-s-ink-3" strokeWidth={2} />
        <span className="font-body text-s-ink-2">{salon.address}</span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="font-body font-semibold text-s-ink hover:underline"
        >
          Wegbeschreibung
        </a>
      </div>
    </section>
  );
}
