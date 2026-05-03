"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * QuartiersGrid — Phase 8.5 / B3 (locked 2026-05-03).
 *
 * Reference: `public/solen-coral.html:1061-1083` (HTML) + 320-328 (CSS).
 * NEW component (not a refit) — the live `BrowseByCitySection` is the
 * cross-city picker (Basel / Zürich / Bern), which is a different concern.
 * Both coexist: cities at the top of the dark-register block, quartiers below.
 *
 * Anatomy:
 * - Section: dark-ink `#1A1209` bg (matches BrowseByCitySection's register)
 * - Eyebrow: yellow `#F2C144` per ref CSS `:321` `.qrt-sec .sec-eye{color:var(--yellow)}`
 *   (overrides the standard amber section eyebrow on this specific dark section)
 * - Headline: 2-line "Entdecke" / "Basel" — second line in brand color
 *   (post-Q64 = brand-green `#1B4D1B`; on dark-ink bg the contrast is ~3.4:1
 *   which passes AA-large but not AA-body. Acceptable for a 36-64px display word.)
 * - Sub-line: italic Figtree 15px, white-45% per ref `:1070`
 * - Grid: 4-col desktop, 2-col mobile (ref `:323` + `:396`)
 * - Tile: `rgba(255,255,255,.06)` bg, `rgba(255,255,255,.10)` border, 20px radius,
 *   Figtree 700 15px white name + 12px white-45% count + huge Anton 64px
 *   absolutely positioned watermark number bottom-right at 5% white
 * - Hover: bg up to 10%, translateY -3px, elevation-3 shadow
 *
 * Hardcoded Basel quartiers for pre-launch demo data; future iteration will
 * fetch from Supabase per active city. Last tile is the "more coming soon"
 * dashed-border placeholder per ref `:1080`.
 */

interface Quartier {
  slug: string;
  name: string;
  count: number;
  num: string;
}

// Basel quartiers per reference `:1073-1080`. Counts are demo placeholders.
const BASEL_QUARTIERS: Quartier[] = [
  { slug: "kleinbasel",   name: "Kleinbasel",   count: 12, num: "01" },
  { slug: "gundeldingen", name: "Gundeldingen", count: 8,  num: "02" },
  { slug: "grossbasel",   name: "Grossbasel",   count: 10, num: "03" },
  { slug: "st-johann",    name: "St. Johann",   count: 4,  num: "04" },
  { slug: "bruderholz",   name: "Bruderholz",   count: 3,  num: "05" },
  { slug: "iselin",       name: "Iselin",       count: 5,  num: "06" },
  { slug: "breite",       name: "Breite",       count: 4,  num: "07" },
];

export default function QuartiersGrid() {
  const locale = useLocale();
  const t = useTranslations("home") as any;

  return (
    <section
      className="relative overflow-hidden px-5 md:px-10 lg:px-20 py-16 md:py-20"
      style={{ background: "#1A1209" }}
      aria-labelledby="quartiers-heading"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow — yellow per ref CSS .qrt-sec .sec-eye override at line 321 */}
        <span
          className="block font-body font-bold uppercase mb-3"
          style={{ color: "#F2C144", fontSize: 11, letterSpacing: ".22em" }}
        >
          {t("quartiers.label") || "Dein Quartier"}
        </span>

        {/* 2-line color-split headline per ref `:1069`.
            "Entdecke" stays white (--bg on dark register), "Basel" in brand color.
            font-size clamp matches ref `:322`. */}
        <h2
          id="quartiers-heading"
          className="font-heading uppercase mb-4"
          style={{
            color: "#FFFFFF",
            fontSize: "clamp(36px, 5vw, 64px)",
            letterSpacing: "0.01em",
            lineHeight: 1,
          }}
        >
          {t("quartiers.discoverWord") || "Entdecke"}
          <br />
          <span style={{ color: "#1B4D1B" }}>
            {t("quartiers.cityName") || "Basel"}
          </span>
        </h2>

        {/* Sub-line — italic Figtree per ref `:1070` */}
        <p
          className="font-body italic max-w-[480px] mb-8"
          style={{ fontSize: 15, color: "rgba(250,246,239,0.45)", lineHeight: 1.8 }}
        >
          {t("quartiers.subline") ||
            "Salons direkt bei dir im Quartier — vom Kleinbasel bis ins Bruderholz."}
        </p>

        {/* Grid — 2-col mobile, 4-col desktop (ref `:323` + `:396`) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BASEL_QUARTIERS.map((q) => (
            <Link
              key={q.slug}
              href={`/${locale}/quartier/${q.slug}`}
              className="qrt-tile relative overflow-hidden rounded-[20px] cursor-pointer transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-elevation-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1209]"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                padding: 20,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              aria-label={`${q.name} — ${q.count} Salons`}
            >
              <div
                className="font-body font-bold"
                style={{ fontSize: 15, color: "#FFFFFF", marginBottom: 4 }}
              >
                {q.name}
              </div>
              <div className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                {q.count} Salons
              </div>
              {/* Big watermark numeral per ref `:328` */}
              <div
                className="font-heading absolute pointer-events-none"
                style={{
                  fontSize: 64,
                  right: -8,
                  bottom: -16,
                  color: "rgba(255,255,255,0.05)",
                  lineHeight: 1,
                }}
                aria-hidden
              >
                {q.num}
              </div>
            </Link>
          ))}

          {/* "More coming soon" dashed placeholder per ref `:1080` */}
          <div
            className="relative overflow-hidden rounded-[20px] cursor-default"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px dashed rgba(255,255,255,0.10)",
              padding: 20,
              opacity: 0.4,
            }}
            aria-hidden
          >
            <div className="font-body font-bold" style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
              {t("quartiers.morePlaceholder") || "Mehr folgen"}
            </div>
            <div className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              {t("quartiers.soon") || "bald"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
