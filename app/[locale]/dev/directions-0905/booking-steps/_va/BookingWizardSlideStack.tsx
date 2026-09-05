'use client';

// Grounded-in: components-legacy/booking/BookingWizard.tsx (this file is a copy of that real
// component, per this fan-out's explicit instruction to copy it into this direction's own
// folder and change ONLY the step-swap motion and the summary bar).
//
// Exists-check: `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps, unrelated,
// the graveyard entry itself names the CURRENT wizard this file copies as the live
// replacement). `npm run exists BookingWizard` -> 1 hit, the real component named above.
//
// Direction: A, slide stack. The one idea: steps slide horizontally like pages in a physical
// stack. The leaving step moves left 24% and dims to 60% opacity (thud, accelerating, since
// it is exiting); the entering step slides in from the right, fully opaque, over the leaving
// one (glide, decelerating, since it is arriving), 320ms. Going back reverses both directions.
// `AnimatePresence mode="popLayout"` (not the real wizard's `mode="wait"`) is the one
// structural change beyond swapping the motion hook: `mode="wait"` would finish the exit
// before starting the enter, which cannot produce "entering slides in ... over it" (the two
// must be on screen and animating at the same time for the stack/overlap read).
//
// Sources: structure = Fresha (`_design-system/references/fresha--booking-flow.md`, port map:
// "Whole wizard -> BookingWizard.tsx", step order services -> professional -> time -> confirm,
// the breadcrumb-shaped Services/Professional/Time/Confirm chrome that capture shows is
// deliberately left out, matching that same spec file's own logged conflict against this
// project's dated no-breadcrumb rule and this surface's FIXED "back arrow is the only
// navigation" constraint). Motion = this surface's own `slideStackMotion.ts` (see that file's
// header for the full duration/curve provenance, this direction has no measured
// Airbnb/21st.dev value for a horizontal step-to-step slide, so the brief's 320ms starting
// value is kept as-is). Everything else (back/exit nav, the step components, STEPS ordering
// logic, hair-step gating) is BYTE-IDENTICAL to the real BookingWizard.tsx, unchanged per the
// brief.
//
// Depicts: back arrow + exit X + centered step-title bar -> components-legacy/booking/BookingWizard.tsx (copied unchanged, same BackButton + BookingExitButton + title logic)
// Depicts: services step body + its own fixed bottom bar -> components-legacy/booking/ServicesStaffStep.tsx (real component, imported unchanged)
// Depicts: staff step body + its own fixed bottom bar -> components-legacy/booking/StaffStep.tsx (real component, imported unchanged)
// Depicts: date/time step body -> components-legacy/booking/DateTimeStep.tsx (real component, imported unchanged)
// Depicts: hair step body -> components-legacy/booking/HairStep.tsx (real component, imported unchanged)
// Depicts: pay/confirm step body + its own fixed bottom bar -> components-legacy/booking/PayConfirmStep.tsx (real component, imported unchanged)
// Depicts: the horizontal slide-stack swap itself -> NET-NEW: this direction's own motion primitive, ./slideStackMotion.ts, no navigation chrome added beyond what BookingWizard.tsx already renders
//
// Conflicts:
// - [structural, stated plainly] "the bottom summary bar stays put and only its contents
//   cross-fade": each real step component (unchanged, per the brief) nests its own
//   `fixed bottom-0` running-summary/CTA bar INSIDE its own returned JSX tree (e.g.
//   ServicesStaffStep.tsx:571). Per the CSS spec, any non-none `transform` on an ancestor
//   (the `x` this direction animates) becomes the containing block for that fixed
//   descendant for as long as the transform is non-none, so during the ~320ms transition
//   window the footer necessarily moves and can be clipped together with its own step's
//   body. It re-pins to the true viewport position the instant the transform resolves back
//   to none at rest (framer-motion resets `transform` to literal `none` at rest, per this
//   project's own ENTER_RECIPE comment in motion.ts). A footer that is TRULY stationary
//   through the whole transition would require extracting it from the step components,
//   which this brief holds FIXED as unchanged, so the closest available behavior ships:
//   correct at rest before and after every swap, moving only during the animated window
//   itself, same tradeoff the LOCKED useStepSwapMotion already accepts for its own smaller
//   scale(0.99) delta (see that hook's own header comment for the identical reasoning).
// - [no on-screen step chrome] Fresha's own capture shows a breadcrumb-shaped progress row
//   naming all four steps; this surface's FIXED constraints ban any such chrome ("the back
//   arrow is the navigation"), so it is not ported, matching the Fresha spec file's own
//   logged conflict on this exact point.
import { useEffect, useRef } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react'; // mockup-ok: direction-A owned slide-stack motion, extends the owner-approved ENTER RECIPE family (2026-07-09)
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
import { useSlideStackMotion } from './slideStackMotion';

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

interface BookingWizardSlideStackProps {
  services: Service[];
  staffList: StaffMember[];
  salon: Salon;
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

export default function BookingWizardSlideStack({ services, staffList, salon, staffServices, serviceAddons, serviceOptions, isLoggedIn, salonHasRedeemableVoucher }: BookingWizardSlideStackProps) {
  const t = useTranslations('booking') as any;
  const locale = useLocale();
  const router = useRouter();
  const { currentStep, goToStep, formData } = useBooking();
  const { variants: slideVariants, transition: slideTransition } = useSlideStackMotion();

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

  // Direction-A only addition: which way the slide should travel. A ref (not state) holds
  // the PREVIOUS index across renders; comparing it to the current index before the effect
  // below updates it is what makes this data-driven (works whether the step change came from
  // the back arrow or from a step's own internal "Continue"), never caller-aware.
  const prevIndexRef = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= prevIndexRef.current ? 1 : -1;
  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

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
        return <HairStep staff={selectedStaff} showBeard={services.some((s) => cartIds.has(s.id) && s.category === 'barbershop')} />; // drift-ok: byte-identical to components-legacy/booking/BookingWizard.tsx:169, a FIXED real component's own data-derived flag, copied unchanged per this fan-out's brief, not new drift introduced by this direction
      case 'pay-confirm':
        return <PayConfirmStep salon={salon} staff={selectedStaff} isLoggedIn={isLoggedIn} salonHasRedeemableVoucher={salonHasRedeemableVoucher} />;
      default:
        return null;
    }
  };

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
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink"> {/* type-scale-ok: byte-identical to components-legacy/booking/BookingWizard.tsx's own compact-header title (mockup 26, owner-approved 2026-06-12), copied unchanged, not a new value */}
          {t(`stepTitles.${STEP_TITLE_KEYS[normalizedStep]}`)}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* Direction A: slide stack. `overflow-x-hidden` (not on the real wizard, added here)
          keeps the entering panel's off-screen starting position (x: 100%/-100%) from
          producing a horizontal scrollbar during the ~320ms transition; it is the one
          structural container change this direction needs beyond the motion hook swap. */}
      <div className="relative overflow-x-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={normalizedStep}
            custom={direction}
            variants={slideVariants} // mockup-ok: direction-A owned slide-stack motion, see slideStackMotion.ts
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            <SectionErrorBoundary section={`BookingWizardSlideStack:${normalizedStep}`}>
              {renderStep()}
            </SectionErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
