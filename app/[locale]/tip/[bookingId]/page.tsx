"use client";

// Booking tip deep-link (the tipPromptEmail target). Opens the shared <TipSheet> over a plain
// backdrop, so the tip is the same bottom-sheet popup here as it is in-app. Dismiss → home.
// /api/tips returns the clientSecret (100% to the salon's Connect account, no platform fee).

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import ErrorState from "@/components-legacy/ui/ErrorState";
import Spinner from "@/components-legacy/ui/Spinner";
import TipSheet from "@/app/[locale]/_components/tips/TipSheet";
import { localizedField } from "@/lib/i18n/localized-field";

export default function BookingTipPage() {
  const params = useParams()!;
  const router = useRouter();
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const bookingId = params?.bookingId as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setBooking(null);
    try {
      if (!bookingId) throw new Error("Booking ID missing");
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) throw new Error(`Booking request failed: ${response.status}`);
      const payload = await response.json();
      const loaded = payload.data ?? payload.booking ?? payload;
      if (!loaded || loaded.id !== bookingId) throw new Error("Booking response identity mismatch");
      setBooking(loaded);
    } catch (err) {
      console.error("[BookingTip] failed to load booking:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void loadBooking(); }, [loadBooking]);

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

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-s-bg-sunken">
        <ErrorState title={tCommon("errorPaymentLoading")} retryLabel={tCommon("retry")} onRetry={loadBooking} />
      </div>
    );
  }

  const staffName =
    booking?.staff_name ?? booking?.staff_member_name ?? booking?.staff_members?.name ?? booking?.staff?.name ?? "Stylist";
  const staffPhoto = booking?.staff_avatar_url ?? booking?.staff_members?.avatar_url ?? booking?.staff?.avatar_url ?? null;
  const staffRating = booking?.staff_rating ?? booking?.staff_members?.average_rating ?? booking?.staff?.average_rating ?? null;
  const staffReviews = booking?.staff_review_count ?? booking?.staff_members?.review_count ?? booking?.staff?.review_count ?? null;
  const serviceName =
    localizedField(booking.services ?? booking.service, "name", locale) || booking.service_name || null;
  const salonName = booking?.salon_name ?? booking?.salons?.name ?? booking?.salon?.name ?? null;
  const contextLine = [serviceName, salonName].filter(Boolean).join(" ") || undefined;

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
