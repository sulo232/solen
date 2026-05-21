'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import BookingCard, { type Booking } from './BookingCard';
import Spinner from '@/components-legacy/ui/Spinner';
import EmptyState from '@/components-legacy/ui/EmptyState';

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
    // TODO: Implement reschedule logic
  };

  const handleCancel = (booking: Booking) => {
    // TODO: Implement cancel logic
  };

  const handleRebook = (booking: Booking) => {
    // TODO: Implement rebook logic
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-s-ink/[0.06] mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 hover:text-s-ink'
          }`}
        >
          {t('upcoming')}
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 hover:text-s-ink'
          }`}
        >
          {t('past')}
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            tab === 'cancelled'
              ? 'border-s-coral text-s-coral'
              : 'border-transparent text-s-ink/60 hover:text-s-ink'
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
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={Calendar}
          title={t('noBookings')}
          message={
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
