// Shared Zurich wall-clock -> true UTC instant conversion. `availability_slots.starts_at`/
// `ends_at` are timestamptz and every consumer formats them assuming a TRUE UTC instant
// (Europe/Zurich display). The cron (generate-slots) always used this correctly; several
// manual dashboard paths instead stored the owner's picked wall-clock time AS IF it were UTC
// (naive "YYYY-MM-DDTHH:MM:SS", no Z), which Postgres reads as UTC, so a 09:00 CH pick landed
// on the DB as 09:00 UTC (11:00 CH in summer) and could bucket to the wrong calendar day.
//
// dateStr = "YYYY-MM-DD", hours/minutes = the Zurich wall-clock time. DST-safe: resolves the
// zone offset AT that instant rather than assuming a fixed +1/+2.
export function zurichWallClockToUtc(dateStr: string, hours: number, minutes: number): Date {
  const guess = new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`);
  // Zone offset at that instant, independent of the PROCESS timezone: render the
  // same instant in UTC and in Zurich, parse both the same way, diff them.
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  const asZurich = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  const offsetMs = asZurich.getTime() - asUtc.getTime();
  return new Date(guess.getTime() - offsetMs);
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
