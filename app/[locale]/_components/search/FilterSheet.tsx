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
 * OMITTED (no API support): Preis (min_price/max_price read but not applied,
 *   route.ts L133-134) and "In deiner Naehe" (needs lat/lng geolocation capture,
 *   no `distance` param + no geo-prompt UI in scope). Haartyp / Ausstattung
 *   omitted per spec (no DB data).
 */

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
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

// V3-D391: price filter is a SLIDER (Fresha "Maximum price" model), not buckets.
// Single max-price thumb — drag down to cap the price; at MAX = no filter. Live
// label while dragging; commits to the URL only on release (pointer/key up).
function PriceSlider({
  maxPrice,
  onChange,
}: {
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
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
        {val >= MAX ? "Beliebiger Preis" : `Bis CHF ${val}`}
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
        aria-label="Maximalpreis"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={val}
      >
        <div className="h-1.5 w-full rounded-full bg-s-border" />
        <div className="absolute h-1.5 rounded-full bg-s-accent" style={{ width: `${pct}%` }} />
        <div
          className="absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-s-accent bg-white shadow-[0_2px_6px_rgba(10,10,10,0.2)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-body text-[12px] text-s-ink-3">
        <span>CHF {MIN}</span>
        <span>CHF {MAX}+</span>
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
  /** Bewertung chips. */
  rating45: string;
  rating40: string;
  ratingAny: string;
  /** Für wen / Service type. */
  forWhoHeading: string;
  genderAny: string;
  genderFemale: string;
  genderMale: string;
  /** Ausstattung / Amenities heading. */
  amenitiesHeading: string;
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

  // ── Ausstattung / Amenities (salons boolean columns) ──
  amenityOptions: { col: string; label: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[];
  amenities: string[];
  onAmenityToggle: (col: string) => void;

  // ── Angebote (deals / last_minute_discount) ──
  deals: boolean;
  onDealsToggle: () => void;

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
        "inline-flex min-h-[36px] items-center gap-1.5 rounded-pill px-3.5",
        "font-body text-[14px] font-medium leading-none",
        "transition-[background-color,border-color,color,transform] duration-150 ease-glide",
        "active:scale-[0.97] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        active
          // V3-D421k (owner): selections INSIDE the sheet mark BLUE (tint), matching the
          // active chips in the row — soft blue wash + blue hairline + ink text.
          ? "border border-s-accent/40 bg-s-accent/[0.08] text-s-ink font-semibold"
          : "border border-s-border bg-white text-s-ink hover:border-s-ink",
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
  amenityOptions,
  amenities,
  onAmenityToggle,
  deals,
  onDealsToggle,
}: Omit<FilterSheetProps, "isOpen" | "onClose" | "resultCount" | "onReset">) {
  return (
    <>
      {/* Sortieren — segmented control (writes `sort`). */}
      {(!section || section === "sort") && (
        <FilterGroup heading={section ? "" : labels.sortHeading}>
          <div className="flex rounded-[12px] bg-s-bg-sunken p-1">
            {sortOptions.map((opt) => {
              const isActive = opt.value === sort;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSortChange(opt.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex-1 rounded-[9px] px-2 py-2 text-center",
                    "font-body text-[12.5px] leading-none",
                    "transition-[background-color,color,box-shadow] duration-150 ease-glide",
                    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                    isActive
                      // V3-D421k (owner): selected sort segment marks blue too.
                      ? "bg-s-accent/[0.12] font-semibold text-s-accent"
                      : "font-medium text-s-ink-2 hover:text-s-ink",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Preis — buckets writing min_price / max_price. Tapping the active one clears. */}
      {(!section || section === "price") && (
        <FilterGroup heading={section ? "" : labels.priceHeading}>
          <PriceSlider maxPrice={maxPrice} onChange={onPriceChange} />
        </FilterGroup>
      )}

      {/* Für wen / Service type — services.suitable_gender (Alle / Damen / Herren). */}
      {(!section || section === "gender") && (
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
              Divers
            </SheetChip>
          </div>
        </FilterGroup>
      )}

      {/* Bewertung — min_rating chips (4.5+ / 4.0+ / Egal). */}
      {(!section || section === "rating") && (
        <FilterGroup heading={section ? "" : labels.ratingHeading}>
          <div className="flex flex-wrap gap-2">
            <SheetChip active={minRating === 4.5} onClick={() => onMinRatingChange(minRating === 4.5 ? null : "4.5")}>
              <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
              4.5
            </SheetChip>
            <SheetChip active={minRating === 4.0} onClick={() => onMinRatingChange(minRating === 4.0 ? null : "4.0")}>
              <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
              4.0
            </SheetChip>
            <SheetChip active={minRating === 3.5} onClick={() => onMinRatingChange(minRating === 3.5 ? null : "3.5")}>
              <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
              3.5
            </SheetChip>
            <SheetChip active={minRating === 3.0} onClick={() => onMinRatingChange(minRating === 3.0 ? null : "3.0")}>
              <Star size={14} stroke="none" aria-hidden className="fill-s-star" />
              3.0
            </SheetChip>
            <SheetChip active={minRating === null} onClick={() => onMinRatingChange(null)}>
              {labels.ratingAny}
            </SheetChip>
          </div>
        </FilterGroup>
      )}

      {/* Ausstattung / Amenities — salons boolean columns + icons. */}
      {(!section || section === "amenities") && (
        <FilterGroup heading={section ? "" : labels.amenitiesHeading}>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map((a) => {
              const Icon = a.icon;
              return (
                <SheetChip key={a.col} active={amenities.includes(a.col)} onClick={() => onAmenityToggle(a.col)}>
                  {Icon && <Icon size={14} strokeWidth={2} className="shrink-0" />}
                  {a.label}
                </SheetChip>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* V3-D391: Angebote / Last-Minute deals — the "more filters" the user asked for. */}
      {(!section || section === "deals") && (
        <FilterGroup heading={section ? "" : "Angebote"}>
          <div className="flex flex-wrap gap-2">
            <SheetChip active={deals} onClick={onDealsToggle}>
              Angebote
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

  // Primary CTA recipe (LOCKFILE §2.5): white on s-ink, 15px/500. Applies the
  // (already-live) URL params and closes - the list reacts to the params, so
  // "apply" is just "close" here (params write on every tap = instant filtering).
  const applyButton = (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "flex-1 rounded-pill bg-s-ink px-6 py-3 text-center",
        "font-body text-[15px] font-medium leading-none tracking-[-0.005em] text-white",
        "transition-[background-color,transform] duration-150 ease-glide",
        "hover:bg-black active:scale-[0.98] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
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
