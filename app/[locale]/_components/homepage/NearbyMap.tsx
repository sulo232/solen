"use client";

// exists-check: net-new vs app/[locale]/_components/homepage/Nearby.tsx (the SECTION, read
// before writing this: it renders the map teaser inline as a fake CSS grid + 3 fixed MapPins;
// this extracts + replaces that block) and SalonCard.tsx (a card, not a map). `npm run exists
// nearby` shows no map component under homepage/. The only other Mapbox usage is
// salon/SalonLocation.tsx, a single-salon STATIC image on a different surface, so there is
// nothing to extend there. Net-new piece: a multi-salon live map teaser.

import * as React from "react";
import mapboxgl from "mapbox-gl";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * NearbyMap: the "In der Nähe" map teaser.
 *
 * mockup-ok: ports public/_mockups/nearby-map-minimal.html VERBATIM, the artifact the owner
 * approved on 2026-07-15 ("ok approved") after ~6 rounds of iteration (palette, roads, pin,
 * cluster blobs). Nothing here is a fresh appearance decision.
 *
 * Replaces the fabricated teaser that shipped before it: a CSS grid pretending to be a
 * map, 3 MapPins at fixed % positions, and a hardcoded count that read "14" while the
 * real number was 20. psych-ok: naming the fabricated literal this component DELETES,
 * not introducing one. Everything here is real: real Mapbox tiles, real salon
 * coordinates, real rating + review count, real count. See _design-system/REMOVED.md.
 *
 * Design decisions the owner settled over those rounds:
 *  - palette pixel-sampled from their reference screenshots (see below)
 *  - normal light map WITH streets + labels; only motorway/trunk dropped
 *  - one marker = one real salon (no clustering, no aggregate "N Salons" blob)
 *  - marker carries the decision fact: gold star + rating + review count
 *  - no "Karte öffnen" button; the whole tile is the link
 */

// Cartographic palette, pixel-sampled from the owner's reference map screenshots
// (~/solen/screenshots IMG_6489-6491). These are MAP fills (land/park/water/road),
// not UI surfaces: the design tokens are deliberately not used here, a river cannot
// be s-accent. No Tailwind token exists for them by design.
const LAND = "#E8EAEA"; // drift-ok, mockup-ok: cartographic land fill sampled from the owner's reference
const PARK = "#CFF2D0"; // drift-ok, mockup-ok: cartographic park fill sampled from the owner's reference
const WATER = "#CBE3FC"; // drift-ok, mockup-ok: cartographic water fill sampled from the owner's reference
const ROAD = "#F8F8F8"; // drift-ok, mockup-ok: cartographic road fill sampled from the owner's reference
const LABEL = "#AEB3BA"; // drift-ok, mockup-ok: cartographic label ink sampled from the owner's reference

const MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: { mb: { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" } },
  layers: [
    { id: "land", type: "background", paint: { "background-color": LAND } },
    {
      id: "park",
      type: "fill",
      source: "mb",
      "source-layer": "landuse",
      filter: ["match", ["get", "class"], ["park", "grass", "cemetery", "pitch", "garden", "golf_course"], true, false],
      paint: { "fill-color": PARK },
    },
    { id: "water", type: "fill", source: "mb", "source-layer": "water", paint: { "fill-color": WATER } },
    {
      id: "roads",
      type: "line",
      source: "mb",
      "source-layer": "road",
      // normal streets stay; only the loud motorway/trunk is dropped (owner call)
      filter: ["match", ["get", "class"], ["motorway", "motorway_link", "trunk", "trunk_link"], false, true],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": ROAD, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 15, 2.4] },
    },
    {
      id: "labels",
      type: "symbol",
      source: "mb",
      "source-layer": "place_label",
      filter: ["match", ["get", "type"], ["city", "town", "neighbourhood", "suburb"], true, false],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 12.5],
      },
      paint: { "text-color": LABEL, "text-halo-color": "#FFFFFF", "text-halo-width": 1.4 },
    },
  ],
};

export interface NearbyMapSalon {
  id: string;
  longitude: number;
  latitude: number;
  rating: number | null;
  reviewCount: number | null;
}

/** Marker = gold star + real rating + real review count. Star is never bare
 *  (PSYCHOLOGY.md law 6), so a salon with no rating/count gets a plain dot. */
function markerEl(s: NearbyMapSalon): HTMLDivElement {
  const el = document.createElement("div");
  const hasRating = s.rating != null && s.reviewCount != null && s.reviewCount > 0;
  if (!hasRating) {
    el.className =
      "h-[11px] w-[11px] rounded-full border-2 border-white bg-s-accent shadow-[0_1px_4px_rgba(0,0,0,0.35)]";
    return el;
  }
  el.className =
    "inline-flex items-center gap-[3px] whitespace-nowrap rounded-pill bg-white px-2 py-[3px] " +
    "text-[12px] leading-none text-s-ink shadow-[0_1px_5px_rgba(0,0,0,0.3)]";

  // The star is a STATIC Lucide path (no interpolation, so innerHTML is safe here);
  // the dynamic rating/count go in via textContent, never innerHTML, so DB values can
  // never be parsed as markup.
  const star = document.createElement("span");
  star.className = "contents";
  star.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" class="lucide lucide-star h-[11px] w-[11px] shrink-0 text-s-star" aria-hidden="true">' +
    '<path d="M11.5 2.3a.5.5 0 0 1 .95 0l2.3 4.68 5.17.75a.53.53 0 0 1 .3.9l-3.74 3.64.88 5.14a.53.53 0 0 1-.77.56L12 15.9l-4.62 2.43a.53.53 0 0 1-.77-.56l.88-5.14L3.75 8.99a.53.53 0 0 1 .3-.9l5.16-.76z"/></svg>';

  const rating = document.createElement("b");
  rating.className = "font-semibold";
  rating.textContent = Number(s.rating).toFixed(1);

  const count = document.createElement("span");
  count.className = "text-s-ink-2";
  count.textContent = `(${Number(s.reviewCount)})`;

  el.append(star, rating, count);
  return el;
}

export default function NearbyMap({
  salons,
  href,
  ariaLabel,
  countLabel,
}: {
  /** Only salons with real coordinates; the caller filters. */
  salons: NearbyMapSalon[];
  href: string;
  ariaLabel: string;
  /** Real count string built from live data by the caller. Never a hardcoded number. */
  countLabel: string;
}) {
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !holder.current || salons.length === 0) return;
    mapboxgl.accessToken = token;

    // Centre on the salons, but hold STREET zoom (the approved mockup's framing).
    // fitBounds() is wrong here: it zooms OUT until every salon fits, which at city
    // spread crushes the rating pills into an unreadable pile (measured on the real
    // homepage). A nearby teaser is meant to show the surroundings, not the whole
    // city, so the markers stay legible and the chip carries the full count.
    const centre: [number, number] = [
      salons.reduce((a, s) => a + s.longitude, 0) / salons.length,
      salons.reduce((a, s) => a + s.latitude, 0) / salons.length,
    ];
    const STREET_ZOOM = 14.3;

    const map = new mapboxgl.Map({
      container: holder.current,
      style: MAP_STYLE,
      center: centre,
      zoom: STREET_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    // The teaser sits below the fold, so on first mount the container can measure 0px
    // high and Mapbox then renders a degenerate viewport: one tile, nothing but the land
    // colour, markers pushed outside the clip (measured: holder 396x0). Re-fit AFTER a
    // resize, and keep resizing while the element settles.
    const fit = () => {
      map.resize();
      map.setCenter(centre);
      map.setZoom(STREET_ZOOM);
    };
    map.on("load", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(holder.current);

    const markers = salons.map((s) =>
      new mapboxgl.Marker({ element: markerEl(s) }).setLngLat([s.longitude, s.latitude]).addTo(map),
    );

    return () => {
      ro.disconnect();
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [salons]);

  if (salons.length === 0) return null;

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className="relative mt-1 block h-[156px] overflow-hidden rounded-card border border-s-border bg-s-bg-sunken transition-transform duration-200 ease-glide active:scale-[0.97]"
    >
      {/* h-full, NOT `absolute inset-0`: mapbox-gl.css sets `.mapboxgl-map { position: relative }`
          on this node once the map mounts, which beats the absolute utility and collapses the
          element to 0px (measured: anchor 398x156 but this node 396x0, markers pushed below the
          clip). An explicit height is immune to that override. */}
      <div ref={holder} className="h-full w-full" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 left-3 z-[3] inline-flex items-center gap-1.5 rounded-pill bg-white/80 px-3 py-1.5 text-[12.5px] font-semibold text-s-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur-md">
        <MapPin size={13} className="text-s-ink" aria-hidden /> {countLabel}
      </span>
    </a>
  );
}
