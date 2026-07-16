import { type ClassValue, clsx } from "clsx";

/**
 * Merge Tailwind classes safely (used by UI components).
 * Requires: pnpm add clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Convert a salon name to a URL-safe slug.
 * Example: "Salon Müller & Co." → "salon-muller-co"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[äöü]/g, (char) => ({ ä: "ae", ö: "oe", ü: "ue" }[char] ?? char))
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Format a price in CHF.
 * Example: formatPrice(45.5) → "CHF 45.50"
 */
export function formatPrice(amount: number, locale = "de-CH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Split text on the first case-insensitive occurrence of a query substring, for the P13
 * search-overlay match highlight (owner-approved 2026-07-16, TASTE_LOG.md "reference-probe
 * picks round 1"). Plain data (no JSX here, this file stays framework-agnostic) , each
 * caller renders its own <mark> so the highlight styling stays local to its surface.
 * No match found -> a single non-matched segment (never a fabricated highlight).
 */
export function splitHighlight(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return [{ text, match: false }];
  const before = text.slice(0, idx);
  const hit = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return [
    ...(before ? [{ text: before, match: false }] : []),
    { text: hit, match: true },
    ...(after ? [{ text: after, match: false }] : []),
  ];
}

/**
 * Format a duration in minutes to human-readable.
 * Example: formatDuration(90) → "1h 30min"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Check if a date string is within N hours from now.
 */
export function isWithinHours(dateStr: string, hours: number): boolean {
  const date = new Date(dateStr);
  const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);
  return date <= cutoff && date > new Date();
}

/**
 * Advance a date by recurring frequency.
 */
export function advanceByFrequency(
  date: Date,
  frequency: "weekly" | "biweekly" | "monthly" | "custom",
  customDays?: number
): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "custom":
      next.setDate(next.getDate() + (customDays ?? 7));
      break;
  }
  return next;
}
