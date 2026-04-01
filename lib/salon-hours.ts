export type OpeningHours = {
  monday?:    { open: string; close: string } | null;
  tuesday?:   { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?:  { open: string; close: string } | null;
  friday?:    { open: string; close: string } | null;
  saturday?:  { open: string; close: string } | null;
  sunday?:    { open: string; close: string } | null;
};

export type OpenNowResult = {
  isOpen: boolean;
  closesAt: string | null;
  opensAt: string | null;
  todayHours: { open: string; close: string } | null;
};

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

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
  const dayKey = DAY_KEYS[dayOfWeek];
  const todayEntry = opening_hours[dayKey] ?? null;

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
