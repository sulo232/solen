"use client";

import { useEffect, useState } from "react";
import { Star, Calendar, Users, MapPin } from "lucide-react";

/**
 * TrustStatsBanner — Q51 (locked 2026-05-02) section #8 of the home rhythm.
 *
 * Renders four key platform numbers as a stat-strip near the bottom of /:
 *   - Salons listed
 *   - Reviews collected
 *   - Cities served
 *   - Avg rating
 *
 * Numbers are fetched from /api/stats client-side (lightweight). Falls back
 * to the design baseline (2400 reviews, 5 cities, 4.7 avg, 200 salons) until
 * the API responds — this avoids a layout shift on first paint.
 *
 * Anatomy: cream #FAF7F3 bg, four stat tiles each with Anton tabular numeric
 * + Figtree label, line-coral lucide icon. NO decorative gradient. Per Q43,
 * numerics are tabular.
 */
const FALLBACK = {
  salons: 200,
  reviews: 2400,
  cities: 5,
  avg_rating: 4.7,
};

export default function TrustStatsBanner() {
  const [stats, setStats] = useState(FALLBACK);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStats({
          salons: d.salons ?? FALLBACK.salons,
          reviews: d.reviews ?? FALLBACK.reviews,
          cities: d.cities ?? FALLBACK.cities,
          avg_rating: d.avg_rating ?? FALLBACK.avg_rating,
        });
      })
      .catch((err) => console.error("[TrustStatsBanner] /api/stats fetch:", err));
  }, []);

  const tiles = [
    { key: "salons", label: "Salons", value: stats.salons.toLocaleString("de-CH"), icon: MapPin },
    { key: "reviews", label: "Bewertungen", value: stats.reviews.toLocaleString("de-CH"), icon: Star },
    { key: "cities", label: "Städte", value: String(stats.cities), icon: Calendar },
    { key: "rating", label: "Ø Bewertung", value: stats.avg_rating.toFixed(1), icon: Users },
  ];

  return (
    <section className="px-5 md:px-10 lg:px-20" aria-label="Plattform Statistik">
      <div className="rounded-[16px] px-4 py-5 sm:px-6 sm:py-6" style={{ background: "#FAF7F3" }}>
        <p className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-coral-text mb-3 text-center">
          Vertrauen in Zahlen
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map(({ key, label, value, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center text-center px-2 py-3 rounded-[10px] bg-white border border-s-ink/[0.04]"
            >
              <Icon size={16} className="text-s-coral mb-1.5" aria-hidden />
              <div
                className="font-heading text-[24px] sm:text-[28px] text-s-ink leading-[0.95] uppercase tabular-nums"
                style={{ letterSpacing: "0.01em" }}
              >
                {value}
              </div>
              <div className="mt-1 font-body text-[11px] text-s-ink/55">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
