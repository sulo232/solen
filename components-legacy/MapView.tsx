"use client";

// Must be loaded with: dynamic(() => import('@/components-legacy/MapView'), { ssr: false })
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in env.

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCard } from "@/lib/types";
import Supercluster from "supercluster";

const BASEL_CENTER: [number, number] = [7.5886, 47.5596];

interface MapViewProps {
  salons: SalonCard[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** When true, shows category chips + area search. False for mini-maps (salon profile). */
  enhanced?: boolean;
  /** Callback when user clicks "In diesem Bereich suchen" with map bounds */
  onAreaSearch?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export default function MapView({ salons, selectedId, onSelect, enhanced = false, onAreaSearch }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // mapbox-gl v3's Map/Marker types are so deeply recursive that tsc throws
  // TS2321 "Excessive stack depth" when comparing them on assignment — a known
  // v3 issue that fails `next build` (ignoreBuildErrors:false). Typing these
  // refs loosely sidesteps the structural comparison without changing runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const [mapError, setMapError] = useState(!process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Marker click handlers should always call the LATEST onSelect, but onSelect
  // must NOT be a dep of the markers effect — parents pass an inline onSelect,
  // which would otherwise rebuild every marker (and re-fit the map) every render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // fitBounds should fire only when the SET of salons changes, not on every
  // re-render — repeated fitBounds is what made the map "move weirdly".
  const fittedSigRef = useRef<string>("");

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
    // bare streets-v12 fallback. NEXT_PUBLIC_MAPBOX_STYLE_LIGHT still overrides.
    const style = process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT || "mapbox://styles/solen32/cmpshru31000801s751e55735";
    const isBareStreets = style === "mapbox://styles/mapbox/streets-v12";

    const map = new mapboxgl.Map({
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
      // Uber-style clean detail on Fresha-colour streets: KEEP the drivable road
      // network (minor / service / street / arterials) so it reads as a real
      // map, but hide the clutter that felt "busy" — POI + transit swarm, road
      // labels, highway shields, building footprints, and pedestrian footpaths/
      // steps. Iterate ids so it's robust to renames; try/catch so a style
      // override lacking these layers fails silently. Skipped for a custom style.
      if (!isBareStreets) return;
      try {
        for (const layer of map.getStyle()?.layers ?? []) {
          if (/poi|transit|road-label|road-number|building|path|steps|pedestrian/i.test(layer.id)) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        }
        // Colours ≈ Fresha (streets-v12's own palette) with a light saturation
        // bump so it isn't flat. Canvas-only filter — the B&W price-pill markers
        // are DOM siblings of the canvas, so they stay untouched.
        map.getCanvas().style.filter = "saturate(1.15)";
      } catch (e) {
        console.warn("[MapView] streets styling skipped:", e);
      }
    });
    // A transient tile/style error must NOT flip to the fallback + tear the map
    // down (that drove the create→remove→recreate loop). Just log it.
    map.on("error", (e) => console.warn("Mapbox error:", e));

    // V3-D382: no NavigationControl — Fresha mobile has no zoom +/- buttons
    // (pinch / double-tap to zoom). The corner buttons were visual clutter.
    mapRef.current = map;

    // Show area search button on pan/zoom (debounced)
    if (enhanced) {
      const handleMove = () => {
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = setTimeout(() => {
          setShowAreaSearch(true);
        }, 500);
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

      const zoom = Math.floor(map.getZoom());
      const features = clusterIndex.getClusters([-180, -85, 180, 85], zoom);

      features.forEach((f) => {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        const props = f.properties as Record<string, unknown>;

        // Outer = mapbox positioning (NO transition on transform, or markers lag
        // during pans). Inner = visuals + hover/selection scale.
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        const inner = document.createElement("div");
        inner.style.fontFamily = "Geist, system-ui, -apple-system, sans-serif";
        inner.style.transition = "transform 150ms ease";

        if ((props as { cluster?: boolean }).cluster) {
          // Cluster bubble — ink-filled circle + white count. Click zooms in to
          // split it (Fresha behaviour).
          inner.style.cssText += `
            display:flex;align-items:center;justify-content:center;
            min-width:30px;height:30px;padding:0 9px;border-radius:9999px;
            font-size:13px;font-weight:700;background:#0A0A0A;color:#ffffff;
            border:2px solid #ffffff;box-shadow:0 2px 10px rgba(10,10,10,0.30);
          `;
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
          return;
        }

        // Individual salon — solid price pill, ink-filled when selected.
        const salonId = props.salonId as string;
        const minPrice = props.minPrice as number | null;
        const isSelected = salonId === selectedId;

        if (minPrice && minPrice > 0) {
          inner.style.cssText += `
            display:flex;align-items:center;justify-content:center;
            padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;
            white-space:nowrap;box-shadow:0 2px 8px rgba(10,10,10,0.16);
            background:${isSelected ? "#0A0A0A" : "#ffffff"};
            color:${isSelected ? "#ffffff" : "#0A0A0A"};
            border:1px solid ${isSelected ? "#0A0A0A" : "rgba(10,10,10,0.14)"};
          `;
          inner.textContent = `ab ${formatCurrency(minPrice)}`;
        } else {
          inner.style.cssText += `
            width:13px;height:13px;border-radius:50%;background:#0A0A0A;
            border:2px solid #ffffff;box-shadow:0 1px 4px rgba(10,10,10,0.20);
          `;
        }
        if (isSelected) inner.style.transform = "scale(1.12)";
        el.appendChild(inner);

        el.addEventListener("click", () => onSelectRef.current?.(salonId));
        el.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.15)"; });
        el.addEventListener("mouseleave", () => { inner.style.transform = isSelected ? "scale(1.12)" : "scale(1)"; });

        // V3-D382: no marker popup. The bottom-sheet card already shows the
        // salon's name / rating / price, so a popup bubble over the map was a
        // redundant "second" info display.
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.set(salonId, marker);
      });

      // Fit bounds — only when the SET of salons changes.
      const sig = filteredSalons.map((s) => s.id).join("|");
      if (filteredSalons.length > 0 && sig !== fittedSigRef.current) {
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
  }, [clusterIndex, selectedId]);

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

  const handleAreaSearch = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onAreaSearch) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    onAreaSearch({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setShowAreaSearch(false);
  }, [onAreaSearch]);

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {/* Map container */}
      <div ref={containerRef} className={`w-full h-full min-h-[280px] md:min-h-[400px] rounded-[12px] overflow-hidden ${mapError ? 'hidden' : ''}`} />

      {/* Fallback Error UI */}
      {mapError && (
        <div className="w-full h-full min-h-[280px] md:min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-s-bg-sunken rounded-[12px] border border-s-ink/5">
          <MapPin className="w-10 h-10 text-s-ink/40 mb-3" />
          <h3 className="font-heading text-lg font-semibold text-s-ink mb-1">Karte nicht verfügbar</h3>
          <p className="text-sm font-body text-s-ink/60 mb-4 max-w-sm">
            Die interaktive Karte kann momentan nicht geladen werden.
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Basel,+Switzerland"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-s-ink hover:brightness-[1.06] text-white text-[11px] font-heading uppercase tracking-[.06em] rounded-btn shadow-elevation-2 transition-[transform,filter] active:scale-[0.97]"
          >
            In Google Maps öffnen
          </a>
        </div>
      )}

      {/* "In diesem Bereich suchen" floating button */}
      {enhanced && showAreaSearch && onAreaSearch && !mapError && (
        <button
          onClick={handleAreaSearch}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-5 py-3.5 rounded-pill bg-white text-s-ink text-[11px] font-heading uppercase tracking-[.06em] shadow-warm-lg border border-s-ink/10 hover:bg-s-bg-surface transition-colors"
        >
          <MapPin size={14} className="text-s-ink/50" />
          In diesem Bereich suchen
        </button>
      )}
    </div>
  );
}
