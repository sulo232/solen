"use client";

// Booking tip deep-link (the tipPromptEmail target). Opens the shared <TipSheet> over a plain
// backdrop, so the tip is the same bottom-sheet popup here as it is in-app. Dismiss → home.
// /api/tips returns the clientSecret (100% to the salon's Connect account, no platform fee).

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Spinner from "@/components-legacy/ui/Spinner";
import TipSheet from "@/app/[locale]/_components/tips/TipSheet";

export default function BookingTipPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const bookingId = params?.bookingId as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.booking ?? d))
      .catch((err) => console.error("[BookingTip] failed to load booking:", err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const close = () => {
    setOpen(false);
    setTimeout(() => router.push(`/${locale}`), 250);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-s-bg-sunken">
        <Spinner size="md" />
      </div>
    );
  }

  const staffName =
    booking?.staff_name ?? booking?.staff_member_name ?? booking?.staff?.name ?? "Stylist";
  const staffPhoto = booking?.staff_avatar_url ?? booking?.staff?.avatar_url ?? null;
  const staffRating = booking?.staff_rating ?? booking?.staff?.average_rating ?? null;
  const staffReviews = booking?.staff_review_count ?? booking?.staff?.review_count ?? null;
  const serviceName = booking?.service_name ?? booking?.service?.name_de ?? null;
  const salonName = booking?.salon_name ?? booking?.salon?.name ?? null;
  const contextLine = [serviceName, salonName].filter(Boolean).join(" · ") || undefined;

  return (
    <div className="min-h-screen bg-s-bg-sunken">
      <TipSheet
        open={open}
        onClose={close}
        recipientName={staffName}
        recipientPhoto={staffPhoto}
        recipientRating={staffRating}
        recipientReviewCount={staffReviews}
        contextLine={contextLine}
        locale={locale}
        createIntent={(amount) =>
          fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId, amount }),
          }).then((r) => r.json())
        }
      />
    </div>
  );
}
