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

      salons.forEach((salon) => {
        const isSelected = salon.id === selectedId;
        const minPrice = (salon as SalonCard & { min_price?: number }).min_price;

        // Price pin element
        const el = document.createElement("div");
        if (minPrice && minPrice > 0) {
          // Price badge pin
          el.className = [
            "flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all duration-150 whitespace-nowrap",
            isSelected
              ? "bg-coral text-white scale-110"
              : "bg-white text-dark border border-gray-200 hover:bg-teal hover:text-white hover:border-teal",
          ].join(" ");
          el.textContent = `ab ${minPrice}`;
        } else {
          // Dot pin (no price available)
          el.className = [
            "w-4 h-4 rounded-full border-2 border-white shadow-card cursor-pointer transition-all duration-150",
            isSelected ? "bg-coral scale-125" : "bg-teal hover:scale-110",
          ].join(" ");
        }
        el.addEventListener("click", () => onSelect?.(salon.id));

        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, maxWidth: "200px" }).setHTML(
          `<div style="padding:8px">
             <p style="font-weight:600;font-size:13px;color:#1A1A2E;margin:0 0 2px">${salon.name}</p>
             <p style="font-size:11px;color:#888;margin:0 0 4px">${salon.quartier}</p>
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
