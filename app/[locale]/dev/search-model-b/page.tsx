"use client";

/**
 * /dev/search-model-b , R4-4/A2 REWORK (owner 2026-07-04): "make mockup" , make the
 * Model B mockup INTERACTIVE so the owner can feel it (tap a category pill, type a
 * service, watch the two params stay independent) instead of reading a static caption.
 * ONE interactive mockup, not variations. The prior static TODAY/MODEL-B compare stays
 * as a small reference note above the interactive screen (owner: "keep or drop the
 * static compare , the interactive Model B is the deliverable").
 *
 * This does NOT invent a new bar. It extracts the REAL top-of-category-page anatomy
 * near-verbatim from its actual source files (see Grounded-in below) , the ONLY delta
 * from the real code is BEHAVIORAL: the category pill row and the search bar's line 2
 * are wired to independent React state instead of one shared param, so tapping a pill
 * never clears typed text and typing never reassigns the category. Same shape, same
 * radius, same classes as production; nothing added, nothing removed.
 *
 * lang-ok: the de-DE chrome strings inside the phone frame ("Jetzt geöffnet", "Preis",
 * "Für wen", "Beliebteste", "Suchen") are the REAL production copy, verbatim, because
 * this mockup's whole point is to prove it copies the real bar exactly (not a
 * translated approximation). All the ENGLISH review commentary (captions, callouts,
 * intro paragraph, param readout) is written in English per the mockup convention.
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
 * Exists-check: npm run exists search-model-b = 11 hits, all this same route (page
 *   sections + exported symbol) , EXTENDING the existing R4-4 static compare, not a new
 *   route. The REAL surfaces this interactive layer mirrors are SearchTemplate.tsx
 *   (search bar / filter pills / count+sort) and Header.tsx (home button / city chip /
 *   category pills row, incl. the 4th "spa" entry in HEADER_CATEGORIES L96-101 that the
 *   prior static version was missing).
 * Grounded-in (exact source lines copied near-verbatim, 2026-07-04):
 *   - Header.tsx L557-590 (home icon button, h-10 w-10 rounded-[13px] border)
 *   - Header.tsx L267-286 (MobileCityChip: MapPin + city name + ChevronDown pill)
 *   - Header.tsx L765-796 (burger button, h-10 w-10 rounded-[13px] border, Menu/X swap)
 *   - Header.tsx L96-101 + L803-856 (HEADER_CATEGORIES incl. spa + pill row: h-10
 *     rounded-full border px-4, active = border-s-bg-sunken bg-s-bg-sunken font-semibold,
 *     22px PNG icon + 15px label) , the ONLY change is `<Link>` -> `<button onClick>`
 *     since this mockup has no router, classes/markup otherwise identical
 *   - SearchTemplate.tsx L1220-1267 (the two-line search bar: rounded-pill border-s-border
 *     bg-white px-3.5 py-2.5, line1 14px medium "Suchen", line2 12.5px grey city, map
 *     icon-button h-9 w-9 rounded-full border) , line 2 becomes a real `<input>` sharing
 *     the identical text classes (14px/12.5px) instead of a static span
 *   - SearchTemplate.tsx L1311-1393 (filter-pill row: sliders circle h-9 w-9 rounded-full
 *     border, pills h-9 rounded-pill border pl-3.5 pr-2.5 text-13.5px)
 *   - SearchTemplate.tsx L1421-1428 (result count "N Salons" 16px semibold + sort
 *     dropdown pill 13px)
 *   - SalonResultCard.tsx feed variant (FeedCard below mirrors its real anatomy:
 *     aspect-[3/2] photo, frosted heart, name + star, meta lines, matched-service row,
 *     "View store" off-ramp)
 * reinvent-ok: gradient photo stand-ins (drift-ok, mockup placeholders) and the sample
 *   salon name/photo are placeholder content for a static feed card, not a new data
 *   source. The `?category=`/`?q=` param readout box is new UI but it is a DEV-ONLY
 *   diagnostic label (not part of the real bar), same pattern as a11y/debug overlays ,
 *   it is not presented as production chrome. Real tokens, Lucide, no CDN, no em-dash,
 *   no middot, >=12px.
 */
import { useEffect, useMemo, useState } from "react";
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

// Grounded in Header.tsx HEADER_CATEGORIES L96-101 (icons under /public/icons/categories).
const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber", iconSrc: "/icons/categories/clippers.png" },
  { slug: "nails", label: "Nails", iconSrc: "/icons/categories/nails.png" },
  { slug: "spa", label: "Spa", iconSrc: "/icons/categories/spa.png" },
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

// Header.tsx L803-856 verbatim classes , category-tab pill row. INTERACTIVE (A2): tapping
// a pill calls `onSelect`, which ONLY ever writes the category param , it never touches
// the typed text state in the parent (that is the whole Model B behavioral delta).
function CategoryPillsRow({ active, onSelect }: { active: string; onSelect: (slug: string) => void }) {
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
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(c.slug)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 font-body text-[15px] leading-none transition-colors duration-150 ease-glide ${
              isActive
                ? "border-s-bg-sunken bg-s-bg-sunken font-semibold text-s-ink"
                : "border-s-border bg-white font-medium text-s-ink hover:bg-s-bg-sunken"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.iconSrc} alt="" className="h-[22px] w-[22px] shrink-0 object-contain" aria-hidden />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

// SearchTemplate.tsx L1220-1267 verbatim classes , the two-line search bar. INTERACTIVE
// (A2): line 2 is a real `<input>` sharing the identical 12.5px grey classes, wired to
// its OWN `q` state , typing here never touches the category state above (the pill row
// owns category, this input owns free text; two params, two sources of truth).
function SearchBar({ line1, value, onChange }: { line1: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[14px] font-medium text-s-ink">{line1}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Balayage, Bart, Maniküre..."
          aria-label="Service suchen"
          className="block w-full truncate border-0 bg-transparent p-0 font-body text-[12.5px] text-s-ink-2 outline-none placeholder:text-s-ink-3 focus:text-s-ink"
        />
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

// The live param readout , a dev-only diagnostic strip showing the two params the
// interactive frame is currently composing, plus the resulting URL. Not part of the
// real bar; a debug label proving the behavioral delta (two independent params).
function ParamReadout({ category, q, locale = "de" }: { category: string; q: string; locale?: string }) {
  const composedUrl = useMemo(() => {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return `/${locale}/${category}${params}`;
  }, [category, q, locale]);

  return (
    <div className="rounded-xl border border-s-border bg-s-bg-sunken px-3.5 py-3">
      <p className="font-body text-[12px] font-semibold text-s-ink-3">Live params</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Callout>category={category}</Callout>
        <Callout>q={q.trim() || "(empty)"}</Callout>
      </div>
      <p className="mt-2 truncate font-mono text-[12.5px] font-medium text-s-ink">{composedUrl}</p>
    </div>
  );
}

// One labelled phone frame , the REAL top-of-category-page anatomy. INTERACTIVE
// (A2): category + q are lifted to the parent so the readout can show them live;
// this frame just wires the real components to that shared state.
function PhoneFrame({
  label,
  caption,
  city,
  activeCategory,
  onSelectCategory,
  q,
  onChangeQ,
  count,
}: {
  label: string;
  caption: string;
  city: string;
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  q: string;
  onChangeQ: (v: string) => void;
  count: number;
}) {
  const activeLabel = CATEGORIES.find((c) => c.slug === activeCategory)?.label ?? activeCategory;
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
        {/* Category pills row , tap sets activeCategory ONLY, never touches q. */}
        <div className="mt-3">
          <CategoryPillsRow active={activeCategory} onSelect={onSelectCategory} />
        </div>
        {/* Search bar , line 2 is a real input bound to q ONLY, never touches category. */}
        <div className="mt-3">
          <SearchBar line1={activeLabel} value={q} onChange={onChangeQ} />
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

  // Model B interactive state , TWO independent sources of truth. Tapping a category
  // pill writes ONLY `category`; typing writes ONLY `q`. Neither setter ever reads or
  // clears the other, which is the entire behavioral delta this mockup demonstrates.
  const [category, setCategory] = useState("coiffeur");
  const [q, setQ] = useState("Balayage");

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-s-bg-base py-6">
      <div className="mx-auto w-full max-w-[460px] px-4">
        <p className="font-body text-[12px] text-s-ink-3">
          A2: interactive Model B , tap a category pill, type in the search bar's second
          line, watch the two params below stay independent. Today (for reference): one
          shared field mixes "which category" and "what service", so the backend
          guess-matches it. Model B: category = pill tap (writes ?category=), service =
          typed text (writes ?q=), and neither ever rewrites the other.
        </p>

        <div className="mt-6">
          <PhoneFrame
            label="Model B"
            caption="Tap a pill, then type , the text stays put."
            city="Basel"
            activeCategory={category}
            onSelectCategory={setCategory}
            q={q}
            onChangeQ={setQ}
            count={8}
          />

          <div className="mt-3">
            <ParamReadout category={category} q={q} />
          </div>

          <p className="mt-3 rounded-xl bg-s-bg-sunken px-3.5 py-3 font-body text-[12.5px] leading-relaxed text-s-ink-2">
            Category = pill (?category). Service = what you type (?q). No guess-matching.
          </p>
        </div>
      </div>
    </main>
  );
}
