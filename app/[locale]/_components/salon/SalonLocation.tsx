"use client";

import * as React from "react";
import { Bus, MapPin, Navigation, TrainFront, TramFront } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { SalonDetail } from "./_shared";
import { SOLEN_MAP_STYLE, toStaticStylePath } from "@/lib/map-style";

/**
 * SalonLocation — V3-D389 (2026-05-31, Fresha 1:1 PDP capture).
 *
 * Standalone "Standort" section: map, then address + directions.
 *
 * The map is a LIVE mapbox-gl render (2026-07-23, replaces the earlier static Mapbox
 * image — measured finding: the Solen Studio style used by the search map
 * (components-legacy/MapView.tsx:139) returns a blank image from the Static Images API
 * at every zoom 12-16; it only renders under mapbox-gl). Non-interactive (no gesture
 * trap on a scrolling page).
 *
 * The map surface itself no longer opens Google Maps on tap (owner feedback,
 * 2026-07-23: "when you click it, just opens Google Maps, and that's not what I
 * want") — `map`/`compact` keep their explicit "Wegbeschreibung" text link as the
 * deliberate directions affordance beside the address; `card-overlay`'s floating
 * name/address card keeps its own tap-to-open-Maps link (that card, not the map
 * tile behind it, is this variant's equivalent affordance).
 *
 * `variant` (added 2026-07-23 for the /dev/pdp/location direction mockup):
 * treatment switch. Default is now "card-overlay" (the owner's pick out of the 3
 * mockup directions — every existing caller, e.g. SalonDetailV3, omits the prop and
 * gets this). "map" is the original pre-mockup markup, kept for reference/reversion.
 * "compact" is the third mockup direction, not currently used by any caller.
 */
export function SalonLocation({
  salon,
  variant = "card-overlay",
  mapStyle,
}: {
  salon: SalonDetail;
  variant?: "map" | "card-overlay" | "compact";
  /** Standard Mapbox style id — works with the existing public token. Default = the
   *  same Solen Studio style the search map uses (see SOLEN_STYLE below). */
  mapStyle?: string;
}) {
  const hasCoords = Boolean(salon.latitude && salon.longitude);

  // Nearest public-transport stop — replaces the old hardcoded `walkTimeMinutes`
  // mockup prop (2026-07-23, owner: "we don't know where the person is... mark the
  // nearest bus or tram station"). Real coordinates in, real station+distance out via
  // /api/transit/nearest-stop (transport.opendata.ch). Only `card-overlay` renders
  // this, so only it fetches — declared above the early `return null` below so the
  // hook count stays constant across renders (Rules of Hooks).
  const [transitStop, setTransitStop] = React.useState<NearestTransitStop | null>(null);
  React.useEffect(() => {
    if (variant !== "card-overlay" || !hasCoords) return;
    let cancelled = false;
    fetch(`/api/transit/nearest-stop?lat=${salon.latitude}&lng=${salon.longitude}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stop: NearestTransitStop | null } | null) => {
        if (!cancelled) setTransitStop(data?.stop ?? null);
      })
      .catch(() => {
        // Degrade gracefully: no chip, never a fabricated fallback number.
        if (!cancelled) setTransitStop(null);
      });
    return () => {
      cancelled = true;
    };
  }, [variant, hasCoords, salon.latitude, salon.longitude]);

  if (!salon.address && !hasCoords) return null;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  // Use the SAME style the search map uses (components-legacy/MapView.tsx:139): the real
  // Solen Studio style on the solen32 account, env override winning exactly as it does there.
  // Canonical Solen map style — single source of truth (lib/map-style.ts, LOCKFILE §0.13).
  const stylePath = mapStyle
    ? mapStyle.includes("/")
      ? mapStyle.replace("mapbox://styles/", "")
      : `mapbox/${mapStyle}`
    : toStaticStylePath(SOLEN_MAP_STYLE);
  const canRenderMap = hasCoords && Boolean(token);
  const TransitIcon = transitStop ? transitIconFor(transitStop.type) : null;

  // ---- variant: card-overlay — the map stays 4:3, a white name/address/transit-stop
  // card floats over its bottom edge instead of the address row living below it.
  if (variant === "card-overlay") {
    return (
      <section id="section-location">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Standort
        </h2>

        {canRenderMap && (
          <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-s-border">
            {/* 2026-07-23: no longer a tap-to-open-Maps link — owner feedback, tapping
                the map surface itself shouldn't navigate away. Plain div now; the
                floating card below stays the tappable directions affordance. */}
            <div className="absolute inset-0">
              <LocationMapCanvas longitude={salon.longitude} latitude={salon.latitude} stylePath={stylePath} label={`Karte: ${salon.address}`} />
            </div>

            {/* Floating info card — still the deliberate tap-to-open-Maps affordance for
                this variant (equivalent to the "Wegbeschreibung" link in the other two). */}
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${salon.name}: In Google Maps öffnen`}
              className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-elevation-3 transition-opacity hover:opacity-90"
            >
              <span className="min-w-0">
                <span className="block truncate font-body text-[14px] font-semibold text-s-ink">{salon.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2">
                  <MapPin size={12} className="shrink-0 text-s-ink-3" strokeWidth={2} />
                  <span className="truncate">{salon.address}</span>
                </span>
              </span>
              {transitStop && TransitIcon && (
                <span className="flex shrink-0 items-center gap-1.5 text-s-accent">
                  <TransitIcon size={16} strokeWidth={2} className="shrink-0" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="max-w-[100px] truncate text-[11px] font-semibold text-s-ink">{transitStop.name}</span>
                    <span className="text-[11px] font-semibold text-s-accent">{transitStop.walkMinutes} Min.</span>
                  </span>
                </span>
              )}
            </a>
          </div>
        )}
      </section>
    );
  }

  // ---- variant: compact — a shorter 2:1 map with the address row beside it
  // instead of the full-width map + address-below-it layout.
  if (variant === "compact") {
    return (
      <section id="section-location">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Standort
        </h2>

        <div className="mt-5 flex items-center gap-4">
          {canRenderMap && (
            <div className="relative aspect-[2/1] w-[152px] shrink-0 overflow-hidden rounded-2xl border border-s-border">
              <LocationMapCanvas longitude={salon.longitude} latitude={salon.latitude} stylePath={stylePath} label={`Karte: ${salon.address}`} />
            </div>
          )}
          <div className="min-w-0 flex-1 font-body text-[14px]">
            <span className="flex items-start gap-1.5 text-s-ink-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-s-ink-3" strokeWidth={2} />
              <span className="leading-snug">{salon.address}</span>
            </span>
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              className="group mt-1.5 inline-flex items-center gap-1 font-medium text-s-accent transition-opacity hover:opacity-80"
            >
              <Navigation size={13} className="text-s-accent transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
              Wegbeschreibung
            </a>
          </div>
        </div>
      </section>
    );
  }

  // ---- variant: map (default) — original pre-mockup markup, minus the map-surface
  // tap-to-open-Maps link (2026-07-23, see file header).
  return (
    <section id="section-location">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Standort
      </h2>

      {canRenderMap && (
        <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-s-border">
          <LocationMapCanvas longitude={salon.longitude} latitude={salon.latitude} stylePath={stylePath} label={`Karte: ${salon.address}`} />
        </div>
      )}

      {/* Street stays plain ink; "Wegbeschreibung" is the link BESIDE it (no blue street). */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[14px]">
        <span className="inline-flex items-center gap-1.5 text-s-ink-2">
          <MapPin size={14} className="shrink-0 text-s-ink-3" strokeWidth={2} />
          {salon.address}
        </span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-1 font-medium text-s-accent transition-opacity hover:opacity-80"
        >
          <Navigation size={13} className="text-s-accent transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
          Wegbeschreibung
        </a>
      </div>
    </section>
  );
}

// Local mirror of app/api/transit/nearest-stop/route.ts's response shape (type-only —
// no runtime import from a route module). Kept in sync by hand; the route is the
// source of truth for the actual values.
type TransitStopType = "tram" | "bus" | "train" | "other";
type NearestTransitStop = {
  name: string;
  type: TransitStopType;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  walkMinutes: number;
};

/** tram/bus/train -> the matching Lucide glyph (all 3 confirmed present in the
 *  installed lucide-react — package.json "lucide-react": 0.577.0). "other" (a rarer
 *  opendata.ch icon value, e.g. a ferry stop) falls back to Bus as the generic
 *  public-transit glyph rather than rendering nothing. */
function transitIconFor(type: TransitStopType) {
  if (type === "tram") return TramFront;
  if (type === "train") return TrainFront;
  return Bus;
}

// Single-salon framing zoom. MEASURED against the Solen Studio style's own definition
// (Mapbox Styles API, 2026-07-23): it's a Mapbox Standard-based style
// (`mapbox://styles/mapbox/standard` import) whose building layers
// (3d-building/procedural-buildings/2d-building) all carry `minzoom: 15` — the
// previous STREET_ZOOM=14.3 (borrowed from NearbyMap.tsx, which frames a whole CITY
// of salons) sat BELOW that threshold, so no building ever rendered, matching the
// owner's report ("can't see any details of the buildings... you can't see
// anything"). 17.0 clears minzoom 15 with real margin for individual-building
// legibility on a single-venue frame, and also clears building-number-label's
// minzoom:17, so the salon's building carries its street-number label too.
const STREET_ZOOM = 17;

/**
 * LocationMapCanvas — live mapbox-gl render for a single salon, ported from
 * NearbyMap.tsx's init effect (dynamic-import-free static import + useEffect init is
 * safe here for the same reason: this file is already "use client", and the effect
 * only runs client-side, so nothing touches the DOM during SSR).
 *
 * Non-interactive (interactive:false — matches NearbyMap.tsx, disables scrollZoom /
 * dragPan / dragRotate / touchZoomRotate / keyboard / boxZoom / doubleClickZoom all at
 * once, so there's no gesture trap on a scrolling page) and attribution-minimal
 * (attributionControl:false, same as NearbyMap.tsx). The map surface itself carries no
 * tap behaviour (2026-07-23) — directions live in the caller's separate explicit link.
 */
function LocationMapCanvas({
  longitude,
  latitude,
  stylePath,
  label,
}: {
  longitude: number;
  latitude: number;
  stylePath: string;
  label: string;
}) {
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !holder.current) return;
    mapboxgl.accessToken = token;

    const centre: [number, number] = [longitude, latitude];

    const map = new mapboxgl.Map({
      container: holder.current,
      style: `mapbox://styles/${stylePath}`,
      center: centre,
      zoom: STREET_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    const marker = new mapboxgl.Marker({ element: pinMarkerEl(), anchor: "bottom" })
      .setLngLat(centre)
      .addTo(map);

    // Same below-the-fold 0px-container guard as NearbyMap.tsx: on first mount the
    // section can measure 0px high before layout settles, which mapbox then bakes
    // into a degenerate viewport. Re-fit after resize, and keep resizing while the
    // element settles.
    const fit = () => {
      map.resize();
      map.setCenter(centre);
      map.setZoom(STREET_ZOOM);
    };
    map.on("load", fit);
    const ro = new ResizeObserver(fit);
    ro.observe(holder.current);

    return () => {
      ro.disconnect();
      marker.remove();
      map.remove();
    };
  }, [longitude, latitude, stylePath]);

  return (
    // h-full, NOT `absolute inset-0`: mapbox-gl.css sets `.mapboxgl-map { position: relative }`
    // on this node once the map mounts, which beats an absolute utility and collapses the
    // element to 0px (same finding as NearbyMap.tsx). An explicit height is immune to that.
    <div ref={holder} className="h-full w-full" role="img" aria-label={label} />
  );
}

/** Solen pin — ink teardrop + white centre dot, tip on the coordinate. Built as a raw
 *  DOM element (not JSX) because mapboxgl.Marker's `element` option requires one; the
 *  markup is a STATIC SVG string (no interpolation), same safe pattern as
 *  NearbyMap.tsx's markerEl(). anchor:"bottom" (set where this is used) puts the tip
 *  — not the element's centre — on the marker's lng/lat. */
function pinMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";
  el.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 32" width="30" height="40" style="display:block">' +
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0Z" fill="#0A0A0A"/>' + // drift-ok: token s-ink, inline for vanilla-DOM marker
    '<circle cx="12" cy="12" r="4.25" fill="#FFFFFF"/></svg>';
  return el;
}
