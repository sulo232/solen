"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * CategoriesGrid — Phase 8.3 (A2 LOCKED 2026-05-03).
 *
 * Reference: `public/solen-coral.html:801-821` (HTML) + 212-220 (CSS).
 *
 * 6 category tiles in a 6-col grid (3-col on mobile per ref `:393`). Each
 * tile = solid per-category color + Anton uppercase name + count, with a
 * dark-ink gradient overlay at the bottom for legibility.
 *
 * Per-category colors are LOCKED via the categories grid in the reference
 * (lines 813-820) and are NOT subject to the Q64 brand pivot — they're
 * category-tinted accents, semantically distinct from brand color.
 */

interface CategoriesGridProps {
  /** Maps category key → live count (e.g. { coiffeur: 42, barber: 18 }). */
  categoryCounts?: Record<string, number>;
}

interface CategoryTile {
  key: string;
  name: string;
  countLabel: (count: number) => string;
  bg: string;
}

// Category keys + locked colors per reference categories grid (`:813-820`).
// Order matches reference exactly: Coiffeur → Barber → Nails → Spa → Makeup → Waxing.
const TILES: CategoryTile[] = [
  { key: "coiffeur",   name: "COIFFEUR", countLabel: (n) => `${n} Salons`,    bg: "#D4870A" },
  { key: "barber",     name: "BARBER",   countLabel: (n) => `${n} Shops`,     bg: "#4A1E3C" },
  { key: "nails",      name: "NAILS",    countLabel: (n) => `${n} Studios`,   bg: "#E8624A" },
  { key: "spa",        name: "SPA",      countLabel: (n) => `${n} Anbieter`,  bg: "#7BA688" },
  { key: "makeup",     name: "MAKEUP",   countLabel: (n) => `${n} Studios`,   bg: "#C9A96E" },
  { key: "waxing",     name: "WAXING",   countLabel: (n) => `${n} Salons`,    bg: "#6BA3C8" },
];

export default function CategoriesGrid({ categoryCounts = {} }: CategoriesGridProps) {
  const locale = useLocale();
  const t = useTranslations("home") as any;

  return (
    <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 64 }} aria-labelledby="categories-heading">
      <div className="max-w-[1200px] mx-auto">
        {/* Header — eyebrow + headline + "Alle ansehen" link, per ref `:805-810`.
            Eyebrow color is AMBER per ref CSS `.sec-eye{color:var(--amber)}` line 210
            (all section eyebrows use amber regardless of light/dark register). */}
        <span
          className="block font-body font-bold uppercase mb-2"
          style={{ color: "#F3A864", fontSize: 11, letterSpacing: ".22em" }}
        >
          Kategorien
        </span>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-7">
          <h2
            id="categories-heading"
            className="font-heading text-s-ink uppercase"
            style={{ fontSize: 28, letterSpacing: "0.01em", lineHeight: 1.05, marginBottom: 0 }}
          >
            Was suchst du?
          </h2>
          <Link
            href={`/${locale}/discover`}
            className="font-body font-medium text-s-ink hover:underline transition-colors"
            style={{ fontSize: 14 }}
            aria-label="Alle Kategorien ansehen"
          >
            Alle ansehen →
          </Link>
        </div>

        {/* Grid — 6 cols desktop, 3 cols mobile per ref `:393` */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {TILES.map((tile) => {
            const count = categoryCounts[tile.key] ?? 0;
            return (
              <Link
                key={tile.key}
                href={`/${locale}/${tile.key}`}
                className="group relative aspect-square overflow-hidden rounded-[20px] border border-s-ink/[0.08] cursor-pointer transition-[border-color,transform,filter] duration-[250ms] ease-out hover:border-s-coral/40 hover:scale-[1.04] hover:rotate-[-1deg] hover:saturate-[1.1] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
                aria-label={`${tile.name} — ${count > 0 ? tile.countLabel(count) : ""}`}
              >
                {/* Solid color background — per-category, NOT brand. `group` on parent Link
                    enables the bg-zoom hover effect to fire on tile hover (ref CSS :217). */}
                <div
                  className="absolute inset-0 transition-transform duration-[400ms] ease-out group-hover:scale-[1.07]"
                  style={{ background: tile.bg }}
                />
                {/* Bottom-fade label band — dark-ink gradient over the color for legibility */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-3"
                  style={{ background: "linear-gradient(to top, rgba(26,18,9,0.68) 0%, transparent 100%)" }}
                >
                  <div
                    className="font-heading uppercase text-white"
                    style={{ fontSize: 20, letterSpacing: ".03em", lineHeight: 1, marginBottom: 2 }}
                  >
                    {tile.name}
                  </div>
                  {count > 0 && (
                    <div
                      className="font-body font-semibold uppercase"
                      style={{ fontSize: 10, letterSpacing: ".1em", color: "rgba(255,255,255,0.62)" }}
                    >
                      {tile.countLabel(count)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
