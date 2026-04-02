'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import {
  Calendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
  Button as AriaButton,
} from 'react-aria-components';
import { parseDate } from '@internationalized/date';
import Spinner from '@/components/ui/Spinner';

interface DateSelectionStepProps {
  salonId: string;
}

export default function DateSelectionStep({ salonId }: DateSelectionStepProps) {
  const t = useTranslations('booking.dateSelection');
  const { formData, updateFormData, goToStep } = useBooking();
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailability = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          staff_id: formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
        });

        const res = await fetch(`/api/availability/unavailable-dates?${params}`);
        if (!res.ok) throw new Error('Failed to fetch unavailable dates');

        const data = await res.json();
        setUnavailableDates(new Set(data.unavailableDates || []));
      } catch (err) {
        console.error('[DateSelectionStep] Failed to fetch unavailable dates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnavailability();
  }, [salonId, formData.selectedStaffId, formData.services]);

  const handleSelectDate = (date: any) => {
    const isoString = date.toString();
    updateFormData({ selectedDate: new Date(isoString) });
  };

  const handleContinue = () => {
    if (!formData.selectedDate) {
      alert(t('selectDate'));
      return;
    }
    setIsChecking(true);
    goToStep('time');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('staff');
  };

  const isDateDisabled = (date: any) => {
    return unavailableDates.has(date.toString());
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="border border-s-ink/[0.08] dark:border-white/[0.08] rounded-[16px] p-4 bg-[--raised] dark:bg-s-dm-surface">
          <Calendar
            value={
              formData.selectedDate
                ? parseDate(formData.selectedDate.toISOString().split('T')[0])
                : undefined
            }
            onChange={handleSelectDate}
            minValue={parseDate(new Date().toISOString().split('T')[0])}
            isDateUnavailable={isDateDisabled}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <Heading className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text" />
              <div className="flex gap-1">
                <AriaButton
                  slot="previous"
                  className="p-2 rounded-[8px] hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  ←
                </AriaButton>
                <AriaButton
                  slot="next"
                  className="p-2 rounded-[8px] hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  →
                </AriaButton>
              </div>
            </div>
            <CalendarGrid className="border-collapse space-y-2">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-center text-xs font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 p-2">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isUnavailable, isOutsideMonth }) =>
                      `w-10 h-10 rounded-[8px] flex items-center justify-center font-body text-sm font-semibold cursor-pointer transition-[border-color,background-color] duration-150 ${
                        isSelected
                          ? 'bg-s-coral text-white ring-2 ring-s-coral/30'
                          : isUnavailable
                          ? 'text-s-ink/20 dark:text-s-dm-text/20 cursor-not-allowed'
                          : isOutsideMonth
                          ? 'text-s-ink/20 dark:text-s-dm-text/20'
                          : 'text-s-ink dark:text-s-dm-text hover:-translate-y-[5px] hover:shadow-v5-card-hover'
                      }`
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-[transform,filter,border-color,background-color] duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!formData.selectedDate || isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
