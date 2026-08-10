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
 * Force the Swiss apostrophe/period grouping convention (CLAUDE.md: "Swiss uses an
 * apostrophe: 1'000") regardless of which locale reaches formatPrice/formatNumber.
 *
 * copy-i18n-06 (2026-07-27): de-CH/it-CH/en-CH all apostrophe-group in this runtime's
 * ICU data, but fr-CH does NOT: it space-groups with a comma decimal (verified via
 * `(1234567).toLocaleString("fr-CH")` giving "1 234 567", not "1'234'567"). The call
 * site that correctly threads a per-locale tag into formatPrice (SearchOverlay.tsx)
 * was therefore silently producing space-grouped French prices next to apostrophe-
 * grouped counts on the same page. Numbers (unlike dates, which stay locale-native
 * via resolveSwissLocale below) are formatted identically across all four UI locales.
 */
function swissNumberFormat(amount: number, options: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("de-CH", options).format(amount);
}

/**
 * Format a CHF price with `CHF ` prefix (Q43 lock, prefix not suffix).
 * Whole-number prices drop the decimals; fractional prices keep two.
 * The `locale` param is accepted for call-site compatibility but no longer affects
 * the digit grouping (copy-i18n-06, see swissNumberFormat above).
 *
 * formatPrice(85)        → "CHF 85"
 * formatPrice(85.5)      → "CHF 85.50"
 * formatPrice(1250, "fr-CH") → "CHF 1'250" (apostrophe, not "1 250")
 */
export function formatPrice(amount: number, locale: string = "de-CH"): string {
  void locale; // kept for call-site compatibility; grouping is locale-invariant, see swissNumberFormat
  const intl = swissNumberFormat(amount, {
    style: "decimal",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `CHF ${intl}`;
}

/**
 * Locale-aware grouped-number string, no parens (added 2026-07-26 alongside the
 * de-CH literal sweep so review-count / total-count call sites that don't want
 * formatCount's parens have one shared resolver instead of re-deriving the Swiss
 * tag inline). Accepts bare app locale keys ("de", "fr") or a full BCP-47 tag.
 * The `locale` param no longer affects grouping (copy-i18n-06): every UI locale
 * shows the same Swiss apostrophe grouping, since fr-CH's real Intl behavior is
 * space-grouping, not apostrophe.
 *
 * formatNumber(1270)       → "1'270"
 * formatNumber(1270, "fr") → "1'270" (forced Swiss apostrophe grouping, not "1 270")
 */
export function formatNumber(n: number, locale: string = "de"): string {
  void locale; // kept for call-site compatibility; grouping is locale-invariant, see swissNumberFormat
  return swissNumberFormat(n, {});
}

/**
 * Format a count with parentheses (per Q43 / SOLEN_DESIGN.md §17 voice rule):
 * ratings show count in parens, e.g. "★ 4.8 (127)".
 * Accepts bare app locale keys ("de", "fr") or a full BCP-47 tag. Grouping is the
 * forced Swiss apostrophe convention for every locale (copy-i18n-06, see
 * swissNumberFormat above); the `locale` param no longer changes the digits.
 *
 * formatCount(127) → "(127)"
 * formatCount(1270, "fr") → "(1'270)" (forced apostrophe grouping, not "(1 270)")
 */
export function formatCount(n: number, locale: string = "de"): string {
  return `(${formatNumber(n, locale)})`;
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

// Maps app locale keys (de/en/fr/it) to the Swiss regional variants so
// Intl.DateTimeFormat produces the correct weekday/month language for each locale.
const SWISS_DATE_LOCALES: Record<string, string> = {
  de: "de-CH",
  en: "en-CH",
  fr: "fr-CH",
  it: "it-CH",
};

/**
 * Resolve an app locale key ("de"/"en"/"fr"/"it", or an already-full BCP-47 tag) to
 * its Swiss regional Intl tag. Exported (2026-07-26, de-CH literal sweep) so call
 * sites that need a raw toLocaleDateString/toLocaleTimeString/Intl.NumberFormat tag
 * (not one of this file's higher-level formatters) share one resolver instead of
 * re-deriving their own de/en/fr/it ternary, which is how the codebase ended up
 * with 116 hardcoded "de-CH" literals and inconsistent en-GB/en-CH mappings.
 *
 * resolveSwissLocale("fr")     → "fr-CH"
 * resolveSwissLocale("de-CH")  → "de-CH"
 * resolveSwissLocale(undefined)→ "de-CH"
 */
export function resolveSwissLocale(locale?: string | null): string {
  if (!locale) return "de-CH";
  return SWISS_DATE_LOCALES[locale] ?? SWISS_DATE_LOCALES[locale.split("-")[0]] ?? "de-CH";
}

/**
 * Format an ISO date string (YYYY-MM-DD) as a short weekday + day + month label.
 * The locale param accepts both bare app keys ("de", "fr") and full BCP-47 tags
 * ("de-CH") and maps them to the correct Swiss regional variant so FR/IT users
 * see their own weekday abbreviations instead of German ones.
 *
 * formatDateLabel("2026-07-04")         -> "Sa. 4. Jul." (de-CH)
 * formatDateLabel("2026-07-04", "fr")   -> "sam. 4 juil." (fr-CH)
 * formatDateLabel("2026-07-04", "it")   -> "sab 4 lug" (it-CH)
 * formatDateLabel("2026-07-04", "en")   -> "Sat 4 Jul" (en-CH)
 */
export function formatDateLabel(iso: string, locale: string = "de"): string {
  try {
    const resolved = resolveSwissLocale(locale);
    return new Intl.DateTimeFormat(resolved, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Locale maps for next-slot relative labels (mirrors SLOT_TODAY/SLOT_TOMORROW
// used in SearchTemplate; extracted here so CategoryBrowseRails and
// SearchTemplate share one implementation).
const NEXT_SLOT_TODAY: Record<string, string> = { de: "heute", en: "today", fr: "auj.", it: "oggi" };
const NEXT_SLOT_TOMORROW: Record<string, string> = { de: "morgen", en: "tomorrow", fr: "demain", it: "domani" };
const NEXT_SLOT_WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/**
 * Given an array of services (each with optional `slots` ISO strings), return
 * a short human-readable label for the earliest upcoming slot across all services.
 * Uses Europe/Zurich for hour formatting so the label is correct regardless of
 * where the JS runtime is hosted.
 *
 * nextAvailableSlotLabel(services, "de") -> "heute 15:30" | "morgen 09:00" | "Mi. 14:00" | null
 */
export function nextAvailableSlotLabel(
  services: Array<{ slots?: string[] | null }> | null | undefined,
  locale: string = "de",
): string | null {
  if (!services?.length) return null;
  const now = Date.now();
  let earliest: Date | null = null;
  for (const svc of services) {
    for (const iso of svc.slots ?? []) {
      const t = new Date(iso);
      if (!Number.isNaN(t.getTime()) && t.getTime() > now && (!earliest || t < earliest)) {
        earliest = t;
      }
    }
  }
  if (!earliest) return null;
  // Resolve the caller's locale to its Swiss regional variant (mirrors formatDateLabel above);
  // was hardcoded to "de-CH" here, silently ignoring the `locale` param on FR/IT/EN callers.
  const resolvedLocale = resolveSwissLocale(locale);
  // Use Zurich timezone so late-evening slots are attributed to the correct day.
  // hourCycle forced to h23: Swiss convention is 24h time regardless of UI language.
  const hhmm = earliest.toLocaleTimeString(resolvedLocale, {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const tzFormatter = new Intl.DateTimeFormat(resolvedLocale, { timeZone: "Europe/Zurich", dateStyle: "short" });
  const todayStr = tzFormatter.format(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tzFormatter.format(tomorrowDate);
  const slotStr = tzFormatter.format(earliest);
  if (slotStr === todayStr) return `${NEXT_SLOT_TODAY[locale] ?? NEXT_SLOT_TODAY.de} ${hhmm}`;
  if (slotStr === tomorrowStr) return `${NEXT_SLOT_TOMORROW[locale] ?? NEXT_SLOT_TOMORROW.de} ${hhmm}`;
  const dayIdx = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Zurich", weekday: "short" }).format(earliest);
  // Map English 3-char abbreviation to DE index: Sun=0,Mon=1,...
  const EN_DAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const wdIdx = EN_DAYS[dayIdx] ?? earliest.getDay();
  return `${NEXT_SLOT_WEEKDAYS[wdIdx]}. ${hhmm}`;
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
