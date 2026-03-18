import { Resend } from "resend";

interface BookingEmailData {
  to: string;
  salonName: string;
  salonAddress?: string;
  salonPhotoUrl?: string;
  serviceName: string;
  date: string; // e.g. "2026-03-24"
  time: string; // e.g. "14:00"
  price: number;
  bookingId: string;
  cancelUrl?: string;
  mapsUrl?: string;
}

/**
 * Generate an .ics calendar attachment for a booking.
 * Uses Europe/Zurich timezone (Swiss standard).
 */
function generateICS(data: BookingEmailData): string {
  const dtStart = data.date.replace(/-/g, "") + "T" + data.time.replace(":", "") + "00";
  // Assume 1-hour duration by default
  const startH = parseInt(data.time.split(":")[0], 10);
  const endH = String(startH + 1).padStart(2, "0");
  const dtEnd = data.date.replace(/-/g, "") + "T" + endH + data.time.split(":")[1] + "00";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Solen//Booking//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Zurich",
    "BEGIN:STANDARD",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `DTSTART;TZID=Europe/Zurich:${dtStart}`,
    `DTEND;TZID=Europe/Zurich:${dtEnd}`,
    `SUMMARY:${data.serviceName} bei ${data.salonName}`,
    data.salonAddress ? `LOCATION:${data.salonAddress}` : "",
    `DESCRIPTION:Buchung bei ${data.salonName}\\nService: ${data.serviceName}\\nPreis: CHF ${data.price.toFixed(2)}`,
    `UID:${data.bookingId}@solen.ch`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

/**
 * Send a booking confirmation email via Resend.
 * If RESEND_API_KEY is not set, silently returns false.
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[booking-email] RESEND_API_KEY not set, skipping email");
    return false;
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@solen.ch";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.solen.ch";
  const cancelUrl = data.cancelUrl ?? `${baseUrl}/de/profile`;
  const mapsUrl = data.mapsUrl ?? (data.salonAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.salonAddress)}`
    : null);

  const icsContent = generateICS(data);

  try {
    await resend.emails.send({
      from: `Solen <${fromEmail}>`,
      to: data.to,
      subject: `Buchungsbestätigung: ${data.serviceName} bei ${data.salonName}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1A1A2E;">
          ${data.salonPhotoUrl ? `<img src="${data.salonPhotoUrl}" alt="${data.salonName}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px;" />` : ""}
          <h2 style="margin: 16px 0 8px; font-family: 'Syne', Arial, sans-serif;">Termin bestätigt!</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #666;">Salon</td><td style="padding: 6px 0; font-weight: 600;">${data.salonName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Service</td><td style="padding: 6px 0;">${data.serviceName}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Datum</td><td style="padding: 6px 0;">${data.date}</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Uhrzeit</td><td style="padding: 6px 0;">${data.time} Uhr</td></tr>
            <tr><td style="padding: 6px 0; color: #666;">Preis</td><td style="padding: 6px 0; font-weight: 600;">CHF ${data.price.toFixed(2)}</td></tr>
          </table>
          <div style="margin: 20px 0; display: flex; gap: 10px;">
            ${mapsUrl ? `<a href="${mapsUrl}" style="display: inline-block; padding: 10px 20px; background: #38B2AC; color: white; border-radius: 8px; text-decoration: none; font-size: 14px;">📍 Wegbeschreibung</a>` : ""}
            <a href="${cancelUrl}" style="display: inline-block; padding: 10px 20px; background: #f3f3f3; color: #1A1A2E; border-radius: 8px; text-decoration: none; font-size: 14px;">Stornieren / Ändern</a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Kostenlose Stornierung bis 24h vor dem Termin. Nach dem Termin erhältst du eine Bewertungseinladung.
          </p>
          <p style="font-size: 12px; color: #999;">
            <a href="${baseUrl}" style="color: #38B2AC;">solen.ch</a> — Beauty & Wellness Booking
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "termin.ics",
          content: Buffer.from(icsContent).toString("base64"),
          contentType: "text/calendar",
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("[booking-email] Failed to send:", err);
    return false;
  }
}
