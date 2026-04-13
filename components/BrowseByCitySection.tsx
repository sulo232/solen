"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, MapPin } from "lucide-react";

/**
 * BrowseByCitySection — Fresha-inspired city browser
 *
 * Clean white/light design with modern typography
 */

const CITIES = [
  { slug: "basel", name: "Basel", country: "Switzerland", count: 42, featured: true },
  { slug: "zurich", name: "Zurich", country: "Switzerland", count: 38, featured: false },
  { slug: "bern", name: "Bern", country: "Switzerland", count: 28, featured: false },
] as const;

const CATEGORIES = [
  { key: "coiffeur", label: "Hair Salons" },
  { key: "nails", label: "Nail Salons" },
  { key: "barbershop", label: "Barbers" },
  { key: "spa", label: "Spa & Wellness" },
  { key: "makeup", label: "Makeup" },
  { key: "waxing", label: "Waxing" },
] as const;

export default function BrowseByCitySection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const tNav = useTranslations("navigation");

  return (
    <section className="py-16 md:py-24 bg-[#101010]" aria-labelledby="city-section-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12">
          <h2 id="city-section-heading" className="text-3xl md:text-4xl font-bold text-white">
            {t("cities.title") || "Browse by city"}
          </h2>
          <p className="mt-3 text-white/60 text-lg">
            {t("cities.subtitle") || "Discover salons and spas in your area"}
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/${locale}/${city.slug}/coiffeur`}
              className="group relative p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {city.country}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">
                    {city.name}
                  </h3>
                  <p className="mt-2 text-white/50 text-sm">
                    {city.count} {t("cities.salonsCount") || "salons"}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
              </div>
              
              {city.featured && (
                <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-white text-[#101010] rounded-full">
                  {t("cities.popular") || "Popular"}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Category Links */}
        <div>
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
            {t("cities.browseBy") || "Browse by service"}
          </h3>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(({ key, label }) => (
              <Link
                key={key}
                href={`/${locale}/${key}`}
                className="px-4 py-2 text-sm font-medium text-white/70 border border-white/20 rounded-full hover:bg-white hover:text-[#101010] transition-all duration-200"
              >
                {tNav(key) || label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
