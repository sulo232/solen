"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";

/**
 * FeaturedStylists — V2-D46 (2026-05-09).
 *
 * Marketplace adaptation of LUMIÈRE's "Master Hands" stylist showcase.
 * Lumière showed ONE salon's team; Solen surfaces top-rated stylists
 * across the entire marketplace, each linking to their salon-detail page.
 *
 * Anatomy per stylist card:
 *   ┌──────────────────┐
 *   │   [circle photo] │ ← w/ rating badge bottom-right
 *   │       4.9★       │
 *   └──────────────────┘
 *   Elena Rossi
 *   COIFFEUR · BASEL
 *
 * Demo data inline; replace with `/api/stylists/featured` query in Phase 2.
 */

interface Stylist {
  slug: string;
  name: string;
  /** Lowercase category slug — looked up in CATEGORY_TOKENS for colorway */
  specialty: "coiffeur" | "barbershop" | "nails" | "spa";
  city: string;
  rating: number;
}

/** V3 Earthen Wellness Light cat tokens (V2-D60, CLAUDE.md §design system).
 *  Pre-2026-05-16 each stylist hardcoded V2-D15-3 era retired colors
 *  (cherry #B5345A, ice blue #CAE8FF, forest #193120) — replaced with
 *  current V3 cat colorways. Single source of truth keyed by specialty. */
const CATEGORY_TOKENS: Record<Stylist["specialty"], { photoColor: string; initialColor: string }> = {
  coiffeur:   { photoColor: "#FFE8D8", initialColor: "#E0703D" }, // peach + warm terracotta
  barbershop: { photoColor: "#EAE0D0", initialColor: "#2A1F18" }, // bone + ink
  nails:      { photoColor: "#D4DDC8", initialColor: "#A04A22" }, // sage-pale + terra-deep
  spa:        { photoColor: "#D4F2E0", initialColor: "#0F6F44" }, // emerald-subtle + emerald-mid
};

/** Display label per category. Inline so we don't re-import from CATEGORIES
 *  const (which lives in Header.tsx — to be consolidated to lib/constants
 *  per the audit's CATEGORIES drift finding). */
const CATEGORY_LABELS: Record<Stylist["specialty"], string> = {
  coiffeur:   "Coiffeur",
  barbershop: "Barbershop",
  nails:      "Nails",
  spa:        "Spa",
};

const DEMO: Stylist[] = [
  { slug: "elena-rossi",    name: "Elena Rossi",   specialty: "coiffeur",   city: "Basel",      rating: 4.9 },
  { slug: "marcus-chen",    name: "Marcus Chen",   specialty: "barbershop", city: "Zürich",     rating: 5.0 },
  { slug: "sophie-dubois",  name: "Sophie Dubois", specialty: "nails",      city: "Bern",       rating: 4.8 },
  { slug: "luca-bernasco",  name: "Luca Bernasco", specialty: "spa",        city: "Lugano",     rating: 4.9 },
  { slug: "anna-keller",    name: "Anna Keller",   specialty: "coiffeur",   city: "Luzern",     rating: 4.7 },
  { slug: "tobias-mueller", name: "Tobias Müller", specialty: "barbershop", city: "St. Gallen", rating: 4.8 },
];

export default function FeaturedStylists() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <Section>
      <SectionFrame>
        {/* V2-D46 + V2-D49f + V2-D49m: stylist row with scroll-arrow controls
            (mobile bare arrow, desktop circle scroll buttons). */}
        <SectionTitle
          title="Lass dich verwöhnen."
          link={{ label: "Alle Stilist:innen →", href: "/stylists" }}
          scrollRef={scrollRef}
        />
        <div
          ref={scrollRef}
          className={[
            "salon-card-stagger",
            "mt-3 flex gap-5 overflow-x-auto px-1 py-2",
            "[scrollbar-width:none]",
            "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
            "[&::-webkit-scrollbar]:hidden",
            "scroll-pl-1 md:scroll-pl-3",
            "[&>*:last-child]:mr-2",
          ].join(" ")}
        >
        {DEMO.map((s) => {
          const initial = s.name.charAt(0).toUpperCase();
          const tokens = CATEGORY_TOKENS[s.specialty];
          const label = CATEGORY_LABELS[s.specialty];
          return (
            <Link
              key={s.slug}
              href={`/stylist/${s.slug}`}
              aria-label={`${s.name}, ${label} in ${s.city}`}
              className="group flex shrink-0 snap-start flex-col items-center text-center w-[120px] md:w-[140px] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-4 focus-visible:rounded-full"
            >
              {/* Circular portrait — V3 cat-color bg until real photos ship.
                  Soft hover ring transition + scale lift, ease-glide curve. */}
              <div className="relative">
                <div
                  className="grid h-[110px] w-[110px] md:h-[130px] md:w-[130px] place-items-center rounded-full ring-2 ring-white shadow-[0_4px_14px_rgba(4,51,56,0.10)] transition-[transform,box-shadow,ring-color] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:scale-[1.03] group-hover:shadow-[0_8px_20px_rgba(4,51,56,0.14)] group-hover:ring-s-brand/30"
                  style={{ backgroundColor: tokens.photoColor }}
                >
                  <span
                    className="font-display text-[42px] font-black"
                    style={{ color: tokens.initialColor }}
                    aria-hidden
                  >
                    {initial}
                  </span>
                </div>
                {/* Rating pill — center-below circle, no overlap.
                    Pre-2026-05-16 used `-bottom-1 right-2` (overlap awkward
                    on small circles). Now sits cleanly under the avatar. */}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-[3px] shadow-[0_2px_8px_rgba(4,51,56,0.10)] font-body text-[11px] font-bold text-s-ink whitespace-nowrap">
                  <Star size={10} fill="#F3A864" stroke="none" aria-hidden />
                  {s.rating.toFixed(1)}
                </span>
              </div>
              {/* Name + specialty/city below.
                  V2-D66 (2026-05-16, Hayden move #7): dropped uppercase +
                  tracking on the meta line. Stylist name is already the
                  visual anchor (bold ink); the meta is a quiet caption,
                  not a section label. Sentence case + medium weight reads
                  cleaner + sits visually below the name as it should. */}
              <h3 className="mt-5 font-body text-[15px] font-bold text-s-ink leading-tight">
                {s.name}
              </h3>
              <p className="mt-1 font-body text-[12px] font-medium text-s-ink-2">
                {label} · {s.city}
              </p>
            </Link>
          );
        })}
        </div>
      </SectionFrame>
    </Section>
  );
}
