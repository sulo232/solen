// exists-check: net-new. npm run exists ics returned no VCALENDAR/.ics generation
// anywhere in the repo (seo-comms-09, 2026-07-27). A minimal RFC 5545 VCALENDAR builder,
// no external package: Solen sends one event type (a booking) with no recurrence, no
// attendee RSVP tracking, so the handful of fields below is the whole surface a
// dependency would otherwise wrap.

function escapeIcsText(s: string): string {
  // RFC 5545 §3.3.11: backslash, semicolon, comma, and newline must be escaped.
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Format a Date as a UTC VCALENDAR timestamp: YYYYMMDDTHHMMSSZ. */
function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildBookingIcs(vars: {
  uid: string;
  title: string;
  description: string;
  location: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  url?: string;
}): string {
  const now = toIcsUtc(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//solen.ch//booking-confirmation//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${vars.uid}@solen.ch`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtc(new Date(vars.startsAt))}`,
    `DTEND:${toIcsUtc(new Date(vars.endsAt))}`,
    `SUMMARY:${escapeIcsText(vars.title)}`,
    `DESCRIPTION:${escapeIcsText(vars.description)}`,
    `LOCATION:${escapeIcsText(vars.location)}`,
    "STATUS:CONFIRMED",
    ...(vars.url ? [`URL:${escapeIcsText(vars.url)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 §3.1 requires CRLF line endings.
  return lines.join("\r\n");
}
