"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * City Selector — Component Map §16
 *
 * Design intent: "This section should feel premium and expansive because
 * it's showing the cities where Solen operates."
 *
 * - Full-width dark register: #1A1209 (Q23 s-ink — locked dark surface)
 * - Basel = active (coral left border permanent, 'Entdecken →' visible)
 * - Zürich/Bern = hover only shows coral border
 * - City font: Anton uppercase 36-48px (clamp viewport-responsive) per Q48
 * - Category pills: single row, no wrap, overflow-x auto
 * - Coral label header: Figtree 11px/700 uppercase tracked .22em (Q48 eyebrow)
 */

const CITIES = [
  { slug: "basel",  name: "BASEL",  count: 42, active: true },
  { slug: "zurich", name: "ZÜRICH", count: 38, active: false },
  { slug: "bern",   name: "BERN",   count: 28, active: false },
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
      style={{ background: "#1A1209" }}
      aria-labelledby="city-section-heading"
    >
      <div className="px-5 md:px-10 lg:px-20 py-12">

        {/* Q48 eyebrow — Figtree 700 tracked .22em uppercase coral */}
        <span
          id="city-section-heading"
          className="block font-body text-[11px] font-bold uppercase tracking-[.22em] mb-8 md:mb-12"
          style={{ color: "#F3A864" }}
        >
          {t("cities.title") || "Salons in deiner Nähe"}
        </span>

        {/* City list */}
        <div role="list">
          {CITIES.map((city, idx) => (
            <Link
              key={city.slug}
              href={`/${locale}/${city.slug}/coiffeur`}
              role="listitem"
              aria-label={`${city.name} — ${city.count} Salons`}
              className="group flex items-center justify-between py-4 relative"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderBottom: idx === CITIES.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                borderLeft: city.active ? "4px solid #E8624A" : "4px solid transparent",
                paddingLeft: city.active ? 12 : 0,
                transition: "padding-left 200ms ease, border-color 200ms ease",
              }}
              onMouseEnter={(e) => {
                if (!city.active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderLeft = "4px solid #E8624A";
                  el.style.paddingLeft = "12px";
                }
              }}
              onMouseLeave={(e) => {
                if (!city.active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderLeft = "4px solid transparent";
                  el.style.paddingLeft = "0px";
                }
              }}
            >
              {/* Q48 Anton uppercase city name — locked letter-spacing, leading 0.95 */}
              <span
                className="font-heading group-hover:text-white uppercase"
                style={{
                  fontSize: "clamp(36px, 6vw, 48px)",
                  lineHeight: 0.95,
                  letterSpacing: "0.01em",
                  color: city.active ? "#FFFFFF" : "rgba(255,255,255,0.85)",
                  transition: "color 200ms ease",
                }}
              >
                {city.name}
              </span>

              {/* Count + Entdecken link */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="font-body text-xs tabular-nums"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {city.count} Salons
                </span>
                {/* Q48 eyebrow — Figtree 700 tracked uppercase, hover-revealed for non-active */}
                <span
                  className={`font-body text-[11px] font-bold uppercase tracking-[.22em] ${
                    city.active
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{
                    color: "#F3A864",
                    transition: "opacity 200ms ease",
                  }}
                  aria-hidden={!city.active}
                >
                  {tNav("discover") || "Entdecken"} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Category pills — single row, no wrap */}
        <div
          className="flex gap-2 overflow-x-auto mt-8 md:mt-11"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            flexWrap: "nowrap",
          }}
        >
          {CATEGORY_KEYS.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${key}`}
              className="flex-shrink-0 font-body text-[13px] font-medium active:scale-[0.97] transition-[transform,background,color,border-color] duration-150"
              style={{
                padding: "5px 12px",
                borderRadius: 99,
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.6)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(232,98,74,0.18)";
                el.style.color = "rgba(232,98,74,0.95)";
                el.style.borderColor = "rgba(232,98,74,0.28)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "transparent";
                el.style.color = "rgba(255,255,255,0.6)";
                el.style.borderColor = "rgba(255,255,255,0.2)";
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
