// Shared Zurich wall-clock -> true UTC instant conversion. `availability_slots.starts_at`/
// `ends_at` are timestamptz and every consumer formats them assuming a TRUE UTC instant
// (Europe/Zurich display). The cron (generate-slots) always used this correctly; several
// manual dashboard paths instead stored the owner's picked wall-clock time AS IF it were UTC
// (naive "YYYY-MM-DDTHH:MM:SS", no Z), which Postgres reads as UTC, so a 09:00 CH pick landed
// on the DB as 09:00 UTC (11:00 CH in summer) and could bucket to the wrong calendar day.
//
// dateStr = "YYYY-MM-DD", hours/minutes = the Zurich wall-clock time. DST-safe: resolves the
// zone offset AT that instant rather than assuming a fixed +1/+2.
const ZURICH_CLOCK_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
export function zurichWallClockToUtc(
  dateStr: string,
  hours: number,
  minutes: number,
): Date {
  const guess = new Date(
    `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`,
  );
  // Offset at the naive UTC guess can belong to the other side of a clock
  // change. Try offsets surrounding this civil date, then require a round trip.
  const wallStamp = (instant: Date) => {
    const parts = ZURICH_CLOCK_FMT.formatToParts(instant);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((value) => value.type === type)?.value);
    const clock = new Date(0);
    clock.setUTCFullYear(part("year"), part("month") - 1, part("day"));
    clock.setUTCHours(part("hour"), part("minute"), part("second"), 0);
    return clock.getTime();
  };
  const guessMs = guess.getTime();
  const offsets = new Set(
    [-1, 0, 1].map((day) => {
      const instant = new Date(guessMs + day * 86400000);
      return wallStamp(instant) - instant.getTime();
    }),
  );
  const matches = [...offsets]
    .map((offset) => guessMs - offset)
    .filter((instant) => wallStamp(new Date(instant)) === guessMs);
  // Preserve the later occurrence of a repeated hour. A nonexistent spring
  // clock retains the old normalization; callers can refuse its failed round trip.
  return new Date(
    matches.length
      ? Math.max(...matches)
      : guessMs - (wallStamp(guess) - guessMs),
  );
}

// Reverse direction: a true UTC instant -> its Zurich-local calendar day, "YYYY-MM-DD".
// Any consumer bucketing a timestamptz (e.g. availability_slots.starts_at) by day must go
// through this, not a raw string prefix of the UTC ISO value: a slot whose Zurich-local
// start is between 00:00 and 02:00 sits on the PREVIOUS UTC day, so a startsWith(dayIso)
// prefix match silently drops it from that day's view.
const ZURICH_YMD_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function zurichYmd(d: Date): string {
  return ZURICH_YMD_FMT.format(d);
}

// Calendar readers share inclusive civil dates, with a bounded range and true
// Zurich midnight instants. Invalid/overflow dates must not normalize silently.
export function zurichCalendarRange(
  from: string | null,
  to: string | null,
): { start: string; end: string } | null {
  const parse = (value: string | null) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? date
      : null;
  };
  const first = parse(from);
  const last = parse(to);
  if (!first || !last) return null;
  const days = (last.getTime() - first.getTime()) / 86400000 + 1;
  if (days < 1 || days > 45) return null;
  last.setUTCDate(last.getUTCDate() + 1);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(last.toISOString())) return null;
  return {
    start: zurichWallClockToUtc(from!, 0, 0).toISOString(),
    end: zurichWallClockToUtc(
      last.toISOString().slice(0, 10),
      0,
      0,
    ).toISOString(),
  };
}
