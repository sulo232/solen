/**
 * Solen formatting helpers — Q43 (locked 2026-05-02): tabular numerics on movers,
 * CHF prefix on prices, locale-aware date/time/count formatting.
 *
 * These return strings; for in-place tabular-nums apply the Tailwind class
 * `tabular-nums` (or `font-variant-numeric: tabular-nums` in CSS) to the
 * containing element so digits align column-wise.
 */

import { formatCurrency } from "./format-currency";

export { formatCurrency };

/**
 * Format a CHF price with `CHF ` prefix (Q43 lock — prefix, not suffix).
 * Whole-number prices drop the decimals; fractional prices keep two.
 *
 * formatPrice(85)        → "CHF 85"
 * formatPrice(85.5)      → "CHF 85.50"
 * formatPrice(85, "fr")  → "CHF 85"
 */
export function formatPrice(amount: number, locale: string = "de-CH"): string {
  const intl = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `CHF ${intl}`;
}

/**
 * Format a count with parentheses (per Q43 / SOLEN_DESIGN.md §17 voice rule):
 * ratings show count in parens, e.g. "★ 4.8 (127)".
 *
 * formatCount(127) → "(127)"
 */
export function formatCount(n: number): string {
  return `(${n.toLocaleString("de-CH")})`;
}

/**
 * Format a time slot in 24-hour. Always tabular when rendered with tabular-nums.
 *
 * formatTime(14, 30)   → "14:30"
 * formatTime(9, 0)     → "09:00"
 */
export function formatTime(hour: number, minute: number = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Format a star rating to one decimal. Single trailing decimal, no rounding-down.
 *
 * formatRating(4.83) → "4.8"
 * formatRating(5)    → "5.0"
 */
export function formatRating(score: number): string {
  return score.toFixed(1);
}

/**
 * Format relative time offset for upcoming surfaces, e.g. "in 2h", "in 45 min".
 * Caller passes minutes; we pick the readable register.
 *
 * formatTimeOffset(45)   → "in 45 min"
 * formatTimeOffset(120)  → "in 2h"
 * formatTimeOffset(150)  → "in 2.5h"
 */
export function formatTimeOffset(minutes: number, locale: "de" | "en" | "fr" | "it" = "de"): string {
  const labels: Record<string, { min: string; hour: string }> = {
    de: { min: "min", hour: "h" },
    en: { min: "min", hour: "h" },
    fr: { min: "min", hour: "h" },
    it: { min: "min", hour: "h" },
  };
  const lab = labels[locale] ?? labels.de;
  const inWord = locale === "fr" ? "dans" : locale === "it" ? "tra" : locale === "en" ? "in" : "in";
  if (minutes < 60) return `${inWord} ${minutes} ${lab.min}`;
  const hours = minutes / 60;
  const display = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
  return `${inWord} ${display}${lab.hour}`;
}
