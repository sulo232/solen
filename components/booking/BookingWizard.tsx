'use client';

import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import {
  ServicesStaffStep,
  DateTimeStep,
  PayConfirmStep,
} from '@/components/booking';
import type { Salon, StaffMember } from '@/lib/types';

/**
 * BookingWizard — Q55 (locked 2026-05-02) 3-step wizard, Q56 step indicator.
 *
 * Steps collapsed from 4 to 3 per Q55:
 *   - Step 1: services-staff (Service + Staff)        ← unchanged
 *   - Step 2: datetime       (Date + Time)            ← unchanged
 *   - Step 3: pay-confirm    (Bestätigen & Zahlen)    ← NEW PayConfirmStep merges
 *                                                       former ConfirmationStep + PaymentStep
 *
 * Q56 progress indicator:
 *   - 3-segment progress bar, coral fill = current OR completed
 *   - eyebrow `Schritt N / 3` (Figtree 700 .22em coral)
 *   - Anton step label below
 *   - Tappable previous segments for jump-back (preserves formData)
 *   - NO numbered circles, NO breadcrumb pills, NO walking dots
 *
 * Legacy currentStep values 'confirm' + 'payment' are mapped to 'pay-confirm'
 * so existing in-progress sessions don't lose state on first load post-deploy.
 */
const STEPS = ['services-staff', 'datetime', 'pay-confirm'] as const;
type ActiveStep = typeof STEPS[number];

const STEP_LABELS: Record<ActiveStep, string> = {
  'services-staff': 'Service & Stylist',
  'datetime': 'Datum & Zeit',
  'pay-confirm': 'Bestätigen & Zahlen',
};

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface BookingWizardProps {
  services: Service[];
  staffList: StaffMember[];
  salon: Salon;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

export default function BookingWizard({ services, staffList, salon }: BookingWizardProps) {
  const t = useTranslations('booking') as any;
  const { currentStep, goToStep, formData } = useBooking();

  // Map legacy step keys to the new 3-step enum (graceful migration for in-progress sessions)
  const normalizedStep: ActiveStep =
    currentStep === 'confirm' || currentStep === 'payment'
      ? 'pay-confirm'
      : STEPS.includes(currentStep as ActiveStep)
        ? (currentStep as ActiveStep)
        : STEPS[0];

  const currentIndex = STEPS.indexOf(normalizedStep);

  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
      ? staffList.find((s) => s.id === formData.selectedStaffId) || null
      : null;

  const canGoBack = currentIndex > 0;

  const handleBack = () => {
    if (canGoBack) goToStep(STEPS[currentIndex - 1]);
  };

  const handleSegmentJump = (i: number) => {
    // Q56: only previous segments are tappable (forward-jumping breaks validation order)
    if (i < currentIndex) goToStep(STEPS[i]);
  };

  const renderStep = () => {
    switch (normalizedStep) {
      case 'services-staff':
        return <ServicesStaffStep services={services} staffList={staffList} salonId={salon.id} />;
      case 'datetime':
        return <DateTimeStep salonId={salon.id} />;
      case 'pay-confirm':
        return <PayConfirmStep salon={salon} staff={selectedStaff} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Q56 progress indicator — 3-segment bar + eyebrow + Anton step label */}
      <div className="px-1 pt-2 pb-4">
        {/* 3-segment bar */}
        <div className="flex items-center gap-[3px] mb-3" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((step, i) => {
            const isFilled = i <= currentIndex;
            const isPast = i < currentIndex;
            return (
              <button
                key={step}
                type="button"
                onClick={() => handleSegmentJump(i)}
                disabled={!isPast}
                aria-label={`Zurück zu Schritt ${i + 1}: ${STEP_LABELS[step]}`}
                className={[
                  'flex-1 h-[3px] rounded-full transition-colors duration-200',
                  isFilled ? 'bg-s-coral' : 'bg-s-bg-sunken',
                  isPast ? 'cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-1' : 'cursor-default',
                ].join(' ')}
              />
            );
          })}
        </div>

        {/* Eyebrow + Anton step label */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label={t('back')}
              className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center hover:bg-s-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-1"
            >
              <ChevronLeft size={18} className="text-s-ink" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-[.22em] text-s-coral-text">
              Schritt {currentIndex + 1} / {STEPS.length}
            </p>
            <h3 className="font-heading text-[16px] sm:text-[20px] uppercase text-s-ink leading-[0.95]" style={{ letterSpacing: '0.01em' }}>
              {STEP_LABELS[normalizedStep]}
            </h3>
          </div>
        </div>
      </div>

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={normalizedStep}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.4, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
