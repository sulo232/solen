'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { SelectedService } from '@/lib/booking-state';
import type { StaffMember } from '@/lib/types';

interface WaitlistModalProps {
  salonId: string;
  salonName: string;
  service: SelectedService | null;
  preferredDate: Date;
  /** Chosen stylist from the booking flow; null = Keine Präferenz. */
  staff?: StaffMember | null;
  onClose: () => void;
}

type TimeRange = 'any' | 'morning' | 'afternoon' | 'evening';
const TIME_RANGES: TimeRange[] = ['any', 'morning', 'afternoon', 'evening'];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function WaitlistModal({
  salonId,
  salonName,
  service,
  preferredDate,
  staff = null,
  onClose,
}: WaitlistModalProps) {
  const t = useTranslations('booking.waitlist');
  const locale = useLocale();
  const [timeRange, setTimeRange] = useState<TimeRange>('any');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = preferredDate.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const serviceName = service ? (locale === 'de' ? service.name_de : service.name_en) : null;

  // Static labels — next-intl typed keys forbid dynamic t(`time_${x}`).
  const timeLabel = (tr: TimeRange) => {
    switch (tr) {
      case 'any':
        return t('time_any');
      case 'morning':
        return t('time_morning');
      case 'afternoon':
        return t('time_afternoon');
      case 'evening':
        return t('time_evening');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          service_id: service?.id,
          preferred_date: ymd(preferredDate),
          preferred_time_range: timeRange,
          staff_member_id: staff?.id ?? null,
        }),
      });
      if (!res.ok) throw new Error('waitlist_failed');
      setDone(true);
    } catch (err) {
      console.error('[WaitlistModal] join error:', err);
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40"
        // motion-ok: translucent dim backdrop behind the sheet, a scrim, not content, opacity-only is correct.
        initial={{ opacity: 0 }} // mockup-ok
        animate={{ opacity: 1 }} // mockup-ok
        exit={{ opacity: 0 }} // mockup-ok
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white px-5 pt-3 pb-8"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-s-ink/15" />

        {done ? (
          <div className="flex flex-col items-center px-2 py-6 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-s-success/10">
              <Check size={30} className="text-s-success" />
            </div>
            <h2 className="font-heading text-xl font-bold text-s-ink">{t('successTitle')}</h2>
            <p className="mt-2 text-sm text-s-ink-2">
              {t('successBody', { salon: salonName, date: dateLabel })}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-btn border border-s-border bg-white py-3.5 font-heading text-sm font-semibold text-s-ink transition-colors hover:border-s-ink/30"
            >
              {t('browseOther')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <h2 className="font-heading text-xl font-bold leading-tight text-s-ink">{t('title')}</h2>
              <button onClick={onClose} aria-label={t('close')} className="-mr-1 p-1 text-s-ink/40">
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>
            <p className="mt-1.5 mb-4 text-sm text-s-ink-2">{t('lead')}</p>

            <div className="mb-5 rounded-2xl bg-s-bg-sunken px-4 py-3">
              <div className="flex justify-between py-0.5 text-[13px]">
                <span className="text-s-ink-2">{t('salonLabel')}</span>
                <span className="font-semibold text-s-ink">{salonName}</span>
              </div>
              {serviceName && (
                <div className="flex justify-between py-0.5 text-[13px]">
                  <span className="text-s-ink-2">{t('serviceLabel')}</span>
                  <span className="font-semibold text-s-ink">{serviceName}</span>
                </div>
              )}
              <div className="flex justify-between py-0.5 text-[13px]">
                <span className="text-s-ink-2">{t('dateLabel')}</span>
                <span className="font-semibold text-s-ink">{dateLabel}</span>
              </div>
              <div className="flex justify-between py-0.5 text-[13px]">
                <span className="text-s-ink-2">{t('staffLabel')}</span>
                <span className="font-semibold text-s-ink">{staff?.name ?? t('staffAny')}</span>
              </div>
            </div>

            <p className="mb-2 font-heading text-xs font-bold uppercase tracking-[.04em] text-s-ink-2">
              {t('preferredTime')}
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTimeRange(tr)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    timeRange === tr
                      ? 'border-s-ink bg-s-bg-sunken text-s-ink'
                      : 'border-s-border text-s-ink hover:border-s-ink/30'
                  }`}
                >
                  {timeLabel(tr)}
                </button>
              ))}
            </div>

            {error && <p className="mb-3 text-center text-sm text-s-error">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
