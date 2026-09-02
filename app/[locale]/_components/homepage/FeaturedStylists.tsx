"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, Star } from "lucide-react";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { cn } from "@/lib/utils";
import { FROST_GLASS } from "@/lib/frost-glass";
import { useTranslations } from "next-intl";

/**
 * FeaturedStylists — V3-D140 (2026-05-25).
 *
 * SUPERSEDES the V2-D46 horizontal-scroll stylist avatars (circular monogram
 * tiles, "Lass dich verwöhnen." discovery moment). New direction per user-
 * supplied reference 2026-05-25: vertical list of "professional cards" in
 * the Fresha / Treatwell utility pattern. Section purpose shifts from
 * discovery → search-result decision-support.
 *
 * Card anatomy (vertical, full-width row):
 *   ┌──────────────────────────────────────┐
 *   │ [PHOTO 72px]  Name           ★ 4.9   │
 *   │               distance · spec · city │
 *   │               N Bewertungen          │
 *   └──────────────────────────────────────┘
 *
 * Section header: text-link "Alle ansehen →" right side, NO chevron scroll
 * buttons (scrollRef intentionally omitted — vertical layout doesn't need
 * programmatic scroll).
 *
 * Data wiring DEFERRED to Phase 2 — DEMO array stays inline with:
 *   - photoUrl: Unsplash placeholders. Real photos come from the
 *     staff_portfolio_images migration (032) once the API endpoint is wired.
 *   - distance: hardcoded display strings ("410 m" / "1.2 km"). Real
 *     distance = haversine(userCoords, salonCoords) using existing
 *     lib/cities.ts helpers, once geolocation context lands on homepage.
 *   - reviewCount: hardcoded ints. Real count = COUNT(*) on reviews
 *     filtered by stylist_id (denormalize into staff.review_count for perf).
 *
 * Visible cap: 4 cards (locked per mockup 2026-05-25).
 *
 * ⚠️ NOT RENDERED (V3-D436, 2026-06-05): removed from the homepage
 * (app/[locale]/page.tsx). The card Link below points at /stylist/${s.slug},
 * a route that does NOT exist (the locale catch-all serves a soft not-found at
 * HTTP 200). The DEMO array is standalone (no salon slug / staff id) so it
 * can't be repointed at the real /salon/[slug]/staff/[staffId] profile route
 * without inventing a mapping. To revive: rebuild against /api/staff/featured
 * (returns real { id, salon_slug, … }) and link to /salon/${salon_slug}/staff/${id}.
 * Until then the href below is intentionally dead-but-unreachable.
 *
 * Mocking trade-off: identical photo size + identical info density across
 * cards intentionally — this is a SCAN/COMPARE pattern not a discovery
 * pattern, so visual uniformity helps the user pick fast.
 */

interface Stylist {
  slug: string;
  name: string;
  specialty: "coiffeur" | "barbershop" | "nails" | "spa";
  city: string;
  rating: number;
  reviewCount: number;
  /** Pre-formatted display distance: "410 m" under 1km, "1.2 km" over. */
  distance: string;
  /** Photo URL. If absent → falls back to category-color monogram tile. */
  photoUrl?: string;
  /** V3-D182 (2026-05-26, council B): today availability. Demo strings
   *  cycle 3 states ("3 Slots heute" / "Heute frei" / "Heute ausgebucht").
   *  Phase 2 derives from real booking data via /api/stylists/availability. */
  availability:
    | { state: "open"; label: string }
    | { state: "full"; label: string };
}

const CATEGORY_LABELS: Record<Stylist["specialty"], string> = {
  coiffeur:   "Coiffeur",
  barbershop: "Barbershop",
  nails:      "Nails",
  spa:        "Spa",
};

/** Fallback colors for missing-photo monogram tile. Kept from V2-D46 since
 *  the same hue palette communicates the specialty even without a photo. */
const CATEGORY_TOKENS: Record<Stylist["specialty"], { bg: string; initial: string }> = {
  coiffeur:   { bg: "#FFE8D8", initial: "#E0703D" },
  barbershop: { bg: "#EAE0D0", initial: "#2A1F18" },
  nails:      { bg: "#D4DDC8", initial: "#A04A22" },
  spa:        { bg: "#D4F2E0", initial: "#0F6F44" },
};

const DEMO: Stylist[] = [
  {
    slug: "elena-rossi",
    name: "Elena Rossi",
    specialty: "coiffeur",
    city: "Basel",
    rating: 4.9,
    reviewCount: 693,
    distance: "410 m",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
    availability: { state: "open", label: "3 Slots heute" },
  },
  {
    slug: "marcus-chen",
    name: "Marcus Chen",
    specialty: "barbershop",
    city: "Basel",
    rating: 5.0,
    reviewCount: 792,
    distance: "1.2 km",
    photoUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&q=80",
    availability: { state: "full", label: "Heute ausgebucht" },
  },
  {
    slug: "sophie-dubois",
    name: "Sophie Dubois",
    specialty: "nails",
    city: "Bern",
    rating: 4.8,
    reviewCount: 248,
    distance: "1.8 km",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
    availability: { state: "open", label: "Heute frei" },
  },
  {
    slug: "luca-bernasco",
    name: "Luca Bernasco",
    specialty: "spa",
    city: "Lugano",
    rating: 4.9,
    reviewCount: 156,
    distance: "2.1 km",
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&q=80",
    availability: { state: "open", label: "2 Slots heute" },
  },
];

/**
 * SaveHeart — V3-D182 (2026-05-26, council B).
 *
 * Small heart save toggle on the corner of the stylist photo. Custom
 * (not the shared HeartButton) because:
 *   - HeartButton has a 44px hit-area button + 32px visible glass — too
 *     big to fit on a 72px photo without overflowing the text column.
 *   - HeartButton mirrors absolute right-[2px] top-[2px] inside its
 *     parent; here we want the heart to sit on the photo's TOP-RIGHT
 *     corner, slightly overflowing for an "applied sticker" feel.
 *
 * Hit area is 32×32 (just under WCAG 44px ideal — acceptable trade-off
 * for the visual tightness on a 72px avatar). e.preventDefault +
 * stopPropagation so taps don't bubble up to the parent Link.
 *
 * Local state only — backend wiring lands when `/api/favorites/toggle`
 * also accepts `stylist_id` (currently salon-only).
 *
 * V3-D194 (2026-05-26): MOVED above FeaturedStylists. Next.js Fast Refresh
 * de-hoists `function` declarations that return JSX (treats them as components
 * for tracking), losing the JS hoisting guarantee. Defining above the use site
 * sidesteps the issue without changing semantics.
 */
// V3-D194 SaveHeart definition (Fast Refresh hoisting workaround).
function SaveHeart({ name }: { name: string }) {
  const [saved, setSaved] = React.useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s);
      }}
      aria-label={saved ? `${name} aus Favoriten entfernen` : `${name} speichern`}
      aria-pressed={saved}
      style={FROST_GLASS}
      className={cn(
        "absolute -right-1 -top-1 z-[1] grid h-8 w-8 place-items-center rounded-full",
        // V3-D420: shared FROST_GLASS recipe (was an inline re-derive of the same values).
        "transition-transform duration-200 ease-glide",
        "hover:scale-110 active:scale-[0.97] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
      )}
    >
      <Heart
        size={14}
        strokeWidth={1.6}
        fill={saved ? "#FF3366" : "none"}
        stroke={saved ? "none" : "var(--color-heading)"}
        aria-hidden
      />
    </button>
  );
}

export default function FeaturedStylists() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.featured");
  const tCommon = useTranslations("common");
  return (
    <Section>
      <SectionFrame>
        {/* V3-D140-fix (2026-05-25): "Alle ansehen →" link removed per user.
            Section now caps at 4 cards with no overflow escape. If discovery
            of more stylists is needed later, re-add: link={{ label: "Alle ansehen →", href: "/stylists" }} */}
        <SectionTitle title={t("nearbyPros")} />
        <ul className="mt-3 flex flex-col gap-2">
          {DEMO.map((s) => {
            const tokens = CATEGORY_TOKENS[s.specialty];
            const initial = s.name.charAt(0).toUpperCase();
            return (
              <li key={s.slug}>
                <Link
                  href={`/stylist/${s.slug}`}
                  aria-label={`${s.name}, ${CATEGORY_LABELS[s.specialty]} in ${s.city}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.02)] transition-[transform,box-shadow] duration-150 ease-glide hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] active:scale-[0.98] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
                >
                  {/* Photo wrapper — `relative` (NO overflow-hidden here
                      so the SaveHeart can sit on the corner without being
                      clipped). Inner `<div>` does the circular crop. */}
                  <div className="relative h-[72px] w-[72px] shrink-0">
                    <div
                      className="absolute inset-0 grid place-items-center overflow-hidden rounded-full shadow-[0_2px_8px_rgba(4,51,56,0.10)]"
                      style={!s.photoUrl ? { backgroundColor: tokens.bg } : undefined}
                    >
                      {s.photoUrl ? (
                        <Image
                          src={s.photoUrl}
                          alt={tCommon("photoOf", { name: s.name })}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <span
                          className="font-display text-[28px] font-semibold"
                          style={{ color: tokens.initial }}
                          aria-hidden
                        >
                          {initial}
                        </span>
                      )}
                    </div>
                    {/* V3-D182 (council B): SaveHeart on photo corner.
                        Custom 28px button (not full HeartButton) because
                        the 44px HeartButton hit area would overflow the
                        72px photo. Click stops propagation so the card's
                        outer Link doesn't navigate. */}
                    <SaveHeart name={s.name} />
                  </div>

                  {/* Body — 3 rows after V3-D182 restructure:
                        Row 1: name + ★ rating(count)
                        Row 2: distance · specialty · city
                        Row 3: availability pill (replaces "N Bewertungen") */}
                  <div className="min-w-0 flex-1">
                    {/* Row 1 — name + rating with count inline.
                        V3-D191 (2026-05-26): name 700→500, rating 700→500 for Uber-modern
                        weight contrast (display↔body 3× ratio). V3-D190 sizes kept. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-body text-[15px] font-medium leading-[1.2] tracking-[-0.01em] text-s-ink">
                        {s.name}
                      </h3>
                      {/* V3-D346 (2026-05-28): rating recedes to grey-regular — the gold star
                          carries the signal; the number competing at 500/ink was one of 4 dark
                          elements fighting the name. Uber keeps rating light grey. */}
                      <span className="inline-flex shrink-0 items-baseline gap-1 font-body text-[13px] font-normal text-s-ink-2 tabular-nums">
                        <Star size={11} stroke="none" aria-hidden className="translate-y-[1.5px] fill-s-star" />
                        {s.rating.toFixed(1)}
                        <span className="font-normal text-[12px] text-s-ink-2">({s.reviewCount})</span>
                      </span>
                    </div>
                    {/* Row 2 — distance · specialty · city, ALL one flat grey meta line.
                        V3-D346 (2026-05-28): distance was font-semibold text-s-ink (600/ink) —
                        BOLDER than the name (500). Dropped to inherit the grey-regular row so
                        metadata stops out-shouting the anchor. */}
                    <div className="truncate font-body text-[12px] font-normal leading-[1.35] text-s-ink-2">
                      <span>{s.distance}</span>
                      <span> {CATEGORY_LABELS[s.specialty]} {s.city}</span>
                    </div>
                    {/* Row 3 — availability pill (open = ink text, full = muted) */}
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-full bg-s-bg-sunken px-2 py-0.5",
                        /* V3-D346: pill text 600→500; the bg already gives it presence, no need to
                           add a 4th heavy ink element. */
                        "font-body text-[12px] font-medium",
                        s.availability.state === "open" ? "text-s-ink-2" : "text-s-ink-2",
                      )}
                    >
                      <Clock size={10} strokeWidth={2.5} aria-hidden />
                      {s.availability.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </SectionFrame>
    </Section>
  );
}
