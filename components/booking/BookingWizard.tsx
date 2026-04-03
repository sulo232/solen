'use client';

import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import {
  ServiceSelectionStep,
  StaffSelectionStep,
  DateSelectionStep,
  TimeSelectionStep,
  ConfirmationStep,
  PaymentStep,
} from '@/components/booking';
import type { Salon, StaffMember } from '@/lib/types';

const STEPS = ['services', 'staff', 'date', 'time', 'confirm', 'payment'] as const;

const STEP_KEYS: Record<string, string> = {
  services: 'stepServices',
  staff: 'stepStaff',
  date: 'stepDate',
  time: 'stepTime',
  confirm: 'stepConfirm',
  payment: 'stepPayment',
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
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function BookingWizard({
  services,
  staffList,
  salon,
}: BookingWizardProps) {
  const t = useTranslations('booking');
  const { currentStep, goToStep, formData } = useBooking();

  const currentIndex = STEPS.indexOf(currentStep as typeof STEPS[number]);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  // Get selected staff object
  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
      ? staffList.find((s) => s.id === formData.selectedStaffId) || null
      : null;

  const canGoBack = currentIndex > 0;

  const handleBack = () => {
    if (canGoBack) {
      goToStep(STEPS[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'services':
        return <ServiceSelectionStep services={services} salonId={salon.id} />;
      case 'staff':
        return <StaffSelectionStep staffList={staffList} salonId={salon.id} />;
      case 'date':
        return <DateSelectionStep salonId={salon.id} />;
      case 'time':
        return <TimeSelectionStep salonId={salon.id} />;
      case 'confirm':
        return <ConfirmationStep salon={salon} staff={selectedStaff} />;
      case 'payment':
        return <PaymentStep salonId={salon.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* ── Progress bar ── */}
      <div className="w-full h-1 bg-s-bg-surface rounded-full overflow-hidden mb-1">
        <motion.div
          className="h-full bg-[#E8624A] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>

      {/* ── Step header ── */}
      <div className="flex items-center gap-3 px-1 py-3 mb-4">
        {canGoBack && (
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-s-bg-sunken transition-colors"
            aria-label={t('back')}
          >
            <ChevronLeft className="w-5 h-5 text-s-ink" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-[#6A6A6A]">
            {t('stepOf', { current: currentIndex + 1, total: STEPS.length })}
          </p>
          <h3 className="text-[17px] font-heading font-semibold text-s-ink truncate">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t(STEP_KEYS[currentStep] as any)}
          </h3>
        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`h-[3px] rounded-full transition-[width,background-color] duration-300 ${
              i < currentIndex
                ? "w-3 bg-[#E8624A]"
                : i === currentIndex
                ? "w-6 bg-[#E8624A]"
                : "w-3 bg-s-ink/[0.08]"
            }`}
          />
        ))}
      </div>

      {/* ── Step content with animation ── */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={currentStep}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
