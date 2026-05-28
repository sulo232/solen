"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import type { SalonDetail } from "./_shared";

/**
 * SalonAbout — V2-D53.3 (2026-05-11) · V3-D209 locale-pick (2026-05-26).
 *
 * About paragraph followed by the location section. Map is rendered as a
 * placeholder block for now — real Mapbox integration is gated on
 * `NEXT_PUBLIC_MAPBOX_TOKEN` (deferred per user "all full except the map").
 *
 * V3-D209 (verifier punch-list item #4): previously rendered EN + DE
 * paragraphs concatenated on every locale — user on /de/ saw English text
 * first, then German. Fresha shows one paragraph in the active locale.
 * Now picks `about_text_${locale}` with a sensible fallback chain ending in
 * any available text.
 *
 * Placeholder design:
 *   • Light gray block sized to match a real map (~aspect-[16/9])
 *   • Compass icon + "Karte folgt" caption in the center
 *   • Below: address + Get directions link
 *
 * When the env var lands, swap the placeholder div for a `<Map />`
 * component using react-map-gl. Marker = black pill with salon rating.
 */
export function SalonAbout({ salon, locale }: { salon: SalonDetail; locale: string }) {
  // V3-D209: pick one text in the active locale; fall back through de → en if missing.
  // Type cast is needed because SalonDetail only types `_de` / `_en` keys today —
  // additional locales (fr/it) gracefully read undefined and skip.
  const localized = (key: string) => (salon as unknown as Record<string, string | undefined>)[key];
  const text =
    localized(`about_text_${locale}`) ??
    localized(`description_${locale}`) ??
    salon.about_text_de ??
    salon.description_de ??
    salon.about_text_en ??
    salon.description_en ??
    null;

  if (!text && !salon.address) return null;

  // V2-D53.3 fix #8 (R2-G1): salon.address already includes city, don't append postal.
  const fullAddress = salon.address;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <section id="section-about">
      {/* V3-D202 (A12): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Über uns
      </h2>

      {text && (
        <div className="mt-4 max-w-3xl space-y-4 text-[14px] leading-relaxed text-s-ink-2 md:text-[15px]">
          <p className="whitespace-pre-line">{text}</p>
        </div>
      )}

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
          className="font-body font-semibold text-s-ink hover:underline"
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
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E7E5E4" strokeWidth="0.5" />
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
