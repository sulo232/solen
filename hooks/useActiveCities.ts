"use client";

import { useEffect, useState } from "react";
import type { ActiveCityRow } from "@/lib/cities";

/**
 * useActiveCities , CLIENT-side fetch of the live DB-active city set via the
 * public /api/cities endpoint (which reads `cities WHERE is_active`, see
 * app/api/cities/route.ts). Introduced in the 2026-07-04 city-rollout
 * refactor: every nav city picker (MobileMenu, DesktopCitySelector,
 * CityTopBar, Header's MobileCityChip) used to hardcode `CITY_SLUGS`/`CITIES`
 * from lib/cities.ts, so the admin Staedte toggle never actually changed what
 * a customer saw. This hook is the single shared fetch so all four consumers
 * stay in sync without duplicating the request.
 *
 * Falls back to `CITY_SLUGS`/`CITIES` (lib/cities.ts static fallback, the 3
 * launch cities) ONLY while loading or on a fetch error, so the picker is
 * never empty, but the LIVE DB set wins the moment it resolves.
 */
export function useActiveCities() {
  const [cities, setCities] = useState<ActiveCityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cities")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const rows: ActiveCityRow[] = items.map((it: Record<string, unknown>) => ({
          id: String(it.city ?? it.slug),
          slug: String(it.slug ?? it.city),
          name_de: String(it.name_de ?? it.name ?? it.city),
          name_en: String(it.name_en ?? it.name ?? it.city),
          name_fr: String(it.name_fr ?? it.name ?? it.city),
          name_it: String(it.name_it ?? it.name ?? it.city),
          display_order: Number(it.display_order ?? 0),
          latitude: Number(it.latitude ?? 0),
          longitude: Number(it.longitude ?? 0),
          radius_km: it.radius_km != null ? Number(it.radius_km) : null,
        }));
        setCities(rows);
      })
      .catch((err) => {
        console.error("[useActiveCities] failed to fetch /api/cities:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { cities, loading };
}
