'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar } from 'lucide-react';
import BookingCard, { type Booking } from './BookingCard';
import CancelBookingSheet from './CancelBookingSheet';
import Spinner from '@/components-legacy/ui/Spinner';
import EmptyState from '@/components-legacy/ui/EmptyState';
import { toast } from '@/app/[locale]/_components/primitives/Toast';

type BookingTab = 'upcoming' | 'past' | 'cancelled';

interface BookingsListProps {
  userId: string;
}

export default function BookingsList({ userId }: BookingsListProps) {
  const t = useTranslations('bookingsList');
  const tUi = useTranslations('bookingsListUi');
  const locale = useLocale();
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cancel-confirm sheet (audit #7) — the booking pending cancellation + in-flight state.
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/user?tab=${tab}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('[BookingsList] Failed to load bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Fetch bookings when tab changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Cancel: open the confirm sheet (shows the real refund preview). The actual POST runs
  // from the sheet's confirm button (audit #7 — replaces the old window.confirm()).
  const handleCancel = (booking: Booking) => setCancelTarget(booking);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Cancel failed: ${response.statusText}`);
      }
      toast.success(t('cancelledToast'));
      setCancelTarget(null);
      await fetchBookings();
    } catch (err) {
      console.error('[BookingsList] Failed to cancel booking:', err);
      toast.error(err instanceof Error ? err.message : t('cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  // Reschedule needs a new slot picked on the salon calendar; this list has no picker.
  // The booking carries salon.slug, so route to the salon page where the user picks a
  // new time (true in-place reschedule via POST /api/bookings/<id>/reschedule is a
  // separate flow). Routing to the PDP — not straight into /booking — avoids silently
  // creating a SECOND paid booking while the original still stands. Fallback to the hint
  // only when the slug is somehow missing. (2026-06-14 audit: was a no-op hint toast.)
  const handleReschedule = (booking: Booking) => {
    const slug = booking.salon?.slug;
    if (slug) {
      window.location.href = `/${locale}/salon/${slug}`;
    } else {
      toast.info(t('rescheduleHint'));
    }
  };

  // Rebook: reuse the express-rebook API (works from the booking id) to find the next
  // available slot, then confirm it via express-rebook/confirm, then refetch.
  const handleRebook = async (booking: Booking) => {
    try {
      const response = await fetch('/api/bookings/express-rebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: booking.salon_id,
          service_id: booking.service_id,
          rebook_from_booking_id: booking.id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Rebook failed: ${response.statusText}`);
      }
      const slot = data.suggestedSlot;
      if (!slot?.slotId) {
        throw new Error(data.error || t('rebookNoSlot'));
      }
      const confirmRes = await fetch('/api/bookings/express-rebook/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.slotId,
          service_id: data.serviceId,
          staff_id: data.staffId,
          source_booking_id: data.sourceBookingId,
        }),
      });
      if (!confirmRes.ok) {
        const cd = await confirmRes.json().catch(() => ({}));
        throw new Error(cd.error || `Rebook failed: ${confirmRes.statusText}`);
      }
      toast.success(t('rebookedToast'));
      await fetchBookings();
    } catch (err) {
      console.error('[BookingsList] Failed to rebook booking:', err);
      toast.error(err instanceof Error ? err.message : t('rebookError'));
    }
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-s-border mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-s-ink text-s-ink'
              : 'border-transparent text-s-ink-2 hover:text-s-ink'
          }`}
        >
          {t('upcoming')}
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-s-ink text-s-ink'
              : 'border-transparent text-s-ink-2 hover:text-s-ink'
          }`}
        >
          {t('past')}
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'cancelled'
              ? 'border-s-ink text-s-ink'
              : 'border-transparent text-s-ink-2 hover:text-s-ink'
          }`}
        >
          {t('cancelled')}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-s-error">{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={Calendar}
          title={t('noBookings')}
          message={
            tab === 'upcoming'
              ? tUi('emptyUpcoming')
              : tab === 'past'
                ? tUi('emptyPast')
                : tUi('emptyCancelled')
          }
        />
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onRebook={handleRebook}
            />
          ))}
        </div>
      )}

      <CancelBookingSheet
        booking={cancelTarget}
        isOpen={cancelTarget !== null}
        onOpenChange={(open) => { if (!open && !cancelling) setCancelTarget(null); }}
        onConfirm={confirmCancel}
        cancelling={cancelling}
      />
    </div>
  );
}
