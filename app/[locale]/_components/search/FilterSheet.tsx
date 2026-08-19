"use client";

/**
 * FilterSheet - V3-D351 (2026-05-28).
 *
 * The full filter sheet behind the round SlidersHorizontal button in the search
 * chrome. Structure mirrors the approved mockup
 * (`public/solen-search-filters-variants.html` → "The shared Filter sheet"):
 * Sortieren (segmented) / Verfuegbarkeit (chips) / Bewertung (chips), with a
 * Zuruecksetzen + "{count} Salons anzeigen" footer.
 *
 * STRUCTURE = Fresha/mockup filter-sheet anatomy. AESTHETIC = B&W Layer-1 chrome
 * per LOCKFILE §1 tokens + §2.5 type roles (Section H2 group titles, Secondary
 * CTA chips, Primary CTA apply button). No pastel, no accent fills on chrome.
 *
 * Layer 1 chrome. Reuses the `Sheet` primitive (mobile bottom sheet +
 * `useResponsiveOverlay` → Modal on desktop; react-aria portal, focus-trap,
 * scroll-lock, reduced-motion already handled by the primitive).
 *
 * Single source of truth: every control writes the SAME URL params the chip row
 * uses, via the `toggleBooleanParam` / `updateParam` callbacks passed down from
 * SearchTemplate. The sheet holds NO filter state of its own - open/close state
 * lives in SearchTemplate and arrives as `isOpen` / `onClose`.
 *
 * Param support (verified against app/api/salons/route.ts 2026-05-28):
 *   - sort                → supported (rating/price/newest/distance)
 *   - instant_bookable    → supported (48h availability join)
 *   - deals               → supported (last_minute_discount_percent > 0)
 *   - walk_in             → supported (walkin_enabled column)
 *   - min_rating          → supported (gte average_rating)
 *   - open_now            → supported (isOpenNow over opening_hours; open salon IDs
 *                           resolved server-side before pagination, route.ts ~L138).
 *   - min_price/max_price → supported (Preis; buildPriceTask matches salons with
 *                           >=1 active service in the band, route.ts ~L276-282).
 * OMITTED (no API support): "In deiner Naehe" (needs lat/lng geolocation capture,
 *   no `distance` param + no geo-prompt UI in scope). Haartyp / Ausstattung
 *   omitted per spec (no DB data).
 */

import * as React from "react";
import { motion } from "motion/react"; // mockup-ok: owner-approved /dev/filter-menus (R4-1 morph)
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { strokeForSize } from "@/lib/icon-stroke";
import {
  Sheet,
  Modal,
  SheetHeader,
  SheetBody,
  SheetCTARow,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useResponsiveOverlay,
} from "../primitives";

// R4-1 (2026-07-03, owner-approved /dev/filter-menus): shared search-bar ease. Drives
// the Sort segmented pill morph + the rating bar fill glide (owner: "make it morphing,
// don't snap, more smooth"). Same curve as SearchTemplate/booking. mockup-ok
const EASE = [0.32, 0.72, 0, 1] as const;

// V3-D391: price filter is a SLIDER (Fresha "Maximum price" model), not buckets.
// Single max-price thumb — drag down to cap the price; at MAX = no filter. Live
// label while dragging; commits to the URL only on release (pointer/key up).
function PriceSlider({
  maxPrice,
  onChange,
  anyLabel,
  upToLabel,
  ariaLabel,
}: {
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
  // V3-D451: copy passed in (resolved per-locale by the parent's searchUi namespace).
  anyLabel: string;
  upToLabel: (amount: number) => string;
  ariaLabel: string;
}) {
  const MIN = 20;
  const MAX = 300;
  const STEP = 10;
  const [val, setVal] = React.useState(maxPrice ?? MAX);
  const valRef = React.useRef(val);
  valRef.current = val;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  React.useEffect(() => setVal(maxPrice ?? MAX), [maxPrice]);
  const pct = ((val - MIN) / (MAX - MIN)) * 100;
  const fromX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return val;
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round((MIN + ratio * (MAX - MIN)) / STEP) * STEP;
  };
  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setVal(fromX(e.clientX));
  };
  const move = (e: React.PointerEvent) => {
    if (dragging.current) setVal(fromX(e.clientX));
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(null, valRef.current >= MAX ? null : valRef.current);
  };
  return (
    <div className="pt-1">
      <div className="mb-4 font-body text-[15px] font-semibold text-s-ink">
        {val >= MAX ? anyLabel : upToLabel(val)}
      </div>
      {/* V3-D392: custom track so the FILL (left → thumb) shows colour (accent blue),
          not a flat grey bar. Drag the whole track; commits on release. */}
      <div
        ref={trackRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        className="relative flex h-6 cursor-pointer touch-none select-none items-center"
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={val}
      >
        <div className="h-1.5 w-full rounded-full bg-s-border" />
        {/* Owner (2026-07-01): filters are neutral, not blue , the fill + handle are ink. */}
        <div className="absolute h-1.5 rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
        <div
          className="absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-s-ink bg-white shadow-[0_2px_6px_rgba(10,10,10,0.2)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-body text-[12px] text-s-ink-2">
        <span>CHF {MIN}</span>
        <span>CHF {MAX}+</span>
      </div>
    </div>
  );
}

// R4-1b (2026-07-03, owner-approved /dev/filter-menus): the Bewertung filter is a
// SWIPEABLE DISCRETE BAR over 5 stops [Any, 3.0, 3.5, 4.0, 4.5] (min_rating),
// replacing the old chip row. Dragging/tapping the track steps across the stops; the
// STOPS stay discrete but the visual fill + thumb GLIDE (motion, EASE) so it never
// snaps ("don't snap", owner). A star + selected value label sits above; tick labels
// (>= 12px) sit under the track. Writes the same min_rating param the chips did.
const RATING_STOPS: (number | null)[] = [null, 3.0, 3.5, 4.0, 4.5];

function RatingBar({
  minRating,
  onChange,
  anyLabel,
  andUpLabel,
  ariaLabel,
}: {
  minRating: number | null;
  onChange: (value: string | null) => void;
  // Copy passed in (resolved per-locale by the parent).
  anyLabel: string;
  andUpLabel: (value: string) => string;
  ariaLabel: string;
}) {
  const idxFromRating = (r: number | null) => {
    const i = RATING_STOPS.findIndex((s) => s === r);
    return i >= 0 ? i : 0;
  };
  const [idx, setIdx] = React.useState(() => idxFromRating(minRating));
  const idxRef = React.useRef(idx);
  idxRef.current = idx;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  React.useEffect(() => setIdx(idxFromRating(minRating)), [minRating]);

  const last = RATING_STOPS.length - 1;
  const pct = (idx / last) * 100;
  const stop = RATING_STOPS[idx];

  const idxFromX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return idxRef.current;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * last);
  };
  // Commit the current stop to the URL param (null = "Any", clears min_rating).
  const commit = (i: number) => {
    const s = RATING_STOPS[i];
    onChange(s == null ? null : String(s));
  };
  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setIdx(idxFromX(e.clientX));
  };
  const move = (e: React.PointerEvent) => {
    if (dragging.current) setIdx(idxFromX(e.clientX));
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = false;
    commit(idxRef.current);
  };
  const label = stop == null ? anyLabel : andUpLabel(String(stop));

  return (
    <div className="pt-1">
      {/* Selected value: star + the current stop. */}
      <div className="mb-4 flex items-center gap-1.5 font-body text-[15px] font-semibold text-s-ink">
        <Star size={16} strokeWidth={1.9} stroke="none" aria-hidden className="fill-s-star" />
        {label}
      </div>
      {/* Swipeable/drag bar - ink track fill + ink thumb, stepping across the 5 stops.
          The fill width + thumb position ANIMATE (motion, EASE) so the move eases even
          though the stops are discrete ("don't snap"). While dragging, motion tracks
          the finger 1:1 (duration 0); on release it eases to the settled stop. */}
      <div
        ref={trackRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        className="relative flex h-6 cursor-pointer touch-none select-none items-center"
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={idx}
        aria-valuetext={label}
      >
        <div className="h-1.5 w-full rounded-full bg-s-border" />
        {/* THE SPEED LAW hard rule 2 (motion audit HOME_SEARCH_INSPO.md row 100): was
            `animate={{ width }}`. A full-width bar scaled by `scaleX` from a left origin paints the
            identical fill without ever animating `width` (no reflow). */}
        <motion.div
          className="absolute left-0 h-1.5 w-full origin-left rounded-full bg-s-ink"
          animate={{ scaleX: pct / 100 }}
          transition={dragging.current ? { duration: 0 } : { duration: 0.22, ease: EASE }}
        />
        {/* row 101: was `animate={{ left }}`. `left` percentages are relative to the TRACK, which
            `translateX` alone can't reproduce (transform % is relative to the element's own box), so
            the thumb sits inside a full-width wrapper and the WRAPPER is translated by `pct`% of its
            own width (== the track's width); the visible 20px circle stays statically centered at the
            wrapper's left edge. */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: `${pct}%` }}
          transition={dragging.current ? { duration: 0 } : { duration: 0.22, ease: EASE }}
        >
          <div className="absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-s-ink bg-white shadow-[0_2px_6px_rgba(10,10,10,0.2)]" />
        </motion.div>
      </div>
      {/* Tick labels under the track - one per stop, >= 12px. */}
      <div className="mt-2 flex justify-between font-body text-[12px] text-s-ink-2">
        {RATING_STOPS.map((s, i) => (
          <span key={i} className={i === idx ? "font-semibold text-s-ink" : undefined}>
            {s == null ? anyLabel : String(s)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API - all state + writers are owned by SearchTemplate (single source of
// truth). The sheet is a controlled, stateless view over the URL params.
// ─────────────────────────────────────────────────────────────────────────────

export interface FilterSheetSortOption {
  value: string;
  label: string;
}

export interface FilterSheetLabels {
  /** Sheet title - "Filter". */
  title: string;
  /** Reset link/button - "Zuruecksetzen". */
  reset: string;
  /** Close button aria-label. */
  close: string;
  /** Group heading - "Sortieren". */
  sortHeading: string;
  /** Group heading - "Preis". */
  priceHeading: string;
  /** Group heading - "Bewertung". */
  ratingHeading: string;
  /** Bewertung chips (rating45/40 legacy; the bar uses ratingAny + ratingAndUp). */
  rating45: string;
  rating40: string;
  ratingAny: string;
  /** R4-1b rating BAR: "{value} and up" label + the bar's aria-label. */
  ratingAndUp: (value: string) => string;
  ratingAria: string;
  /** Für wen / Service type. */
  forWhoHeading: string;
  genderAny: string;
  genderFemale: string;
  genderMale: string;
  genderNonBinary: string;
  /** Ausstattung / Amenities heading. */
  amenitiesHeading: string;
  /** Angebote / deals group heading. */
  dealsHeading: string;
  /** Price slider — "any price" + "up to CHF {amount}" + slider aria-label. */
  priceAny: string;
  priceUpTo: (amount: number) => string;
  maxPriceAria: string;
  /** Footer apply button - receives the live count. */
  apply: (count: number) => string;
}

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Live result count for the apply button. */
  resultCount: number;
  /** V3-D390: when set, render ONLY this category's group (focused pill sheet);
   *  null = the full "all filters" sheet (the ≡ button). */
  section?: string | null;
  labels: FilterSheetLabels;

  // ── Sortieren ──
  sortOptions: readonly FilterSheetSortOption[];
  sort: string;
  onSortChange: (value: string) => void;

  // ── Preis (min_price / max_price) ──
  minPrice: number | null;
  maxPrice: number | null;
  onPriceChange: (min: number | null, max: number | null) => void;

  // ── Bewertung (min_rating) ──
  minRating: number | null;
  onMinRatingChange: (value: string | null) => void;

  // ── Für wen / Service type (services.suitable_gender) ──
  gender: string | null;
  onGenderChange: (value: string | null) => void;
  /** V3-D454 (2026-07-06): hide the group while no active service can discriminate
   *  by gender. Defaults to true (shown) so an omitted prop keeps prior behavior. */
  showGender?: boolean;

  // ── Ausstattung / Amenities (salons boolean columns) ──
  amenityOptions: { col: string; label: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[];
  amenities: string[];
  onAmenityToggle: (col: string) => void;
  /** AMENITIES_SELF_REPORTED (app/[locale]/_components/salon/_shared.ts): hide the group
   *  while the underlying salons columns are nulled (fabricated data removed 2026-07-16).
   *  Defaults to true (shown) so an omitted prop keeps prior behavior. */
  showAmenities?: boolean;

  // ── Angebote (deals / last_minute_discount) ──
  deals: boolean;
  onDealsToggle: () => void;
  /** V3-D454 (2026-07-06): hide the group while 0 listed salons have a real deal.
   *  Defaults to true (shown) so an omitted prop keeps prior behavior. */
  showDeals?: boolean;

  /** Clears every filter param (booleans + min_rating + sort). */
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal sub-views (shared between Sheet + Modal shells)
// ─────────────────────────────────────────────────────────────────────────────

// V3-D351: filter chip inside a sheet group. Secondary-CTA recipe at rest
// (white + hairline + ink), flips to ink fill when active — the fill alone
// signals selected (matches TabPill / PillToggle; no check). 36px min height.
function SheetChip({
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
      className={cn(
        // mockup-ok: 44px a11y-floor contract row (interactive controls >= h-11); matches the
        // top-level filter chips raised in SearchTemplate this pass, so in-modal chips stay consistent.
        "inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-3.5",
        "font-body text-[14px] font-medium leading-none",
        "transition-[background-color,border-color,color,transform] duration-150 ease-glide",
        "active:scale-[0.97] active:duration-[80ms]",
        "focus-visible:outline-none",
        active
          // Owner (2026-07-02, approved mockup /dev/filter-refine): selected = calm GRAY sunken,
          // NO ink/blue border ("you have the pill, just sync it out grayed"). Gray wash + ink
          // text + semibold (TabPill treatment). border-transparent keeps the box size stable.
          ? "border border-transparent bg-s-bg-sunken text-s-ink font-semibold"
          : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-s-border py-4 first:pt-0 last:border-b-0">
      {/* V3-D390: heading hidden in a focused single-category sheet (the sheet title
          already names it). Section H2 recipe (LOCKFILE §2.5). */}
      {heading && (
        <h3 className="font-display mb-3 text-[16px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
          {heading}
        </h3>
      )}
      {children}
    </section>
  );
}

function FilterSheetContent({
  section,
  labels,
  sortOptions,
  sort,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceChange,
  minRating,
  onMinRatingChange,
  gender,
  onGenderChange,
  showGender = true,
  amenityOptions,
  amenities,
  onAmenityToggle,
  showAmenities = true,
  deals,
  onDealsToggle,
  showDeals = true,
}: Omit<FilterSheetProps, "isOpen" | "onClose" | "resultCount" | "onReset">) {
  return (
    <>
      {/* Sortieren - segmented control (writes `sort`). R4-1a (owner-approved
          /dev/filter-menus): the selected white pill MORPHS between segments via a
          shared motion layoutId (duration 0.26, EASE), so it glides instead of
          snapping. The white pill on the sunken track = the "selected = gray track,
          white active" recipe; NO black, NO blue. */}
      {(!section || section === "sort") && (
        <FilterGroup heading={section ? "" : labels.sortHeading}>
          <div className="flex gap-1 rounded-[12px] bg-s-bg-sunken p-1">
            {sortOptions.map((opt) => {
              const isActive = opt.value === sort;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSortChange(opt.value)}
                  aria-pressed={isActive}
                  className={cn(
                    // mockup-ok: 44px a11y-floor contract row; sort segment raised to min-h-[44px].
                    "relative flex min-h-[44px] flex-1 items-center justify-center whitespace-nowrap rounded-[9px] px-2 text-center",
                    "font-body text-[12.5px] leading-none",
                    "transition-colors duration-150 ease-glide",
                    "focus-visible:outline-none",
                    isActive
                      // Owner (2026-07-01): neutral, not blue. The white pill (below) is
                      // the active fill; the label just goes semibold ink.
                      ? "font-semibold text-s-ink"
                      : "font-medium text-s-ink-2 hover:text-s-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="filterSheetSortPill"
                      transition={{ duration: 0.26, ease: EASE }}
                      className="absolute inset-0 z-0 rounded-[9px] bg-white shadow-sm"
                    />
                  )}
                  <span className="relative z-[1]">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Preis — buckets writing min_price / max_price. Tapping the active one clears. */}
      {(!section || section === "price") && (
        <FilterGroup heading={section ? "" : labels.priceHeading}>
          <PriceSlider
            maxPrice={maxPrice}
            onChange={onPriceChange}
            anyLabel={labels.priceAny}
            upToLabel={labels.priceUpTo}
            ariaLabel={labels.maxPriceAria}
          />
        </FilterGroup>
      )}

      {/* Für wen / Service type - services.suitable_gender (Alle / Damen / Herren).
          V3-D454: hidden while no active service can discriminate by gender (showGender
          stays true when a stale ?gender= link is active, passed in from SearchTemplate). */}
      {showGender && (!section || section === "gender") && (
        <FilterGroup heading={section ? "" : labels.forWhoHeading}>
          <div className="flex flex-wrap gap-2">
            <SheetChip active={gender === null} onClick={() => onGenderChange(null)}>
              {labels.genderAny}
            </SheetChip>
            <SheetChip active={gender === "female"} onClick={() => onGenderChange(gender === "female" ? null : "female")}>
              {labels.genderFemale}
            </SheetChip>
            <SheetChip active={gender === "male"} onClick={() => onGenderChange(gender === "male" ? null : "male")}>
              {labels.genderMale}
            </SheetChip>
            <SheetChip active={gender === "non_binary"} onClick={() => onGenderChange(gender === "non_binary" ? null : "non_binary")}>
              {labels.genderNonBinary}
            </SheetChip>
          </div>
        </FilterGroup>
      )}

      {/* Bewertung - R4-1b swipeable discrete bar (Any / 3.0 / 3.5 / 4.0 / 4.5),
          replacing the old chip row. Writes the same min_rating param. */}
      {(!section || section === "rating") && (
        <FilterGroup heading={section ? "" : labels.ratingHeading}>
          <RatingBar
            minRating={minRating}
            onChange={onMinRatingChange}
            anyLabel={labels.ratingAny}
            andUpLabel={labels.ratingAndUp}
            ariaLabel={labels.ratingAria}
          />
        </FilterGroup>
      )}

      {/* Ausstattung / Amenities: salons boolean columns + icons. Hidden while
          showAmenities is false (AMENITIES_SELF_REPORTED, salon/_shared.ts): the
          underlying columns are nulled fabricated data, not a real fact yet. */}
      {showAmenities && (!section || section === "amenities") && (
        <FilterGroup heading={section ? "" : labels.amenitiesHeading}>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((a) => {
              const Icon = a.icon;
              return (
                <SheetChip key={a.col} active={amenities.includes(a.col)} onClick={() => onAmenityToggle(a.col)}>
                  {/* ig9 (owner-approved 2026-07-16): calibrated size-to-stroke table, lib/icon-stroke.ts */}
                  {Icon && <Icon size={14} strokeWidth={strokeForSize(14)} className="shrink-0" />}
                  {a.label}
                </SheetChip>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* V3-D391: Angebote / Last-Minute deals, the "more filters" the user asked for.
          V3-D454: hidden while 0 listed salons have a real deal (showDeals stays true
          when a stale ?deals=true link is active, passed in from SearchTemplate). */}
      {showDeals && (!section || section === "deals") && (
        <FilterGroup heading={section ? "" : labels.dealsHeading}>
          <div className="flex flex-wrap gap-2">
            <SheetChip active={deals} onClick={onDealsToggle}>
              {labels.dealsHeading}
            </SheetChip>
          </div>
        </FilterGroup>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterSheet - responsive shell (Sheet on mobile, Modal on desktop)
// ─────────────────────────────────────────────────────────────────────────────

export function FilterSheet(props: FilterSheetProps) {
  const { isOpen, onClose, resultCount, labels, onReset } = props;
  const overlay = useResponsiveOverlay();

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const resetButton = (
    <button
      type="button"
      onClick={onReset}
      className={cn(
        "shrink-0 rounded-md px-1 font-body text-[14px] font-medium text-s-ink",
        "transition-colors duration-150 hover:text-s-ink-2",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
      )}
    >
      {labels.reset}
    </button>
  );

  // R4-1d (owner voice 2026-07-03, mockup-ok /dev/filter-menus): filter-sheet Apply is
  // a NEUTRAL OUTLINE, not the LOCKFILE §2.5 ink Primary CTA ("i dont like black
  // buttons" - amends the ink-CTA convention for filter sheets specifically, logged
  // in TASTE_LOG.md). Applies the (already-live) URL params and closes - the list
  // reacts to the params, so "apply" is just "close" here. No focus-visible utility
  // here (the global focus system in globals.css already handles it, V3-D449).
  const applyButton = (
    <button
      type="button"
      onClick={onClose}
      // accessibility-08 (2026-07-27): resultCount already updates this button's own text
      // live as the user toggles filter options, but a screen-reader user's focus usually
      // stays ON the checkbox/toggle they just touched, not this button, so the count change
      // went unheard. aria-live="polite" on the button announces it without moving focus.
      aria-live="polite"
      className={cn(
        "flex-1 rounded-pill border border-s-border bg-white px-6 py-3 text-center",
        "font-body text-[15px] font-medium leading-none tracking-[-0.005em] text-s-ink tabular-nums",
        "transition-[colors,transform] duration-150 ease-glide",
        "hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms]",
      )}
    >
      {labels.apply(resultCount)}
    </button>
  );

  if (overlay === "modal") {
    return (
      <Modal
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        size="md"
        aria-label={labels.title}
      >
        <ModalHeader title={labels.title} onClose={onClose} closeAriaLabel={labels.close} />
        <ModalBody>
          <FilterSheetContent {...props} />
        </ModalBody>
        <ModalFooter layout="between">
          {resetButton}
          {applyButton}
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      height="auto"
      aria-label={labels.title}
    >
      <SheetHeader title={labels.title} onClose={onClose} closeAriaLabel={labels.close}>
        {/* Reset sits left of the title region per the mockup sheet header. */}
      </SheetHeader>
      <SheetBody>
        <FilterSheetContent {...props} />
      </SheetBody>
      <SheetCTARow layout="reset-and-primary">
        {resetButton}
        {applyButton}
      </SheetCTARow>
    </Sheet>
  );
}
