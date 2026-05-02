'use client';

import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import {
  ServicesStaffStep,
  DateTimeStep,
  ConfirmationStep,
  PaymentStep,
} from '@/components/booking';
import type { Salon, StaffMember } from '@/lib/types';

const STEPS = ['services-staff', 'datetime', 'confirm', 'payment'] as const;
type ActiveStep = typeof STEPS[number];

const STEP_KEYS: Record<string, string> = {
  'services-staff': 'stepServicesStaff',
  datetime: 'stepDatetime',
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = useTranslations('booking') as any;
  const { currentStep, goToStep, formData } = useBooking();

  const activeStep: ActiveStep = STEPS.includes(currentStep as ActiveStep)
    ? (currentStep as ActiveStep)
    : STEPS[0];
  const currentIndex = STEPS.indexOf(activeStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

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
    switch (activeStep) {
      case 'services-staff':
        return (
          <ServicesStaffStep
            services={services}
            staffList={staffList}
            salonId={salon.id}
          />
        );
      case 'datetime':
        return <DateTimeStep salonId={salon.id} />;
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
      {/* Progress bar — h-1.5 (6px), animated fill */}
      <div className="w-full h-1.5 bg-s-ink/[0.06] rounded-full overflow-hidden mb-1">
        <motion.div
          className="h-full bg-s-coral rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>

      {/* Step header */}
      <div className="flex items-center gap-3 px-1 py-3 mb-4">
        {canGoBack && (
          <button
            onClick={handleBack}
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-s-ink/[0.06]:bg-white/[0.06] transition-colors"
            aria-label={t('back')}
          >
            <ChevronLeft className="w-5 h-5 text-s-ink" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-heading font-bold uppercase tracking-[.08em] text-s-ink/50">
            {t('stepOf', { current: currentIndex + 1, total: STEPS.length })}
          </p>
          <h3 className="text-lg font-heading font-semibold text-s-ink truncate">
            {t(STEP_KEYS[activeStep])}
          </h3>
        </div>
      </div>

      {/* Step dots — spring animation on active width */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            animate={{
              width: i === currentIndex ? 32 : 16,
              backgroundColor:
                i <= currentIndex
                  ? 'rgb(232, 98, 74)'
                  : 'rgba(26, 18, 9, 0.08)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="h-1 rounded-full"
          />
        ))}
      </div>

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={activeStep}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
