"use client";

/**
 * /dev/search-model-b , R4-4 REWORK (owner 2026-07-03 #2): "make me a compare thingy
 * between the current and the not-current one. What the fuck is wrong with your search
 * bar? That shit is not what we have." The PRIOR version of this mockup invented a
 * search bar (a 4-segment category picker + a separate free-text field) that does not
 * exist anywhere in the real app , the owner rejected it outright.
 *
 * This rework does NOT invent anything. It extracts the REAL top-of-category-page
 * anatomy near-verbatim from its actual source files (see Grounded-in below) and
 * renders it TWICE, stacked as labelled phone frames: TODAY (the real bar, unchanged,
 * with a caption calling out the ambiguity bug) and MODEL B (the exact same real bar,
 * with only the two things Model B actually changes highlighted via caption call-outs,
 * no new control invented). Static/non-functional per the compare-page brief.
 *
 * lang-ok: the de-DE chrome strings inside the phone frames ("Jetzt geöffnet", "Preis",
 * "Für wen", "Beliebteste", "Suchen") are the REAL production copy, verbatim, because
 * this mockup's whole point is to prove it copies the real bar exactly (not a
 * translated approximation). All the ENGLISH review commentary (captions, callouts,
 * intro paragraph) is written in English per the mockup convention.
 *
 * Reference: the real /de/coiffeur top was screenshotted live and viewed before writing
 * this file (scratchpad real_category_top.png) , home icon-button, city chip, category
 * pills row, the two-line search bar (Suchen / Schweizweit + map icon), filter-pill row,
 * result-count + sort row. Every one of those regions below copies its REAL classes.
 *
 * The results card below matches the canonical feed-card signature (aspect-[3/2] photo
 * + name + star + meta + a matched-service row + "View store" off-ramp), same shape as
 * SalonResultCard.tsx variant="feed" / /dev/map-full's StoreCard.
 *
 * Exists-check: npm run exists search-model-b = 0 (the route itself only); the REAL
 *   surfaces this mirrors are SearchTemplate.tsx (search bar / filter pills / count+sort)
 *   and Header.tsx (home button / city chip / category pills row).
 * Grounded-in (exact source lines copied near-verbatim, 2026-07-03):
 *   - Header.tsx L557-590 (home icon button, h-10 w-10 rounded-[13px] border)
 *   - Header.tsx L267-286 (MobileCityChip: MapPin + city name + ChevronDown pill)
 *   - Header.tsx L765-796 (burger button, h-10 w-10 rounded-[13px] border, Menu/X swap)
 *   - Header.tsx L803-856 (HEADER_CATEGORIES pill row: h-10 rounded-full border px-4,
 *     active = border-s-bg-sunken bg-s-bg-sunken font-semibold, 22px PNG icon + 15px label)
 *   - SearchTemplate.tsx L1145-1230 (the two-line search bar: rounded-pill border-s-border
 *     bg-white px-3.5 py-2.5, line1 14px medium "Suchen", line2 12.5px grey city, map
 *     icon-button h-9 w-9 rounded-full border)
 *   - SearchTemplate.tsx L1245-1330 (filter-pill row: sliders circle h-9 w-9 rounded-full
 *     border, pills h-9 rounded-pill border pl-3.5 pr-2.5 text-13.5px)
 *   - SearchTemplate.tsx L1355-1428 (result count "N Salons" 16px semibold + sort
 *     dropdown pill 13px)
 *   - SalonResultCard.tsx feed variant (FeedCard below mirrors its real anatomy:
 *     aspect-[3/2] photo, frosted heart, name + star, meta lines, matched-service row,
 *     "View store" off-ramp)
 * reinvent-ok: gradient photo stand-ins (drift-ok, mockup placeholders) and the sample
 *   salon name/photo are placeholder content for a static compare mockup, not a new
 *   data source. Real tokens, Lucide, no CDN, no em-dash, no middot.
 */
import { useEffect, useState } from "react";
import {
  Home,
  Menu,
  MapPin,
  ChevronDown,
  Search,
  Map as MapIcon,
  SlidersHorizontal,
  Star,
  Heart,
  ChevronRight,
} from "lucide-react";
import { notFound } from "next/navigation";

// FROST_GLASS verbatim (lib/frost-glass.ts) , for the on-photo heart, matching the
// real SalonResultCard feed variant.
const FROST = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
} as const;

// Grounded in Header.tsx HEADER_CATEGORIES (icons under /public/icons/categories).
const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber", iconSrc: "/icons/categories/clippers.png" },
  { slug: "nails", label: "Nails", iconSrc: "/icons/categories/nails.png" },
];

// mockup gradient placeholders , stand-ins for real salon photos (drift-ok).
const PHOTOS = [
  "linear-gradient(135deg,#8a7f77 0%,#5c534d 55%,#3f3833 100%)", // drift-ok: mockup photo placeholder gradient
];

// Header.tsx L557-590 verbatim classes , home icon-button.
function HomeButton() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-s-border bg-white text-s-ink">
      <Home size={22} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// Header.tsx L267-286 verbatim classes , MobileCityChip (static, no dropdown open state).
function CityChip({ city }: { city: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-body text-[15px] font-semibold text-s-ink">
      <MapPin size={15} strokeWidth={2} aria-hidden className="text-s-ink-2" />
      <span>{city}</span>
      <ChevronDown size={14} strokeWidth={2} aria-hidden />
    </span>
  );
}

// Header.tsx L765-796 verbatim classes , burger button (static, closed state).
function BurgerButton() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-s-border bg-white text-s-ink">
      <Menu size={22} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// Header.tsx L803-856 verbatim classes , category-tab pill row.
function CategoryPillsRow({ active }: { active: string }) {
  return (
    <div
      role="tablist"
      aria-label="Kategorien"
      className="flex items-center gap-2 overflow-x-auto scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {CATEGORIES.map((c) => {
        const isActive = c.slug === active;
        return (
          <span
            key={c.slug}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 font-body text-[15px] leading-none ${
              isActive
                ? "border-s-bg-sunken bg-s-bg-sunken font-semibold text-s-ink"
                : "border-s-border bg-white font-medium text-s-ink"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.iconSrc} alt="" className="h-[22px] w-[22px] shrink-0 object-contain" aria-hidden />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

// SearchTemplate.tsx L1145-1230 verbatim classes , the two-line search bar. `line1` /
// `line2` are the ONLY thing Model B changes (query moves to line2 while the pill row
// keeps the category), everything else (shape, radius, padding, map icon) is identical.
function SearchBar({ line1, line2 }: { line1: string; line2: string | null }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[14px] font-medium text-s-ink">{line1}</span>
        {line2 && <span className="block truncate font-body text-[12.5px] text-s-ink-2">{line2}</span>}
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink">
        <MapIcon size={16} strokeWidth={2} aria-hidden />
      </span>
    </div>
  );
}

// SearchTemplate.tsx L1245-1330 verbatim classes , sliders circle + filter-pill row.
function FilterPillRow() {
  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink">
        <SlidersHorizontal size={16} strokeWidth={2} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none text-s-ink">
          Jetzt geöffnet
        </span>
        <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none text-s-ink">
          Preis <ChevronDown size={14} strokeWidth={2} className="opacity-50" aria-hidden />
        </span>
        <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none text-s-ink">
          Für wen <ChevronDown size={14} strokeWidth={2} className="opacity-50" aria-hidden />
        </span>
      </div>
    </div>
  );
}

// SearchTemplate.tsx L1355-1428 verbatim classes , result count + sort dropdown.
function CountAndSort({ count }: { count: number }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
        <span className="tabular-nums">{count}</span> Salons
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-pill border border-s-border bg-white px-3 py-1.5 font-body text-[13px] font-medium leading-none text-s-ink">
        Beliebteste <ChevronDown size={13} strokeWidth={2.25} aria-hidden />
      </span>
    </div>
  );
}

// Canonical feed-card signature (SalonResultCard.tsx variant="feed" / /dev/map-full
// StoreCard): aspect-[3/2] photo + frosted heart + name + star + meta + a matched
// service line + "View store" off-ramp.
function FeedCard({
  name,
  meta,
  rating,
  service,
}: {
  name: string;
  meta: string;
  rating: string;
  service: string;
}) {
  return (
    <div className="w-full">
      <div
        className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl shadow-elevation-2"
        style={{ backgroundImage: PHOTOS[0] }} // drift-ok: mockup photo placeholder gradient
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
        <p className="mt-1.5 truncate text-[13px] text-s-ink-2">Matched: {service}</p>
        <span className="mt-2 block text-[13px] font-semibold text-s-accent">
          View store <ChevronRight size={14} className="inline" />
        </span>
      </div>
    </div>
  );
}

// A labelled call-out chip pointing at a region (used only in MODEL B captions).
// >= 12px per LOCKFILE §2.5 legibility floor.
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-s-ink px-1.5 py-0.5 font-mono text-[12px] font-semibold leading-none text-white">
      {children}
    </span>
  );
}

// One labelled phone frame , the REAL top-of-category-page anatomy, static.
function PhoneFrame({
  label,
  caption,
  city,
  activeCategory,
  searchLine1,
  searchLine2,
  count,
}: {
  label: string;
  caption: string;
  city: string;
  activeCategory: string;
  searchLine1: string;
  searchLine2: string | null;
  count: number;
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-s-ink px-2 py-1 font-body text-[12px] font-bold text-white">
          {label}
        </span>
        <p className="font-body text-[12px] text-s-ink-3">{caption}</p>
      </div>
      <div className="w-full overflow-hidden rounded-[32px] border border-s-border bg-white p-3 shadow-elevation-2">
        {/* Header top row , home + city + burger. */}
        <div className="flex items-center justify-between gap-2">
          <HomeButton />
          <CityChip city={city} />
          <BurgerButton />
        </div>
        {/* Category pills row. */}
        <div className="mt-3">
          <CategoryPillsRow active={activeCategory} />
        </div>
        {/* Search bar. */}
        <div className="mt-3">
          <SearchBar line1={searchLine1} line2={searchLine2} />
        </div>
        {/* Filter-pill row. */}
        <FilterPillRow />
        {/* Result count + sort. */}
        <CountAndSort count={count} />
        {/* Results , canonical feed-card structure (aspect-3/2 + View store). */}
        <div className="mt-4">
          <FeedCard name="Atelier Haarwerk" meta="450 m, Coiffeur, Basel, 84 reviews" rating="4.8" service="Balayage" />
        </div>
      </div>
    </div>
  );
}

export default function SearchModelBMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-s-bg-base py-6">
      <div className="mx-auto w-full max-w-[460px] px-4">
        <p className="font-body text-[12px] text-s-ink-3">
          R4-4 rework: the search bar below is the REAL bar (SearchTemplate.tsx), copied verbatim.
          Model B changes nothing about its shape, only what text sits on which line, called out below.
        </p>

        <div className="mt-6 flex flex-col gap-10">
          {/* TODAY , the real bar, unchanged. Typing a service while a category pill is
              active writes ONE mixed param (?service=...), so the backend has to GUESS
              whether the typed text is a category name or a free-text service query. */}
          <div>
            <PhoneFrame
              label="Today"
              caption="Real bar. Typing 'Balayage' while Coiffeur is active writes one ambiguous param."
              city="Basel"
              activeCategory="coiffeur"
              searchLine1="Balayage"
              searchLine2="Basel"
              count={8}
            />
            <p className="mt-3 rounded-xl bg-s-bg-sunken px-3.5 py-3 font-body text-[12.5px] leading-relaxed text-s-ink-2">
              The bug: the bar carries one string for both "which category" and "what service".
              The backend guess-matches it against the category enum first, falling back to a
              free-text service search only if it misses, so a typed term that happens to look
              like a category slug (or a typo of one) silently mis-routes.
            </p>
          </div>

          {/* MODEL B , the IDENTICAL real bar. The only deltas: (1) line 2 of the search
              bar shows the TYPED SERVICE TEXT instead of the city, while the category stays
              on the pill row above it (2 sources of truth, 2 params); (2) tapping a pill
              never rewrites the text field. No new control, no segmented picker, no
              separate free-text field , same bar, same shape, same radius. */}
          <div>
            <PhoneFrame
              label="Model B"
              caption="Same bar. Category lives on the pill row; the bar's line 2 shows the typed text."
              city="Basel"
              activeCategory="coiffeur"
              searchLine1="Suchen"
              searchLine2="Balayage"
              count={8}
            />
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-s-bg-sunken px-3.5 py-3">
                <Callout>pill -&gt; ?category=coiffeur</Callout>
                <p className="font-body text-[12.5px] leading-relaxed text-s-ink-2">
                  The active Coiffeur pill is the only thing that writes the category param.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-s-bg-sunken px-3.5 py-3">
                <Callout>text -&gt; ?q=balayage</Callout>
                <p className="font-body text-[12.5px] leading-relaxed text-s-ink-2">
                  The bar's second line is the free-text service query, a separate param.
                </p>
              </div>
              <p className="rounded-xl bg-s-bg-sunken px-3.5 py-3 font-body text-[12.5px] leading-relaxed text-s-ink-2">
                Tapping a different category pill never rewrites the typed text (and vice
                versa), because the two are two separate URL params instead of one guessed
                string. No new search bar, no segmented control, no invented UI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
