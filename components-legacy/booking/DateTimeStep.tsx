'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Clock, ChevronDown, Users } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { parseDate, today, getLocalTimeZone, type CalendarDate } from '@internationalized/date';
import { DateTimePicker, useEnterMotion } from '@/app/[locale]/_components/primitives';
import Spinner from '@/components-legacy/ui/Spinner';
import type { StaffMember } from '@/lib/types';
import WaitlistModal from './WaitlistModal';

interface DateTimeStepProps {
  salonId: string;
  staffList: StaffMember[];
  isLoggedIn: boolean;
  salonName: string;
  /** Where "Weiter" advances. The wizard passes 'hair' when the cart has hair services
   *  (owner mockup booking-hair-step); defaults to the legacy 'confirm' (= pay-confirm). */
  nextStep?: import('@/lib/booking-state').BookingStep;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

// Local-parts yyyy-mm-dd (timezone-safe — avoids UTC date shift).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export default function DateTimeStep({ salonId, staffList, isLoggedIn, salonName, nextStep = 'confirm' }: DateTimeStepProps) {
  const tDate = useTranslations('booking.dateSelection');
  const tTime = useTranslations('booking.timeSelection');
  const tWait = useTranslations('booking.waitlist');
  const tStaff = useTranslations('staffPicker') as any;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const [showWaitlist, setShowWaitlist] = useState(false);
  const { formData, updateFormData, goToStep } = useBooking();

  const handleWaitlist = () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Dead-click fix (owner 2026-06-12): the modal needs a date; without one the
    // button silently did nothing. Ask for the day first.
    if (!formData.selectedDate) {
      setError(tDate('selectDate'));
      return;
    }
    setError(null);
    setShowWaitlist(true);
  };

  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailability = async () => {
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
          date: ymd(formData.selectedDate!),
          staff_id:
            formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
          duration_minutes: formData.totalDuration.toString(),
        });
        const res = await fetch(`/api/availability/time-slots?${params}`);
        if (!res.ok) throw new Error('Failed to fetch time slots');
        const data = await res.json();
        setSlots(
          (data.slots ?? []).map((s: TimeSlot) => ({ time: s.time, available: s.isAvailable })),
        );
      } catch (err) {
        console.error('[DateTimeStep] Failed to fetch time slots:', err);
        setSlotsError(tTime('errorFetchingSlots'));
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchTimeSlots();
  }, [salonId, formData.selectedDate, formData.selectedStaffId, formData.services, tTime]);

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
    goToStep(nextStep);
    setIsChecking(false);
  };

  // Booking selection (JS Date) <-> primitive value (CalendarDate).
  const handlePickerChange = ({ date, time }: { date: CalendarDate | null; time: string | null }) => {
    setError(null);
    updateFormData({
      selectedDate: date ? new Date(date.toString()) : null,
      selectedTime: time,
    });
  };

  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
      ? staffList.find((s) => s.id === formData.selectedStaffId) ?? null
      : null;

  // ENTER RECIPE (MOTION.md, owner-approved 2026-07-09), applied to the picker block
  // only, not the `pb-28` root: the root also contains the fixed bottom CTA bar, and a
  // resting `filter: blur(0px)` never collapses to `none` (framer-motion only special
  // cases `transform`), so it would establish a containing block and detach the bar
  // from the viewport. This block has no `position: fixed` descendant, so it is safe.
  const enterMotion = useEnterMotion();

  return (
    <div className="pb-28">
      <motion.div {...enterMotion}> {/* mockup-ok: approved /dev/motion-recipe ENTER RECIPE */}
      {/* Stylist pill, opens the staff step. Date affordances live in the picker below. */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => goToStep(staffList.length > 1 ? 'staff' : 'services-staff')}
          className="flex items-center gap-2 rounded-full border border-s-border py-1.5 pl-1.5 pr-3 transition-colors hover:border-s-ink/25"
        >
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-s-border bg-white"> {/* mockup-ok: owner-specified fix, icon was blending into the sunken background */}
            {selectedStaff?.avatar_url ? (
              <Image
                src={selectedStaff.avatar_url}
                alt=""
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users size={14} strokeWidth={1.6} className="text-s-ink-2" />
            )}
          </span>
          <span className="text-[14px] font-medium text-s-ink">
            {selectedStaff ? selectedStaff.name : tStaff('any')}
          </span>
          <ChevronDown size={16} strokeWidth={1.9} className="text-s-ink-2" />
        </button>
      </div>

      {/* Date + time, shared DateTimePicker primitive (strip layout, blue selection).
          Replaces the bespoke day-strip + slot grid + month-popup that used to live
          here; the primitive now owns the strip, the grouped slots, the loading/empty
          states, and the "more dates" month sheet. Booking keeps the orchestration
          (slot fetch, context, waitlist, CTA) below. */}
      <div className="mt-7">
        <DateTimePicker
          value={{
            date: formData.selectedDate ? parseDate(ymd(new Date(formData.selectedDate))) : null,
            time: formData.selectedTime ?? null,
          }}
          onChange={handlePickerChange}
          dateLayout="strip"
          selectedTone="accent"
          slots={slots}
          isLoadingSlots={isLoadingSlots}
          minDate={today(getLocalTimeZone())}
          isDateDisabled={(d) => unavailableDates.has(d.toString())}
          dateLabel={tDate('pickDate')}
          timeLabel={tTime('title')}
          labels={{
            morning: tTime('morning'),
            afternoon: tTime('afternoon'),
            evening: tTime('evening'),
            availableTimes: tTime('title'),
            moreDates: tDate('pickDate'),
          }}
          emptySlotContent={
            slotsError ? (
              <p className="py-4 text-center text-sm text-s-ink-2">{slotsError}</p>
            ) : (
              <div className="py-8 text-center">
                <Clock size={36} className="mx-auto mb-2 text-s-ink-2" /> {/* mockup-ok: owner-specified fix, icon was near-invisible at /20 opacity */}
                <p className="text-sm text-s-ink-2">{tTime('noSlotsAvailable')}</p>
              </div>
            )
          }
        />
      </div>
      </motion.div>

      {/* Waitlist (restructured, owner 2026-06-12): the FULL card appears only when
          the selected day genuinely has nothing free (it IS the answer then); on a
          normal day it shrinks to one quiet ink line. One primary per screen,
          the old always-on ink card competed with Weiter. */}
      {formData.selectedDate && !isLoadingSlots && slots.filter((sl) => sl.available).length === 0 && !slotsError ? (
        <div className="mt-5 rounded-2xl border border-s-border bg-[--raised] p-4">
          <div className="flex items-center gap-2 font-heading text-[15px] font-bold text-s-ink">
            {tWait('dontMissTitle')}
          </div>
          <p className="mt-1.5 mb-3.5 text-[13px] leading-snug text-s-ink-2">
            {tWait('triggerBody')}
          </p>
          <button
            type="button"
            onClick={handleWaitlist}
            className="w-full rounded-btn bg-s-ink py-3 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98]"
          >
            {tWait('joinButton')}
          </button>
        </div>
      ) : (
        <p className="mt-5 text-center">
          <button
            type="button"
            onClick={handleWaitlist}
            className="font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors hover:text-s-ink"
          >
            {tWait('quietLink')}
          </button>
        </p>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-s-error">{error}</p>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-[--raised]">
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

      {/* Waitlist modal */}
      {showWaitlist && formData.selectedDate && (
        <WaitlistModal
          salonId={salonId}
          salonName={salonName}
          service={formData.services[0] ?? null}
          preferredDate={formData.selectedDate}
          staff={selectedStaff}
          onClose={() => setShowWaitlist(false)}
        />
      )}
    </div>
  );
}
