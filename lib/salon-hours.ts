// Day-keyed opening hours. The live data + the onboarding form use SHORT keys
// (mon/tue/.../sun); a few older paths used long names (monday/...). This type +
// isOpenNow accept BOTH conventions so the open-now check can't silently break on
// a key mismatch — the bug that previously made isOpenNow return false for every
// salon (it only looked up long names while all real data is short-keyed).
export type OpeningHours = Record<string, { open: string; close: string } | null | undefined>;

export type OpenNowResult = {
  isOpen: boolean;
  closesAt: string | null;
  opensAt: string | null;
  todayHours: { open: string; close: string } | null;
};

// Indexed by JS getDay() (0=Sun). Both conventions are checked at lookup time so
// short-keyed (live) and long-keyed (legacy) opening_hours both resolve correctly.
const DAY_KEYS_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_KEYS_LONG = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function getZurichNow(): { dayOfWeek: number; currentMinutes: number } {
  const now = new Date();
  // Use Intl to get Zurich local time parts
  const parts = new Intl.DateTimeFormat("en-CH", {
    timeZone: "Europe/Zurich",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hourStr    = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minuteStr  = parts.find((p) => p.type === "minute")?.value ?? "0";

  // Map short weekday to JS day number (0=Sun)
  const WEEKDAY_MAP: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = WEEKDAY_MAP[weekdayStr] ?? new Date().getDay();
  const currentMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);

  return { dayOfWeek, currentMinutes };
}

export function isOpenNow(opening_hours: OpeningHours | null | undefined): OpenNowResult {
  if (!opening_hours) {
    return { isOpen: false, closesAt: null, opensAt: null, todayHours: null };
  }

  const { dayOfWeek, currentMinutes } = getZurichNow();
  const todayEntry =
    opening_hours[DAY_KEYS_SHORT[dayOfWeek]] ?? opening_hours[DAY_KEYS_LONG[dayOfWeek]] ?? null;

  if (!todayEntry) {
    return { isOpen: false, closesAt: null, opensAt: null, todayHours: null };
  }

  const { open, close } = todayEntry;
  const openMin  = toMinutes(open);
  const closeMin = toMinutes(close);

  let isOpen: boolean;
  if (closeMin > openMin) {
    // Normal hours, e.g. 09:00–19:00
    isOpen = currentMinutes >= openMin && currentMinutes < closeMin;
  } else {
    // Overnight, e.g. 20:00–02:00
    isOpen = currentMinutes >= openMin || currentMinutes < closeMin;
  }

  return {
    isOpen,
    closesAt: isOpen ? close : null,
    opensAt:  isOpen ? null  : open,
    todayHours: { open, close },
  };
}
