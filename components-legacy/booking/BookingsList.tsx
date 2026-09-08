'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import BookingCard, { type Booking } from './BookingCard';
import CancelBookingSheet from './CancelBookingSheet';
import RescheduleSheet from './RescheduleSheet';
import { Skeleton } from '@/app/[locale]/_components/primitives';
import EmptyState from '@/components-legacy/ui/EmptyState';
import ErrorState from '@/components-legacy/ui/ErrorState';
import { toast } from '@/app/[locale]/_components/primitives/Toast';

type BookingTab = 'upcoming' | 'past' | 'cancelled';

interface BookingsListProps {
  userId: string;
}

export default function BookingsList({ userId }: BookingsListProps) {
  const t = useTranslations('bookingsList');
  const tUi = useTranslations('bookingsListUi');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cancel-confirm sheet (audit #7) — the booking pending cancellation + in-flight state.
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Reschedule sheet (in-place, replaces the old PDP redirect). RescheduleSheet owns the
  // picker + the POST /api/bookings/[id]/reschedule call itself; this only tracks the target.
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);

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

  // Reschedule: open RescheduleSheet, a real in-place reschedule via
  // POST /api/bookings/<id>/reschedule (claims the new slot before freeing the old one,
  // so it can never create a SECOND paid booking). Previously this redirected to the salon
  // PDP (2026-06-14 audit), which risked exactly that double-booking. The hint toast is now
  // only a fallback for the rare case the booking is missing the salon/service id it needs.
  const handleReschedule = (booking: Booking) => {
    if (!booking.salon_id || !booking.service_id) {
      toast.info(t('rescheduleHint'));
      return;
    }
    setRescheduleTarget(booking);
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
      {/* mockup-ok: container/spacing classes copied verbatim from the locked BookingCard.tsx
          (bg-[--raised] rounded-card border-s-border shadow-elevation-1) so the skeleton shape
          matches the real card , no new visual design, per design contract "loading = Skeleton". */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[--raised] rounded-card border border-s-border p-4 shadow-elevation-1"
              aria-hidden="true"
            >
              <div className="flex items-start gap-3">
                {/* Focal date block */}
                <Skeleton width={52} height={64} rounded={12} className="flex-none" />

                {/* Salon + service + place + time */}
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton height={16} width="70%" rounded={4} />
                  <Skeleton height={14} width="55%" rounded={4} />
                  <Skeleton height={13} width="45%" rounded={4} />
                </div>

                {/* Status pill */}
                <Skeleton width={60} height={24} rounded="full" className="flex-none" />
              </div>

              {/* Footer: price + actions */}
              <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
                <Skeleton width={80} height={18} rounded={4} />
                <div className="flex items-center gap-2">
                  <Skeleton width={90} height={36} rounded="full" />
                  <Skeleton width={38} height={38} rounded="full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          title={tCommon('errorLoading')}
          onRetry={fetchBookings}
          retryLabel={tCommon('retry')}
        />
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

      <RescheduleSheet
        booking={rescheduleTarget}
        isOpen={rescheduleTarget !== null}
        onOpenChange={(open) => { if (!open) setRescheduleTarget(null); }}
        onRescheduled={async () => {
          setRescheduleTarget(null);
          toast.success(t('rescheduledToast'));
          await fetchBookings();
        }}
      />
    </div>
  );
}
