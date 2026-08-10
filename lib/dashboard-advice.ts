import { hoursForDay, timeToMinutes, zurichCivil, type OpeningHours } from "./salon-hours";

// ─────────────────────────────────────────────────────────────
// Dashboard advice (owner decision 9, 2026-08-09 "9 a").
//
// Turns the salon's OWN booking history into a small number of things the owner
// can act on ("your Tuesday afternoons are empty"), never into a guess. Every
// rule here has three properties, and a rule that cannot satisfy all three does
// not fire at all:
//   1. it compares the salon against ITSELF (its own average), never a benchmark
//      we do not have;
//   2. it only speaks about time windows the salon is actually OPEN, read from
//      opening_hours, so we never advise about a day they are closed;
//   3. it needs a floor of real evidence (MIN_BOOKINGS over a whole-week window)
//      before it says anything.
// When nothing clears those bars the caller renders the plain "not enough
// history yet" state with the real counts. There is no fallback advice.
// ─────────────────────────────────────────────────────────────

/** Whole weeks of history the advice reads. 8 gives 8 samples of every weekday. */
export const ADVICE_WINDOW_WEEKS = 8;
const ADVICE_WINDOW_DAYS = ADVICE_WINDOW_WEEKS * 7;

/** Below this many kept appointments in the window, no slot rule may speak. */
export const ADVICE_MIN_BOOKINGS = 20;

/** A per-slot average below this is noise, not a baseline to compare against. */
const MIN_SLOT_AVERAGE = 2;

/** "Quiet" = at most half the salon's own average for an open slot. */
const QUIET_MAX_SHARE = 0.5;

/** "Busy" = at least double the salon's own average for an open slot. */
const BUSY_MIN_FACTOR = 2;

/** Share of appointments cancelled or missed before it is worth naming. */
const CANCEL_MIN_RATE = 0.15;

export type AdviceDaypart = "morning" | "afternoon" | "evening";

/** Zurich wall-clock minute ranges, a full partition of the day. */
const DAYPART_RANGES: Record<AdviceDaypart, { from: number; to: number }> = {
  morning: { from: 0, to: 12 * 60 },
  afternoon: { from: 12 * 60, to: 17 * 60 },
  evening: { from: 17 * 60, to: 24 * 60 },
};
const DAYPARTS: AdviceDaypart[] = ["morning", "afternoon", "evening"];

/** A slot must overlap the opening window by at least this to count as open. */
const MIN_OPEN_OVERLAP_MINUTES = 60;

export type AdviceItem =
  | { kind: "empty_slot"; day: number; daypart: AdviceDaypart; count: 0; average: number }
  | { kind: "quiet_slot"; day: number; daypart: AdviceDaypart; count: number; average: number }
  | { kind: "busy_slot"; day: number; daypart: AdviceDaypart; count: number; average: number }
  | { kind: "cancellations"; count: number; total: number; percent: number };

export type DashboardAdvice = {
  window_weeks: number;
  /** Appointments that actually happened in the window (cancelled + no-show excluded). */
  counted_bookings: number;
  min_bookings: number;
  /** False when opening_hours is missing or covers fewer than two slots. */
  has_opening_hours: boolean;
  items: AdviceItem[];
};

export type AdviceBooking = { starts_at: string; status: string | null };

/** The last N Zurich calendar dates BEFORE today, so every weekday gets equal samples. */
function windowDateKeys(now: Date, days: number): Set<string> {
  const today = zurichCivil(now).dateKey;
  const [y, m, d] = today.split("-").map(Number);
  const anchor = Date.UTC(y, m - 1, d);
  const keys = new Set<string>();
  for (let i = 1; i <= days; i++) {
    keys.add(new Date(anchor - i * 86400000).toISOString().slice(0, 10));
  }
  return keys;
}

function overlapMinutes(a: { from: number; to: number }, b: { from: number; to: number }): number {
  return Math.max(0, Math.min(a.to, b.to) - Math.max(a.from, b.from));
}

/** Open slots for one weekday, from the salon's stated hours. Handles overnight closing. */
function openDaypartsFor(hours: { open: string; close: string } | null): AdviceDaypart[] {
  if (!hours?.open || !hours?.close) return [];
  const from = timeToMinutes(hours.open);
  const rawTo = timeToMinutes(hours.close);
  if (Number.isNaN(from) || Number.isNaN(rawTo)) return [];
  // 20:00 to 02:00 closes after midnight; clamp at the end of the day rather than
  // spilling the tail into the next weekday, which would be a different slot.
  const to = rawTo > from ? rawTo : 24 * 60;
  return DAYPARTS.filter((p) => overlapMinutes(DAYPART_RANGES[p], { from, to }) >= MIN_OPEN_OVERLAP_MINUTES);
}

function daypartOf(hour: number): AdviceDaypart {
  const minutes = hour * 60;
  return DAYPARTS.find((p) => minutes >= DAYPART_RANGES[p].from && minutes < DAYPART_RANGES[p].to) ?? "evening";
}

const cellKey = (day: number, daypart: AdviceDaypart) => `${day}-${daypart}`;

/**
 * Reads a salon's own last {@link ADVICE_WINDOW_WEEKS} weeks of bookings and returns
 * the handful of things that are measurably out of line with its own average.
 * Returns an empty `items` array whenever the evidence is too thin; it never
 * invents an item to fill the panel.
 */
export function computeDashboardAdvice({
  bookings,
  openingHours,
  now = new Date(),
}: {
  bookings: AdviceBooking[];
  openingHours: OpeningHours | null | undefined;
  now?: Date;
}): DashboardAdvice {
  const dates = windowDateKeys(now, ADVICE_WINDOW_DAYS);

  const inWindow: { day: number; daypart: AdviceDaypart; status: string | null }[] = [];
  for (const b of bookings) {
    if (!b.starts_at) continue;
    const at = new Date(b.starts_at);
    if (Number.isNaN(at.getTime())) continue;
    const { dateKey, dayOfWeek, hour } = zurichCivil(at);
    if (!dates.has(dateKey)) continue;
    inWindow.push({ day: dayOfWeek, daypart: daypartOf(hour), status: b.status });
  }

  const missed = inWindow.filter((b) => b.status === "cancelled" || b.status === "no_show");
  const kept = inWindow.filter((b) => b.status !== "cancelled" && b.status !== "no_show");

  // Open slots, from the salon's stated hours. Fewer than two and there is nothing
  // to compare a quiet slot against, so the slot rules stay silent.
  const openCells: { day: number; daypart: AdviceDaypart }[] = [];
  for (let day = 0; day < 7; day++) {
    for (const daypart of openDaypartsFor(hoursForDay(openingHours, day))) {
      openCells.push({ day, daypart });
    }
  }
  const hasUsableHours = openCells.length >= 2;

  const counts = new Map<string, number>();
  for (const cell of openCells) counts.set(cellKey(cell.day, cell.daypart), 0);
  for (const b of kept) {
    const key = cellKey(b.day, b.daypart);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const items: AdviceItem[] = [];
  const enoughHistory = kept.length >= ADVICE_MIN_BOOKINGS;

  if (hasUsableHours && enoughHistory) {
    const inOpenCells = [...counts.values()].reduce((sum, n) => sum + n, 0);
    const average = inOpenCells / openCells.length;

    if (average >= MIN_SLOT_AVERAGE) {
      const sorted = openCells
        .map((cell) => ({ ...cell, count: counts.get(cellKey(cell.day, cell.daypart)) ?? 0 }))
        .sort((a, b) => a.count - b.count);
      const quietest = sorted[0];
      const busiest = sorted[sorted.length - 1];
      const shown = Math.round(average);

      if (quietest.count === 0) {
        items.push({ kind: "empty_slot", day: quietest.day, daypart: quietest.daypart, count: 0, average: shown });
      } else if (quietest.count <= average * QUIET_MAX_SHARE) {
        items.push({ kind: "quiet_slot", day: quietest.day, daypart: quietest.daypart, count: quietest.count, average: shown });
      }

      if (busiest.count >= average * BUSY_MIN_FACTOR && busiest !== quietest) {
        items.push({ kind: "busy_slot", day: busiest.day, daypart: busiest.daypart, count: busiest.count, average: shown });
      }
    }
  }

  if (inWindow.length >= ADVICE_MIN_BOOKINGS) {
    const rate = missed.length / inWindow.length;
    if (rate >= CANCEL_MIN_RATE) {
      items.push({
        kind: "cancellations",
        count: missed.length,
        total: inWindow.length,
        percent: Math.round(rate * 100),
      });
    }
  }

  // Most actionable first: an open slot nobody books, then money already lost to
  // no-shows, then the slot that is running hot.
  const RANK: Record<AdviceItem["kind"], number> = { empty_slot: 0, quiet_slot: 1, cancellations: 2, busy_slot: 3 };
  items.sort((a, b) => RANK[a.kind] - RANK[b.kind]);

  return {
    window_weeks: ADVICE_WINDOW_WEEKS,
    counted_bookings: kept.length,
    min_bookings: ADVICE_MIN_BOOKINGS,
    has_opening_hours: hasUsableHours,
    items,
  };
}
