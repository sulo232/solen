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
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-ink/[0.08]">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="font-heading font-semibold text-[22px] tracking-tight text-s-ink" style={{ lineHeight: "1.1" }}>
          {t("cities.title") || "Salons in deiner Nähe"}
        </h2>
      </div>

      {/* City Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={`/${locale}/${city.slug}/coiffeur`}
            className="group relative overflow-hidden rounded-[16px] h-[200px] flex flex-col items-end justify-end p-6 hover:-translate-y-[5px] hover:shadow-[0_4px_12px_rgba(26,18,9,.06),0_16px_40px_rgba(26,18,9,.08)] transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${city.gradient}`}
              aria-hidden="true"
            />

            {/* Content Overlay */}
            <div className="relative z-10 w-full text-center">
              <h3 className={`font-heading font-bold text-[28px] ${city.textColor} mb-1`}>
                {city.name}
              </h3>
              <p className={`font-body text-[14px] ${city.textColor} opacity-90`}>
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
                  className="text-[13px] text-[#6A6A6A] hover:text-s-ink transition-colors duration-150"
                >
                  {category.label}
                </Link>
                {idx < CATEGORIES.length - 1 && (
                  <span className="text-s-ink/[0.08]">·</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
