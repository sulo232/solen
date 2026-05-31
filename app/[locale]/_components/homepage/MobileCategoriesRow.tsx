"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCustomerPrefs, type CustomerPrefs } from "./useCustomerPrefs";

/**
 * MobileCategoriesRow — V3-D113 (2026-05-23). Curation added V3-D348.
 *
 * Uber-style 3-col tile grid of categories. Sits between Hero and FeedZone,
 * MOBILE-ONLY (md:hidden) — desktop already has the Services dropdown in
 * the header, mobile collapses categories behind the hamburger.
 *
 * V3-D348 curation (client-side, keeps the homepage's static cache): once the
 * user's onboarding picks load, the categories they chose jump to the front of
 * the grid and get an ink-ring "selected" marker. Logged-out / no-picks users
 * see the default order — no change, no flash beyond the initial reorder.
 *
 * Spec source: `_audits/screenshots/uber-explore-grid-spec.md`
 *   Measured: tile aspect 1.15:1, h-gap 3%, v-gap 4%, side padding 6%,
 *   tile bg #F3F3F3, label inside tile bottom-band.
 *
 * Icons: user-supplied 3D rendered PNGs at `public/icons/categories/`.
 */

interface Category {
  slug: string;
  label: string;
  /** Path under /public — next/image src */
  icon: string;
  /** Optional override when the source PNG has extra transparent padding. */
  iconClass?: string;
}

// V3-D152/153/154: Walk-in + Karte + Spa tiles → 3×2 grid, all six on first paint.
const CATEGORIES: Category[] = [
  { slug: "coiffeur",   label: "Coiffeur", icon: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber",   icon: "/icons/categories/clippers.png" },
  { slug: "nails",      label: "Nails",    icon: "/icons/categories/nails.png" },
  { slug: "map",        label: "Karte",    icon: "/icons/categories/map.png" },
  { slug: "walk-in",    label: "Walk-in",  icon: "/icons/categories/walkin.png" },
  { slug: "spa",        label: "Spa",      icon: "/icons/categories/spa.png" },
];

export default function MobileCategoriesRow({
  prefsOverride,
}: {
  /** Test seam — when provided, bypasses the live fetch (used by dev previews). */
  prefsOverride?: CustomerPrefs | null;
} = {}) {
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  const picked = prefs?.categories ?? [];

  // Picked category-tiles lead (in pick order), then the rest in original order.
  // Picks without a tile (makeup/waxing) drop out via the find()/filter.
  const pickedTiles = picked
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is Category => Boolean(c));
  const rest = CATEGORIES.filter((c) => !picked.includes(c.slug));
  const tiles = pickedTiles.length ? [...pickedTiles, ...rest] : CATEGORIES;

  return (
    <section aria-label="Kategorien" className="relative z-[1] mb-2 md:hidden">
      <div className="mx-auto max-w-[1280px] px-6 py-2">
        <h2 className="mb-3 font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          Für dich
        </h2>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {tiles.map(({ slug, label, icon, iconClass }) => {
            const isPick = picked.includes(slug);
            return (
              <Link
                key={slug}
                href={`/de/${slug}`}
                aria-label={label}
                className="group focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-3xl"
              >
                <div
                  className={`
                    relative flex aspect-[1.15/1] flex-col items-center justify-between
                    rounded-3xl p-3
                    transition-transform duration-200 ease-glide
                    group-hover:-translate-y-[2px]
                    group-active:scale-[0.97] group-active:duration-[80ms]
                    ${isPick
                      ? "bg-white border-[1.5px] border-s-ink"
                      : "bg-[#F3F3F3] group-hover:bg-[#EFEFEF]"}
                  `}
                >
                  {isPick && (
                    <span className="absolute right-2 top-2 grid h-[18px] w-[18px] place-items-center rounded-full bg-s-ink">
                      <Check size={11} strokeWidth={3} className="text-white" aria-hidden />
                    </span>
                  )}
                  <div className="relative grid w-full flex-1 place-items-center">
                    <Image
                      src={icon}
                      alt=""
                      width={64}
                      height={64}
                      className={`h-auto object-contain ${iconClass ?? "w-[60%] max-w-[64px]"}`}
                    />
                  </div>
                  <span className="font-body text-[13px] font-medium leading-tight text-s-ink">
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
