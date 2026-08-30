'use client';

import { useEffect } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react'; // mockup-ok: applying owner-approved /dev/motion-recipe ENTER RECIPE (2026-07-09)
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { useStepSwapMotion, SectionErrorBoundary } from '@/app/[locale]/_components/primitives';
import {
  ServicesStaffStep,
  StaffStep,
  DateTimeStep,
  PayConfirmStep,
  HairStep,
} from '@/components-legacy/booking';
import BookingExitButton from '@/components-legacy/booking/BookingExitButton';
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
// Mockup 20 (owner-approved 2026-06-11) — exact Fresha bones: services-only
// step, then the team picker as its OWN step, then Zeit (+ 'Deine Haare' when
// the cart holds hair services, 2026-06-10 mockup). NO progress UI anywhere —
// the back arrow is the navigation, the big title names the task (i18n keys
// booking.stepTitles.*). The staff step is skipped for 0/1-staff salons.
type ActiveStep = 'services-staff' | 'staff' | 'datetime' | 'hair' | 'pay-confirm';

const STEP_TITLE_KEYS: Record<ActiveStep, string> = {
  'services-staff': 'services',
  'staff': 'staff',
  'datetime': 'datetime',
  'hair': 'hair',
  'pay-confirm': 'payConfirm',
};

// Hair step shows only for hair categories — data-driven via the service rows
// (NOT a component-level category branch; V3-D205 stays intact).
const HAIR_CATEGORIES = new Set(['coiffeur', 'barbershop']);

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  // V3-D380: ServicesStaffStep's Service requires subcategory and the booking
  // page query already selects it — declaring it here aligns the two Service
  // types (fixes the pre-existing TS2719 "two unrelated Service types" error).
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

interface BookingWizardProps {
  services: Service[];
  staffList: StaffMember[];
  salon: Salon;
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
  // SP-1: surfaced from the server page so PayConfirmStep shows the guest form when logged out.
  isLoggedIn: boolean;
  // Owner 2026-08-21: surfaced from the server page so PayConfirmStep only offers the
  // gift-voucher code field when this salon actually has a redeemable voucher.
  salonHasRedeemableVoucher: boolean;
}

// Step swap uses `useStepSwapMotion` (app/[locale]/_components/primitives/motion.ts),
// the ENTER RECIPE with blur deliberately omitted for this one wrapper level
// (containing-block reasoning documented there, not re-derived here) and
// full `prefers-reduced-motion` support.

export default function BookingWizard({ services, staffList, salon, staffServices, serviceAddons, serviceOptions, isLoggedIn, salonHasRedeemableVoucher }: BookingWizardProps) {
  const t = useTranslations('booking') as any;
  const locale = useLocale();
  const router = useRouter();
  const { currentStep, goToStep, formData } = useBooking();
  const { variants: stepSwapVariants, transition: stepSwapTransition } = useStepSwapMotion();

  // Hair step is part of the flow when ANY cart service belongs to a hair category.
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

  // Map legacy step keys to the active enum (graceful migration for in-progress sessions)
  const normalizedStep: ActiveStep =
    currentStep === 'confirm' || currentStep === 'payment'
      ? 'pay-confirm'
      : STEPS.includes(currentStep as ActiveStep)
        ? (currentStep as ActiveStep)
        : STEPS[0];

  const currentIndex = STEPS.indexOf(normalizedStep);

  // Owner 2026-06-12: changing step kept the previous scroll position ("scrolled
  // down... go to the next one, it still scrolled down"). Each step starts at top.
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
        return <HairStep staff={selectedStaff} showBeard={services.some((s) => cartIds.has(s.id) && s.category === 'barbershop')} />;
      case 'pay-confirm':
        return <PayConfirmStep salon={salon} staff={selectedStaff} isLoggedIn={isLoggedIn} salonHasRedeemableVoucher={salonHasRedeemableVoucher} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Mockup 20 nav — back + X on the sunken body (no bar, no salon name,
          no progress UI; exactly the captured Fresha anatomy) */}
      {/* 2026-08-10: matched to the top bar. This was a 40px bare glyph, no fill, no border,
          no shadow, while the header drew a 44px control , two shapes for one job, which is
          half of what he meant by "multiple design styles". Now the same circle: 44, white,
          hairline plus whisper shadow. The `-ml-1` pull is gone with it; it existed to hide
          the fact that a bare glyph has no box to align. */}
      <div className="flex items-center justify-between pt-1 pb-1">
        {canGoBack ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('back')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white shadow-whisper transition-[colors,transform] hover:border-s-ink active:scale-[0.94] active:duration-[80ms] active:ease-glide"
          >
            <ArrowLeft size={22} strokeWidth={2.2} className="text-s-ink" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Step 1 back: return to where the user actually came from (the Inspo look, search, the salon page...).
              // It was hardcoded to the salon page, which dumped anyone arriving via Inspo "Book this look" onto a
              // page they never visited. Fall back to the salon page only on a deep link with no history.
              if (typeof window !== 'undefined' && window.history.length > 1) router.back();
              else router.push(`/${locale}/salon/${salon.slug}`);
            }}
            aria-label={t('back')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white shadow-whisper transition-[colors,transform] hover:border-s-ink active:scale-[0.94] active:duration-[80ms] active:ease-glide"
          >
            <ArrowLeft size={22} strokeWidth={2.2} className="text-s-ink" />
          </button>
        )}
        {/* Compact header (mockup 26, owner-approved 2026-06-12): the step title sits
            small in the bar between back and X — the 30px page title read unbalanced. */}
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink">
          {t(`stepTitles.${STEP_TITLE_KEYS[normalizedStep]}`)}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={normalizedStep}
          custom={1}
          variants={stepSwapVariants} // mockup-ok: approved /dev/motion-recipe ENTER RECIPE
          initial="enter"
          animate="center"
          exit="exit"
          transition={stepSwapTransition}
        >
          <SectionErrorBoundary section={`BookingWizard:${normalizedStep}`}>
            {renderStep()}
          </SectionErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
