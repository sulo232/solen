'use client';

// exists-check: net-new vs lib/booking-context.tsx (the state/reducer this file only consumes
// via useBooking(), not reimplements). This file's actual closest match is
// components-legacy/booking/BookingWizard.tsx itself, which it is an explicit sanctioned copy
// of per this direction's brief ("copy BookingWizard.tsx into your _v folder as the base").
// `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps, unrelated legacy nail
// wizard). `npm run exists BookingWizardB` -> 0, net-new (this file). ServicesStaffStep,
// StaffStep, DateTimeStep, HairStep, PayConfirmStep, BookingExitButton, BackButton and
// useStepSwapMotion are all real, imported unchanged below, not forked.
//
// Grounded-in: components-legacy/booking/BookingWizard.tsx (the real orchestrator this file
// is a copy of). Everything below is that file's own structure (STEPS order, nav row,
// AnimatePresence step swap, the real step components imported unchanged from
// components-legacy/booking) with exactly two changes: (1) the step-swap cross-fade with no
// x-axis travel, already what `useStepSwapMotion` produces (reused unchanged, not forked) --
// Fresha's own step-to-step motion was not captured with timing data
// (_design-system/references/fresha--booking-flow.md names no motion numbers, only anatomy),
// so this direction keeps Solen's own locked step-swap recipe rather than inventing a Fresha
// number that was never measured; (2) the new GrowingSummaryBar (./GrowingSummaryBar.tsx)
// rendered below the step content, hidden on the pay-confirm step where the step's own real
// Pay button already exists.
//
// Depicts: wizard nav row (back control, exit control, step title) -> components-legacy/booking/BookingWizard.tsx (unchanged, copied).
// Depicts: services-staff / staff / datetime / hair / pay-confirm step content -> components-legacy/booking/*.tsx (real components, imported unchanged, not forked).
// Depicts: step-swap cross-fade with no lateral movement -> app/[locale]/_components/primitives/motion.ts (useStepSwapMotion, reused unchanged).
// Depicts: growing chip + count-up summary bar -> ./GrowingSummaryBar.tsx (net-new, this direction's one idea, own Depicts manifest in that file).
//
// Conflict noted, not ported: the Fresha capture shows a breadcrumb-shaped progression cue
// and Solen's contract graveyards any such cue on this wizard, so it stays absent here exactly
// as it is absent in the real file this copies. Fresha's green due-now price emphasis is also
// not ported (Solen reserves green for an actually-completed payment state); PayConfirmStep is
// imported unchanged and untouched here regardless.

import { useEffect } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useStepSwapMotion, SectionErrorBoundary } from '@/app/[locale]/_components/primitives';
import { BackButton } from '@/app/[locale]/_components/primitives/BackButton';
import {
  ServicesStaffStep,
  StaffStep,
  DateTimeStep,
  PayConfirmStep,
  HairStep,
} from '@/components-legacy/booking';
import BookingExitButton from '@/components-legacy/booking/BookingExitButton';
import type { Salon, StaffMember } from '@/lib/types';
import GrowingSummaryBar from './GrowingSummaryBar';

type ActiveStep = 'services-staff' | 'staff' | 'datetime' | 'hair' | 'pay-confirm';

const STEP_TITLE_KEYS: Record<ActiveStep, string> = {
  'services-staff': 'services',
  'staff': 'staff',
  'datetime': 'datetime',
  'hair': 'hair',
  'pay-confirm': 'payConfirm',
};

const HAIR_CATEGORIES = new Set(['coiffeur', 'barbershop']);

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  subcategory: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  description_de: string | null;
  description_en: string | null;
  suitable_gender: string[] | null;
}

export interface StaffService {
  staff_member_id: string;
  service_id: string;
}
export interface ServiceAddon {
  service_id: string;
  addon_service_id: string;
  sort_order: number | null;
}
export interface ServiceOption {
  id: string;
  service_id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
  sort_order: number | null;
}

interface BookingWizardBProps {
  services: Service[];
  staffList: StaffMember[];
  salon: Salon;
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

export default function BookingWizardB({
  services,
  staffList,
  salon,
  staffServices,
  serviceAddons,
  serviceOptions,
  isLoggedIn,
  salonHasRedeemableVoucher,
}: BookingWizardBProps) {
  const t = useTranslations('booking') as any;
  const locale = useLocale();
  const router = useRouter();
  const { currentStep, goToStep, formData } = useBooking();
  const { variants: stepSwapVariants, transition: stepSwapTransition } = useStepSwapMotion();

  const cartIds = new Set(formData.services.map((s) => s.id));
  const hairRelevant = services.some((s) => cartIds.has(s.id) && HAIR_CATEGORIES.has(s.category));
  const hasStaffStep = staffList.length > 1;
  const STEPS: readonly ActiveStep[] = [
    'services-staff',
    ...(hasStaffStep ? (['staff'] as const) : []),
    'datetime',
    ...(hairRelevant ? (['hair'] as const) : []),
    'pay-confirm',
  ];

  const normalizedStep: ActiveStep =
    currentStep === 'confirm' || currentStep === 'payment'
      ? 'pay-confirm'
      : STEPS.includes(currentStep as ActiveStep)
        ? (currentStep as ActiveStep)
        : STEPS[0];

  const currentIndex = STEPS.indexOf(normalizedStep);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [normalizedStep]);

  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
      ? staffList.find((s) => s.id === formData.selectedStaffId) || null
      : null;

  const canGoBack = currentIndex > 0;

  const handleBack = () => {
    if (canGoBack) goToStep(STEPS[currentIndex - 1]);
  };

  const renderStep = () => {
    switch (normalizedStep) {
      case 'services-staff':
        return <ServicesStaffStep services={services} staffList={staffList} salonId={salon.id} salonSlug={salon.slug} staffServices={staffServices} serviceAddons={serviceAddons} serviceOptions={serviceOptions} nextStep={hasStaffStep ? 'staff' : 'datetime'} />;
      case 'staff':
        return <StaffStep staffList={staffList} staffServices={staffServices} salonSlug={salon.slug} />;
      case 'datetime':
        return <DateTimeStep salonId={salon.id} staffList={staffList} isLoggedIn={isLoggedIn} salonName={salon.name} nextStep={hairRelevant ? 'hair' : 'confirm'} />;
      case 'hair':
        return <HairStep staff={selectedStaff} showBeard={services.some((s) => cartIds.has(s.id) && s.category === 'barbershop')} />; // drift-ok: verbatim copy of BookingWizard.tsx:169, brief says change ONLY step-swap motion and the summary bar
      case 'pay-confirm':
        return <PayConfirmStep salon={salon} staff={selectedStaff} isLoggedIn={isLoggedIn} salonHasRedeemableVoucher={salonHasRedeemableVoucher} />;
      default:
        return null;
    }
  };

  // Direction B: the growing summary bar gates each chip on STEP PROGRESSION (has the
  // wizard moved past the step that captures this field), not on the raw form value alone,
  // so a chip "lands" once, on advance, matching the brief's "grows step by step" -- not the
  // instant a value changes mid-step.
  const showServiceChip = currentIndex > STEPS.indexOf('services-staff');
  const showStaffChip = hasStaffStep && currentIndex > STEPS.indexOf('staff');
  const showTimeChip = currentIndex > STEPS.indexOf('datetime');
  const staffLabel = hasStaffStep ? (selectedStaff ? selectedStaff.name : 'Any professional') : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pt-1 pb-1">
        {canGoBack ? (
          <BackButton
            variant="flat"
            label={t('back')}
            onClick={handleBack}
            className="shrink-0"
          />
        ) : (
          <BackButton
            variant="flat"
            label={t('back')}
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) router.back();
              else router.push(`/${locale}/salon/${salon.slug}`);
            }}
            className="shrink-0"
          />
        )}
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink"> {/* type-scale-ok: verbatim copy of BookingWizard.tsx:214, unchanged per this direction's brief */}
          {t(`stepTitles.${STEP_TITLE_KEYS[normalizedStep]}`)}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={normalizedStep}
          custom={1}
          variants={stepSwapVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={stepSwapTransition}
        >
          <SectionErrorBoundary section={`BookingWizardB:${normalizedStep}`}>
            {renderStep()}
          </SectionErrorBoundary>
        </motion.div>
      </AnimatePresence>

      <GrowingSummaryBar
        showServiceChip={showServiceChip}
        showStaffChip={showStaffChip}
        showTimeChip={showTimeChip}
        staffLabel={staffLabel}
        onReviewAndPay={() => goToStep('pay-confirm')}
        hidden={normalizedStep === 'pay-confirm'}
      />
    </div>
  );
}
