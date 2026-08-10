"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale } from "next-intl";
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
  /** Optional destination override. Defaults to /de/{slug}. Walk-in points at the
   *  existing barbershop search with the walk_in filter pre-applied (no bespoke route). */
  href?: string;
}

// V3-D152/153/154: Walk-in + Karte + Spa tiles → 3×2 grid, all six on first paint.
const CATEGORIES: Category[] = [
  { slug: "coiffeur",   label: "Coiffeur", icon: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber",   icon: "/icons/categories/clippers.png" },
  { slug: "nails",      label: "Nails",    icon: "/icons/categories/nails.png" },
  { slug: "map",        label: "Karte",    icon: "/icons/categories/map.png", href: "search?view=map" },
  { slug: "walk-in",    label: "Walk-in",  icon: "/icons/categories/walkin.png", href: "barbershop?walk_in=true" },
  { slug: "spa",        label: "Spa",      icon: "/icons/categories/spa.png" },
];

export default function MobileCategoriesRow({
  prefsOverride,
}: {
  /** Test seam — when provided, bypasses the live fetch (used by dev previews). */
  prefsOverride?: CustomerPrefs | null;
} = {}) {
  const locale = useLocale();
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  const picked = prefs?.categories ?? [];

  // Picked category-tiles lead (in pick order), then the rest in original order.
  // Picks without a matching tile drop out via the find()/filter.
  const pickedTiles = picked
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is Category => Boolean(c));
  const rest = CATEGORIES.filter((c) => !picked.includes(c.slug));
  const tiles = pickedTiles.length ? [...pickedTiles, ...rest] : CATEGORIES;

  return (
    // 2026-07-17 rhythm decision (TASTE_LOG.md, shipped as Section's mb-4 on
    // SectionHeader.tsx): mb-2 -> mb-4 so this section matches the primitive's
    // cadence. Own inner bottom pad is already py-2 (8), same as Section's, so
    // only the outer margin needed to move: 8 (own py-2) + 16 (mb-4) + 8 (next
    // Section's py-2 top) = 32 CSS visible gap on mobile.
    // 2026-08-01 (home-v3 mockup reconciliation, public/_mockups/home-v3/search-a.html): the
    // mockup's home state has no tile grid at all, Walk-in now has its own dedicated band further
    // down the same page (WalkInBand.tsx, unaffected by this change) so it is not stranded. Karte
    // stays reachable via Nearby.tsx's own "Karte öffnen" map teaser + SearchTemplate's map FAB;
    // it loses this one direct entry point, see page.tsx's I1 comment for the full note. Was
    // `md:hidden` (mobile-only, already invisible on desktop); now `hidden` outright so desktop
    // stays exactly as it was (never rendered there) and mobile matches it. Component kept intact,
    // not deleted, for revert.
    // RESTORED 2026-08-10, owner: "I also made, like, a category thingy, also really gone."
    // It was not gone. On 2026-08-01 this one class went from `md:hidden` (visible on a phone,
    // hidden on desktop) to `hidden` outright, to match a mockup, with the component left on disk
    // for revert. This is that revert. Back to `md:hidden`: he sees it on his phone, desktop stays
    // exactly as it has been, which is what the 08-01 change was protecting.
    <section aria-label="Kategorien" className="relative z-[1] mb-4 md:hidden">
      <div className="mx-auto max-w-[1280px] px-6 py-2">
        <h2 className="mb-3 font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          Für Sie
        </h2>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {tiles.map(({ slug, label, icon, iconClass, href: hrefOverride }) => {
            const isPick = picked.includes(slug);
            return (
              <Link
                key={slug}
                href={hrefOverride ? `/${locale}/${hrefOverride}` : `/${locale}/${slug}`}
                aria-label={label}
                className="group focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-3xl"
              >
                {/* Depth fix (2026-06-09, owner-approved): unselected tiles FLOAT = white + a soft, wide
                    shadow, not the old sinking gray (#F3F3F3). The card must be LIGHTER than the page with a
                    soft-wide (not tight) shadow, the council's core fix for "flat". */}
                <div
                  className={`
                    relative flex aspect-[1.15/1] flex-col items-center justify-between
                    rounded-3xl p-3
                    transition-[transform,box-shadow] duration-200 ease-glide
                    group-hover:-translate-y-[2px]
                    group-active:scale-[0.97] group-active:duration-[80ms]
                    ${isPick
                      ? "bg-white border-[1.5px] border-s-ink"
                      : "bg-white shadow-float"}
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
                  {/* RANGE_LAW A6 (2026-07-25): 13px -> 12px, merges this caption into the
                      same "meta" size bucket the page already uses (review counts), instead
                      of a size that only these six tile labels used.
                      mockup-ok: task-directed size merge (RANGE_LAW A6). */}
                  <span className="font-body text-[12px] font-medium leading-tight text-s-ink">
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
