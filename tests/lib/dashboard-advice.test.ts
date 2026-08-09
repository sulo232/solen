// tests/lib/dashboard-advice.test.ts
//
// The dashboard advice panel (owner decision 9, 2026-08-09) states things to the salon
// owner as fact. These tests exist because the expensive failure is not a crash, it is a
// confident sentence that is wrong: advice about a day the salon is closed, a weekday
// pattern read off one sample, or a hour bucket that is off by the UTC-to-Zurich shift.
//
// Pure logic, no db, no network: computeDashboardAdvice takes bookings + opening hours.

import { describe, it, expect } from "vitest";
import { computeDashboardAdvice, ADVICE_MIN_BOOKINGS, type AdviceBooking } from "@/lib/dashboard-advice";

// A Thursday, so "yesterday" and the 56-day window are unambiguous.
const NOW = new Date("2026-08-06T10:00:00Z");

const OPEN_ALL_WEEK = {
  mon: { open: "09:00", close: "19:00" },
  tue: { open: "09:00", close: "19:00" },
  wed: { open: "09:00", close: "19:00" },
  thu: { open: "09:00", close: "19:00" },
  fri: { open: "09:00", close: "19:00" },
  sat: { open: "09:00", close: "19:00" },
  sun: { open: "09:00", close: "19:00" },
};

/** N bookings on the given Zurich weekday + hour, spread over past weeks inside the window. */
function bookingsOn(weekday: number, hourZurich: number, n: number, status = "completed"): AdviceBooking[] {
  const out: AdviceBooking[] = [];
  // 2026-08-02 is a Sunday inside the window; step back whole weeks from there.
  const sundayBase = Date.UTC(2026, 7, 2);
  for (let week = 0; week < n; week++) {
    const day = sundayBase + weekday * 86400000 - week * 7 * 86400000;
    // August is CEST (UTC+2), so a Zurich wall-clock hour is hour-2 in UTC.
    out.push({ starts_at: new Date(day + (hourZurich - 2) * 3600000).toISOString(), status });
  }
  return out;
}

describe("computeDashboardAdvice", () => {
  it("says nothing at all when the history is below the evidence floor", () => {
    const result = computeDashboardAdvice({
      bookings: bookingsOn(2, 14, 5),
      openingHours: OPEN_ALL_WEEK,
      now: NOW,
    });
    expect(result.items).toEqual([]);
    expect(result.counted_bookings).toBe(5);
    expect(result.min_bookings).toBe(ADVICE_MIN_BOOKINGS);
  });

  it("names the empty open slot, and never a slot the salon is closed for", () => {
    // Busy every open weekday except Tuesday afternoon, which is open and untouched.
    const bookings = [
      ...bookingsOn(1, 14, 8),
      ...bookingsOn(3, 14, 8),
      ...bookingsOn(4, 14, 8),
      ...bookingsOn(5, 14, 8),
    ];
    const result = computeDashboardAdvice({
      bookings,
      // Closed Saturday and Sunday: those must never be reported as empty.
      openingHours: { ...OPEN_ALL_WEEK, sat: null, sun: null },
      now: NOW,
    });
    const empty = result.items.filter((i) => i.kind === "empty_slot");
    expect(empty.length).toBe(1);
    const first = empty[0] as { day: number; daypart: string };
    expect([0, 6]).not.toContain(first.day);
    expect(result.has_opening_hours).toBe(true);
  });

  it("reads the hour in Zurich, not UTC", () => {
    // 12:30 UTC in August is 14:30 Zurich, which is the afternoon, not the morning.
    const result = computeDashboardAdvice({
      bookings: [
        ...Array.from({ length: 24 }, (_, i) => ({
          starts_at: new Date(Date.UTC(2026, 7, 2) - i * 86400000 + 12.5 * 3600000).toISOString(),
          status: "completed",
        })),
      ],
      openingHours: OPEN_ALL_WEEK,
      now: NOW,
    });
    // Nothing should ever be reported as a busy MORNING from 12:30 UTC bookings.
    const morning = result.items.filter(
      (i) => (i as { daypart?: string }).daypart === "morning" && i.kind === "busy_slot",
    );
    expect(morning).toEqual([]);
  });

  it("excludes cancelled and no-show appointments from the kept count", () => {
    const result = computeDashboardAdvice({
      bookings: [
        ...bookingsOn(2, 14, 8, "completed"),
        ...bookingsOn(3, 14, 8, "cancelled"),
        ...bookingsOn(4, 14, 8, "no_show"),
      ],
      openingHours: OPEN_ALL_WEEK,
      now: NOW,
    });
    expect(result.counted_bookings).toBe(8);
  });

  // Weekdays 1/2/3 (Mon/Tue/Wed) all land fully inside the window here. Weekday 4 is
  // NOW's own weekday, so its most recent occurrence is today and is excluded, which is
  // the behaviour the last test pins.
  it("names the cancellation share once it clears the floor, with the real counts", () => {
    const result = computeDashboardAdvice({
      bookings: [
        ...bookingsOn(1, 14, 8, "completed"),
        ...bookingsOn(2, 14, 8, "completed"),
        ...bookingsOn(3, 14, 8, "cancelled"),
      ],
      openingHours: OPEN_ALL_WEEK,
      now: NOW,
    });
    const cancel = result.items.find((i) => i.kind === "cancellations") as
      | { count: number; total: number; percent: number }
      | undefined;
    expect(cancel).toBeDefined();
    expect(cancel!.count).toBe(8);
    expect(cancel!.total).toBe(24);
    expect(cancel!.percent).toBe(33);
  });

  it("reports missing opening hours instead of guessing which slots are quiet", () => {
    const result = computeDashboardAdvice({
      bookings: bookingsOn(2, 14, 30),
      openingHours: null,
      now: NOW,
    });
    expect(result.has_opening_hours).toBe(false);
    expect(result.items.filter((i) => i.kind !== "cancellations")).toEqual([]);
  });

  it("ignores bookings outside the window, including today and the future", () => {
    const future = [{ starts_at: new Date("2026-09-01T12:00:00Z").toISOString(), status: "confirmed" }];
    const today = [{ starts_at: new Date("2026-08-06T12:00:00Z").toISOString(), status: "confirmed" }];
    const old = [{ starts_at: new Date("2026-01-01T12:00:00Z").toISOString(), status: "completed" }];
    const result = computeDashboardAdvice({
      bookings: [...future, ...today, ...old],
      openingHours: OPEN_ALL_WEEK,
      now: NOW,
    });
    expect(result.counted_bookings).toBe(0);
  });
});
