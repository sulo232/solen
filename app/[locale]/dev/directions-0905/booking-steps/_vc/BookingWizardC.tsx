'use client';

// exists-check: net-new vs _tasks/SOLEN_DESIGN.md, _plans/MOBILE_DESIGN_SYSTEM.md,
// _plans/DESIGN_SYSTEM_HARDENING.md, _design-system/components/Step.md,
// _plans/DESIGN_PRINCIPLE_RESEARCH.md, _plans/SEARCH_SHEET_SIZE_2026-08-12.md,
// _tasks/archive/SOLEN_DESIGN.archived.md, app/[locale]/dev/motion-recipe/page.tsx: none of
// these are the booking wizard's step-swap component or a sheet-stack implementation of it
// (Step.md documents a generic multi-step form primitive, not this wizard; motion-recipe is
// the ENTER RECIPE demo page, reused here only for its constants via motion.ts, not this
// file's source). This file itself is a deliberate, brief-required COPY of the real
// components-legacy/booking/BookingWizard.tsx (confirmed identical apart from the step-swap
// block, per the brief: "copy BookingWizard.tsx into your _v folder as the base and change
// ONLY the step-swap motion and summary bar"), scoped to booking-steps/_vc/ only.
//
// Grounded-in: components-legacy/booking/BookingWizard.tsx (the real wizard this file copies)
//
// Depicts: nav row (back/title/X) -> components-legacy/booking/BookingWizard.tsx (copied unchanged)
// Depicts: services-staff step -> components-legacy/booking/ServicesStaffStep.tsx (real, unchanged)
// Depicts: staff step -> components-legacy/booking/StaffStep.tsx (real, unchanged)
// Depicts: datetime step -> components-legacy/booking/DateTimeStep.tsx (real, unchanged)
// Depicts: hair step -> components-legacy/booking/HairStep.tsx (real, unchanged)
// Depicts: pay-confirm step -> components-legacy/booking/PayConfirmStep.tsx (real, unchanged)
// Depicts: sheet-stack layering -> NET-NEW: this direction's own idea (brief's Direction C), built from LOCKFILE.md §16.1's dim/320ms-glide recipe + airbnb--motion.md's 400ms reveal + motion.ts's thud-exit pairing
//
// Direction C: Sheet layering.
//
// This file is a COPY of components-legacy/booking/BookingWizard.tsx (real component, real
// step children, real seed data via getBookingWizardSeedData.ts). Per the brief, ONLY the
// step-swap motion block is changed (the old `<AnimatePresence mode="wait"><motion.div
// key={normalizedStep} .../></AnimatePresence>` crossfade is replaced by a two-layer sheet
// stack: the current step rises as a sheet with a 28px top radius over the immediately
// preceding step, which scales to 0.96 and dims underneath, like an iOS card stack). The nav
// row (back/title/X), STEPS order, hasStaffStep/hairRelevant logic, and every step component
// import are otherwise byte-identical to the source file.
//
// Sources + numbers used (never invented, see the Sources/Conflicts note on page.tsx too):
// - 28px top radius, 0.96 previous-step scale, "dims underneath": given directly in the
//   Direction C brief.
// - Dim value `rgba(10,10,10,.42)`: _design-system/LOCKFILE.md §16.1 (the ONE existing locked
//   Solen recipe for "a page/sheet dimming underneath another sheet"), reused rather than
//   inventing a new scrim opacity.
// - Previous-layer transition, 320ms glide, "reversing on close": _design-system/LOCKFILE.md
//   §16.1 Background Option B ("translateY(10px) scale(.965) + brightness(.96), 320ms glide,
//   reversing on close"). The brief's own 0.96 (not .965) and "scale + dim" (no translateY,
//   no brightness) are used instead where the brief is explicit; 320ms glide is carried over
//   for the one thing the brief did not give a duration for.
// - New-sheet enter, 400ms glide: _design-system/references/airbnb--motion.md, "Full-screen
//   reveal (search sheet, gallery, date picker)" tier, measured 400ms on TWO independent
//   captures (gallery open, reserve/date-picker entry), mapped to Solen's `glide` token by
//   that file's own port-map table (closest fit for a decelerating, no-overshoot reveal).
// - Sheet dismiss (back), 260ms thud: app/[locale]/_components/primitives/motion.ts's own
//   `STEP_SWAP_DURATION` (0.26) + `THUD_EASE` (cubic-bezier(0.7,0,0.84,0)), the codebase's own
//   existing thud-exit convention for this exact wizard. Neither airbnb--motion.md nor
//   21st-dev--motion-kit.md measured a thud-curved dismiss (Airbnb's own capture explicitly
//   logs thud as a Solen-only curve Airbnb never uses), so no external measured value exists
//   for this one; using the codebase's own locked pairing instead of inventing a new one.
// - Curve rule (entering = glide/decelerate, exiting = thud/accelerate): FIXED per the brief,
//   applied to which of the two sheet transitions gets which curve.
//
// Because each step component (ServicesStaffStep, StaffStep, DateTimeStep, HairStep,
// PayConfirmStep) renders its own `fixed bottom-0` CTA bar (confirmed by reading all five
// files), animating a `transform` (scale/translate) on a step's wrapper establishes a CSS
// containing block for that descendant, so the previous step's fixed bar stays trapped
// inside its own receded, dimmed card rather than escaping to the real viewport bottom
// (same CSS mechanism useStepSwapMotion's own docstring names for `filter`; `transform` does
// the identical thing per spec). This is the desired look for a receded, non-interactive
// card, not a bug. The active top sheet is only scaled during its own brief enter/exit
// transition; framer-motion resets `transform` to `none` at rest, so its own fixed bar sits
// at the true viewport bottom once settled, matching every other step's real behaviour.

import { useEffect, useRef, useState } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Transition } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { SectionErrorBoundary } from '@/app/[locale]/_components/primitives';
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

interface BookingWizardCProps {
  services: Service[];
  staffList: StaffMember[];
  salon: Salon;
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

// Solen locked easing tokens (_design-system/LOCKFILE.md §4), same values motion.ts uses.
const GLIDE_EASE = [0.16, 1, 0.3, 1] as const;
const THUD_EASE = [0.7, 0, 0.84, 0] as const;

const SHEET_ENTER_DURATION = 0.4; // airbnb--motion.md, full-screen reveal, verified 400ms
const SHEET_RECEDE_DURATION = 0.32; // LOCKFILE §16.1, 320ms glide, reversing on close
const SHEET_EXIT_DURATION = 0.26; // motion.ts STEP_SWAP_DURATION (existing thud-exit pairing)

const DIM_RGBA = 'rgba(10,10,10,.42)'; // LOCKFILE §16.1 dim layer value

export default function BookingWizardC({
  services,
  staffList,
  salon,
  staffServices,
  serviceAddons,
  serviceOptions,
  isLoggedIn,
  salonHasRedeemableVoucher,
}: BookingWizardCProps) {
  const t = useTranslations('booking') as any;
  const locale = useLocale();
  const router = useRouter();
  const { currentStep, goToStep, formData } = useBooking();
  const reduceMotion = useReducedMotion();

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

  const isBarbershopCart = services.some((s) => cartIds.has(s.id) && s.category === 'barbershop'); // drift-ok: byte-identical predicate to BookingWizard.tsx's own renderStep('hair') call, copied unchanged per the brief

  const renderStepFor = (step: ActiveStep) => {
    switch (step) {
      case 'services-staff':
        return (
          <ServicesStaffStep
            services={services}
            staffList={staffList}
            salonId={salon.id}
            salonSlug={salon.slug}
            staffServices={staffServices}
            serviceAddons={serviceAddons}
            serviceOptions={serviceOptions}
            nextStep={hasStaffStep ? 'staff' : 'datetime'}
          />
        );
      case 'staff':
        return <StaffStep staffList={staffList} staffServices={staffServices} salonSlug={salon.slug} />;
      case 'datetime':
        return (
          <DateTimeStep
            salonId={salon.id}
            staffList={staffList}
            isLoggedIn={isLoggedIn}
            salonName={salon.name}
            nextStep={hairRelevant ? 'hair' : 'confirm'}
          />
        );
      case 'hair':
        return <HairStep staff={selectedStaff} showBeard={isBarbershopCart} />;
      case 'pay-confirm':
        return (
          <PayConfirmStep
            salon={salon}
            staff={selectedStaff}
            isLoggedIn={isLoggedIn}
            salonHasRedeemableVoucher={salonHasRedeemableVoucher}
          />
        );
      default:
        return null;
    }
  };

  // --- Sheet stack: the ONLY structural change from the source BookingWizard.tsx ---
  // Rolling window of at most 2 mounted steps: [previous, top] or [top] at step 1. Navigation
  // in this wizard only ever moves +-1 step (services -> staff -> datetime -> hair ->
  // pay-confirm, back one at a time), so "current + immediate previous" is always the correct
  // and complete stack depth; no deeper history is ever visible, so no deeper scale value is
  // invented for it.
  const [mountedSteps, setMountedSteps] = useState<ActiveStep[]>([STEPS[0]]);
  const lastIndexRef = useRef(currentIndex);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const justMountedRef = useRef<Set<ActiveStep>>(new Set([STEPS[0]]));

  useEffect(() => {
    const oldIndex = lastIndexRef.current;
    if (currentIndex === oldIndex) return;
    const goingForward = currentIndex > oldIndex;
    directionRef.current = goingForward ? 'forward' : 'back';
    lastIndexRef.current = currentIndex;

    setMountedSteps((prev) => {
      if (goingForward) {
        justMountedRef.current = new Set([normalizedStep]);
        return [...prev, normalizedStep].slice(-2);
      }
      const idx = prev.indexOf(normalizedStep);
      justMountedRef.current = new Set();
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [normalizedStep];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, normalizedStep]);

  const topStep = mountedSteps[mountedSteps.length - 1];
  const previousStep = mountedSteps.length > 1 ? mountedSteps[mountedSteps.length - 2] : null;
  const topIsBrandNew = justMountedRef.current.has(topStep);

  const enterTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: SHEET_ENTER_DURATION, ease: GLIDE_EASE };
  const promoteTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: SHEET_RECEDE_DURATION, ease: GLIDE_EASE };
  const recedeTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: SHEET_RECEDE_DURATION, ease: GLIDE_EASE };
  const exitTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: SHEET_EXIT_DURATION, ease: THUD_EASE };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pt-1 pb-1">
        {canGoBack ? (
          <BackButton variant="flat" label={t('back')} onClick={handleBack} className="shrink-0" />
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
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink"> {/* type-scale-ok: byte-identical to BookingWizard.tsx's own compact step title, copied unchanged per the brief */}
          {t(`stepTitles.${STEP_TITLE_KEYS[normalizedStep]}`)}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* Sheet stack stage. The real page wrapper (page.tsx, one level up) supplies the
          sunken tray background so the white sheet's 28px top radius + elevation-2 shadow
          reads against a visibly different background (edge-visibility floor). */}
      <div className="relative">
        <AnimatePresence initial={false}>
          {previousStep && (
            <motion.div
              key={`prev-${previousStep}`}
              aria-hidden="true"
              inert={true}
              className="pointer-events-none absolute inset-x-0 top-0 origin-top overflow-hidden rounded-t-[28px] bg-white"
              initial={false}
              animate={{ scale: 0.96 }}
              transition={topIsBrandNew ? recedeTransition : promoteTransition}
              style={{ transformOrigin: 'top center' }}
            >
              {renderStepFor(previousStep)}
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: DIM_RGBA }}
                initial={false}
                animate={{ opacity: 1 }}
                transition={topIsBrandNew ? recedeTransition : promoteTransition}
              />
            </motion.div>
          )}
          <motion.div
            key={topStep}
            className="relative z-10 overflow-hidden rounded-t-[28px] bg-white shadow-elevation-2"
            initial={topIsBrandNew ? { opacity: 0, y: 24, scale: 0.98 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98, transition: exitTransition }}
            transition={topIsBrandNew ? enterTransition : promoteTransition}
          >
            <SectionErrorBoundary section={`BookingWizardC:${topStep}`}>{renderStepFor(topStep)}</SectionErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
