"use client";

// Must be loaded with: dynamic(() => import('@/components-legacy/MapView'), { ssr: false })
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in env.

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import type { SalonCard } from "@/lib/types";
import { SOLEN_MAP_STYLE, applySolenBasemapConfig , SOLEN_BASEMAP_CONFIG } from "@/lib/map-style";
import Supercluster from "supercluster";

const BASEL_CENTER: [number, number] = [7.5886, 47.5596];

// Toggle ONLY the selection-dependent styles of a salon rating pill, IN PLACE. Selecting a
// pin used to tear down + rebuild every marker, which flickered every label on the map
// on each tap (owner 2026-07-01). Invariant styles are set once at creation; this flips the
// rest via the CSS transition on the inner element.
// Selected = GRAY sunken fill (owner-approved map-full mockup, 2026-07-02), NOT ink-black and
// NOT blue. Ink text + s-border hairline stay in both states; only the fill + scale change.
// Hex is inline because this is a vanilla-DOM mapbox marker (Tailwind classes can't apply);
// the values ARE the canonical tokens (#F4F4F5=s-bg-sunken, #E4E4E7=s-border, #0A0A0A=s-ink).
function applyPillSelection(inner: HTMLElement, isSelected: boolean) {
  inner.style.padding = isSelected ? "6px 12px" : "5px 11px";
  inner.style.fontSize = isSelected ? "13px" : "12.5px";
  inner.style.boxShadow = isSelected
    ? "0 2px 6px rgba(10,10,10,0.16),0 10px 24px rgba(10,10,10,0.14)"
    : "0 1px 2px rgba(10,10,10,0.12),0 4px 12px rgba(10,10,10,0.10)";
  inner.style.background = isSelected ? "#F4F4F5" : "#ffffff"; // drift-ok: token s-bg-sunken, inline for vanilla-DOM marker
  inner.style.color = "#0A0A0A"; // drift-ok: token s-ink, inline for vanilla-DOM marker
  inner.style.border = "1px solid #E4E4E7"; // drift-ok: token s-border, inline for vanilla-DOM marker
  inner.style.transform = isSelected ? "scale(1.10)" : "scale(1)";
}

// M2 "Soft" zoom enter-motion (owner-picked, /dev/map-zoom, 2026-07-02): when a marker is
// (re)built on zoomend / salon-set change, ease it in via the Web Animations API instead of
// popping in solid, opacity 0->1 + scale 0.9->end, staggered by index. `endScale` is the
// marker's RESTING transform (1 for a plain marker, 1.12 for a pin that's already selected)
// so the enter animation lands exactly where applyPillSelection/hover expect it. Reduced-motion
// skips the animation entirely (element is left at its resting state).
function animateMarkerIn(el: HTMLElement, index: number, endScale: number) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: `scale(${endScale})` },
    ],
    { duration: 260, delay: Math.min(index * 30, 180), easing: "cubic-bezier(0.32,0.72,0,1)", fill: "backwards" },
  );
}

interface MapViewProps {
  salons: SalonCard[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** When true, shows category chips + area search. False for mini-maps (salon profile). */
  enhanced?: boolean;
  /** Callback when user clicks "In diesem Bereich suchen" with map bounds */
  onAreaSearch?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  /** [lng, lat] to recenter on when there are ZERO salons (e.g. the user picked a city with no
   *  listings yet). Without this the map stayed on the previous city while the sheet said "0 in X",
   *  which read as "it doesn't bring me to that city" (owner 2026-07-01). */
  emptyCenter?: [number, number] | null;
}

export default function MapView({ salons, selectedId, onSelect, enhanced = false, onAreaSearch, emptyCenter }: MapViewProps) {
  const tCommon = useTranslations("common");
  const containerRef = useRef<HTMLDivElement>(null);
  // mapbox-gl v3's Map/Marker types are so deeply recursive that tsc throws
  // TS2321 "Excessive stack depth" when comparing them on assignment — a known
  // v3 issue that fails `next build` (ignoreBuildErrors:false). Typing these
  // refs loosely sidesteps the structural comparison without changing runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapError, setMapError] = useState(!process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Marker click handlers should always call the LATEST onSelect, but onSelect
  // must NOT be a dep of the markers effect — parents pass an inline onSelect,
  // which would otherwise rebuild every marker (and re-fit the map) every render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // AUTO-update the sheet to the visible viewport on a USER zoom/pan (owner's repeated ask,
  // supersedes the old "Search this area" button). Ref so the map-init effect doesn't rebuild
  // the map when the parent passes a new inline onAreaSearch each render.
  const onAreaSearchRef = useRef(onAreaSearch);
  onAreaSearchRef.current = onAreaSearch;
  // once the user has moved the map themselves, stop auto-fitting to results (they own the viewport).
  const userMovedRef = useRef(false);
  // fitBounds should fire only when the SET of salons changes, not on every
  // re-render — repeated fitBounds is what made the map "move weirdly".
  const fittedSigRef = useRef<string>("");
  // Selection is applied to price pills IN PLACE (no marker rebuild), so keep the
  // current selectedId in a ref for the marker build + hover handlers, and keep a
  // handle to each salon's inner pill element to restyle on selection change.
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const salonPillsRef = useRef<Map<string, any>>(new Map());

  // Markers reflect exactly the salons the PAGE passes — the page owns category
  // filtering now (MapView's own chip row was a duplicate; removed V3-D378).
  const filteredSalons = salons;

  // Cluster nearby salons (Fresha-style) so dense areas don't overlap. Rebuilt
  // only when the salon set changes.
  const clusterIndex = useMemo(() => {
    const idx = new Supercluster<{
      salonId: string; minPrice: number | null; name: string; address: string; rating: number;
    }>({ radius: 56, maxZoom: 16 });
    idx.load(
      filteredSalons.map((s) => ({
        type: "Feature" as const,
        properties: {
          salonId: s.id,
          minPrice: (s as SalonCard & { min_price?: number | null }).min_price ?? null,
          name: s.name,
          address: s.address,
          rating: s.average_rating,
        },
        geometry: { type: "Point" as const, coordinates: [s.longitude, s.latitude] as [number, number] },
      })),
    );
    return idx;
  }, [filteredSalons]);

  // Init map once. Basemap = Solen's custom Mapbox Studio style (built by the
  // user in the solen32 account, 2026-05-30). One fixed style; no dark-mode
  // observer / setStyle churn (that re-fetched the style in a loop and — with
  // StrictMode's dev double-mount — left the canvas blank). The bare streets-v12
  // fallback still gets a runtime declutter; the Studio style is used as-is.
  useEffect(() => {
    if (!containerRef.current || mapError || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    // Default basemap = Solen's custom Mapbox Studio style (solen32 account),
    // used exactly as designed. The runtime declutter below only applies to the
    // bare streets-v12 fallback. Canonical style + NEXT_PUBLIC_MAPBOX_STYLE_LIGHT
    // override now live in lib/map-style.ts (the ONE map style for Solen — LOCKFILE §0.13).
    const style = SOLEN_MAP_STYLE;
    const isBareStreets = style === "mapbox://styles/mapbox/streets-v12";

    const map = new mapboxgl.Map({
      config: { basemap: SOLEN_BASEMAP_CONFIG }, // deterministic basemap config at init (avoids on-load race)
      container: containerRef.current,
      style,
      center: BASEL_CENTER,
      zoom: 13,
      projection: "mercator", // flat map, Fresha-style
      // Dedicated search maps (enhanced) pan with ONE finger / normal scroll —
      // forcing two-finger there made the full-screen mobile map feel frozen.
      // Inline mini-maps (enhanced=false) keep cooperative gestures so the page
      // can still scroll past them.
      cooperativeGestures: !enhanced,
    });

    // Keep scrollZoom ENABLED so a MacBook trackpad pinch (delivered as a
    // ⌘/ctrl wheel event) zooms the MAP, not the whole page. cooperativeGestures
    // already gates it — a plain scroll scrolls the page; only pinch / ⌘+scroll
    // (or two fingers on mobile) zooms the map. Disabling it let pinch events
    // bubble to the browser and zoom the entire website.
    // Resize once the flex container has its final size — without this the
    // canvas can paint blank when the map inits before layout settles.
    map.on("load", () => {
      map.resize();
      // Owner reference (2026-07-24): POI icons + labels, street names, place labels, grey
      // buildings, everywhere — this style ships those flags off by default
      // (lib/map-style.ts). CONFLICT flagged, not silently resolved: the ALWAYS regex two
      // lines down was added 2026-07-02 to force-hide poi/transit/rail/station/airport/ferry
      // layers on THIS surface specifically ("owner: dislikes the blue map labels"). That is
      // a different mechanism (setLayoutProperty on individual style layers) than this
      // config-property call, and — if it still matches real layer ids on this Standard-based
      // style — can visually cancel the showPointOfInterestLabels/showTransitLabels config
      // below on the search map ONLY (SalonLocation/NearbyMap don't run this ALWAYS pass).
      // Left the 2026-07-02 declutter untouched pending an explicit call on whether the new
      // "POI everywhere" ask supersedes it here too; needs visual verification.
      applySolenBasemapConfig(map);
      // Uber-style clean detail on Fresha-colour streets: KEEP the drivable road
      // network (minor / service / street / arterials) so it reads as a real
      // map, but hide the clutter that felt "busy". Iterate ids so it's robust to
      // renames; per-layer try/catch so one un-settable layer doesn't abort the rest.
      // ALWAYS hide the coloured POI + transit label swarm (owner 2026-07-02: dislikes
      // the blue map labels, "fonts like Azul") , that ran only on the bare fallback
      // before, so the custom Solen Studio style still showed them. The heavier
      // declutter (road labels / shields / buildings / footpaths) stays fallback-only.
      const ALWAYS = /poi|transit|rail|station|airport|ferry/i;
      const FALLBACK = /road-label|road-number|building|path|steps|pedestrian/i;
      try {
        for (const layer of map.getStyle()?.layers ?? []) {
          const hide = ALWAYS.test(layer.id) || (isBareStreets && FALLBACK.test(layer.id));
          if (!hide) continue;
          try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch { /* layer lacks visibility, skip */ }
        }
        // Colours ≈ Fresha (streets-v12's own palette) with a light saturation
        // bump so it isn't flat. Fallback only; the custom style is used as-is.
        if (isBareStreets) map.getCanvas().style.filter = "saturate(1.15)";
      } catch (e) {
        console.warn("[MapView] map declutter skipped:", e);
      }
    });
    // A transient tile/style error must NOT flip to the fallback + tear the map
    // down (that drove the create→remove→recreate loop). Just log it.
    map.on("error", (e) => console.warn("Mapbox error:", e));

    // V3-D382: no NavigationControl — Fresha mobile has no zoom +/- buttons
    // (pinch / double-tap to zoom). The corner buttons were visual clutter.
    mapRef.current = map;

    // AUTO-search the visible area on a USER zoom/pan (owner: the sheet must reflect what's on
    // screen , zoom into an empty area and the sheet goes empty; zoom to a place and it shows THOSE
    // stores). Only user-initiated moves (e.originalEvent present) fire it , programmatic easeTo/
    // fitBounds have no originalEvent, so the initial fit + the select-pan don't self-trigger.
    // Debounced so a continuous pan/zoom fires once on settle.
    if (enhanced) {
      const handleMove = (e: { originalEvent?: unknown } | undefined) => {
        if (!e || !e.originalEvent) return;
        userMovedRef.current = true;
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = setTimeout(() => {
          const m = mapRef.current;
          if (!m || !onAreaSearchRef.current) return;
          const bounds = m.getBounds();
          if (!bounds) return;
          onAreaSearchRef.current({
            north: bounds.getNorth(), south: bounds.getSouth(),
            east: bounds.getEast(), west: bounds.getWest(),
          });
        }, 450);
      };
      map.on("moveend", handleMove);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhanced, mapError]);

  // Render cluster bubbles + price pills for the current zoom. Re-runs when the
  // salon set or selection changes, and on zoomend (clusters depend on zoom).
  // NOT on pan — markers are geo-anchored so mapbox moves them; no rebuild =
  // no flicker. Markers are always SOLID (no opacity fade) — motion comes from
  // the cluster-expand zoom, hover scale, and the selection pop.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const render = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      salonPillsRef.current.clear();

      const zoom = Math.floor(map.getZoom());
      const features = clusterIndex.getClusters([-180, -85, 180, 85], zoom);

      features.forEach((f, i) => {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        const props = f.properties as Record<string, unknown>;

        // Outer = mapbox positioning (NO transition on transform, or markers lag
        // during pans). Inner = visuals + hover/selection scale.
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        const inner = document.createElement("div");
        // Inter (the app font) , NOT Geist (banned). Transition covers the in-place
        // selection restyle so the pill eases instead of snapping.
        inner.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
        inner.style.transition = "transform 150ms ease, padding 150ms ease, box-shadow 150ms ease, background-color 150ms ease, color 150ms ease";

        if ((props as { cluster?: boolean }).cluster) {
          // Cluster bubble , WHITE disc + ink count + shadow (owner-approved
          // /dev/map-motion + /dev/map-zoom mockups, 2026-07-02: "normal disc,
          // white with shadow, not gray, not black"). mockup-ok. Click zooms in
          // to split it (Fresha behaviour). Hex set via explicit properties
          // below so each token line carries its own drift-ok , vanilla-DOM
          // mapbox marker, no Tailwind.
          inner.style.cssText +=
            "display:flex;align-items:center;justify-content:center;" +
            "min-width:32px;height:32px;padding:0 9px;border-radius:9999px;" +
            "font-size:13px;font-weight:700;"; // mockup-ok: owner-approved /dev/map-motion + /dev/map-zoom
          inner.style.background = "#ffffff"; // drift-ok: token white, inline for vanilla-DOM marker
          inner.style.color = "#0A0A0A"; // drift-ok: token s-ink, inline for vanilla-DOM marker
          inner.style.border = "1.5px solid #E4E4E7"; // drift-ok: token s-border, inline for vanilla-DOM marker
          inner.style.boxShadow = "0 1px 2px rgba(10,10,10,0.12),0 6px 16px rgba(10,10,10,0.12)"; // drift-ok: token shadow values, inline for vanilla-DOM marker
          inner.textContent = String(props.point_count as number);
          el.appendChild(inner);
          el.addEventListener("click", () => {
            const ez = clusterIndex.getClusterExpansionZoom(props.cluster_id as number);
            map.easeTo({ center: [lng, lat], zoom: ez, duration: 500 });
          });
          el.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.12)"; });
          el.addEventListener("mouseleave", () => { inner.style.transform = "scale(1)"; });
          const cm = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          markersRef.current.set(`cluster-${props.cluster_id}`, cm);
          animateMarkerIn(inner, i, 1);
          return;
        }

        // Individual salon: rating pill (owner-approved map-full mockup, 2026-07-02),
        // white pill + yellow star + rating number, gray-sunken when selected. Supersedes
        // V3-D386 (price-only pill) per the owner's recent map approval.
        const salonId = props.salonId as string;
        const rating = props.rating as number | null;
        const isSelected = salonId === selectedIdRef.current;

        if (rating && rating > 0) {
          // Invariant styles here; the selection-dependent bits (fill/size/shadow/scale) go
          // through applyPillSelection so a select restyles IN PLACE (no marker rebuild).
          inner.style.cssText += `
            display:flex;align-items:center;justify-content:center;gap:3px;
            border-radius:9999px;font-weight:600;white-space:nowrap;
          `;
          applyPillSelection(inner, isSelected);
          // Lucide "star" glyph, filled semantic yellow (#FFC32B = s-star), the same icon as
          // the mockup's Star fill-s-star strokeWidth 0. No review count (owner spec).
          inner.innerHTML =
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="#FFC32B" stroke="none" style="flex-shrink:0" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            `<span>${rating.toFixed(1)}</span>`;
          salonPillsRef.current.set(salonId, inner);
        } else {
          // No rating yet (new salon): neutral location dot, no fabricated number.
          inner.style.cssText += `
            width:13px;height:13px;border-radius:50%;background:#0A0A0A;
            border:2px solid #ffffff;box-shadow:0 1px 4px rgba(10,10,10,0.20);
          `;
        }
        if (isSelected) inner.style.transform = "scale(1.12)";
        el.appendChild(inner);
        // M2 "Soft" zoom enter-motion (owner-picked, /dev/map-zoom, 2026-07-02) , eases the
        // cluster<->pins transition on zoomend/salon-set-change instead of a solid pop-in.
        animateMarkerIn(inner, i, isSelected ? 1.12 : 1);

        el.addEventListener("click", () => onSelectRef.current?.(salonId));
        el.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.15)"; });
        // Read the CURRENT selection (ref), not the creation-time value , the pill can be
        // selected/deselected in place without a rebuild.
        el.addEventListener("mouseleave", () => { inner.style.transform = salonId === selectedIdRef.current ? "scale(1.12)" : "scale(1)"; });

        // V3-D382: no marker popup. The bottom-sheet card already shows the
        // salon's name / rating / price, so a popup bubble over the map was a
        // redundant "second" info display.
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.set(salonId, marker);
      });

      // Fit bounds only when the SET of salons changes, and NEVER once the user has moved the
      // map themselves (they own the viewport now; auto-fitting after an area-search would yank
      // the map away from where they zoomed). owner 2026-07-02.
      const sig = filteredSalons.map((s) => s.id).join("|");
      if (filteredSalons.length > 0 && sig !== fittedSigRef.current && !userMovedRef.current) {
        fittedSigRef.current = sig;
        const bounds = new mapboxgl.LngLatBounds();
        filteredSalons.forEach((s) => bounds.extend([s.longitude, s.latitude]));
        map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 500 });
      }
    };

    if (map.loaded()) render();
    else map.once("load", render);
    map.on("zoomend", render);
    return () => { map.off("zoomend", render); };
    // NOTE: selectedId is intentionally NOT a dep , rebuilding every marker on each
    // selection flickered all price labels. Selection is applied in place below.
  }, [clusterIndex]);

  // Restyle the affected price pills IN PLACE when the selection changes (no marker
  // teardown/rebuild, so labels don't flicker on every tap). Pairs with the easeTo pan.
  useEffect(() => {
    salonPillsRef.current.forEach((inner, id) => applyPillSelection(inner, id === selectedId));
  }, [selectedId]);

  // V3-D382: PAN (don't hard-zoom) to the selected salon. Forcing zoom:15 on
  // every swipe-select ratcheted the map deeper each time, so the overview was
  // unrecoverable ("can't go back on the map"). Pan-only preserves the user's
  // zoom; the popup toggle is gone (the sheet card shows the info now).
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const salon = filteredSalons.find((s) => s.id === selectedId);
    if (!salon) return;
    mapRef.current.easeTo({ center: [salon.longitude, salon.latitude], duration: 400 });
  }, [selectedId, filteredSalons]);

  // ZERO results (e.g. a city with no listings): recenter to that city so the map visibly
  // "goes there" instead of sitting on the previous city behind a "0 Salons" sheet (owner).
  useEffect(() => {
    if (!mapRef.current || filteredSalons.length > 0 || !emptyCenter) return;
    mapRef.current.easeTo({ center: emptyCenter, zoom: 12, duration: 500 });
  }, [emptyCenter, filteredSalons]);

  // (area search is now AUTOMATIC on a user zoom/pan , see the moveend handler in the map-init
  // effect above , so the manual "In diesem Bereich suchen" button + handler were removed.)

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Map container */}
      <div ref={containerRef} className={`w-full h-full min-h-[280px] md:min-h-[400px] rounded-[12px] overflow-hidden ${mapError ? 'hidden' : ''}`} />

      {/* Fallback Error UI */}
      {mapError && (
        <div className="w-full h-full min-h-[280px] md:min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-s-bg-sunken rounded-[12px] border border-s-border">
          <MapPin className="w-10 h-10 text-s-ink/40 mb-3" />
          <h3 className="font-heading text-lg font-semibold text-s-ink mb-1">{tCommon("mapUnavailable")}</h3>
          <p className="text-sm font-body text-s-ink-2 mb-4 max-w-sm">
            Die interaktive Karte kann momentan nicht geladen werden.
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Basel,+Switzerland"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-s-ink hover:brightness-[1.06] text-white text-[12px] font-heading uppercase tracking-[.06em] rounded-btn shadow-elevation-2 transition-[transform,filter] active:scale-[0.97]"
          >
            In Google Maps öffnen
          </a>
        </div>
      )}

    </div>
  );
}
