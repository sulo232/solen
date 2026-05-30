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
 *   - walk_in             → supported (walk_in_available column, graceful fallback)
 *   - min_rating          → supported (gte average_rating)
 *   - open_now            → NOT filtered server-side yet (shown for parity with
 *                           the chip row; same param, single source of truth -
 *                           API ignores it and returns the full set until the
 *                           hours-aware filter lands). See report.
 * OMITTED (no API support): Preis (min_price/max_price read but not applied,
 *   route.ts L133-134) and "In deiner Naehe" (needs lat/lng geolocation capture,
 *   no `distance` param + no geo-prompt UI in scope). Haartyp / Ausstattung
 *   omitted per spec (no DB data).
 */

import * as React from "react";
import { Check } from "lucide-react";
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

// V3-D384: price buckets — symbol labels are locale-agnostic (no i18n key needed).
// Tapping the active bucket clears it (back to "any").
const PRICE_BUCKETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "≤ CHF 50", min: null, max: 50 },
  { label: "CHF 50–100", min: 50, max: 100 },
  { label: "≥ CHF 100", min: 100, max: null },
];

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
  /** Footer apply button - receives the live count. */
  apply: (count: number) => string;
}

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Live result count for the apply button. */
  resultCount: number;
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

  /** Clears every filter param (booleans + min_rating + sort). */
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal sub-views (shared between Sheet + Modal shells)
// ─────────────────────────────────────────────────────────────────────────────

// V3-D351: filter chip inside a sheet group. Secondary-CTA recipe at rest
// (white + hairline + ink), flips to Primary-CTA ink fill when active, with a
// leading check (matches the chip-row selected affordance). 36px min height.
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
          ? "border border-s-ink bg-s-ink text-white"
          : "border border-s-border bg-white text-s-ink hover:border-s-ink",
      )}
    >
      {active && <Check size={14} strokeWidth={2.5} aria-hidden />}
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
    <section className="border-b border-s-border py-4 last:border-b-0">
      {/* Section H2 recipe (LOCKFILE §2.5): 18px/600/ink. */}
      <h3 className="font-display mb-3 text-[16px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
        {heading}
      </h3>
      {children}
    </section>
  );
}

function FilterSheetContent({
  labels,
  sortOptions,
  sort,
  onSortChange,
  minPrice,
  maxPrice,
  onPriceChange,
  minRating,
  onMinRatingChange,
}: Omit<FilterSheetProps, "isOpen" | "onClose" | "resultCount" | "onReset">) {
  return (
    <>
      {/* Sortieren - segmented control over SORT_OPTIONS (writes `sort`). */}
      <FilterGroup heading={labels.sortHeading}>
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
                    ? "bg-white font-semibold text-s-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "font-medium text-s-ink-2 hover:text-s-ink",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Preis - buckets writing min_price / max_price (the #1 Fresha/Airbnb
          filter). Tapping the active bucket clears it (back to "any"). */}
      <FilterGroup heading={labels.priceHeading}>
        <div className="flex flex-wrap gap-2">
          {PRICE_BUCKETS.map((b) => {
            const active = minPrice === b.min && maxPrice === b.max;
            return (
              <SheetChip
                key={b.label}
                active={active}
                onClick={() => onPriceChange(active ? null : b.min, active ? null : b.max)}
              >
                {b.label}
              </SheetChip>
            );
          })}
        </div>
      </FilterGroup>

      {/* Bewertung - min_rating chips (4.5+ / 4.0+ / Egal). */}
      <FilterGroup heading={labels.ratingHeading}>
        <div className="flex flex-wrap gap-2">
          <SheetChip
            active={minRating === 4.5}
            onClick={() => onMinRatingChange(minRating === 4.5 ? null : "4.5")}
          >
            {labels.rating45}
          </SheetChip>
          <SheetChip
            active={minRating === 4.0}
            onClick={() => onMinRatingChange(minRating === 4.0 ? null : "4.0")}
          >
            {labels.rating40}
          </SheetChip>
          <SheetChip
            active={minRating === null}
            onClick={() => onMinRatingChange(null)}
          >
            {labels.ratingAny}
          </SheetChip>
        </div>
      </FilterGroup>
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
