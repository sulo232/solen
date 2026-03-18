"use client";

// Must be loaded with: dynamic(() => import('@/components/MapView'), { ssr: false })
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in env.

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { SalonCard } from "@/lib/types";

const BASEL_CENTER: [number, number] = [7.5886, 47.5596];

interface MapViewProps {
  salons: SalonCard[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function MapView({ salons, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers whenever salons or selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const render = () => {
      // Remove stale markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      // Sort salons so gold pins render last (on top)
      const sorted = [...salons].sort((a, b) => {
        const tierOrder: Record<string, number> = { dark: 0, grey: 1, teal: 2, gold: 3 };
        const aT = (a as any).solen_tier ?? "grey";
        const bT = (b as any).solen_tier ?? "grey";
        return (tierOrder[aT] ?? 1) - (tierOrder[bT] ?? 1);
      });

      sorted.forEach((salon) => {
        const isSelected = salon.id === selectedId;
        const minPrice = (salon as SalonCard & { min_price?: number }).min_price;
        const tier: string = (salon as any).solen_tier ?? "grey";

        // Tier-based pin styling
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
          // Teal/Grey: price badge pin
          const opacity = isGrey ? "0.75" : "1";
          el.style.cssText += `
            display:flex;align-items:center;justify-content:center;
            padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;
            white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.1);
            opacity:${opacity};
            background:${isSelected ? "#FF6B6B" : "white"};
            color:${isSelected ? "white" : "#1A1A2E"};
            border:1.5px solid ${isSelected ? "#FF6B6B" : "#E5E7EB"};
          `;
          el.textContent = `ab ${minPrice}`;
        } else {
          // Teal/Grey: dot pin (no price)
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
      if (salons.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        salons.forEach((s) => bounds.extend([s.longitude, s.latitude]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 500 });
      }
    };

    if (map.loaded()) {
      render();
    } else {
      map.once("load", render);
    }
  }, [salons, selectedId, onSelect]);

  // Pan + popup on selection change
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const salon = salons.find((s) => s.id === selectedId);
    if (!salon) return;
    mapRef.current.easeTo({ center: [salon.longitude, salon.latitude], zoom: 15, duration: 400 });
    const marker = markersRef.current.get(selectedId);
    if (marker && !marker.getPopup()?.isOpen()) marker.togglePopup();
  }, [selectedId, salons]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-card overflow-hidden" />
  );
}
