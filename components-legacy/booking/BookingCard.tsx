'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, MapPin, MoreHorizontal, Navigation, CalendarPlus, Receipt } from 'lucide-react';
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
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  has_receipt?: boolean;
  is_first_visit?: boolean;
  is_recurring?: boolean;
  sms_sent_24h?: boolean;
  sms_sent_1h?: boolean;
  review_prompt_sent?: boolean;
  // Joined fields
  salon?: {
    id: string;
    slug?: string;
    name: string;
    address: string;
    average_rating: number;
    review_count: number;
    cover_photo_url?: string | null;
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

/**
 * BookingCard: redesign 2026-06-09 (owner-approved mockup solen-bookings-mockup.html).
 * Was a 5-section, 4-hairline "form" card that read dated vs the app's mobile cards.
 * Now: one calm card with a focal date block (mirrors the confirmation screen), grouped
 * service/place/time, a single semantic status pill, one hairline, ink "Book again" + an
 * overflow for reschedule/cancel. The WHOLE card taps into the salon PDP (the action
 * buttons stop propagation so they don't trigger navigation). Real booking data only.
 */
export default function BookingCard({
  booking,
  onReschedule,
  onCancel,
  onRebook,
}: BookingCardProps) {
  const t = useTranslations('bookingCard');
  const locale = useLocale();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  // Match the existing disclosure pattern: dismiss before another card's
  // pointer or keyboard action opens its menu, retaining only one raised card.
  React.useEffect(() => {
    if (!showMenu) return;
    const dismissOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowMenu(false);
        menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismissOutside, true);
    document.addEventListener('focusin', dismissOutside, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true);
      document.removeEventListener('focusin', dismissOutside, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showMenu]);

  const startDate = new Date(booking.starts_at);
  const endDate = new Date(booking.ends_at);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  const localeCode = locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-CH';
  const dow = startDate.toLocaleDateString(localeCode, { weekday: 'short' });
  const day = startDate.toLocaleDateString(localeCode, { day: '2-digit' });
  const mon = startDate.toLocaleDateString(localeCode, { month: 'short' });
  const time = startDate.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });

  const statusConfig = {
    confirmed: { label: t('status.confirmed'), bg: 'bg-s-success/10', fg: 'text-s-success' },
    pending: { label: t('status.pending'), bg: 'bg-s-warning/10', fg: 'text-s-warning' },
    cancelled: { label: t('status.cancelled'), bg: 'bg-s-error/10', fg: 'text-s-error' },
    completed: { label: t('status.completed'), bg: 'bg-s-ink/5', fg: 'text-s-ink-2' },
    no_show: { label: t('status.no_show'), bg: 'bg-s-ink/5', fg: 'text-s-ink-2' },
  };
  // Fallback so an unexpected status can never crash the card (was `statusConfig[status]`
  // with no guard, which would throw for no_show before it was added).
  const status = statusConfig[booking.status] ?? statusConfig.completed;
  // Reschedule/cancel only make sense for a confirmed booking that hasn't happened yet.
  const isUpcoming = new Date(booking.starts_at).getTime() > Date.now();

  const getServiceName = () => {
    if (!booking.service) return '-';
    const langKey = `name_${locale}` as keyof typeof booking.service;
    return (booking.service[langKey] as string) || booking.service.name_de || booking.service.name_en || '-';
  };

  const href = booking.salon?.slug ? `/${locale}/salon/${booking.salon.slug}` : null;
  // Stop the inner action controls from triggering the card's salon-PDP navigation.
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const inner = (
    <div className={`relative bg-[--raised] rounded-card border border-s-border p-4 shadow-elevation-1 transition-[transform,box-shadow] duration-200 ease-glide hover:-translate-y-[2px] hover:shadow-elevation-2 active:scale-[0.98] ${showMenu ? 'z-30' : ''}`}>
      {href && <Link href={href} className="absolute inset-0 z-10 rounded-card" aria-label={booking.salon?.name || getServiceName()} />}
      <div className="flex items-start gap-3">
        {/* Focal date block */}
        <div className="flex-none w-[52px] rounded-[12px] bg-s-bg-sunken py-2 text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-s-ink-2">{dow}</div>
          <div className="font-heading text-[22px] font-bold leading-[1.05] text-s-ink">{day}</div>
          <div className="text-[12px] text-s-ink-2">{mon}</div>
        </div>

        {/* Salon + service + place + time */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
            {booking.salon?.name || '-'}
          </h3>
          <p className="mt-0.5 truncate text-[14px] text-s-ink">
            {getServiceName()}{duration ? ` · ${duration} ${t('minutes')}` : ''}
          </p>
          {booking.salon?.address && (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
              <MapPin size={13} className="flex-none text-s-ink-2" />
              <span className="truncate">{booking.salon.address}</span>
            </p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
            <Clock size={13} className="flex-none text-s-ink-2" />
            {time}
          </p>
        </div>

        {/* Status */}
        <div className={`flex-none rounded-pill px-2.5 py-1 text-[12px] font-semibold ${status.bg} ${status.fg}`}>
          {status.label}
        </div>
      </div>

      {/* Footer: price + actions */}
      <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
        <div className="text-[15px] font-semibold text-s-ink">
          <span className="mr-1.5 text-[12px] font-normal text-s-ink-2">{t('total')}</span>
          {formatCurrency(booking.price_paid)}
        </div>
        <div className="relative z-20 flex items-center gap-2">
          <button
            onClick={(e) => { stop(e); onRebook?.(booking); }}
            className="group grid min-h-11 place-items-center rounded-pill"
          >
            <span className="rounded-pill bg-s-ink px-4 py-2 text-[13px] font-semibold text-white transition-transform duration-150 group-hover:brightness-[1.08] group-active:scale-[0.97]">
              {t('rebook')}
            </span>
          </button>
          {(booking.status === 'confirmed' || booking.status === 'completed' || booking.has_receipt || booking.salon?.address) && (
            <div ref={menuRef} className="relative">
              <button
                ref={menuTriggerRef}
                onClick={(e) => { stop(e); setShowMenu((v) => !v); }}
                className="grid h-11 w-11 place-items-center rounded-pill border border-s-border bg-white text-s-ink transition-transform duration-150 active:scale-[0.97]"
                aria-label={t('actions')}
                aria-expanded={showMenu}
                aria-controls={showMenu ? menuId : undefined}
              >
                <MoreHorizontal size={18} strokeWidth={1.9} />
              </button>
              {showMenu && (
                <div id={menuId} className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-card border border-s-border bg-[--raised] shadow-elevation-3" onClick={stop}>
                  {booking.status === 'confirmed' && isUpcoming && (<>
                  <button
                    onClick={(e) => { stop(e); onReschedule?.(booking); setShowMenu(false); }}
                    className="block min-h-11 w-full px-4 py-2.5 text-left text-[14px] text-s-ink hover:bg-s-bg-sunken"
                  >
                    {t('reschedule')}
                  </button>
                  <button
                    onClick={(e) => { stop(e); onCancel?.(booking); setShowMenu(false); }}
                    className="block min-h-11 w-full px-4 py-2.5 text-left text-[14px] text-s-error hover:bg-s-error/10"
                  >
                    {t('cancel')}
                  </button>
                  </>)}
                  {/* mockup-ok: public/_mockups/r2-booking-actions/index.html (variant B, owner-approved 2026-09-06) */}
                  {booking.salon?.address && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${booking.salon.name}, ${booking.salon.address}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex min-h-11 items-center gap-2 w-full px-4 py-2.5 text-left text-[14px] text-s-ink hover:bg-s-bg-sunken"
                    >
                      <Navigation size={16} className="flex-none text-s-ink-2" />
                      {t('directions')}
                    </a>
                  )}
                  {(booking.status === 'confirmed' || booking.status === 'completed') && (
                  <a
                    href={`/api/bookings/${booking.id}/ics?locale=${encodeURIComponent(locale)}`}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="flex min-h-11 items-center gap-2 w-full px-4 py-2.5 text-left text-[14px] text-s-ink hover:bg-s-bg-sunken"
                  >
                    <CalendarPlus size={16} className="flex-none text-s-ink-2" />
                    {t('addToCalendar')}
                  </a>
                  )}
                  {booking.has_receipt && (
                    <a
                      href={`/api/bookings/${booking.id}/receipt`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex min-h-11 items-center gap-2 w-full px-4 py-2.5 text-left text-[14px] text-s-ink hover:bg-s-bg-sunken"
                    >
                      <Receipt size={16} className="flex-none text-s-ink-2" />
                      {t('receipt')}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return inner;
}
