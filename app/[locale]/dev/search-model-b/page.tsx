"use client";

/**
 * /dev/search-model-b , A2.refine (owner 2026-07-04): "the search bar must ACCURATELY
 * reflect the CURRENT real search bar, and it must be a FULL-SCREEN mockup." The prior
 * version was a small framed phone-compare with a dominant mono param box; this rework
 * (1) re-extracts the bar from the REAL SearchTemplate.tsx/Header.tsx source (the real
 * anatomy changed since the last pass , the bar is now a single-line-collapsing PILL,
 * the city chip sits CENTERED between home+burger, and count/sort live on their own
 * row below the filter pills, not inline), and (2) renders it as a genuine full-viewport
 * mobile page (not a small card) with a realistic multi-card results feed below, so it
 * reads exactly like /de/coiffeur , only the param readout is now a single subtle
 * caption strip instead of a big mono diagnostic block.
 *
 * INTERACTIVE Model B behavior is UNCHANGED from the prior version: tapping a category
 * pill writes `category` ONLY; typing in the bar's second line writes `q` ONLY. Neither
 * setter ever reads or clears the other , the whole point of Model B (today, one shared
 * field mixes "which category" and "what service"; Model B splits them into two
 * independent params).
 *
 * Grounded-in (exact source lines re-verified live 2026-07-04, Playwright screenshot of
 * /de/coiffeur at 412px, scratchpad a2_real_ref.png , measured search-bar box
 * 380x66.75px, category tabs h-10, filter pills h-9):
 *   - Header.tsx L575-595 (isTopLevel home-icon tile: h-10 w-10 rounded-[13px] border
 *     border-s-border bg-white text-s-ink, hover:border-s-ink)
 *   - Header.tsx L769-800 (burger button: h-10 w-10 rounded-[13px] border, Menu/X swap)
 *   - Header.tsx L630-662 (mobile middle slot: on a category route this is the CENTERED
 *     MobileCityChip, `flex min-w-0 flex-1 justify-center md:hidden` , NOT next to the
 *     home button, centered BETWEEN home and burger; prior mockup wrongly grouped it
 *     next to home)
 *   - Header.tsx L272-294 (MobileCityChip: MapPin + city name + ChevronDown pill,
 *     rounded-full px-3 py-2 text-[15px] font-semibold)
 *   - Header.tsx L803-857 (HEADER_CATEGORIES incl. spa + the category-tab row on its OWN
 *     row below the utility row: h-10 rounded-full border px-4, active = border-s-bg-sunken
 *     bg-s-bg-sunken font-semibold, 22px PNG icon + 15px label, right-edge mask fade)
 *   - SearchTemplate.tsx L1210-1301 (the search band: max-w-[680px] wrapper, the pill
 *     itself `flex w-full items-center gap-3 rounded-pill border border-s-border bg-white
 *     px-3.5 py-2.5`, Search icon 18px, line1 14px font-medium "Suchen"/query, line2
 *     12.5px text-s-ink-2 city/date, trailing map icon-button h-9 w-9 rounded-full border)
 *     , MEASURED live: 380 x 66.75px box at 412px viewport, matches the ~380x67 target.
 *   - SearchTemplate.tsx L1309-1400 (filter-pill row: far-left circle h-9 w-9 rounded-full
 *     border (Sliders/X swap), then scrolling pills h-9 rounded-pill border pl-3.5 pr-2.5
 *     text-[13.5px], selected = bg-s-bg-sunken text-s-ink font-semibold no border , owner
 *     2026-07-01 neutral-not-blue)
 *   - SearchTemplate.tsx L1421-1463 (count + sort row, its OWN row below filters, NOT
 *     inline with them: "{n} Salons" 16px semibold LEFT, sort dropdown pill 13px RIGHT)
 *   - SalonResultCard.tsx variant="card" (the DEFAULT render on /coiffeur per L513-519 +
 *     L1626 `variant={listLayout ? "list" : gridLayout ? "grid" : "card"}`): aspect-[3/2]
 *     rounded-[22px] photo + HeartButton (28px glass circle, 16px icon) top-right, name
 *     (CardName, 18px font-medium ink) + RatingStars(size="md") inline, meta line (CardMeta
 *     12.5px grey: category + city + distance), "ab X CHF" (PriceFrom, emphasis=bold) +
 *     Calendar next-slot text on one row.
 *
 * FULL-SCREEN (this rework's other requirement): every `/dev/*` route is nested under
 * `[locale]/layout.tsx`, which mounts the REAL global `<Header>` on every route , so a
 * plain in-flow full-width div would render its own header stacked BELOW the real one
 * (two headers, wrong). The established fix in this codebase (see results-full/page.tsx,
 * map-full/page.tsx) is a `createPortal` to `document.body`: `fixed inset-0 z-[9999]
 * overflow-y-auto bg-white`, which covers the real Header and reads as a genuine
 * full-viewport mobile page, exactly like /de/coiffeur. This mockup now follows that
 * SAME established pattern (not a new one). The interactive Model B behavior + the
 * live-params readout survive as a single subtle caption strip (one line, `text-[12px]`,
 * the LOCKFILE §2.5 legibility floor) pinned under the top bar, not a dominant mono box.
 *
 * Exists-check: npm run exists search-model-b -> 9 hits, all this same route (EXTENDING
 *   the existing R4-4/A2 interactive mockup, not a new route). The `createPortal` full-
 *   screen wrapper pattern itself is copied from the existing results-full/page.tsx +
 *   map-full/page.tsx (reuse, not invention).
 * reinvent-ok: gradient photo stand-ins + sample salon names/photos are placeholder
 *   content for the results feed, not a new data source (matches the prior version's
 *   convention). Real tokens, Lucide, no CDN, no em-dash, no middot, >=12px.
 * lang-ok: the de-DE chrome strings inside the page ("Jetzt geöffnet", "Preis", "Für wen",
 *   "Bewertung", "Beliebteste", "Suchen", "Basel") are the REAL production copy, verbatim ,
 *   this mockup's whole point is proving it copies the real bar exactly. The English
 *   review commentary (this header comment + the one caption line) stays English per the
 *   mockup convention.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";
import { notFound } from "next/navigation";

// FROST_GLASS verbatim (lib/frost-glass.ts) , for the on-photo heart, matching the
// real HeartButton's default frosted-circle treatment (28px circle / 16px icon).
const FROST = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
} as const;

// Grounded in Header.tsx HEADER_CATEGORIES L97-102 (icons under /public/icons/categories).
const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/scissors.png" },
  { slug: "barbershop", label: "Barber", iconSrc: "/icons/categories/clippers.png" },
  { slug: "nails", label: "Nails", iconSrc: "/icons/categories/nails.png" },
  { slug: "spa", label: "Spa", iconSrc: "/icons/categories/spa.png" },
];

// Grounded in SearchTemplate.tsx L492-504 filterPills (excluding "sort", which lives in
// the separate count+sort row below). Static labels/actives , enough pills to prove the
// row scrolls exactly like the real one (Playwright-measured 4 pills fit the 412px frame).
const FILTER_PILLS = [
  { key: "open_now", label: "Jetzt geöffnet", active: false },
  { key: "price", label: "Preis", active: false, chevron: true },
  { key: "gender", label: "Für wen", active: false, chevron: true },
  { key: "rating", label: "Bewertung", active: false, chevron: true },
];

// mockup gradient placeholders , stand-ins for real salon photos (drift-ok, matches
// the prior version's convention).
const PHOTOS = [
  "linear-gradient(135deg,#8a7f77 0%,#5c534d 55%,#3f3833 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#9b8b7a 0%,#6b5c4d 55%,#463b30 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#a89484 0%,#77675a 55%,#4d4038 100%)", // drift-ok: mockup photo placeholder gradient
];

// Header.tsx L575-595 verbatim classes (isTopLevel home tile).
function HomeButton() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-s-border bg-white text-s-ink">
      <Home size={22} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// Header.tsx L272-294 verbatim classes , MobileCityChip (static, closed state).
// Header.tsx L651-659: this chip is CENTERED in the flex-1 middle slot between the
// home tile and the burger , NOT grouped next to the home button.
function CityChip({ city }: { city: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-body text-[15px] font-semibold text-s-ink">
      <MapPin size={15} strokeWidth={2} aria-hidden className="text-s-ink-2" />
      <span>{city}</span>
      <ChevronDown size={14} strokeWidth={2.5} aria-hidden />
    </span>
  );
}

// Header.tsx L769-800 verbatim classes , burger button (static, closed state).
function BurgerButton() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-s-border bg-white text-s-ink">
      <Menu size={22} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

// Header.tsx L807-858 verbatim classes , category-tab pill row, its OWN row below the
// utility row. INTERACTIVE (A2): tapping a pill calls `onSelect`, which ONLY ever writes
// the category param , it never touches the typed text state in the parent (the whole
// Model B behavioral delta).
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

// SearchTemplate.tsx L1224-1298 verbatim classes , the search pill. MEASURED live
// against /de/coiffeur: 380 x 66.75px box at a 412px viewport (matches the real bar).
// INTERACTIVE (A2): line 2 is a real `<input>` sharing the identical 12.5px grey classes,
// wired to its OWN `q` state , typing here never touches the category state (line 1 shows
// the active category label, matching the real bar's "line1 = query-or-label" grammar).
function SearchBar({ line1, value, onChange }: { line1: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[14px] font-medium text-s-ink">
          {line1}
          {/* SearchTemplate.tsx L1244-1251 verbatim: an inert `w-0 overflow-hidden
              opacity-0` nested span the real bar always renders (a collapsed inline-city
              slot reserved for the scroll-shrink state). Kept here, WITH real text content
              (matching the real `{" "}{cityName}`), because it's the nested inline-block's
              own font-metrics box that adds ~5px to line1's total height , an empty span
              collapses differently and was the reason an earlier pass measured the bar 5px
              SHORT (61.75px) vs the real 66.75px. */}
          <span className="inline-block w-0 overflow-hidden font-normal text-s-ink-2 opacity-0">
            {" "}Basel
          </span>
        </span>
        {/* No `type="text"` , matches the real SearchOverlay.tsx input (L449). UPDATE
            2026-07-17: globals.css's base input law now also reaches bare (typeless)
            `<input>`s, not just typed ones, so omitting the type no longer exempts this
            field on its own; the `!border-0 !bg-transparent` below is what actually keeps
            the compact inline reset (font-size:100%, padding:0) and stops the law's
            min-height/16px-font/filled-gray/1rem-padding from ballooning this line. */}
        {/* mockup-ok: !important preserves the existing look, matches the real SearchOverlay.tsx
            carve-out against the widened base input law (globals.css, 2026-07-17, also sets
            min-height:48px/padding:16px/font-size:16px, exactly the "balloon this compact
            inline line" risk the comment above already named). english-ok: placeholder text
            unchanged, pre-existing German copy mirroring the real UI (V3-D-input-fill-2026-07-17). */}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Balayage, Bart, Maniküre..."
          aria-label="Service suchen"
          className="block w-full truncate !border-0 !bg-transparent !min-h-0 !p-0 font-body !text-[12.5px] text-s-ink-2 outline-none placeholder:text-s-ink-3 focus:text-s-ink"
        />
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink">
        <MapIcon size={16} strokeWidth={2} aria-hidden />
      </span>
    </div>
  );
}

// SearchTemplate.tsx L1319-1399 verbatim classes , far-left filter circle + scrolling
// filter-pill row.
function FilterPillRow() {
  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink">
        <SlidersHorizontal size={16} strokeWidth={2} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {FILTER_PILLS.map((p) => (
          <span
            key={p.key}
            className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-pill pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none ${
              p.active
                ? "border border-transparent bg-s-bg-sunken text-s-ink font-semibold"
                : "border border-s-border bg-white text-s-ink"
            }`}
          >
            {p.label}
            {p.chevron && <ChevronDown size={14} strokeWidth={2} className="opacity-50" aria-hidden />}
          </span>
        ))}
      </div>
    </div>
  );
}

// SearchTemplate.tsx L1424-1463 verbatim classes , result count + sort, ON THEIR OWN
// ROW below the filter pills (not inline with them , the prior mockup version merged
// these two rows, which the real page does not).
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

// SalonResultCard.tsx variant="card" (the DEFAULT render on /coiffeur) , full-width
// landscape card: aspect-[3/2] rounded-[22px] photo + 28px frosted heart, name (18px
// font-medium ink, CardName) + RatingStars(size="md", 13px star) inline, meta line
// (12.5px grey: category, city, distance), "ab X CHF" (bold) + next-slot text.
function ResultCard({
  name,
  meta,
  rating,
  price,
  nextSlot,
  photo,
}: {
  name: string;
  meta: string;
  rating: string;
  price: number;
  nextSlot: string;
  photo: string;
}) {
  return (
    <article className="relative w-full">
      <span className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full text-s-ink" style={FROST}>
        <Heart size={16} strokeWidth={2} aria-hidden />
      </span>
      <div
        className="relative aspect-[3/2] w-full overflow-hidden rounded-[22px] shadow-elevation-2"
        style={{ backgroundImage: photo }} // drift-ok: mockup photo placeholder gradient
      />
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-body text-[18px] font-medium leading-[1.15] tracking-[-0.015em] text-s-ink">
          {name}
        </p>
        <span className="flex shrink-0 items-center gap-[3px] text-[13px] tabular-nums text-s-ink-2">
          <Star size={13} className="fill-s-star" strokeWidth={0} aria-hidden /> {rating}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-body text-[13px] leading-[1.4] text-s-ink-2">{meta}</p>
        <p className="shrink-0 font-body text-[13px] leading-[1.4] text-s-ink-2">
          <span className="text-s-ink-2">ab </span>
          <span className="font-semibold text-s-ink">{price} CHF</span>
        </p>
      </div>
      <p className="mt-0.5 font-body text-[12px] font-medium leading-[1.35] text-s-ink">{nextSlot}</p>
    </article>
  );
}

const SAMPLE_CARDS = [
  { name: "Muse Beauty Studio", meta: "Rümelinsplatz 4, Basel", rating: "4.2", price: 107, nextSlot: "heute 15:30", photo: PHOTOS[0] },
  { name: "Atelier Haarwerk", meta: "Coiffeur, Basel, 450 m", rating: "4.8", price: 65, nextSlot: "heute 16:00", photo: PHOTOS[1] },
  { name: "Salon Rive Gauche", meta: "Coiffeur, Basel, 890 m", rating: "4.6", price: 80, nextSlot: "morgen 09:15", photo: PHOTOS[2] },
];

// Full-viewport screen , portalled to document.body (see FULL-SCREEN note above) so it
// covers the real global Header instead of stacking a second one beneath it.
function Screen() {
  // Model B interactive state , TWO independent sources of truth. Tapping a category
  // pill writes ONLY `category`; typing writes ONLY `q`. Neither setter ever reads or
  // clears the other, which is the entire behavioral delta this mockup demonstrates.
  const [category, setCategory] = useState("coiffeur");
  const [q, setQ] = useState("Balayage");

  const activeLabel = CATEGORIES.find((c) => c.slug === category)?.label ?? category;
  const composedUrl = useMemo(() => {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return `/de/${category}${params}`;
  }, [category, q]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-s-bg-base">
      {/* Single subtle caption strip , the ONLY dev-diagnostic element on the page,
          replacing the prior version's dominant mono param box. One line, 12px (the
          LOCKFILE §2.5 legibility floor), grey. */}
      <div className="mx-auto w-full max-w-[680px] px-4 pt-2">
        <p className="truncate font-mono text-[12px] text-s-ink-3">
          A2 Model B live: <span className="text-s-ink-2">?category={category}</span>{" "}
          <span className="text-s-ink-2">?q={q.trim() || "(empty)"}</span> -&gt; {composedUrl}
        </p>
      </div>

      {/* Header top row , home + CENTERED city chip + burger (Header.tsx L575-800). */}
      <div className="mx-auto mt-2 flex w-full max-w-[1280px] items-center justify-between gap-2 px-4">
        <HomeButton />
        <div className="flex min-w-0 flex-1 justify-center">
          <CityChip city="Basel" />
        </div>
        <BurgerButton />
      </div>

      {/* Category pills , own row below the utility row (Header.tsx L803-858). */}
      <div className="mx-auto mt-3 w-full max-w-[1280px] px-4">
        <CategoryPillsRow active={category} onSelect={setCategory} />
      </div>

      {/* Search band (SearchTemplate.tsx L1202-1301). */}
      <div className="mx-auto mt-3 w-full max-w-[680px] px-4">
        <SearchBar line1={activeLabel} value={q} onChange={setQ} />
      </div>

      {/* Filter chips row (SearchTemplate.tsx L1309-1400). */}
      <div className="mx-auto w-full max-w-[680px] px-4">
        <FilterPillRow />
      </div>

      {/* Result count + sort, its OWN row (SearchTemplate.tsx L1421-1463). */}
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <CountAndSort count={SAMPLE_CARDS.length} />
      </div>

      {/* Results feed , full-width feed-grammar cards (SalonResultCard variant="card"). */}
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pb-16 pt-4">
        {SAMPLE_CARDS.map((c) => (
          <ResultCard key={c.name} {...c} />
        ))}
      </div>
    </div>
  );
}

export default function SearchModelBMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
