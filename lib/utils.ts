/**
 * Converts a string to a URL-safe slug.
 * e.g. "Salon Milano" → "salon-milano"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Formats a price in CHF.
 * e.g. 45 → "CHF 45.00"
 */
export function formatPrice(amount: number, locale = "de-CH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

/**
 * Formats a date for display.
 */
export function formatDate(
  date: string | Date,
  locale = "de-CH",
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/**
 * Formats a time string for display.
 * e.g. "14:30:00" → "14:30"
 */
export function formatTime(
  date: string | Date,
  locale = "de-CH"
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Advances a date by a recurring booking frequency.
 */
export function advanceBookingDate(
  date: Date,
  frequency: "weekly" | "biweekly" | "monthly" | "custom",
  customIntervalDays?: number
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
      next.setDate(next.getDate() + (customIntervalDays ?? 7));
      break;
  }
  return next;
}

/**
 * Returns true if the given date is within the last-minute window.
 */
export function isLastMinute(
  startsAt: Date,
  windowHours: number
): boolean {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  return startsAt >= now && startsAt <= windowEnd;
}

/**
 * Calculates the last-minute discounted price.
 */
export function calcLastMinutePrice(
  basePrice: number,
  discountPercent: number
): number {
  return Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
}
