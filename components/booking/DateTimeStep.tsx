'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface DateTimeStepProps {
  salonId: string;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface TimeGroup {
  label: string;
  slots: TimeSlot[];
}

export default function DateTimeStep({ salonId }: DateTimeStepProps) {
  const tDate = useTranslations('booking.dateSelection');
  const tTime = useTranslations('booking.timeSelection');
  const { formData, updateFormData, goToStep } = useBooking();

  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  const [timeGroups, setTimeGroups] = useState<TimeGroup[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailability = async () => {
      setIsLoadingDates(true);
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
        console.error('[DateTimeStep] Failed to fetch unavailable dates:', err);
      } finally {
        setIsLoadingDates(false);
      }
    };
    fetchUnavailability();
  }, [salonId, formData.selectedStaffId, formData.services]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!formData.selectedDate) return;

    const fetchTimeSlots = async () => {
      setIsLoadingSlots(true);
      setSlotsError(null);
      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          date: formData.selectedDate!.toISOString().split('T')[0],
          staff_id: formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
          duration_minutes: formData.totalDuration.toString(),
        });
        const res = await fetch(`/api/availability/time-slots?${params}`);
        if (!res.ok) throw new Error('Failed to fetch time slots');
        const data = await res.json();

        const groups: TimeGroup[] = [
          {
            label: tTime('morning'),
            slots: data.slots.filter((s: TimeSlot) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 8 && hour < 12;
            }),
          },
          {
            label: tTime('afternoon'),
            slots: data.slots.filter((s: TimeSlot) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 12 && hour < 17;
            }),
          },
          {
            label: tTime('evening'),
            slots: data.slots.filter((s: TimeSlot) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 17 && hour < 21;
            }),
          },
        ].filter((g) => g.slots.length > 0);

        setTimeGroups(groups);
      } catch (err) {
        console.error('[DateTimeStep] Failed to fetch time slots:', err);
        setSlotsError(tTime('errorFetchingSlots'));
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [salonId, formData.selectedDate, formData.selectedStaffId, formData.services, tTime]);

  const handleSelectDate = (date: any) => {
    setError(null);
    updateFormData({ selectedDate: new Date(date.toString()), selectedTime: null });
  };

  const handleSelectTime = (time: string) => {
    setError(null);
    updateFormData({ selectedTime: time });
  };

  const handleContinue = () => {
    if (!formData.selectedDate) {
      setError(tDate('selectDate'));
      return;
    }
    if (!formData.selectedTime) {
      setError(tTime('selectTime'));
      return;
    }
    setIsChecking(true);
    goToStep('confirm');
    setIsChecking(false);
  };

  const isDateDisabled = (date: any) => unavailableDates.has(date.toString());

  return (
    <div className="space-y-6 pb-28">
      {/* Date picker */}
      {isLoadingDates ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="border border-s-ink/[0.08] dark:border-white/[0.08] rounded-card p-4 bg-[--raised] dark:bg-s-dm-surface">
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
                  className="p-2 rounded-input hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  ←
                </AriaButton>
                <AriaButton
                  slot="next"
                  className="p-2 rounded-input hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
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
                      `w-10 h-10 rounded-input flex items-center justify-center font-body text-sm font-semibold cursor-pointer transition-[border-color,background-color] duration-150 ${
                        isSelected
                          ? 'bg-s-coral text-white ring-2 ring-s-coral/30'
                          : isUnavailable
                          ? 'text-s-ink/20 dark:text-s-dm-text/20 cursor-not-allowed line-through'
                          : isOutsideMonth
                          ? 'text-s-ink/20 dark:text-s-dm-text/20'
                          : 'text-s-ink dark:text-s-dm-text hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.06]'
                      }`
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </div>
      )}

      {/* Time slots — appear after date is selected */}
      <AnimatePresence>
        {formData.selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="border-t border-s-ink/[0.06] dark:border-white/[0.08] pt-5">
              <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mb-4">
                {tTime('title')}
              </p>

              {isLoadingSlots ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : slotsError ? (
                <p className="text-center text-sm text-s-ink/60 dark:text-s-dm-text/60 py-4">
                  {slotsError}
                </p>
              ) : timeGroups.length === 0 ? (
                <div className="text-center py-6">
                  <Clock size={36} className="mx-auto text-s-ink/20 dark:text-s-dm-text/20 mb-2" />
                  <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
                    {tTime('noSlotsAvailable')}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {timeGroups.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.slots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.isAvailable && handleSelectTime(slot.time)}
                            disabled={!slot.isAvailable}
                            className={`px-4 py-2 rounded-pill border text-sm font-heading font-semibold transition-[border-color,background-color] duration-150 ${
                              formData.selectedTime === slot.time
                                ? 'bg-s-coral border-s-coral text-white'
                                : slot.isAvailable
                                ? 'border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
                                : 'bg-s-ink/[0.03] dark:bg-white/[0.02] border-transparent text-s-ink/30 dark:text-s-dm-text/30 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-s-coral text-center">{error}</p>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4 z-40">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={handleContinue}
            disabled={!formData.selectedDate || !formData.selectedTime || isChecking}
            className="w-full py-3 rounded-btn bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {tDate('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
