import { describe, expect, it, vi } from "vitest";
import { buildBookingIcs } from "@/lib/ics";

describe("booking calendar URL", () => {
  it("includes the canonical manage URL and keeps it RFC 5545 escaped", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T08:00:00.000Z"));
    const ics = buildBookingIcs({
      uid: "booking-1",
      title: "Schnitt @ Store",
      description: "Termin",
      location: "Basel",
      startsAt: "2026-09-10T08:00:00.000Z",
      endsAt: "2026-09-10T08:30:00.000Z",
      url: "https://solen.ch/de/booking/lookup?code=SOL-1&t=a,b;c",
    });

    expect(ics).toContain("URL:https://solen.ch/de/booking/lookup?code=SOL-1&t=a\\,b\\;c\r\n");
    vi.useRealTimers();
  });
});
