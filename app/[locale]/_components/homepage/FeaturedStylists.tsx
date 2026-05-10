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
  specialty: string;
  city: string;
  rating: number;
  // Photo placeholder color (cat colorway) until real photos ship
  photoColor: string;
  initialColor: string;
}

const DEMO: Stylist[] = [
  { slug: "elena-rossi",   name: "Elena Rossi",    specialty: "Coiffeur",    city: "Basel",  rating: 4.9, photoColor: "#FFF1DD", initialColor: "#B5345A" },
  { slug: "marcus-chen",   name: "Marcus Chen",    specialty: "Barbershop",  city: "Zürich", rating: 5.0, photoColor: "#D8D6CB", initialColor: "#1A1209" },
  { slug: "sophie-dubois", name: "Sophie Dubois",  specialty: "Nails",       city: "Bern",   rating: 4.8, photoColor: "#CAE8FF", initialColor: "#B5345A" },
  { slug: "luca-bernasco", name: "Luca Bernasco",  specialty: "Spa",         city: "Lugano", rating: 4.9, photoColor: "#193120", initialColor: "#D9C9A8" },
  { slug: "anna-keller",   name: "Anna Keller",    specialty: "Coiffeur",    city: "Luzern", rating: 4.7, photoColor: "#FFF1DD", initialColor: "#B5345A" },
  { slug: "tobias-mueller",name: "Tobias Müller",  specialty: "Barbershop",  city: "St. Gallen", rating: 4.8, photoColor: "#D8D6CB", initialColor: "#1A1209" },
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
          return (
            <Link
              key={s.slug}
              href={`/stylist/${s.slug}`}
              aria-label={`${s.name}, ${s.specialty} in ${s.city}`}
              className="group flex shrink-0 snap-start flex-col items-center text-center w-[120px] md:w-[140px] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-4 focus-visible:rounded-full"
            >
              {/* Circular portrait — colored bg until real photos ship.
                  Soft hover ring transition + scale lift, ease-glide curve. */}
              <div className="relative">
                <div
                  className="grid h-[110px] w-[110px] md:h-[130px] md:w-[130px] place-items-center rounded-full ring-2 ring-white shadow-[0_4px_14px_rgba(4,51,56,0.10)] transition-[transform,box-shadow,ring-color] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:scale-[1.03] group-hover:shadow-[0_8px_20px_rgba(4,51,56,0.14)] group-hover:ring-s-brand/30"
                  style={{ backgroundColor: s.photoColor }}
                >
                  <span
                    className="font-display text-[42px] font-black"
                    style={{ color: s.initialColor }}
                    aria-hidden
                  >
                    {initial}
                  </span>
                </div>
                {/* Rating pill — bottom-right, slight overlap */}
                <span className="absolute -bottom-1 right-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-[0_2px_8px_rgba(4,51,56,0.10)] font-body text-[11px] font-bold text-s-ink">
                  <Star size={10} fill="#F3A864" stroke="none" aria-hidden />
                  {s.rating.toFixed(1)}
                </span>
              </div>
              {/* Name + specialty/city below */}
              <h3 className="mt-4 font-body text-[15px] font-bold text-s-ink leading-tight">
                {s.name}
              </h3>
              <p className="mt-1 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-s-ink-2">
                {s.specialty} · {s.city}
              </p>
            </Link>
          );
        })}
        </div>
      </SectionFrame>
    </Section>
  );
}
