"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * CardFilterRow — Phase 8.5 / A4 (decorative-first, locked 2026-05-03).
 *
 * Reference: `public/solen-coral.html:836-844` (HTML) + 81-99 (CSS).
 *
 * 6 chips arranged in a row with a 1px vertical divider between the
 * time-window group (Heute / Morgen / Diese Woche) and the filter
 * group (Online-Zahlung / 4+ Sterne / Nebenzeiten). One chip per group
 * is "active" — Heute (brand-green per Q64) and Online-Zahlung (amber).
 *
 * **Phase 1 — decorative.** Chips toggle local visual state but DON'T
 * actually filter the per-category carousels below. Wiring up real
 * filtering is Phase 8.6 polish (needs API + URL state coordination).
 *
 * Anatomy:
 * - Chip wrapper: flex gap-2 (8px) flex-wrap, mb-6 (24px)
 * - Active "Heute" (brand): brand-green bg, white text, sh-sm
 * - Active "Online-Zahlung": amber bg, white text, sh-sm
 * - Inactive ghost chips: white bg, ink-2 text, warm-ink border, sh-xs,
 *   hover bumps to sunken bg + sh-sm
 * - Divider: 1px wide × 32px tall, warm-ink alpha
 * - All chips: 8px×16px padding, 99px radius, Figtree 700 11px .04em uppercase
 */

type ChipKey = "heute" | "morgen" | "diese-woche" | "online-zahlung" | "vier-sterne" | "nebenzeiten";

interface CardFilterRowProps {
  /** Optional initial active chip from time-group + filter-group */
  defaultActive?: ChipKey[];
  /** Fired when chips change — caller can wire to actual filtering later */
  onChange?: (active: Set<ChipKey>) => void;
}

const TIME_CHIPS: { key: ChipKey; labelKey: string; fallback: string }[] = [
  { key: "heute",       labelKey: "filters.today",     fallback: "Heute" },
  { key: "morgen",      labelKey: "filters.tomorrow",  fallback: "Morgen" },
  { key: "diese-woche", labelKey: "filters.thisWeek",  fallback: "Diese Woche" },
];

const ATTRIBUTE_CHIPS: { key: ChipKey; labelKey: string; fallback: string }[] = [
  { key: "online-zahlung", labelKey: "filters.onlinePay",   fallback: "Online-Zahlung" },
  { key: "vier-sterne",    labelKey: "filters.fourPlusStars", fallback: "4+ Sterne" },
  { key: "nebenzeiten",    labelKey: "filters.offPeak",     fallback: "Nebenzeiten" },
];

export default function CardFilterRow({
  defaultActive = ["heute", "online-zahlung"],
  onChange,
}: CardFilterRowProps) {
  const t = useTranslations("home") as any;
  const [active, setActive] = useState<Set<ChipKey>>(new Set(defaultActive));

  const toggle = (key: ChipKey, group: "time" | "attribute") => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Within time-group, only one chip is active at a time (single-select)
        if (group === "time") {
          TIME_CHIPS.forEach((c) => next.delete(c.key));
        }
        next.add(key);
      }
      onChange?.(next);
      return next;
    });
  };

  const renderChip = (
    key: ChipKey,
    label: string,
    activeStyle: "brand" | "amber",
    group: "time" | "attribute",
  ) => {
    const isActive = active.has(key);
    const isBrand = activeStyle === "brand";
    return (
      <button
        key={key}
        type="button"
        onClick={() => toggle(key, group)}
        aria-pressed={isActive}
        className={[
          "inline-flex items-center justify-center font-body font-bold uppercase transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2",
          "active:scale-[0.97]",
          isActive
            ? "text-white shadow-elevation-1 hover:brightness-[1.06]"
            : "bg-white text-s-ink-2 border border-s-ink/[0.08] shadow-elevation-1 hover:bg-s-bg-sunken",
        ].join(" ")}
        style={{
          padding: "8px 16px",
          borderRadius: 99,
          fontSize: 11,
          letterSpacing: ".04em",
          ...(isActive ? { background: isBrand ? "#1B4D1B" : "#F3A864" } : {}),
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex gap-2 flex-wrap items-center mb-6">
      {TIME_CHIPS.map((c) =>
        renderChip(c.key, t(c.labelKey) || c.fallback, "brand", "time"),
      )}
      {/* Vertical divider per ref `:838` */}
      <div
        className="self-center"
        style={{ width: 1, height: 32, background: "rgba(26,18,9,0.08)", margin: "0 4px" }}
        aria-hidden
      />
      {ATTRIBUTE_CHIPS.map((c) =>
        renderChip(c.key, t(c.labelKey) || c.fallback, "amber", "attribute"),
      )}
    </div>
  );
}
