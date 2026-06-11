'use client';

import { useTranslations } from 'next-intl';
import { useBooking } from '@/lib/booking-context';

/**
 * BookingHeaderTitle — B1 (owner pick, council round 2026-06-11).
 *
 * Step 1 titles the task ("Service wählen") instead of repeating the salon
 * name the user just came from; later steps restore "Termin bei {salon}" as
 * the flow anchor (step names live in the stepper, which appears from step 2).
 */
export default function BookingHeaderTitle({ salonName }: { salonName: string }) {
  const t = useTranslations('booking');
  const { currentStep } = useBooking();
  const isStep1 = !currentStep || currentStep === 'services-staff';
  return (
    <h1 className="min-w-0 flex-1 font-heading text-lg font-semibold tracking-[-0.01em] text-s-ink truncate">
      {isStep1 ? t('chooseServices') : t('bookingAt', { salon: salonName })}
    </h1>
  );
}
