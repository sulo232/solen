"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface CityCard {
  slug: string;
  name: string;
  salonCount: number;
  gradient: string;
  textColor: string;
}

const CITIES: CityCard[] = [
  {
    slug: "basel",
    name: "Basel",
    salonCount: 42,
    gradient: "from-s-coral to-s-amber",
    textColor: "text-white",
  },
  {
    slug: "zurich",
    name: "Zürich",
    salonCount: 38,
    gradient: "from-s-blue to-indigo-600",
    textColor: "text-white",
  },
  {
    slug: "bern",
    name: "Bern",
    salonCount: 28,
    gradient: "from-s-sage to-teal-600",
    textColor: "text-white",
  },
];

const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur" },
  { slug: "nails", label: "Nägel" },
  { slug: "barbershop", label: "Barbershop" },
  { slug: "spa", label: "Spa" },
  { slug: "makeup", label: "Makeup" },
  { slug: "waxing", label: "Waxing" },
];

export default function BrowseByCitySection() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="font-heading font-semibold text-xl tracking-tight text-s-ink dark:text-s-dm-text" style={{ lineHeight: "1.1" }}>
          {t("cities.title") || "Salons in deiner Nähe"}
        </h2>
      </div>

      {/* City Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={`/${locale}/${city.slug}/coiffeur`}
            className="group relative overflow-hidden rounded-card h-[200px] flex flex-col items-end justify-end p-6 hover:-translate-y-[5px] hover:shadow-elevation-3 transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${city.gradient}`}
              aria-hidden="true"
            />

            {/* Content Overlay */}
            <div className="relative z-10 w-full text-center">
              <h3 className={`font-heading font-bold text-3xl ${city.textColor} mb-1`}>
                {city.name}
              </h3>
              <p className={`font-body text-sm ${city.textColor} opacity-90`}>
                {city.salonCount} {city.salonCount === 1 ? "Salon" : "Salons"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Category Sub-links */}
      <div className="space-y-4">
        {CITIES.map((city) => (
          <div key={city.slug} className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
            {CATEGORIES.map((category, idx) => (
              <div key={category.slug} className="flex items-center gap-2">
                <Link
                  href={`/${locale}/${city.slug}/${category.slug}`}
                  className="text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors duration-150"
                >
                  {category.label}
                </Link>
                {idx < CATEGORIES.length - 1 && (
                  <span className="text-s-ink/[0.08] dark:text-white/[0.08]">·</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
