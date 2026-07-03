"use client";

/**
 * /dev/search-model-b , A2 Model B shown IN A FULL-PAGE mockup of the real search/category page
 * (owner 2026-07-03: "let me see Model B but in a full page mockup of the real page"). English (mockup rule).
 *
 * Model B (recommended in /dev/category-flow): today one ambiguous bar writes ?service= vs ?category=
 * and the guess-matching breaks. Model B SEPARATES them , a 4-value category ENUM on a segmented row
 * (writes ?category=) + a free-text service field (writes ?q=). This mockup drops that composer into a
 * replica of the REAL search page anatomy so the owner reads it in context: search chrome at top, the
 * composer replacing the single bar, a filter-pill row, then the full-width feed result cards.
 *
 * Exists-check: npm run exists search-model-b = 0; real page = SearchTemplate.tsx (this mocks its anatomy
 *   with the Model B composer swapped in).
 * Grounded-in: SearchTemplate.tsx anatomy + searchCategories icons + SalonResultCard feed grammar.
 * reinvent-ok: the 4 English review labels (Hair/Barber/Nails/Spa) are OWNER-REVIEW labels for a /dev
 *   decision mockup; the REAL wiring (when Model B is picked) uses the canonical CATEGORY_PILLS
 *   (coiffeur/barbershop/nails/spa) from SearchTemplate + searchCategories icons, NOT a new data source.
 *   Same rationale as /dev/category-flow. Real tokens, Lucide, no CDN, no em-dash, no middot.
 */
import { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import { Search, Scissors, Gem, Leaf, Star, ChevronRight, ChevronDown, SlidersHorizontal, Heart, BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";

// Shared search-bar ease , the same curve SearchTemplate/booking use.
const EASE = [0.32, 0.72, 0, 1] as const;

// reinvent-ok: 4 English REVIEW labels for a /dev decision mockup; icons grounded in the canonical
// searchCategories.ts , Coiffeur/Barbershop = Scissors, Nails = Gem, Spa = Leaf. Real wiring uses CATEGORY_PILLS.
const CATS: { label: string; enumValue: string; Icon: typeof Scissors }[] = [
  { label: "Hair", enumValue: "coiffeur", Icon: Scissors },
  { label: "Barber", enumValue: "barbershop", Icon: Scissors },
  { label: "Nails", enumValue: "nails", Icon: Gem },
  { label: "Spa", enumValue: "spa", Icon: Leaf },
];

// FROST_GLASS verbatim (lib/frost-glass.ts) , for the on-photo heart.
const FROST = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
} as const;

// The 4-segment category picker , gray selected, the white pill MORPHS between
// segments via a shared layoutId (SAME animation as /dev/filter-menus Sort).
function CategorySegmented({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pillId = useId();
  return (
    <div className="flex gap-1 rounded-[14px] bg-s-bg-sunken p-1">
      {CATS.map((c) => {
        const on = c.enumValue === value;
        return (
          <button
            key={c.enumValue}
            type="button"
            onClick={() => onChange(c.enumValue)}
            aria-pressed={on}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 py-2.5 font-body text-[13px] leading-none transition-colors ${
              on ? "font-semibold text-s-ink" : "font-medium text-s-ink-2 hover:text-s-ink"
            }`}
          >
            {on && (
              <motion.span
                layoutId={`catPill-${pillId}`}
                transition={{ duration: 0.26, ease: EASE }}
                className="absolute inset-0 z-0 rounded-[10px] bg-white shadow-sm"
              />
            )}
            <c.Icon size={15} strokeWidth={2} className="relative z-[1] shrink-0" aria-hidden />
            <span className="relative z-[1]">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// A static (visual-only) filter pill for the row below the composer.
function FilterPill({ label, dropdown }: { label: string; dropdown?: boolean }) {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none text-s-ink">
      {label}
      {dropdown && <ChevronDown size={14} strokeWidth={2} className="opacity-50" aria-hidden />}
    </span>
  );
}

// A FULL-WIDTH feed-grammar result card , exactly the real SalonResultCard feed
// signature (aspect-[3/2] photo + name + star + meta + a matched-service line + View store).
function FeedCard({
  name,
  meta,
  rating,
  photo,
  service,
}: {
  name: string;
  meta: string;
  rating: string;
  photo: string;
  service: string;
}) {
  return (
    <div className="w-full">
      <div
        className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl shadow-elevation-2"
        style={{ backgroundImage: photo }} // drift-ok: mockup photo placeholder gradient
      >
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-s-ink" style={FROST}>
          <Heart size={16} />
        </span>
      </div>
      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[16px] font-bold text-s-ink">{name}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-s-ink">
            <Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> {rating}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{meta}</p>
        {/* matched-service line , the service that produced the match (?q=) */}
        <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] text-s-ink-2">
          <BadgeCheck size={13} className="shrink-0 text-s-ink-2" /> {service}
        </p>
        <span className="mt-2 block text-[13px] font-semibold text-s-accent">View store <ChevronRight size={14} className="inline" /></span>
      </div>
    </div>
  );
}

// mockup gradient placeholders , stand-ins for real salon photos.
const PHOTOS = [
  "linear-gradient(135deg,#8a7f77 0%,#5c534d 55%,#3f3833 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#7d8794 0%,#59616c 55%,#3b4048 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#9a8f86 0%,#726255 55%,#4b3f36 100%)", // drift-ok: mockup photo placeholder gradient
];

export default function SearchModelBMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState("coiffeur");
  const [query, setQuery] = useState("");
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-s-bg-base">
      {/* Phone-width column , the feed cards render full-width inside it (real-size rule). */}
      <div className="mx-auto w-full max-w-[412px]">
        {/* Thin caption , what Model B is, in context. */}
        <p className="px-4 pt-4 font-body text-[12px] text-s-ink-3">
          Model B in context , category and text are separate, the URL carries ?category= and ?q=.
        </p>

        {/* Top search chrome band , mirrors the real SearchTemplate sticky search area. */}
        <div className="px-4 pt-3">
          {/* Model B composer replaces the single ambiguous bar. */}
          <p className="mb-1.5 font-body text-[12px] font-semibold text-s-ink-3">Category</p>
          <CategorySegmented value={category} onChange={setCategory} />

          {/* Separate free-text service field underneath. */}
          <label className="mt-3 flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. balayage, black hair"
              className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-s-ink placeholder:text-s-ink-3 focus:outline-none"
            />
          </label>
          <p className="mt-1.5 font-body text-[12px] text-s-ink-3">
            Category writes ?category={category}. Text writes ?q={query || "..."}.
          </p>
        </div>

        {/* Filter-pill row , static visual chips like the real page. */}
        <div className="mt-4 flex items-center gap-2 px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink">
            <SlidersHorizontal size={16} strokeWidth={2} aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterPill label="Open now" />
            <FilterPill label="Deals" />
            <FilterPill label="Sort" dropdown />
            <FilterPill label="Price" dropdown />
          </div>
        </div>

        {/* Result count row , like the real page. */}
        <div className="mt-5 px-4">
          <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
            <span className="tabular-nums">18</span> salons in Basel
          </p>
        </div>

        {/* Results , FULL-WIDTH feed-grammar cards (real-size rule). */}
        <div className="mt-4 flex flex-col gap-6 px-4 pb-12">
          <FeedCard
            name="Muse Beauty Studio"
            meta="450 m, Coiffeur, Basel, 128 reviews"
            rating="4.9"
            photo={PHOTOS[0]}
            service="Matched: Balayage color"
          />
          <FeedCard
            name="Atelier Nord"
            meta="1.2 km, Coiffeur, Basel, 84 reviews"
            rating="4.8"
            photo={PHOTOS[1]}
            service="Matched: Balayage and gloss"
          />
          <FeedCard
            name="Studio Bellevue"
            meta="2.0 km, Coiffeur, Basel, 61 reviews"
            rating="4.7"
            photo={PHOTOS[2]}
            service="Matched: Color correction"
          />
        </div>
      </div>
    </main>
  );
}
