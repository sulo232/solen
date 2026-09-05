// exists-check: net-new vs the surfaced hits (design-plan/history/migration docs, an
// unrelated nail-salon "DesignHistoryTimeline" component) because none of them derive a
// weekday/day/month/time string from an ISO timestamp; the real match is
// components-legacy/booking/BookingCard.tsx's own inline dow/day/mon/time derivation
// (read in full before writing this), which is not an importable helper, only inline
// JSX-adjacent code in a 'use client' component. Extracted here as a small pure function
// so this direction's hero card and expanded timeline row can share one derivation
// instead of two copies, using the exact locked date/time treatment (CLAUDE.md design
// contract: "keep exactly the date and time treatment BookingCard renders today, add no
// new clock time anywhere else").
export interface DateParts {
  dow: string;
  day: string;
  mon: string;
  time: string;
}

export function localeCodeFor(locale: string): string {
  return locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
}

export function dateParts(iso: string, locale: string): DateParts {
  const d = new Date(iso);
  const localeCode = localeCodeFor(locale);
  return {
    dow: d.toLocaleDateString(localeCode, { weekday: "short" }),
    day: d.toLocaleDateString(localeCode, { day: "2-digit" }),
    mon: d.toLocaleDateString(localeCode, { month: "short" }),
    time: d.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" }),
  };
}
