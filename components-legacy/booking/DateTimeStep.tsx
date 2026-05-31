'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import {
  Clock,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Users,
} from 'lucide-react';
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
import Spinner from '@/components-legacy/ui/Spinner';
import type { StaffMember } from '@/lib/types';

interface DateTimeStepProps {
  salonId: string;
  staffList: StaffMember[];
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}
interface TimeGroup {
  label: string;
  slots: TimeSlot[];
}

// Local-parts yyyy-mm-dd (timezone-safe — avoids UTC date shift).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export default function DateTimeStep({ salonId, staffList }: DateTimeStepProps) {
  const tDate = useTranslations('booking.dateSelection');
  const tTime = useTranslations('booking.timeSelection');
  const tStaff = useTranslations('staffPicker') as any;
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();

  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [timeGroups, setTimeGroups] = useState<TimeGroup[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailability = async () => {
      setIsLoadingDates(true);
      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          staff_id:
            formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
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
          staff_id:
            formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
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
  const handleSelectCard = (d: Date) => {
    setError(null);
    updateFormData({ selectedDate: new Date(ymd(d)), selectedTime: null });
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

  // Horizontal day strip — next 14 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const selectedYmd = formData.selectedDate
    ? new Date(formData.selectedDate).toISOString().split('T')[0]
    : null;
  const allSlots = timeGroups.flatMap((g) => g.slots);

  const dl = locale === 'en' ? 'en-US' : locale;
  const weekday = (d: Date) =>
    d.toLocaleDateString(dl, { weekday: 'short' }).replace('.', '');
  const monthShort = (d: Date) =>
    d.toLocaleDateString(dl, { month: 'short' }).replace('.', '');

  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
      ? staffList.find((s) => s.id === formData.selectedStaffId) ?? null
      : null;

  return (
    <div className="pb-28">
      {/* Stylist pill + month-picker button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => goToStep('services-staff')}
          className="flex items-center gap-2 rounded-full border border-s-ink/[0.12] py-1.5 pl-1.5 pr-3 transition-colors hover:border-s-ink/25"
        >
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-s-bg-sunken">
            {selectedStaff?.avatar_url ? (
              <Image
                src={selectedStaff.avatar_url}
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users size={14} className="text-s-ink-2" />
            )}
          </span>
          <span className="text-[14px] font-medium text-s-ink">
            {selectedStaff ? selectedStaff.name : tStaff('any')}
          </span>
          <ChevronDown size={16} className="text-s-ink-2" />
        </button>
        <button
          type="button"
          onClick={() => setShowMonthPicker(true)}
          aria-label={tDate('pickDate')}
          className="grid h-10 w-10 place-items-center rounded-full border border-s-ink/[0.12] text-s-ink transition-colors hover:border-s-ink/25"
        >
          <CalendarIcon size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Select a date */}
      <h3 className="font-heading text-lg font-bold text-s-ink mt-7 mb-3">
        {tDate('pickDate')}
      </h3>
      {isLoadingDates ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="-mx-4 px-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {days.map((d) => {
            const key = ymd(d);
            const unavailable = unavailableDates.has(key);
            const selected = key === selectedYmd;
            return (
              <button
                key={key}
                type="button"
                disabled={unavailable}
                onClick={() => handleSelectCard(d)}
                className={`shrink-0 w-[72px] rounded-2xl border py-3 flex flex-col items-center gap-0.5 transition-colors duration-150 ${
                  selected
                    ? 'bg-s-ink border-s-ink text-white'
                    : unavailable
                      ? 'border-s-ink/[0.06] text-s-ink/30'
                      : 'border-s-ink/[0.12] bg-[--raised] text-s-ink hover:border-s-ink/30'
                }`}
              >
                <span className="text-[12px] font-medium capitalize">
                  {weekday(d)}
                </span>
                <span
                  className={`text-[22px] font-bold leading-none ${
                    unavailable ? 'line-through' : ''
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="text-[12px] capitalize">{monthShort(d)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pick a time */}
      <AnimatePresence>
        {formData.selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <h3 className="font-heading text-lg font-bold text-s-ink mt-8 mb-3">
              {tTime('title')}
            </h3>
            {isLoadingSlots ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : slotsError ? (
              <p className="py-4 text-center text-sm text-s-ink/60">{slotsError}</p>
            ) : allSlots.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={36} className="mx-auto mb-2 text-s-ink/20" />
                <p className="text-sm text-s-ink/60">{tTime('noSlotsAvailable')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {allSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => handleSelectTime(slot.time)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left text-[16px] font-semibold tabular-nums transition-colors duration-150 ${
                      formData.selectedTime === slot.time
                        ? 'bg-s-ink border-s-ink text-white'
                        : slot.isAvailable
                          ? 'border-s-ink/[0.12] bg-[--raised] text-s-ink hover:border-s-ink/30'
                          : 'border-transparent bg-s-ink/[0.03] text-s-ink/30'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-4 text-center text-sm text-s-error">{error}</p>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-ink/[0.06] bg-[--raised]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={handleContinue}
            disabled={!formData.selectedDate || !formData.selectedTime || isChecking}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking && <Spinner size="sm" invert />}
            {tDate('continue')}
          </button>
        </div>
      </div>

      {/* Month-picker popup */}
      <AnimatePresence>
        {showMonthPicker && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMonthPicker(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white px-5 pt-3 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMonthPicker(false)}
                  aria-label={tDate('back')}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-s-ink/[0.06]"
                >
                  <X size={20} className="text-s-ink" />
                </button>
              </div>
              <Calendar
                value={
                  formData.selectedDate
                    ? parseDate(
                        new Date(formData.selectedDate).toISOString().split('T')[0]
                      )
                    : undefined
                }
                onChange={(date) => {
                  handleSelectDate(date);
                  setShowMonthPicker(false);
                }}
                minValue={parseDate(ymd(new Date()))}
                isDateUnavailable={isDateDisabled}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between px-1">
                  <Heading className="text-[17px] font-heading font-bold text-s-ink" />
                  <div className="flex gap-1">
                    <AriaButton
                      slot="previous"
                      className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-ink/[0.06]"
                    >
                      ‹
                    </AriaButton>
                    <AriaButton
                      slot="next"
                      className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-ink/[0.06]"
                    >
                      ›
                    </AriaButton>
                  </div>
                </div>
                <CalendarGrid className="w-full">
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className="pb-2 text-center text-[12px] font-medium text-s-ink/40">
                        {day}
                      </CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell
                        date={date}
                        className={({ isSelected, isUnavailable, isOutsideMonth, isDisabled }) =>
                          `mx-auto grid h-10 w-10 cursor-pointer place-items-center rounded-full text-[14px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-s-ink text-white'
                              : isUnavailable || isDisabled
                                ? 'cursor-not-allowed text-s-ink/25 line-through'
                                : isOutsideMonth
                                  ? 'text-s-ink/20'
                                  : 'text-s-ink hover:bg-s-ink/[0.06]'
                          }`
                        }
                      />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
