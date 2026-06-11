'use client';

import { useBooking } from '@/lib/booking-context';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Clock, Brush, CreditCard, type LucideIcon } from 'lucide-react';
import { BackButton } from '@/app/[locale]/_components/primitives';
import {
  ServicesStaffStep,
  DateTimeStep,
  PayConfirmStep,
  HairStep,
} from '@/components-legacy/booking';
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
// Owner mockup booking-hair-step (2026-06-10): an optional "Deine Haare" step sits
// between Zeit and Bezahlen WHEN the cart contains hair services. Steps are computed
// per cart, so non-hair bookings (nails/spa) keep the original 3-step flow.
const BASE_STEPS = ['services-staff', 'datetime', 'pay-confirm'] as const;
const HAIR_STEPS = ['services-staff', 'datetime', 'hair', 'pay-confirm'] as const;
type ActiveStep = typeof HAIR_STEPS[number];

const STEP_LABELS: Record<ActiveStep, string> = {
  'services-staff': 'Auswahl',
  'datetime': 'Datum & Zeit',
  'hair': 'Deine Haare',
  'pay-confirm': 'Bestätigen & Zahlen',
};

// Short circle labels for the step indicator (owner mockup: Service · Zeit · Haare · Bezahlen)
const INDICATOR_LABELS: Record<ActiveStep, string> = {
  'services-staff': 'Service',
  'datetime': 'Zeit',
  'hair': 'Haare',
  'pay-confirm': 'Bezahlen',
};

// Owner punch-list 2026-06-11: the stepper uses the walk-in tracker's blue icon
// language (LOCKFILE §12) — icon per node, NOT numbers, NOT green (green = state
// color, blue = progress). Brush for Haare (hand-drawn glyphs + sparkles banned).
const STEP_ICONS: Record<ActiveStep, LucideIcon> = {
  'services-staff': Scissors,
  'datetime': Clock,
  'hair': Brush,
  'pay-confirm': CreditCard,
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
}

// Opacity-only crossfade — deliberately NO x/y transform. A transformed
// ancestor becomes the containing block for `position: fixed`, which traps each
// step's fixed action bar + floating pill inside the wizard (they scroll away at
// the footer instead of staying pinned). Fading keeps the bars viewport-fixed.
// V3-D464 (2026-06-09 motion sweep): step change is a slide+fade ("treat UI like a movie"), not a
// bare opacity fade — a subtle 16px x-shift on the §4 `glide` curve so the booking flow moves like a film.
const slideVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export default function BookingWizard({ services, staffList, salon, staffServices, serviceAddons, serviceOptions, isLoggedIn }: BookingWizardProps) {
  const t = useTranslations('booking') as any;
  const { currentStep, goToStep, formData } = useBooking();

  // Hair step is part of the flow when ANY cart service belongs to a hair category.
  const cartIds = new Set(formData.services.map((s) => s.id));
  const hairRelevant = services.some((s) => cartIds.has(s.id) && HAIR_CATEGORIES.has(s.category));
  const STEPS: readonly ActiveStep[] = hairRelevant ? HAIR_STEPS : BASE_STEPS;

  // Map legacy step keys to the active enum (graceful migration for in-progress sessions)
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
        return <ServicesStaffStep services={services} staffList={staffList} salonId={salon.id} salonSlug={salon.slug} staffServices={staffServices} serviceAddons={serviceAddons} serviceOptions={serviceOptions} totalSteps={STEPS.length} />;
      case 'datetime':
        return <DateTimeStep salonId={salon.id} staffList={staffList} isLoggedIn={isLoggedIn} salonName={salon.name} nextStep={hairRelevant ? 'hair' : 'confirm'} />;
      case 'hair':
        return <HairStep staff={selectedStaff} showBeard={services.some((s) => cartIds.has(s.id) && s.category === 'barbershop')} />;
      case 'pay-confirm':
        return <PayConfirmStep salon={salon} staff={selectedStaff} isLoggedIn={isLoggedIn} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Step indicator — owner-approved mockups booking-pay-step/-hair-step-v2
          (2026-06-11): the walk-in tracker's blue icon language. 42px discs — blue +
          white icon when done, white + blue ring when current, sunken when future;
          2px connectors. Done discs stay tappable for jump-back.
          B1 (owner pick, council round 2026-06-11): HIDDEN on step 1 — discovery
          needs no progress reassurance; the stepper appears from step 2 on, and
          step 1's bottom bar carries "Schritt 1 von N" instead. */}
      {currentIndex > 0 && (
      <div className="px-1 pt-2 pb-4">
        <div className="mb-4 flex items-start" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((step, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = STEP_ICONS[step];
            return (
              <div key={step} className={`flex items-start ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => handleSegmentJump(i)}
                  disabled={!isDone}
                  aria-label={`${isDone ? 'Zurück zu ' : ''}Schritt ${i + 1}: ${STEP_LABELS[step]}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex flex-col items-center gap-[7px] px-1 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span
                    className={[
                      'grid h-[42px] w-[42px] place-items-center rounded-full transition-colors duration-200',
                      isDone
                        ? 'bg-s-accent text-white'
                        : isCurrent
                          ? 'bg-white text-s-accent shadow-[inset_0_0_0_2px_var(--color-s-accent,#276EF1),0_0_0_5px_rgba(39,110,241,0.14)]'
                          : 'bg-s-bg-sunken text-s-ink-3',
                    ].join(' ')}
                  >
                    <Icon size={18} strokeWidth={2} aria-hidden />
                  </span>
                  <span className={`text-[10.5px] font-semibold leading-[1.2] ${isCurrent ? 'text-s-ink' : isDone ? 'text-s-ink' : 'text-s-ink-3'}`}>
                    {INDICATOR_LABELS[step]}
                  </span>
                </button>
                {i < STEPS.length - 1 && <div className={`mx-1 mt-[20px] h-[2px] flex-1 rounded-full ${i < currentIndex ? 'bg-s-accent' : 'bg-s-border'}`} aria-hidden />}
              </div>
            );
          })}
        </div>

        {/* Back row only — the big step title duplicated the stepper's node label
            ("Auswahl" under "Service" etc.) and stacked a third heading layer under
            the page h1 (owner de-clutter 2026-06-11). The stepper carries the step
            name; "Termin bei X" stays the one screen heading. */}
        {canGoBack && (
          <BackButton
            variant="flat"
            onClick={handleBack}
            aria-label={t('back')}
            label={t('back')}
            className="-ml-2"
          />
        )}
      </div>
      )}

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={normalizedStep}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
