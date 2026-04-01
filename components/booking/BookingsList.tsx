'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import BookingCard, { type Booking } from './BookingCard';
import { Spinner, EmptyState } from '@/components';

type BookingTab = 'upcoming' | 'past' | 'cancelled';

interface BookingsListProps {
  userId: string;
}

export default function BookingsList({ userId }: BookingsListProps) {
  const t = useTranslations('bookingsList');
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings when tab changes
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/bookings/user?tab=${tab}`
        );
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
    };

    fetchBookings();
  }, [tab]);

  // Tab handlers
  const handleReschedule = (booking: Booking) => {
    console.log('[BookingsList] Reschedule booking:', booking.id);
  };

  const handleCancel = (booking: Booking) => {
    console.log('[BookingsList] Cancel booking:', booking.id);
  };

  const handleRebook = (booking: Booking) => {
    console.log('[BookingsList] Rebook booking:', booking.id);
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-s-ink/[0.06] dark:border-white/[0.08] mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text'
          }`}
        >
          {t('upcoming')}
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text'
          }`}
        >
          {t('past')}
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'cancelled'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text'
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
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          title={t('noBookings')}
          description={
            tab === 'upcoming'
              ? 'Buche jetzt deine nächste Behandlung'
              : tab === 'past'
                ? 'Du hast noch keine abgeschlossenen Buchungen'
                : 'Du hast noch keine stornierten Buchungen'
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
    </div>
  );
}
