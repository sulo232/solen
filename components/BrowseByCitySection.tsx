"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const CITIES = [
  { slug: "basel",  name: "Basel",  count: 42 },
  { slug: "zurich", name: "Zürich", count: 38 },
  { slug: "bern",   name: "Bern",   count: 28 },
] as const;

const CATEGORY_KEYS = [
  "coiffeur", "nails", "barbershop", "spa", "makeup", "waxing",
] as const;

export default function BrowseByCitySection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const tNav = useTranslations("navigation");

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#100602" }}
      aria-labelledby="city-section-heading"
    >
      {/* Coral glow — top right */}
      <div
        className="pointer-events-none absolute -top-32 -right-20 w-[560px] h-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,98,74,.14) 0%, transparent 60%)" }}
        aria-hidden="true"
      />
      {/* Blue glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 w-[320px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(107,163,200,.06) 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative px-5 md:px-6 lg:px-10 xl:px-20 py-16 md:py-20">

        {/* Eyebrow with line */}
        <div className="flex items-center gap-4 mb-12">
          <span
            id="city-section-heading"
            className="font-heading text-[10px] font-bold uppercase tracking-[.16em]"
            style={{ color: "rgba(232,98,74,.7)" }}
          >
            {t("cities.title") || "Wo suchst du?"}
          </span>
          <div className="h-px flex-1 max-w-[200px]" style={{ background: "rgba(255,255,255,.05)" }} aria-hidden="true" />
        </div>

        {/* City list */}
        <div role="list">
          {CITIES.map((city, idx) => (
            <Link
              key={city.slug}
              href={`/${locale}/${city.slug}/coiffeur`}
              role="listitem"
              aria-label={`${city.name} — ${city.count} Salons`}
              className="group flex items-center py-5 relative"
              style={{
                borderTop: idx === 0 ? "1px solid rgba(255,255,255,.05)" : "none",
                borderBottom: "1px solid rgba(255,255,255,.05)",
                paddingLeft: "0px",
                transition: "padding-left 300ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "20px"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "0px"; }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-s-coral origin-bottom scale-y-0 group-hover:scale-y-100"
                style={{ transition: "transform 280ms cubic-bezier(0.23,1,0.32,1)" }}
                aria-hidden="true"
              />

              {/* City name */}
              <span
                className="font-display flex-1 group-hover:text-white"
                style={{
                  fontSize: "clamp(48px, 7vw, 76px)",
                  lineHeight: ".85",
                  letterSpacing: ".01em",
                  color: "rgba(255,255,255,.8)",
                  transition: "color 200ms ease",
                }}
              >
                {city.name}
              </span>

              {/* Count + arrow */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span
                  className="font-body text-xs tracking-[.04em]"
                  style={{ color: "rgba(255,255,255,.28)" }}
                >
                  {city.count} Salons
                </span>
                <span
                  className="flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-[.04em] text-s-coral opacity-0 -translate-x-2.5 group-hover:opacity-100 group-hover:translate-x-0"
                  style={{ transition: "opacity 200ms ease, transform 260ms cubic-bezier(0.23,1,0.32,1)" }}
                  aria-hidden="true"
                >
                  Entdecken <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-11">
          {CATEGORY_KEYS.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${key}`}
              className="px-3.5 py-1.5 rounded-pill font-heading text-xs font-medium"
              style={{
                background: "rgba(255,255,255,.05)",
                color: "rgba(255,255,255,.4)",
                border: "1px solid rgba(255,255,255,.07)",
                transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(232,98,74,.18)";
                el.style.color = "rgba(232,98,74,.95)";
                el.style.borderColor = "rgba(232,98,74,.28)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(255,255,255,.05)";
                el.style.color = "rgba(255,255,255,.4)";
                el.style.borderColor = "rgba(255,255,255,.07)";
              }}
              aria-label={tNav(key)}
            >
              {tNav(key)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
