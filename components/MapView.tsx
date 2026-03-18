"use client";

// Must be loaded with: dynamic(() => import('@/components/MapView'), { ssr: false })
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in env.

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import type { SalonCard } from "@/lib/types";

const BASEL_CENTER: [number, number] = [7.5886, 47.5596];

const CATEGORY_CHIPS = [
  { key: "all", label: "Alle" },
  { key: "coiffeur", label: "Haare" },
  { key: "nails", label: "Nails" },
  { key: "spa", label: "Spa" },
  { key: "barbershop", label: "Barber" },
  { key: "makeup", label: "Kosmetik" },
  { key: "waxing", label: "Waxing" },
] as const;

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter salons by category
  const filteredSalons = activeCategory === "all"
    ? salons
    : salons.filter((s) => s.categories?.includes(activeCategory as any));

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: BASEL_CENTER,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
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
  }, [enhanced]);

  // Sync markers whenever salons, selection, or category change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const render = () => {
      // Remove stale markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      // Sort salons so gold pins render last (on top)
      const sorted = [...filteredSalons].sort((a, b) => {
        const tierOrder: Record<string, number> = { dark: 0, grey: 1, teal: 2, gold: 3 };
        const aT = (a as any).solen_tier ?? "grey";
        const bT = (b as any).solen_tier ?? "grey";
        return (tierOrder[aT] ?? 1) - (tierOrder[bT] ?? 1);
      });

      sorted.forEach((salon) => {
        const isSelected = salon.id === selectedId;
        const minPrice = (salon as SalonCard & { min_price?: number }).min_price;
        const tier: string = (salon as any).solen_tier ?? "grey";

        const isGold = tier === "gold";
        const isDark = tier === "dark";
        const isGrey = tier === "grey";

        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.style.transition = "transform 150ms ease";

        if (isGold) {
          // Gold tier: larger pin with gold styling + "Top Salon" label
          const wrapper = document.createElement("div");
          wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:2px;";

          const pin = document.createElement("div");
          pin.style.cssText = `
            display:flex;align-items:center;justify-content:center;
            padding:3px 8px;border-radius:9999px;font-size:12px;font-weight:700;
            white-space:nowrap;box-shadow:0 2px 8px rgba(212,175,55,0.35);
            transform:scale(1.3);z-index:10;
            background:${isSelected ? "#FF6B6B" : "#D4AF37"};
            color:white;border:2px solid white;
          `;
          pin.textContent = minPrice && minPrice > 0 ? `ab ${minPrice}` : "⭐";
          wrapper.appendChild(pin);

          const label = document.createElement("span");
          label.style.cssText = "font-size:9px;font-weight:700;color:#D4AF37;white-space:nowrap;text-shadow:0 0 3px white,0 0 3px white;";
          label.textContent = "⭐ Top Salon";
          wrapper.appendChild(label);

          el.appendChild(wrapper);
        } else if (isDark) {
          // Dark tier: small grey dot
          el.style.cssText += `
            width:10px;height:10px;border-radius:50%;
            background:#9CA3AF;border:1.5px solid white;
            box-shadow:0 1px 3px rgba(0,0,0,0.1);opacity:0.7;
          `;
        } else if (minPrice && minPrice > 0) {
          // Price badge pin with color coding
          const priceColor = minPrice < 50 ? "#22C55E" : minPrice <= 100 ? "#EAB308" : "#FF6B6B";
          const opacity = isGrey ? "0.75" : "1";
          el.style.cssText += `
            display:flex;align-items:center;justify-content:center;
            padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;
            white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.1);
            opacity:${opacity};
            background:${isSelected ? "#FF6B6B" : "white"};
            color:${isSelected ? "white" : priceColor};
            border:1.5px solid ${isSelected ? "#FF6B6B" : priceColor + "40"};
          `;
          el.textContent = `ab CHF ${minPrice}`;
        } else {
          // Dot pin (no price)
          const dotColor = isSelected ? "#FF6B6B" : "#38B2AC";
          const opacity = isGrey ? "0.75" : "1";
          el.style.cssText += `
            width:14px;height:14px;border-radius:50%;
            background:${dotColor};border:2px solid white;
            box-shadow:0 1px 4px rgba(0,0,0,0.12);opacity:${opacity};
          `;
        }

        el.addEventListener("click", () => onSelect?.(salon.id));
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

        const tierLabel = isGold ? "⭐ Top Salon · " : "";
        const popup = new mapboxgl.Popup({ offset: isGold ? 18 : 10, closeButton: false, maxWidth: "220px" }).setHTML(
          `<div style="padding:8px">
             <p style="font-weight:600;font-size:13px;color:#1A1A2E;margin:0 0 2px">${salon.name}</p>
             <p style="font-size:11px;color:#888;margin:0 0 4px">${tierLabel}${salon.quartier}</p>
             <p style="font-size:11px;color:#333;margin:0">⭐ ${salon.average_rating.toFixed(1)}${minPrice ? ` · ab CHF ${minPrice}` : ""}</p>
           </div>`
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([salon.longitude, salon.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(salon.id, marker);
      });

      // Fit bounds
      if (filteredSalons.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        filteredSalons.forEach((s) => bounds.extend([s.longitude, s.latitude]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 500 });
      }
    };

    if (map.loaded()) {
      render();
    } else {
      map.once("load", render);
    }
  }, [filteredSalons, selectedId, onSelect]);

  // Pan + popup on selection change
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const salon = filteredSalons.find((s) => s.id === selectedId);
    if (!salon) return;
    mapRef.current.easeTo({ center: [salon.longitude, salon.latitude], zoom: 15, duration: 400 });
    const marker = markersRef.current.get(selectedId);
    if (marker && !marker.getPopup()?.isOpen()) marker.togglePopup();
  }, [selectedId, filteredSalons]);

  const handleAreaSearch = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onAreaSearch) return;
    const bounds = map.getBounds();
    onAreaSearch({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setShowAreaSearch(false);
  }, [onAreaSearch]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Category filter chips */}
      {enhanced && (
        <div className="absolute top-3 left-3 right-12 z-10 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => { setActiveCategory(chip.key); setShowAreaSearch(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-medium shadow-sm transition-colors ${
                activeCategory === chip.key
                  ? "bg-teal text-white shadow-md"
                  : "bg-white/95 text-dark/70 hover:bg-white border border-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-card overflow-hidden" />

      {/* "In diesem Bereich suchen" floating button */}
      {enhanced && showAreaSearch && onAreaSearch && (
        <button
          onClick={handleAreaSearch}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2.5 rounded-pill bg-white text-dark text-sm font-medium shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <MapPin size={14} className="text-teal" />
          In diesem Bereich suchen
        </button>
      )}
    </div>
  );
}
