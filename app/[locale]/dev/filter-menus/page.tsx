"use client";

/**
 * /dev/filter-menus , per-filter bottom-sheet gallery (owner 2026-07-03: "i mean each sheetS,
 * not the big filter thing"). The real app opens a SMALL bottom sheet for ONE filter when its
 * chip is tapped (SearchTemplate `openSection(pill.key)` -> FilterSheet `section=`), NOT one big
 * stacked panel. So this mockup shows EACH filter as its own compact bottom-sheet card.
 *
 * Not-a-salon-card: this mockup renders FILTER bottom-sheets (Sort/Rating/Price/Amenities chips),
 *   not salon result cards. The Star icon + "Woman-owned" label are an amenity filter chip
 *   (salons.woman_owned boolean facet) and a rating chip, NOT a salon card. No SalonResultCard here.
 *
 * Real filter set (grounded in SearchTemplate.tsx filterPills + TOGGLE_PILLS + FilterSheet.tsx):
 *   Sort         -> segmented single-select; white pill MORPHS between options     [openSection]
 *   Rating       -> swipeable BAR over 5 stops Any/3.0/3.5/4.0/4.5 (min_rating)    [openSection]
 *   Price        -> slider, CHF 20..300 max-price (min_price/max_price)            [openSection]
 *   For whom     -> chips Alle / Damen / Herren / Non-binary (gender)              [openSection]
 *   Amenities    -> chip WRAP, 9 boolean facets (AMENITY_OPTIONS)                  [openSection]
 *   Open now + Deals -> INLINE toggle chips (TOGGLE_PILLS), NOT sheets             [toggle]
 *
 * ROUND 3 (owner 2026-07-03): Price/For-whom/Amenities APPROVED (untouched). Sort
 * gains a morphing white pill (motion/react shared layoutId, EASE). Availability +
 * Deals lose their sheets -> one "Inline pills (no sheet)" section (Open now + Deals
 * toggle chips). Rating chips -> a swipeable discrete bar. See _plans/SEARCH_MAP_OVERHAUL.md R3-A1.
 *
 * Owner-locked treatment (2026-07-02/03):
 *   - selected chip/segment = GRAY (bg-s-bg-sunken + border, ink text), never black, never blue.
 *   - Amenities KEEP the chip pattern (a wrap of pills), NOT a checklist of rows.
 *   - Price KEEPS the slider (ink track + ink thumb).
 *   - Apply = NEUTRAL OUTLINE (bg-white + border-s-border + text-s-ink, pill) , NOT black
 *     ("i dont like black buttons"; same non-black choice as the category-flow Model B mockup).
 *   - Reset = plain ghost text.
 * Exists-check: `npm run exists filter-menus` = the route itself only; the REAL sheet =
 *   _components/search/FilterSheet.tsx (this mockup restyles its per-section anatomy as separate sheets).
 * Grounded-in: FilterSheet.tsx SheetChip/PriceSlider recipes + SearchTemplate AMENITY_OPTIONS/SORT_VALUES.
 * Real tokens, Lucide, no CDN, English only, no em-dash, no middot.
 */
import { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import {
  Star,
  Wifi,
  Bus,
  Baby,
  Dog,
  Heart,
  Home,
  GraduationCap,
  Accessibility,
  X,
} from "lucide-react";
import { notFound } from "next/navigation";

// Shared search-bar ease , same curve the real SearchTemplate/booking flow use.
const EASE = [0.32, 0.72, 0, 1] as const;

// ── shared bits ──────────────────────────────────────────────────────────────

// A single compact bottom sheet: grabber + close + title + control + footer.
// Footer: Reset ghost text (left) + neutral-outline Apply (right, NOT black).
function SheetCard({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.12)]">
      {/* grabber , LOCKFILE §16.1 (38x4.5 bg-s-border pill, 6px from top) */}
      <div className="flex justify-center pb-1 pt-1.5">
        <span className="h-[4.5px] w-[38px] rounded-full bg-s-border" />
      </div>
      <div className="flex items-center justify-between px-5 pb-1 pt-1">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink">
          <X size={16} />
        </span>
        <p className="font-heading text-[16px] font-bold text-s-ink">{title}</p>
        <span className="w-9" aria-hidden />
      </div>
      <div className="px-5 pb-4 pt-3">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-s-border px-5 py-3.5">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md px-1 font-body text-[14px] font-medium text-s-ink transition-colors hover:text-s-ink-2"
        >
          Reset
        </button>
        {/* Neutral OUTLINE apply , owner: no black buttons (Model B choice). */}
        <button
          type="button"
          className="rounded-pill border border-s-border bg-white px-7 py-2.5 font-body text-[15px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// Owner-locked selected chip = GRAY sunken (bg-s-bg-sunken + border-transparent + ink), never black/blue.
// Mirrors FilterSheet.tsx SheetChip active recipe.
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-pill px-3.5 font-body text-[14px] leading-none transition-colors ${
        active
          ? "border border-transparent bg-s-bg-sunken font-semibold text-s-ink"
          : "border border-s-border bg-white font-medium text-s-ink hover:bg-s-bg-sunken"
      }`}
    >
      {children}
    </button>
  );
}

// Single-select segmented track = white pill on a sunken track (gray selected), never black.
// The white selected pill MORPHS/SLIDES between segments via a shared layoutId
// (motion/react) , the absolute white bg animates its position + size when the
// value changes, so the pill glides rather than pops (owner R3-A1.sort).
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  // useId keeps the layoutId unique per Segmented instance (safe if reused).
  const pillId = useId();
  return (
    <div className="flex gap-1 rounded-[12px] bg-s-bg-sunken p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={`relative flex-1 whitespace-nowrap rounded-[9px] px-2 py-2 text-center font-body text-[12.5px] leading-none transition-colors ${
              on ? "font-semibold text-s-ink" : "font-medium text-s-ink-2 hover:text-s-ink"
            }`}
          >
            {/* The morphing white pill , one shared element that slides between
                segments. transition tuned to the locked EASE + a 0.26s glide. */}
            {on && (
              <motion.span
                layoutId={`sortPill-${pillId}`}
                transition={{ duration: 0.26, ease: EASE }}
                className="absolute inset-0 z-0 rounded-[9px] bg-white shadow-sm"
              />
            )}
            <span className="relative z-[1]">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── the seven individual sheets ──────────────────────────────────────────────

function SortSheet() {
  const [v, setV] = useState("rating");
  return (
    <SheetCard title="Sort" onReset={() => setV("rating")}>
      <Segmented
        value={v}
        onChange={setV}
        options={[
          { value: "rating", label: "Rating" },
          { value: "price", label: "Price" },
          { value: "newest", label: "Newest" },
          { value: "distance", label: "Distance" },
        ]}
      />
    </SheetCard>
  );
}

// Rating = a SWIPEABLE BAR over 5 discrete stops (owner R3-A1.rating). A range
// input steps across [Any, 3.0, 3.5, 4.0, 4.5]; dragging/swiping the ink thumb
// changes the value, with a star + the selected value shown and tick labels under
// the track. Replaces the old chip row.
const RATING_STOPS = ["Any", "3.0", "3.5", "4.0", "4.5"] as const;

function RatingSheet() {
  // index into RATING_STOPS (0 = Any). The range slides 0..4.
  const [idx, setIdx] = useState(0);
  const stop = RATING_STOPS[idx];
  return (
    <SheetCard title="Rating" onReset={() => setIdx(0)}>
      {/* Selected value , star + the current stop */}
      <div className="mb-3 flex items-center gap-1.5 font-body text-[15px] font-semibold text-s-ink">
        <Star size={16} strokeWidth={0} className="fill-s-star" aria-hidden />
        {stop === "Any" ? "Any rating" : `${stop} and up`}
      </div>
      {/* Swipeable/drag bar , ink thumb + ink track fill. step across the 5 stops. */}
      <input
        type="range"
        min={0}
        max={RATING_STOPS.length - 1}
        step={1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        aria-label="Minimum rating"
        aria-valuetext={stop === "Any" ? "Any rating" : `${stop} and up`}
        className="w-full accent-s-ink"
      />
      {/* Tick labels under the track , one per stop, >= 12px */}
      <div className="mt-1.5 flex justify-between font-body text-[12px] text-s-ink-3">
        {RATING_STOPS.map((s, i) => (
          <span key={s} className={i === idx ? "font-semibold text-s-ink" : undefined}>
            {s}
          </span>
        ))}
      </div>
    </SheetCard>
  );
}

function PriceSheet() {
  const [price, setPrice] = useState(300);
  const label = price >= 300 ? "Any price" : `Up to CHF ${price}`;
  return (
    <SheetCard title="Price" onReset={() => setPrice(300)}>
      <div className="mb-3 font-body text-[15px] font-semibold text-s-ink">{label}</div>
      {/* slider kept , ink track + ink thumb (accent-s-ink) */}
      <input
        type="range"
        min={20}
        max={300}
        step={10}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        aria-label="Maximum price"
        className="w-full accent-s-ink"
      />
      <div className="mt-1.5 flex justify-between font-body text-[12px] text-s-ink-3">
        <span>CHF 20</span>
        <span>CHF 300+</span>
      </div>
    </SheetCard>
  );
}

function ForWhomSheet() {
  const [v, setV] = useState<string | null>(null);
  const opts = [
    { value: "female", label: "Women" },
    { value: "male", label: "Men" },
    { value: "non_binary", label: "Non-binary" },
  ];
  return (
    <SheetCard title="For whom" onReset={() => setV(null)}>
      <div className="flex flex-wrap gap-2">
        <Chip active={v === null} onClick={() => setV(null)}>
          All
        </Chip>
        {opts.map((o) => (
          <Chip key={o.value} active={v === o.value} onClick={() => setV(v === o.value ? null : o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </SheetCard>
  );
}

// Amenities KEEP the chip pattern (a wrap of selectable pills), NOT a checklist.
// Set = the 9 real AMENITY_OPTIONS from SearchTemplate.tsx.
const AMENITIES: { col: string; label: string; Icon: typeof Wifi }[] = [
  { col: "wheelchair_accessible", label: "Accessible", Icon: Accessibility },
  { col: "near_public_transport", label: "Transit", Icon: Bus },
  { col: "kid_friendly", label: "Kid-friendly", Icon: Baby },
  { col: "pet_friendly", label: "Pet-friendly", Icon: Dog },
  { col: "wifi_friendly", label: "Wi-Fi", Icon: Wifi },
  { col: "lgbtq_friendly", label: "LGBTQ+", Icon: Heart },
  { col: "woman_owned", label: "Woman-owned", Icon: Star },
  { col: "family_owned", label: "Family-owned", Icon: Home },
  { col: "student_discount", label: "Student", Icon: GraduationCap },
];

function AmenitiesSheet() {
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const tog = (c: string) => setSel((s) => ({ ...s, [c]: !s[c] }));
  return (
    <SheetCard title="Amenities" onReset={() => setSel({})}>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map(({ col, label, Icon }) => (
          <Chip key={col} active={!!sel[col]} onClick={() => tog(col)}>
            <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden />
            {label}
          </Chip>
        ))}
      </div>
    </SheetCard>
  );
}

// Availability (Open now) + Deals are TOGGLE_PILLS in the real app (SearchTemplate
// TOGGLE_PILLS), not sheets , so they render as inline toggle chips, not bottom
// sheets (owner R3-A1.availability + R3-A1.deals). Gray bg-s-bg-sunken + border
// when on (the locked selected treatment), never black/blue.
function InlinePills() {
  const [openNow, setOpenNow] = useState(false);
  const [deals, setDeals] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={openNow} onClick={() => setOpenNow((x) => !x)}>
        Open now
      </Chip>
      <Chip active={deals} onClick={() => setDeals((x) => !x)}>
        Deals
      </Chip>
    </div>
  );
}

// ── gallery ──────────────────────────────────────────────────────────────────

export default function FilterMenusMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Availability + Deals dropped from the sheet gallery , they're inline TOGGLE
  // chips now (SearchTemplate TOGGLE_PILLS), shown in their own section below.
  const sheets: { key: string; note: string; node: React.ReactNode }[] = [
    { key: "sort", note: "Sort , tap the Sort chip (white pill slides between options)", node: <SortSheet /> },
    { key: "rating", note: "Rating , swipeable bar (Any-4.5)", node: <RatingSheet /> },
    { key: "price", note: "Price , slider kept", node: <PriceSheet /> },
    { key: "gender", note: "For whom , gender chips", node: <ForWhomSheet /> },
    { key: "amenities", note: "Amenities , chip wrap (not a checklist)", node: <AmenitiesSheet /> },
  ];

  return (
    <main className="min-h-screen bg-s-bg-sunken py-6">
      <div className="mx-auto w-full max-w-[440px] px-4">
        <div className="pb-5 text-center">
          <p className="font-heading text-[17px] font-bold text-s-ink">Filter sheets</p>
          <p className="mt-1 font-body text-[12.5px] text-s-ink-3">
            Each filter chip opens its OWN compact bottom sheet, not one big panel. Selected = gray,
            Apply = neutral outline (no black).
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {sheets.map((s) => (
            <div key={s.key}>
              <p className="mb-2 pl-1 font-body text-[12.5px] font-semibold text-s-ink-3">{s.note}</p>
              {s.node}
            </div>
          ))}

          {/* Inline pills (no sheet) , Open now + Deals are TOGGLE_PILLS in the real
              app, so they live inline in the chip row, not behind a bottom sheet. */}
          <div>
            <p className="mb-2 pl-1 font-body text-[12.5px] font-semibold text-s-ink-3">
              Inline pills (no sheet)
            </p>
            <div className="rounded-[20px] border border-s-border bg-white p-4">
              <InlinePills />
              <p className="mt-3 font-body text-[12px] text-s-ink-3">
                Open now and Deals are single toggle chips in the filter row (no bottom sheet), matching the real app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
