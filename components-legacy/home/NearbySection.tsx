"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import SectionCarousel from "@/components-legacy/home/SectionCarousel";
import SalonCard from "@/components-legacy/SalonCard";
import { getPersistedCity } from "@/lib/city-cookie";

/**
 * NearbySection — Q51 (locked 2026-05-02) home section #2 (Nearby).
 *
 * Geolocation-aware salon strip. Reads the user's persisted city from
 * the existing city-cookie helper (set by useCityDetection on first
 * visit) and queries `/api/salons/recommendations` for nearby salons.
 *
 * Renders as a SectionCarousel — 2.5-up mobile / 3.5-up tablet / 4.5-up desktop.
 * Hidden entirely if no persisted city OR API returns 0 salons.
 */
export default function NearbySection() {
  const locale = useLocale();
  const [city, setCity] = useState<string | null>(null);
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Read persisted city after mount (avoids SSR/CSR mismatch)
  useEffect(() => {
    setCity(getPersistedCity());
  }, []);

  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/salons/recommendations?city=${city}&limit=8`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSalons(data?.salons ?? data?.items ?? []))
      .catch((err) => console.error("[NearbySection] /api/salons/recommendations:", err))
      .finally(() => setLoading(false));
  }, [city]);

  if (loading || salons.length === 0) return null;

  const cityLabel = city ? city.charAt(0).toUpperCase() + city.slice(1) : "Schweiz";

  return (
    <SectionCarousel
      eyebrow={`In ${cityLabel}`}
      headline="In deiner Nähe"
      seeAllHref={`/${city ?? "basel"}`}
    >
      {salons.map((s) => (
        <div key={s.id} className="snap-start shrink-0 w-[42vw] sm:w-[28vw] md:w-[22vw] lg:w-[19vw] max-w-[260px]">
          <SalonCard salon={s as any} locale={locale} variant="default" />
        </div>
      ))}
    </SectionCarousel>
  );
}
