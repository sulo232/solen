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
import { FROST_GLASS } from "@/lib/frost-glass";
import { SOLEN_MAP_STYLE, applySolenBasemapConfig , SOLEN_BASEMAP_CONFIG } from "@/lib/map-style";

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
 *  - basemap = SOLEN_MAP_STYLE (lib/map-style.ts), the ONE canonical Solen map style
 *    (LOCKFILE §0.13) — the divergent hand-authored palette this component used to
 *    define inline was replaced 2026-07-23, it is no longer a separate decision
 *  - normal light map WITH streets + labels; only motorway/trunk dropped
 *  - one marker = one real salon (no clustering, no aggregate "N Salons" blob)
 *  - marker carries the decision fact: gold star + rating + review count
 *  - no "Karte öffnen" button; the whole tile is the link
 */

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
      "font-body h-[11px] w-[11px] rounded-full border-2 border-white bg-s-accent shadow-[0_1px_4px_rgba(0,0,0,0.35)]";
    return el;
  }
  el.className =
    "font-body inline-flex items-center gap-[3px] whitespace-nowrap rounded-pill bg-white px-2 py-[3px] " +
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
  countSubLabel = null,
}: {
  /** Only salons with real coordinates; the caller filters. */
  salons: NearbyMapSalon[];
  href: string;
  ariaLabel: string;
  /** Real count string built from live data by the caller. Never a hardcoded number. */
  countLabel: string;
  /** Added 2026-08-10 (owner: "I want it to show which city it is"). The chip now leads with the
   *  CITY and this carries the count under it. Null omits the line entirely rather than printing
   *  a placeholder, same no-fabrication contract `countLabel` already had. */
  countSubLabel?: string | null;
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
      config: { basemap: SOLEN_BASEMAP_CONFIG }, // deterministic basemap config at init (avoids on-load race)
      container: holder.current,
      style: SOLEN_MAP_STYLE,
      center: centre,
      zoom: STREET_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    // The teaser sits below the fold, so on first mount the container can measure 0px
    // high and Mapbox then renders a degenerate viewport: one tile, nothing but the land
    // colour, markers pushed outside the clip (measured: holder 396x0). Re-fit AFTER a
    // resize, and keep resizing while the element settles.
    // Most-reviewed salon gets first claim on a spot, so when two pills collide the
    // one with more reviews is the one that stays readable.
    const ordered = [...salons].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    const markers = ordered.map((s) => ({
      s,
      m: new mapboxgl.Marker({ element: markerEl(s) }).setLngLat([s.longitude, s.latitude]).addTo(map),
    }));

    // Some salons sit ~50m apart, so at any zoom that shows the neighbourhood their
    // pills touch. Rather than let them overlap into mush (or invent a cluster blob),
    // hide the pill that loses the collision: the real map behaviour. Recomputed on
    // every resize because the projection depends on the rendered size.
    const PILL_W = 76;
    const PILL_H = 24;
    const decollide = () => {
      const kept: { x: number; y: number }[] = [];
      markers.forEach(({ s, m }) => {
        const p = map.project([s.longitude, s.latitude]);
        const hit = kept.some((k) => Math.abs(k.x - p.x) < PILL_W && Math.abs(k.y - p.y) < PILL_H);
        m.getElement().style.display = hit ? "none" : "";
        if (!hit) kept.push(p);
      });
    };

    const fit = () => {
      map.resize();
      map.setCenter(centre);
      map.setZoom(STREET_ZOOM);
      decollide();
    };
    map.on("load", fit);
    // Owner reference (2026-07-24): POI icons + labels, street names, place labels, grey
    // buildings — this style ships those flags off by default (lib/map-style.ts). Must run
    // after "load" (style is ready by then), never before.
    map.on("load", () => applySolenBasemapConfig(map));
    const ro = new ResizeObserver(fit);
    ro.observe(holder.current);

    return () => {
      ro.disconnect();
      markers.forEach(({ m }) => m.remove());
      map.remove();
    };
  }, [salons]);

  if (salons.length === 0) return null;

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className="relative mt-1 block h-[156px] overflow-hidden rounded-card border border-s-border bg-s-bg-sunken transition-transform duration-200 ease-glide active:scale-[0.97] active:duration-[80ms]"
    >
      {/* h-full, NOT `absolute inset-0`: mapbox-gl.css sets `.mapboxgl-map { position: relative }`
          on this node once the map mounts, which beats the absolute utility and collapses the
          element to 0px (measured: anchor 398x156 but this node 396x0, markers pushed below the
          clip). An explicit height is immune to that override. */}
      <div ref={holder} className="h-full w-full" aria-hidden />
      {/* A5 (owner dictation 2026-08-05, _plans/HOME_FIXES_2026-08-05.md): the count badge
          becomes liquid glass, the SAME treatment as the card heart overlay he pointed at.
          He dictated the recipe by measuring the live heart; those exact values already ARE
          the shared FROST_GLASS util (lib/frost-glass.ts, V3-D420 recipe "A",
          control-over-photo), which is also what HeartButton.tsx renders, so this sources the
          util instead of re-deriving five literals inline. Size, radius and text treatment
          untouched; blur drops 12px -> 4px and the shadow tightens, which IS the match. */}
      <span
        // mockup-ok: owner-dictated exact values (A5), not a fresh appearance decision.
        style={FROST_GLASS}
        className="pointer-events-none absolute bottom-3 left-3 z-[3] inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-semibold text-s-ink"
      >
        {/* mockup-ok , owner 2026-08-10: "I also want it to be more like city and it shows which
            city it is." The city is the label now; the count sits beside it in the same chip at a
            lighter weight. Two spans, and deliberately NO separator glyph between them: they
            already differ in weight, and taste rule 2 says that contrast IS the separator, so
            adding one would be the decorative artifact that rule bans. Chip geometry, frost recipe
            and font size are untouched from A5. */}
        <MapPin size={13} className="text-s-ink" aria-hidden />
        <span>{countLabel}</span>
        {countSubLabel ? (
          <span className="font-normal text-s-ink-2">{countSubLabel}</span>
        ) : null}
      </span>
    </a>
  );
}
