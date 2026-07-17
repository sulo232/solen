"use client";

/**
 * Dev demo (motion pass 2026-06-09, see _design-system/MOTION.md): renders the REAL
 * <BookingConfirmation> with mock "paid guest" props so the SuccessMark celebration +
 * staggered .celebrate-rise risers can be watched in the actual component (reload to replay).
 * Lives at /de/dev/confirm-preview. Not linked from site nav. Safe to delete after review.
 */

import BookingConfirmation from "@/components-legacy/booking/BookingConfirmation";

export default function ConfirmPreview() {
  return (
    <BookingConfirmation
      referenceCode="SOL-7K2QX9"
      salonName="Maison Lumière"
      salonSlug="maison-lumiere"
      salonAddress="Bahnhofstrasse 21, 8001 Zürich"
      salonCoverUrl={null}
      serviceName="Damenhaarschnitt & Föhnen"
      servicePrice={85}
      staffName="Lena Brunner"
      startsAt="2026-06-14T13:30:00.000Z"
      durationMinutes={60}
      pricePaid={85}
      priceLabel="CHF 85.00"
      paidVia="stripe"
      status="confirmed"
      paymentStatus="paid"
      isGuest={true}
      accessLink="https://www.solen.ch/de/booking/lookup?code=SOL-7K2QX9&t=demo"
      accessToken={null}
      contactEmail={null}
      vatRate={8.1}
      netLabel="CHF 78.63"
      vatLabel="CHF 6.37"
      salonVatNumber="CHE-123.456.789 MWST"
      bookingId="00000000-0000-0000-0000-000000000001"
      salonId="00000000-0000-0000-0000-000000000002"
      serviceId="00000000-0000-0000-0000-000000000003"
      staffId="00000000-0000-0000-0000-000000000004"
      endsAt="2026-06-14T14:30:00.000Z"
    />
  );
}
