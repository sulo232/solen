'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';

export interface Booking {
  id: string;
  user_id: string;
  salon_id: string;
  service_id: string;
  slot_id: string;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  is_first_visit?: boolean;
  is_recurring?: boolean;
  sms_sent_24h?: boolean;
  sms_sent_1h?: boolean;
  review_prompt_sent?: boolean;
  // Joined fields
  salon?: {
    id: string;
    name: string;
    address: string;
    average_rating: number;
    review_count: number;
  };
  service?: {
    id: string;
    name_de: string;
    name_en: string;
    name_fr?: string;
    name_it?: string;
    duration_minutes: number;
    price: number;
  };
  staff?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface BookingCardProps {
  booking: Booking;
  onReschedule?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onRebook?: (booking: Booking) => void;
}

export default function BookingCard({
  booking,
  onReschedule,
  onCancel,
  onRebook,
}: BookingCardProps) {
  const t = useTranslations('bookingCard');
  const locale = useLocale();
  const [showMenu, setShowMenu] = React.useState(false);

  // Format date and time
  const startDate = new Date(booking.starts_at);
  const endDate = new Date(booking.ends_at);
  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60)
  );

  const formattedDate = startDate.toLocaleDateString(locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = startDate.toLocaleTimeString(locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Status color and label
  const statusConfig = {
    confirmed: {
      label: t('status.confirmed'),
      bgColor: 'bg-s-sage/10 dark:bg-s-sage/10',
      textColor: 'text-s-sage dark:text-s-sage',
      borderColor: 'border-s-sage/30 dark:border-s-sage/30',
    },
    pending: {
      label: t('status.pending'),
      bgColor: 'bg-s-warning/10 dark:bg-s-warning/10',
      textColor: 'text-s-warning dark:text-s-warning',
      borderColor: 'border-s-warning/30 dark:border-s-warning/30',
    },
    cancelled: {
      label: t('status.cancelled'),
      bgColor: 'bg-s-error/10 dark:bg-s-error/10',
      textColor: 'text-s-error dark:text-s-error',
      borderColor: 'border-s-error/30 dark:border-s-error/30',
    },
    completed: {
      label: t('status.completed'),
      bgColor: 'bg-s-ink/5 dark:bg-s-dm-text/5',
      textColor: 'text-s-ink/60 dark:text-s-dm-text/60',
      borderColor: 'border-s-ink/10 dark:border-s-dm-text/10',
    },
  };

  const status = statusConfig[booking.status];

  // Service name based on locale
  const getServiceName = () => {
    if (!booking.service) return '-';
    const langKey = `name_${locale}` as keyof typeof booking.service;
    return booking.service[langKey] || booking.service.name_de || booking.service.name_en || '-';
  };

  return (
    <div className="bg-[--raised] dark:bg-s-dm-surface rounded-card border border-s-ink/[0.06] dark:border-white/[0.08] overflow-hidden hover:-translate-y-[5px] hover:shadow-elevation-3 transition-[transform,box-shadow] duration-200">
      {/* Header */}
      <div className="p-4 border-b border-s-ink/[0.06] dark:border-white/[0.08] flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold text-s-ink dark:text-s-dm-text">
            {booking.salon?.name || '-'}
          </h3>
          {booking.salon?.average_rating && booking.salon?.review_count ? (
            <div className="flex items-center gap-1 mt-1 text-sm text-s-ink/60 dark:text-s-dm-text/60">
              <Star size={14} className="fill-s-amber text-s-amber" />
              <span>
                {booking.salon.average_rating.toFixed(1)} ({booking.salon.review_count} {t('reviews')})
              </span>
            </div>
          ) : null}
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-pill text-xs font-semibold ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
          {status.label}
        </div>
      </div>

      {/* Service & Duration */}
      <div className="px-4 py-3 border-b border-s-ink/[0.06] dark:border-white/[0.08]">
        <p className="font-body text-s-ink dark:text-s-dm-text">
          {getServiceName()}
        </p>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
          {duration} {t('minutes')}
        </p>
      </div>

      {/* Date, Time, Address */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-3 text-sm text-s-ink dark:text-s-dm-text">
          <Calendar size={16} className="text-s-ink/60 dark:text-s-dm-text/60 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-s-ink dark:text-s-dm-text">
          <Clock size={16} className="text-s-ink/60 dark:text-s-dm-text/60 flex-shrink-0" />
          <span>{formattedTime}</span>
        </div>
        {booking.salon?.address && (
          <div className="flex items-start gap-3 text-sm text-s-ink dark:text-s-dm-text">
            <MapPin size={16} className="text-s-ink/60 dark:text-s-dm-text/60 flex-shrink-0 mt-0.5" />
            <span>{booking.salon.address}</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="px-4 py-3 border-t border-s-ink/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-s-ink/60 dark:text-s-dm-text/60 text-sm">{t('total')}</span>
          <span className="font-semibold text-s-ink dark:text-s-dm-text">
            {formatCurrency(booking.price_paid)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-s-ink/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <button
          onClick={() => onRebook?.(booking)}
          className="px-4 py-2 rounded-pill bg-s-coral text-white text-sm font-semibold hover:brightness-[1.08] active:scale-[0.97] transition-[transform,filter] duration-150"
        >
          {t('rebook')}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] active:scale-[0.97] rounded-pill transition-[transform,background-color] duration-150"
            aria-label="More options"
          >
            <MoreVertical size={18} className="text-s-ink dark:text-s-dm-text" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-[--raised] dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.08] rounded-card shadow-elevation-3 z-50 min-w-[160px]">
              {booking.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => {
                      onReschedule?.(booking);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-s-ink dark:text-s-dm-text hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.08] font-body"
                  >
                    {t('reschedule')}
                  </button>
                  <button
                    onClick={() => {
                      onCancel?.(booking);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-s-error dark:text-s-error hover:bg-s-error/10 dark:hover:bg-s-error/10 font-body"
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
