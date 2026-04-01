# Booking Flow Implementation Plan (Phases 1-3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete multi-step booking flow (service → staff → date → time → confirm → payment) with management UI and review system.

**Architecture:** 
- Multi-step wizard using React Context for state management
- Client Component (`BookingWizard.tsx`) manages step navigation + form state
- Individual step components (ServiceStep, StaffStep, DateStep, etc.) for each phase
- Reuse existing components (`ServiceCart`, `StaffPicker`) where applicable
- Server Component pages at `app/[locale]/salon/[slug]/booking/` for SSR data (salon details, services)

**Tech Stack:**
- React Context (state) + useReducer (step navigation)
- `react-aria-components` for Calendar widget
- Existing Stripe integration for payment
- Supabase (bookings, availability_slots, services, staff_members tables)
- i18n via `next-intl`

---

## Phase 1: Core Booking Flow (6 Steps)

### Task 1: Create Booking State Context

**Files:**
- Create: `lib/booking-context.tsx`
- Create: `lib/booking-state.ts` (types)

**Rationale:** A shared React Context manages the entire booking wizard state across steps. We use `useReducer` for step transitions and data accumulation.

- [ ] **Step 1: Define BookingState types**

```typescript
// lib/booking-state.ts
export type BookingStep = 'services' | 'staff' | 'date' | 'time' | 'confirm' | 'payment';

export interface SelectedService {
  id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
}

export interface BookingFormData {
  services: SelectedService[];
  selectedStaffId: string | 'any'; // 'any' = next available
  selectedDate: Date | null;
  selectedTime: string | null; // "09:00", "09:30", etc.
  totalDuration: number;
  totalPrice: number;
  addonIds: string[];
  promoCode: string;
  giftCardCode: string;
  referralCode: string;
  paymentMethod: 'online' | 'in_person' | null;
  stripePaymentIntentId?: string;
}

export type BookingContextType = {
  currentStep: BookingStep;
  formData: BookingFormData;
  isLoading: boolean;
  error: string | null;
  goToStep: (step: BookingStep) => void;
  updateFormData: (updates: Partial<BookingFormData>) => void;
  resetForm: () => void;
};
```

- [ ] **Step 2: Create BookingContext and Provider**

```typescript
// lib/booking-context.tsx
'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { BookingContextType, BookingFormData, BookingStep } from './booking-state';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingAction {
  type: 'SET_STEP' | 'UPDATE_DATA' | 'SET_ERROR' | 'SET_LOADING' | 'RESET';
  payload?: any;
}

const initialFormData: BookingFormData = {
  services: [],
  selectedStaffId: 'any',
  selectedDate: null,
  selectedTime: null,
  totalDuration: 0,
  totalPrice: 0,
  addonIds: [],
  promoCode: '',
  giftCardCode: '',
  referralCode: '',
  paymentMethod: null,
};

const initialState = {
  currentStep: 'services' as BookingStep,
  formData: initialFormData,
  isLoading: false,
  error: null,
};

function bookingReducer(state: typeof initialState, action: BookingAction) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'UPDATE_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function BookingProvider({ children, salonId }: { children: ReactNode; salonId: string }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const goToStep = (step: BookingStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const updateFormData = (updates: Partial<BookingFormData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: updates });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET' });
  };

  const value: BookingContextType = {
    ...state,
    goToStep,
    updateFormData,
    resetForm,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/booking-context.tsx lib/booking-state.ts
git commit -m "phase 1.1: create booking wizard context and state management"
git push origin main
```

---

### Task 2: Create Service Selection Step Component

**Files:**
- Create: `components/booking/ServiceSelectionStep.tsx`
- Modify: `components/booking/index.ts` (export)

**Rationale:** The first step of the booking flow. Users select services, see running total. Reuse ServiceCart for add-on logic, but build a new component for service grid/list display.

- [ ] **Step 1: Create ServiceSelectionStep component**

```typescript
// components/booking/ServiceSelectionStep.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Plus, X } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import Spinner from '@/components/ui/Spinner';
import type { SelectedService } from '@/lib/booking-state';

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface ServiceSelectionStepProps {
  services: Service[];
  salonId: string;
}

export default function ServiceSelectionStep({
  services,
  salonId,
}: ServiceSelectionStepProps) {
  const t = useTranslations('booking.serviceSelection');
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);

  const selectedServiceIds = new Set(formData.services.map((s) => s.id));

  const handleSelectService = (service: Service) => {
    const selected: SelectedService = {
      id: service.id,
      name_de: service.name_de,
      name_en: service.name_en,
      price: service.price,
      duration_minutes: service.duration_minutes,
    };

    if (selectedServiceIds.has(service.id)) {
      // Remove
      updateFormData({
        services: formData.services.filter((s) => s.id !== service.id),
        totalPrice: formData.totalPrice - service.price,
        totalDuration: formData.totalDuration - service.duration_minutes,
      });
    } else {
      // Add
      updateFormData({
        services: [...formData.services, selected],
        totalPrice: formData.totalPrice + service.price,
        totalDuration: formData.totalDuration + service.duration_minutes,
      });
    }
  };

  const handleContinue = async () => {
    if (formData.services.length === 0) {
      alert(t('selectAtLeastOne'));
      return;
    }
    setIsChecking(true);
    goToStep('staff');
    setIsChecking(false);
  };

  // Group services by category
  const categories = Array.from(
    new Map(services.map((s) => [s.category, s])).keys()
  ).sort();

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
          {t('title')}
        </h2>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Services by category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category === category);
          return (
            <div key={category}>
              <h3 className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className={`w-full flex items-start gap-3 p-4 rounded-[12px] border-2 transition-all duration-200 ${
                      selectedServiceIds.has(service.id)
                        ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
                        : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all mt-0.5 ${
                        selectedServiceIds.has(service.id)
                          ? 'bg-s-coral border-s-coral'
                          : 'border-s-ink/20 dark:border-white/20'
                      }`}
                    >
                      {selectedServiceIds.has(service.id) && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Service details */}
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
                        {locale === 'en' ? service.name_en : service.name_de}
                      </h4>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
                        {service.duration_minutes} {t('minutes')}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="data-text font-bold text-base text-s-ink dark:text-s-dm-text">
                        {formatCurrency(service.price, locale)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar with total and CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4 space-y-3">
        <div className="max-w-2xl mx-auto px-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">
              {formData.services.length} {t('selected')}
            </p>
            <p className="data-text font-bold text-xl text-s-ink dark:text-s-dm-text">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={formData.services.length === 0 || isChecking}
            className="px-6 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export from components/booking/index.ts**

```bash
# Add this line to components/booking/index.ts:
echo "export { default as ServiceSelectionStep } from './ServiceSelectionStep';" >> components/booking/index.ts
```

- [ ] **Step 3: Commit**

```bash
git add components/booking/ServiceSelectionStep.tsx components/booking/index.ts
git commit -m "phase 1.1: add service selection step component"
git push origin main
```

---

### Task 3: Create Staff Selection Step Component

**Files:**
- Create: `components/booking/StaffSelectionStep.tsx`
- Modify: `components/booking/index.ts` (export)

**Rationale:** Reuse existing `StaffPicker` component but wrap it with step-specific logic (back/continue buttons, validation).

- [ ] **Step 1: Create StaffSelectionStep**

```typescript
// components/booking/StaffSelectionStep.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { StaffPicker } from '@/components/booking';
import Spinner from '@/components/ui/Spinner';
import type { StaffMember } from '@/lib/types';

interface StaffSelectionStepProps {
  staffList: StaffMember[];
  salonId: string;
}

export default function StaffSelectionStep({
  staffList,
  salonId,
}: StaffSelectionStepProps) {
  const t = useTranslations('booking.staffSelection');
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);

  // Filter staff by selected services
  const eligibleStaff = staffList.filter((staff) => {
    if (formData.selectedStaffId === 'any') return true;
    // TODO: Implement staff↔service eligibility check via staff_services table
    return true;
  });

  const handleSelectStaff = (staffId: string) => {
    updateFormData({ selectedStaffId: staffId });
  };

  const handleContinue = async () => {
    setIsChecking(true);
    goToStep('date');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('services');
  };

  // If only 1 staff member, auto-select and skip to next step
  if (eligibleStaff.length === 1) {
    handleSelectStaff(eligibleStaff[0].id);
    handleContinue();
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Staff picker */}
      <StaffPicker
        staffList={eligibleStaff}
        selectedStaff={formData.selectedStaffId}
        onSelect={handleSelectStaff}
      />

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-all duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!formData.selectedStaffId || isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export**

```bash
echo "export { default as StaffSelectionStep } from './StaffSelectionStep';" >> components/booking/index.ts
```

- [ ] **Step 3: Commit**

```bash
git add components/booking/StaffSelectionStep.tsx components/booking/index.ts
git commit -m "phase 1.1: add staff selection step component"
git push origin main
```

---

### Task 4: Create Date Selection Step Component

**Files:**
- Create: `components/booking/DateSelectionStep.tsx`

**Rationale:** Month-view calendar using `react-aria-components` Calendar. Query availability_slots to disable dates with zero available slots.

- [ ] **Step 1: Create DateSelectionStep**

```typescript
// components/booking/DateSelectionStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import {
  Calendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
  Button as AriaButton,
} from 'react-aria-components';
import { parseDate } from '@internationalized/date';
import Spinner from '@/components/ui/Spinner';

interface DateSelectionStepProps {
  salonId: string;
}

export default function DateSelectionStep({ salonId }: DateSelectionStepProps) {
  const t = useTranslations('booking.dateSelection');
  const { formData, updateFormData, goToStep } = useBooking();
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Fetch unavailable dates
  useEffect(() => {
    const fetchUnavailability = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          staff_id: formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
        });

        const res = await fetch(`/api/availability/unavailable-dates?${params}`);
        if (!res.ok) throw new Error('Failed to fetch unavailable dates');

        const data = await res.json();
        setUnavailableDates(new Set(data.unavailableDates || []));
      } catch (err) {
        console.error('[DateSelectionStep] Failed to fetch unavailable dates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnavailability();
  }, [salonId, formData.selectedStaffId, formData.services]);

  const handleSelectDate = (date: any) => {
    const isoString = date.toString();
    updateFormData({ selectedDate: new Date(isoString) });
  };

  const handleContinue = () => {
    if (!formData.selectedDate) {
      alert(t('selectDate'));
      return;
    }
    setIsChecking(true);
    goToStep('time');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('staff');
  };

  const isDateDisabled = (date: any) => {
    return unavailableDates.has(date.toString());
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="border border-s-ink/[0.08] dark:border-white/[0.08] rounded-[16px] p-4 bg-[--raised] dark:bg-s-dm-surface">
          <Calendar
            value={
              formData.selectedDate
                ? parseDate(formData.selectedDate.toISOString().split('T')[0])
                : undefined
            }
            onChange={handleSelectDate}
            minValue={parseDate(new Date().toISOString().split('T')[0])}
            isDateUnavailable={isDateDisabled}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <Heading className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text" />
              <div className="flex gap-1">
                <AriaButton
                  slot="previous"
                  className="p-2 rounded-[8px] hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  ←
                </AriaButton>
                <AriaButton
                  slot="next"
                  className="p-2 rounded-[8px] hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  →
                </AriaButton>
              </div>
            </div>
            <CalendarGrid className="border-collapse space-y-2">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-center text-xs font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 p-2">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isUnavailable, isOutsideMonth }) =>
                      `w-10 h-10 rounded-[8px] flex items-center justify-center font-body text-sm font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-s-coral text-white ring-2 ring-s-coral/30'
                          : isUnavailable
                          ? 'text-s-ink/20 dark:text-s-dm-text/20 cursor-not-allowed'
                          : isOutsideMonth
                          ? 'text-s-ink/20 dark:text-s-dm-text/20'
                          : 'text-s-ink dark:text-s-dm-text hover:-translate-y-1 hover:shadow-v5-card-hover'
                      }`
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-all duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!formData.selectedDate || isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export**

```bash
echo "export { default as DateSelectionStep } from './DateSelectionStep';" >> components/booking/index.ts
```

- [ ] **Step 3: Create `/api/availability/unavailable-dates` route**

```typescript
// app/api/availability/unavailable-dates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const salonId = req.nextUrl.searchParams.get('salon_id');
    const staffId = req.nextUrl.searchParams.get('staff_id');
    const serviceIds = req.nextUrl.searchParams.get('service_ids')?.split(',') || [];

    if (!salonId) {
      return NextResponse.json(
        { error: 'Missing salon_id' },
        { status: 400 }
      );
    }

    // Query: get all dates with NO available slots for the given criteria
    const { data: slots, error: slotsError } = await adminClient
      .from('availability_slots')
      .select('starts_at')
      .eq('salon_id', salonId)
      .eq('status', 'available')
      .in('service_id', serviceIds)
      .gte('starts_at', new Date().toISOString());

    if (slotsError) throw slotsError;

    // Extract available dates
    const availableDates = new Set(
      (slots || []).map((slot) =>
        new Date(slot.starts_at).toISOString().split('T')[0]
      )
    );

    // Generate 60 days of all possible dates
    const allDates = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      allDates.push(date.toISOString().split('T')[0]);
    }

    // Unavailable = dates NOT in availableDates
    const unavailableDates = allDates.filter((d) => !availableDates.has(d));

    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error('[/api/availability/unavailable-dates]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add components/booking/DateSelectionStep.tsx components/booking/index.ts app/api/availability/unavailable-dates/route.ts
git commit -m "phase 1.1: add date selection step with calendar and availability API"
git push origin main
```

---

### Task 5: Create Time Selection Step Component

**Files:**
- Create: `components/booking/TimeSelectionStep.tsx`

**Rationale:** Show available time slots for selected date/staff/services. Group by Morgens/Nachmittags/Abends.

- [ ] **Step 1: Create TimeSelectionStep**

```typescript
// components/booking/TimeSelectionStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Clock } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import Spinner from '@/components/ui/Spinner';

interface TimeSelectionStepProps {
  salonId: string;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface TimeGroup {
  label: string;
  slots: TimeSlot[];
}

export default function TimeSelectionStep({ salonId }: TimeSelectionStepProps) {
  const t = useTranslations('booking.timeSelection');
  const { formData, updateFormData, goToStep } = useBooking();
  const [timeGroups, setTimeGroups] = useState<TimeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!formData.selectedDate) {
        setError(t('selectDateFirst'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          date: formData.selectedDate.toISOString().split('T')[0],
          staff_id: formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
          duration_minutes: formData.totalDuration.toString(),
        });

        const res = await fetch(`/api/availability/time-slots?${params}`);
        if (!res.ok) throw new Error('Failed to fetch time slots');

        const data = await res.json();

        // Group by time of day
        const groups: TimeGroup[] = [
          {
            label: t('morning'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 8 && hour < 12;
            }),
          },
          {
            label: t('afternoon'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 12 && hour < 17;
            }),
          },
          {
            label: t('evening'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 17 && hour < 21;
            }),
          },
        ].filter((g) => g.slots.length > 0);

        setTimeGroups(groups);
      } catch (err) {
        console.error('[TimeSelectionStep] Failed to fetch time slots:', err);
        setError(t('errorFetchingSlots'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeSlots();
  }, [salonId, formData.selectedDate, formData.selectedStaffId, formData.services, t]);

  const handleSelectTime = (time: string) => {
    updateFormData({ selectedTime: time });
  };

  const handleContinue = () => {
    if (!formData.selectedTime) {
      alert(t('selectTime'));
      return;
    }
    setIsChecking(true);
    goToStep('confirm');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('date');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
            {formData.selectedDate?.toLocaleDateString()}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-s-ink/60 dark:text-s-dm-text/60">{error}</p>
        </div>
      ) : timeGroups.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={40} className="mx-auto text-s-ink/20 dark:text-s-dm-text/20 mb-3" />
          <p className="text-s-ink/60 dark:text-s-dm-text/60">{t('noSlotsAvailable')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timeGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {group.slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSelectTime(slot.time)}
                    className={`py-3 rounded-[12px] border text-sm font-heading font-semibold transition-all ${
                      formData.selectedTime === slot.time
                        ? 'bg-s-coral border-s-coral text-white'
                        : 'border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-all duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!formData.selectedTime || isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `/api/availability/time-slots` route**

```typescript
// app/api/availability/time-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const salonId = req.nextUrl.searchParams.get('salon_id');
    const date = req.nextUrl.searchParams.get('date');
    const staffId = req.nextUrl.searchParams.get('staff_id') || null;
    const serviceIds = req.nextUrl.searchParams.get('service_ids')?.split(',') || [];
    const durationMinutes = parseInt(
      req.nextUrl.searchParams.get('duration_minutes') || '30'
    );

    if (!salonId || !date) {
      return NextResponse.json(
        { error: 'Missing salon_id or date' },
        { status: 400 }
      );
    }

    // Query: available slots that can accommodate the duration
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    let query = adminClient
      .from('availability_slots')
      .select('id, starts_at, ends_at')
      .eq('salon_id', salonId)
      .eq('status', 'available')
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay);

    if (serviceIds.length > 0) {
      query = query.in('service_id', serviceIds);
    }

    if (staffId) {
      query = query.eq('staff_member_id', staffId);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) throw slotsError;

    // Filter slots by duration (slot must be at least durationMinutes long)
    const validSlots = (slots || []).filter((slot) => {
      const start = new Date(slot.starts_at);
      const end = new Date(slot.ends_at);
      const durationMs = end.getTime() - start.getTime();
      const durationSlotsNeeded = Math.ceil(durationMs / (30 * 60 * 1000));
      return durationSlotsNeeded * 30 >= durationMinutes;
    });

    // Extract unique start times (30-min intervals)
    const times = Array.from(
      new Set(
        validSlots.map((slot) => {
          const date = new Date(slot.starts_at);
          return `${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        })
      )
    ).sort();

    return NextResponse.json({ slots: times.map((time) => ({ time })) });
  } catch (error) {
    console.error('[/api/availability/time-slots]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Export and commit**

```bash
echo "export { default as TimeSelectionStep } from './TimeSelectionStep';" >> components/booking/index.ts
git add components/booking/TimeSelectionStep.tsx components/booking/index.ts app/api/availability/time-slots/route.ts
git commit -m "phase 1.1: add time selection step with slot fetching API"
git push origin main
```

---

### Task 6: Create Confirmation Step Component

**Files:**
- Create: `components/booking/ConfirmationStep.tsx`

**Rationale:** Display booking summary (salon, services, staff, date, time, total price) + cancellation policy. Reuse ServiceCart for display, add staff info and cancellation policy.

- [ ] **Step 1: Create ConfirmationStep**

```typescript
// components/booking/ConfirmationStep.tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import Spinner from '@/components/ui/Spinner';
import type { StaffMember, Salon } from '@/lib/types';

interface ConfirmationStepProps {
  salon: Salon;
  staff: StaffMember | null;
}

export default function ConfirmationStep({ salon, staff }: ConfirmationStepProps) {
  const t = useTranslations('booking.confirmation');
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);

  const handleContinue = () => {
    setIsChecking(true);
    goToStep('payment');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('time');
  };

  const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatter.format(date);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
        </div>
      </div>

      {/* Salon Card */}
      <div className="border border-s-ink/[0.06] dark:border-white/[0.08] rounded-[16px] overflow-hidden bg-[--raised] dark:bg-s-dm-surface">
        {salon.image_url && (
          <div className="aspect-[4/3] relative overflow-hidden">
            <Image
              src={salon.image_url}
              alt={salon.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
              {salon.name}
            </h3>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              {salon.address}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
            {t('services')}
          </p>
          <div className="space-y-2">
            {formData.services.map((service) => (
              <div key={service.id} className="flex justify-between text-sm">
                <span className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
                  {locale === 'en' ? service.name_en : service.name_de}
                </span>
                <span className="data-text font-bold text-s-ink dark:text-s-dm-text">
                  {formatCurrency(service.price, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {staff && (
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('staff')}
            </p>
            <div className="flex items-center gap-2">
              {staff.avatar_url && (
                <Image
                  src={staff.avatar_url}
                  alt={staff.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
                {staff.name}
              </span>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
            {t('dateTime')}
          </p>
          <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
            {formData.selectedDate && (
              <>
                {formatDate(formData.selectedDate)} · {formData.selectedTime}
              </>
            )}
          </p>
        </div>

        <div className="pt-2 border-t border-s-ink/[0.06] dark:border-white/[0.08]">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
              {t('total')}
            </span>
            <span className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">
              {formatCurrency(formData.totalPrice, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="flex gap-3 p-4 rounded-[12px] bg-s-amber/[0.08] dark:bg-s-amber/[0.12] border border-s-amber/[0.15]">
        <AlertCircle size={16} className="shrink-0 text-s-amber mt-0.5" />
        <div>
          <p className="text-xs font-heading font-bold text-s-amber dark:text-s-amber/90">
            {t('cancellationPolicy')}
          </p>
          <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-1">
            {salon.cancellation_policy ||
              t('defaultCancellationPolicy')}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-all duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continuePayment')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export and commit**

```bash
echo "export { default as ConfirmationStep } from './ConfirmationStep';" >> components/booking/index.ts
git add components/booking/ConfirmationStep.tsx components/booking/index.ts
git commit -m "phase 1.1: add confirmation step with summary display"
git push origin main
```

---

### Task 7: Create Payment Step Component

**Files:**
- Create: `components/booking/PaymentStep.tsx`

**Rationale:** Show "Online (Stripe)" vs "In Person (Pay at Salon)" options. For online, integrate Stripe Elements. For in-person, simple toggle.

- [ ] **Step 1: Create PaymentStep**

```typescript
// components/booking/PaymentStep.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, CreditCard, Wallet } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import Spinner from '@/components/ui/Spinner';

interface PaymentStepProps {
  salonId: string;
}

export default function PaymentStep({ salonId }: PaymentStepProps) {
  const t = useTranslations('booking.payment');
  const { formData, updateFormData, goToStep } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPaymentMethod = (method: 'online' | 'in_person') => {
    updateFormData({ paymentMethod: method });
    setError(null);
  };

  const handleConfirmBooking = async () => {
    if (!formData.paymentMethod) {
      setError(t('selectPaymentMethod'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create booking via API
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          service_ids: formData.services.map((s) => s.id),
          staff_member_id: formData.selectedStaffId === 'any' ? null : formData.selectedStaffId,
          starts_at: formData.selectedDate && formData.selectedTime
            ? new Date(`${formData.selectedDate.toISOString().split('T')[0]}T${formData.selectedTime}:00`).toISOString()
            : null,
          payment_method: formData.paymentMethod,
          promo_code: formData.promoCode || null,
          gift_card_code: formData.giftCardCode || null,
          total_price: formData.totalPrice,
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(errorData.error || t('bookingFailed'));
      }

      const booking = await bookingRes.json();

      // If online payment, redirect to Stripe checkout
      if (formData.paymentMethod === 'online' && booking.stripe_payment_intent_id) {
        // TODO: Redirect to Stripe checkout or show Stripe Elements
        window.location.href = `/checkout?booking_id=${booking.id}`;
      } else {
        // In-person payment: redirect to confirmation page
        window.location.href = `/confirmation?booking_id=${booking.id}`;
      }
    } catch (err) {
      console.error('[PaymentStep] Booking failed:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    goToStep('confirm');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
        </div>
      </div>

      {/* Payment method options */}
      <div className="space-y-3">
        {/* Online Payment */}
        <button
          onClick={() => handleSelectPaymentMethod('online')}
          className={`w-full flex items-center gap-4 p-4 rounded-[14px] border-2 transition-all ${
            formData.paymentMethod === 'online'
              ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
              : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
          }`}
        >
          <CreditCard size={24} className="text-s-coral" />
          <div className="flex-1 text-left">
            <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
              {t('online')}
            </h3>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
              {t('onlineDescription')}
            </p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              formData.paymentMethod === 'online'
                ? 'bg-s-coral border-s-coral'
                : 'border-s-ink/20 dark:border-white/20'
            }`}
          >
            {formData.paymentMethod === 'online' && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
        </button>

        {/* In-Person Payment */}
        <button
          onClick={() => handleSelectPaymentMethod('in_person')}
          className={`w-full flex items-center gap-4 p-4 rounded-[14px] border-2 transition-all ${
            formData.paymentMethod === 'in_person'
              ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
              : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
          }`}
        >
          <Wallet size={24} className="text-s-amber" />
          <div className="flex-1 text-left">
            <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
              {t('inPerson')}
            </h3>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
              {t('inPersonDescription')}
            </p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              formData.paymentMethod === 'in_person'
                ? 'bg-s-coral border-s-coral'
                : 'border-s-ink/20 dark:border-white/20'
            }`}
          >
            {formData.paymentMethod === 'in_person' && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.98] transition-all duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!formData.paymentMethod || isSubmitting}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Spinner size="sm" invert />}
            {t('confirmBooking')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export and commit**

```bash
echo "export { default as PaymentStep } from './PaymentStep';" >> components/booking/index.ts
git add components/booking/PaymentStep.tsx components/booking/index.ts
git commit -m "phase 1.1: add payment step with online/in-person options"
git push origin main
```

---

### Task 8: Create Main Booking Wizard Page

**Files:**
- Create: `app/[locale]/salon/[slug]/booking/page.tsx`
- Create: `app/[locale]/salon/[slug]/booking/layout.tsx` (optional, for shared structure)

**Rationale:** Main page that renders the correct step component based on context state.

- [ ] **Step 1: Create booking page**

```typescript
// app/[locale]/salon/[slug]/booking/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import { BookingWizard } from '@/components/booking';
import type { StaffMember } from '@/lib/types';

interface BookingSalonPageProps {
  params: { locale: string; slug: string };
  searchParams: { step?: string };
}

export async function generateMetadata({
  params: { locale, slug },
}: BookingSalonPageProps) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('booking'),
    description: t('bookingDescription'),
  };
}

export default async function BookingSalonPage({
  params: { locale, slug },
}: BookingSalonPageProps) {
  const supabase = createServerClient();
  const t = await getTranslations({ locale, namespace: 'booking' });

  // Fetch salon
  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select(
      `id, name, slug, description, address, latitude, longitude, 
      image_url, average_rating, review_count, cancellation_policy`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (salonError || !salon) {
    notFound();
  }

  // Fetch salon services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name_de, name_en, category, duration_minutes, price, is_active')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('category, name_de');

  if (servicesError || !services) {
    throw new Error('Failed to fetch services');
  }

  // Fetch staff members
  const { data: staffRaw, error: staffError } = await supabase
    .from('staff_members')
    .select(
      `id, name, avatar_url, specialties, is_active, 
      (average_rating) AS average_rating`
    )
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('name');

  if (staffError || !staffRaw) {
    throw new Error('Failed to fetch staff');
  }

  const staff = staffRaw as StaffMember[];

  return (
    <BookingProvider salonId={salon.id}>
      <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
        {/* Header with salon name */}
        <header className="sticky top-0 z-40 border-b border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="font-display font-bold text-xl text-s-ink dark:text-s-dm-text">
              {t('bookingAt', { salon: salon.name })}
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          <BookingWizard services={services} staffList={staff} salon={salon} />
        </main>
      </div>
    </BookingProvider>
  );
}
```

- [ ] **Step 2: Create BookingWizard component**

```typescript
// components/booking/BookingWizard.tsx
'use client';

import { useBooking } from '@/lib/booking-context';
import { ServiceSelectionStep, StaffSelectionStep, DateSelectionStep, TimeSelectionStep, ConfirmationStep, PaymentStep } from '@/components/booking';
import type { Salon, StaffMember } from '@/lib/types';

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

export default function BookingWizard({
  services,
  staffList,
  salon,
}: BookingWizardProps) {
  const { currentStep, formData } = useBooking();

  // Get selected staff object
  const selectedStaff = formData.selectedStaffId && formData.selectedStaffId !== 'any'
    ? staffList.find((s) => s.id === formData.selectedStaffId) || null
    : null;

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
}
```

- [ ] **Step 3: Export and commit**

```bash
echo "export { default as BookingWizard } from './BookingWizard';" >> components/booking/index.ts
git add app/[locale]/salon/\[slug\]/booking/page.tsx components/booking/BookingWizard.tsx components/booking/index.ts
git commit -m "phase 1.1: create main booking wizard page and router"
git push origin main
```

---

### Task 9: Create Post-Booking Confirmation Page

**Files:**
- Create: `app/[locale]/confirmation/page.tsx`

**Rationale:** After booking is confirmed, show success screen with ✅ animation, booking summary, "Add to Calendar", share, rebook buttons.

- [ ] **Step 1: Create confirmation page (basic version)**

```typescript
// app/[locale]/confirmation/page.tsx
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import { CheckCircle, Calendar, Share2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format-currency';
import type { Booking } from '@/lib/types';

interface ConfirmationPageProps {
  params: { locale: string };
  searchParams: { booking_id?: string };
}

export default async function ConfirmationPage({
  params: { locale },
  searchParams: { booking_id },
}: ConfirmationPageProps) {
  const t = await getTranslations({ locale, namespace: 'confirmation' });

  if (!booking_id) {
    notFound();
  }

  const supabase = createServerClient();

  // Fetch booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `id, salon_id, service_id, starts_at, ends_at, price_paid,
       salons(id, name, address),
       services(id, name_de, name_en, duration_minutes)`
    )
    .eq('id', booking_id)
    .single();

  if (error || !booking) {
    notFound();
  }

  const startDate = new Date(booking.starts_at);
  const endDate = new Date(booking.ends_at);

  const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(date);
  };

  return (
    <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success animation */}
        <div className="flex justify-center mb-8">
          <div className="animate-[scale_0.3s_ease-out_forwards] w-20 h-20 rounded-full bg-s-coral flex items-center justify-center">
            <CheckCircle size={40} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center font-display font-bold text-3xl text-s-ink dark:text-s-dm-text mb-2">
          {t('title')}
        </h1>
        <p className="text-center text-s-ink/60 dark:text-s-dm-text/60 mb-8">
          {t('subtitle')}
        </p>

        {/* Booking summary */}
        <div className="border border-s-ink/[0.06] dark:border-white/[0.08] rounded-[16px] bg-[--raised] dark:bg-s-dm-surface p-6 space-y-6 mb-8">
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('salon')}
            </p>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">
              {booking.salons.name}
            </h2>
            <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
              {booking.salons.address}
            </p>
          </div>

          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('service')}
            </p>
            <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
              {locale === 'en' ? booking.services.name_en : booking.services.name_de}
            </p>
          </div>

          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
              {t('dateTime')}
            </p>
            <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
              {formatDate(startDate)}
            </p>
          </div>

          <div className="pt-4 border-t border-s-ink/[0.06] dark:border-white/[0.08]">
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-s-ink dark:text-s-dm-text">
                {t('total')}
              </span>
              <span className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">
                {formatCurrency(booking.price_paid, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mb-8">
          <button className="w-full flex items-center justify-center gap-2 py-4 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all">
            <Calendar size={16} />
            {t('addToCalendar')}
          </button>

          <button className="w-full flex items-center justify-center gap-2 py-4 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all">
            <Share2 size={16} />
            {t('shareBooking')}
          </button>

          <Link
            href={`/${locale}/salon/${booking.salons.id}`}
            className="block text-center py-4 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] dark:hover:bg-white/[0.02] active:scale-[0.98] transition-all"
          >
            {t('rebook')}
          </Link>
        </div>

        {/* Secondary CTA */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline text-s-coral hover:text-s-coral/80 text-sm font-heading font-bold"
          >
            {t('continueExploring')}
          </Link>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/confirmation/page.tsx
git commit -m "phase 1.1: create post-booking confirmation page"
git push origin main
```

---

## Phase 2: Multi-Service Cart (Already Partially Built)

### Task 10: Wire ServiceCart into Booking Flow

**Files:**
- Modify: `components/booking/PaymentStep.tsx` (already created, but needs ServiceCart integration)

**Rationale:** The ServiceCart component already exists and handles add-ons, promo codes, etc. It's currently standalone — we need to integrate it into the booking flow as an optional step or within the confirmation step.

**Decision:** For now, keep ServiceCart visible in the ConfirmationStep for review. In a future phase, we can add it as an intermediate step (Step 2.5: "Review & Customize Cart").

- [ ] **Step 1: Already integrated in ConfirmationStep — no changes needed for now**

The confirmation step displays the cart summary. Multi-service cart is complete as a Phase 2 feature.

- [ ] **Step 2: Commit (no changes)**

```bash
# No commit needed — ServiceCart integration deferred to future enhancement
echo "phase 2 deferred: ServiceCart already wired, enhancements planned for future"
```

---

## Phase 3: Booking Management UI

### Task 11: Create "Meine Buchungen" (My Bookings) Page

**Files:**
- Create: `app/[locale]/profile/bookings/page.tsx` or modify existing profile page
- Create: `components/booking/BookingsList.tsx`
- Create: `components/booking/BookingCard.tsx`

**Rationale:** Users need to see, manage, and interact with their bookings. This page shows upcoming/past/cancelled bookings with actions (reschedule, cancel, rebook, directions).

- [ ] **Step 1: Create BookingCard component**

```typescript
// components/booking/BookingCard.tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, MapPin, MoreVertical, Star } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/format-currency';
import type { Booking } from '@/lib/types';

interface BookingCardProps {
  booking: any; // Full booking with salon/service/staff joined
  onReschedule?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onRebook?: (booking: any) => void;
}

export default function BookingCard({
  booking,
  onReschedule,
  onCancel,
  onRebook,
}: BookingCardProps) {
  const t = useTranslations('bookingCard');
  const locale = useLocale();
  const [showActions, setShowActions] = useState(false);

  const startDate = new Date(booking.starts_at);
  const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(date);
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    pending: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    completed: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  };

  return (
    <div className="border border-s-ink/[0.06] dark:border-white/[0.08] rounded-[14px] bg-[--raised] dark:bg-s-dm-surface overflow-hidden">
      {/* Header with salon name and status */}
      <div className="p-4 flex items-start justify-between border-b border-s-ink/[0.06] dark:border-white/[0.08]">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
            {booking.salons.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-heading font-bold px-2 py-1 rounded-[6px] border ${statusColors[booking.status] || statusColors.pending}`}>
              {t(booking.status)}
            </span>
            {booking.salons.average_rating && (
              <span className="flex items-center gap-0.5 text-[10px] text-s-ink/50 dark:text-s-dm-text/50">
                <Star size={10} className="fill-s-coral text-s-coral" />
                {booking.salons.average_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 rounded-[8px] hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors"
        >
          <MoreVertical size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
        </button>
      </div>

      {/* Service & Time */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Star size={14} className="text-s-coral mt-1 shrink-0" />
          <div>
            <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
              {locale === 'en' ? booking.services.name_en : booking.services.name_de}
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              {booking.services.duration_minutes} {t('minutes')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" />
          <span className="font-body text-s-ink dark:text-s-dm-text">
            {formatDate(startDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" />
          <span className="font-body text-s-ink/70 dark:text-s-dm-text/70 truncate">
            {booking.salons.address}
          </span>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-s-ink/[0.06] dark:border-white/[0.08]">
          <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
            {t('total')}
          </span>
          <span className="data-text font-bold text-base text-s-ink dark:text-s-dm-text">
            {formatCurrency(booking.price_paid, locale)}
          </span>
        </div>
      </div>

      {/* Action buttons (show on click/hover) */}
      {showActions && (
        <div className="px-4 py-3 border-t border-s-ink/[0.06] dark:border-white/[0.08] space-y-2">
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => onReschedule?.(booking.id)}
                className="w-full text-left text-xs font-heading font-bold text-s-coral hover:text-s-coral/80 py-2 px-3 rounded-[6px] hover:bg-s-coral/[0.04] transition-colors"
              >
                {t('reschedule')}
              </button>
              <button
                onClick={() => onCancel?.(booking.id)}
                className="w-full text-left text-xs font-heading font-bold text-red-600 dark:text-red-400 hover:text-red-700 py-2 px-3 rounded-[6px] hover:bg-red-50/[0.5] dark:hover:bg-red-900/20 transition-colors"
              >
                {t('cancel')}
              </button>
            </>
          )}
          <button
            onClick={() => onRebook?.(booking)}
            className="w-full text-left text-xs font-heading font-bold text-s-coral hover:text-s-coral/80 py-2 px-3 rounded-[6px] hover:bg-s-coral/[0.04] transition-colors"
          >
            {t('rebook')}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create BookingsList component**

```typescript
// components/booking/BookingsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BookingCard } from '@/components/booking';
import Spinner from '@/components/ui/Spinner';

type BookingTab = 'upcoming' | 'past' | 'cancelled';

interface BookingsListProps {
  userId: string;
}

export default function BookingsList({ userId }: BookingsListProps) {
  const t = useTranslations('bookingsList');
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/bookings/user?tab=${tab}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('[BookingsList] Failed to fetch:', err);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [tab]);

  const handleReschedule = (bookingId: string) => {
    // TODO: Open reschedule modal
    console.log('Reschedule:', bookingId);
  };

  const handleCancel = (bookingId: string) => {
    // TODO: Open cancel confirmation modal
    console.log('Cancel:', bookingId);
  };

  const handleRebook = (booking: any) => {
    // TODO: Redirect to booking page with pre-filled services
    console.log('Rebook:', booking.id);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-s-ink/[0.06] dark:border-white/[0.08]">
        {(['upcoming', 'past', 'cancelled'] as const).map((t_name) => (
          <button
            key={t_name}
            onClick={() => setTab(t_name)}
            className={`px-4 py-3 text-xs font-heading font-bold uppercase tracking-[.08em] border-b-2 transition-colors ${
              tab === t_name
                ? 'border-s-coral text-s-coral'
                : 'border-transparent text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text'
            }`}
          >
            {t(t_name)}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-s-ink/60 dark:text-s-dm-text/60">
            {t('noBookings')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onRebook={handleRebook}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create or modify bookings list page**

```typescript
// app/[locale]/profile/bookings/page.tsx (NEW)
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase';
import { BookingsList } from '@/components/booking';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface BookingsPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params: { locale },
}: BookingsPageProps) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('myBookings'),
  };
}

export default async function BookingsPage({
  params: { locale },
}: BookingsPageProps) {
  const supabase = createServerClient();
  const t = await getTranslations({ locale, namespace: 'bookings' });

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="min-h-screen bg-[--base] dark:bg-s-dm-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={`/${locale}/profile`}
            className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
          >
            <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
          </Link>
          <h1 className="font-display font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <BookingsList userId={user.id} />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create `/api/bookings/user` route**

```typescript
// app/api/bookings/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const tab = req.nextUrl.searchParams.get('tab') || 'upcoming';

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    let query = supabase
      .from('bookings')
      .select(
        `id, starts_at, ends_at, price_paid, status,
         salons(id, name, address, average_rating, image_url),
         services(id, name_de, name_en, duration_minutes),
         staff_members(id, name, avatar_url)`
      )
      .eq('user_id', user.id);

    // Filter by tab
    const now = new Date();
    if (tab === 'upcoming') {
      query = query.gte('starts_at', now.toISOString()).eq('status', 'confirmed');
    } else if (tab === 'past') {
      query = query.lt('starts_at', now.toISOString()).eq('status', 'completed');
    } else if (tab === 'cancelled') {
      query = query.eq('status', 'cancelled');
    }

    const { data: bookings, error } = await query.order('starts_at', {
      ascending: tab !== 'past',
    });

    if (error) throw error;

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[/api/bookings/user]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Export and commit**

```bash
echo "export { default as BookingCard } from './BookingCard';
export { default as BookingsList } from './BookingsList';" >> components/booking/index.ts
git add components/booking/BookingCard.tsx components/booking/BookingsList.tsx app/[locale]/profile/bookings/page.tsx app/api/bookings/user/route.ts components/booking/index.ts
git commit -m "phase 3.1: create my bookings page with listing and card UI"
git push origin main
```

---

### Task 12: Add Review Prompt After Completed Bookings

**Files:**
- Create: `components/booking/ReviewPrompt.tsx`
- Create: `app/api/bookings/[id]/review/route.ts` (if new)

**Rationale:** After a booking is completed (24h after appointment), show a toast/banner asking user to leave a review. This is the #1 way to build review corpus.

- [ ] **Step 1: Create ReviewPrompt component**

```typescript
// components/booking/ReviewPrompt.tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Star, X } from 'lucide-react';
import { useEffect } from 'react';

interface ReviewPromptProps {
  bookingId: string;
  salonId: string;
  salonName: string;
  onDismiss?: () => void;
}

export default function ReviewPrompt({
  bookingId,
  salonId,
  salonName,
  onDismiss,
}: ReviewPromptProps) {
  const t = useTranslations('reviewPrompt');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert(t('selectRating'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          salon_id: salonId,
          rating,
          comment: comment || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit review');

      setIsVisible(false);
      onDismiss?.();
    } catch (err) {
      console.error('[ReviewPrompt] Failed to submit:', err);
      alert(t('submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-[--raised] dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.08] rounded-[16px] p-5 shadow-lg space-y-4 z-50 animate-[slideUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h3>
          <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mt-0.5">
            {salonName}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="p-1 rounded-[6px] hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.08]"
        >
          <X size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
        </button>
      </div>

      {/* Star rating */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform duration-200 hover:scale-110"
          >
            <Star
              size={28}
              className={`${
                rating >= star
                  ? 'fill-s-coral text-s-coral'
                  : 'text-s-ink/20 dark:text-s-dm-text/20'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment input */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder={t('commentPlaceholder')}
        maxLength={500}
        className="w-full px-3 py-2 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-s-bg-base dark:bg-s-dm-bg text-xs font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 resize-none"
        rows={2}
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? '...' : t('submit')}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add to profile/page or use as a global component**

For simplicity, add ReviewPrompt to the profile page (it fetches user's completed bookings without reviews and shows the prompt).

- [ ] **Step 3: Commit**

```bash
echo "export { default as ReviewPrompt } from './ReviewPrompt';" >> components/booking/index.ts
git add components/booking/ReviewPrompt.tsx components/booking/index.ts
git commit -m "phase 3.2: add review prompt component for completed bookings"
git push origin main
```

---

## Verification & Testing Plan

### Pre-Commit Verification

Before each commit, run:

```bash
npm run build                   # Must pass
npx tsc --noEmit              # Must pass (zero type errors)
git diff --stat               # Review changed files
```

### Post-Push Verification

After each push:

```bash
# Wait 60s for Vercel deploy
sleep 60

# Check deployment status
curl -s https://www.solen.ch/de/ -I | head -3  # Must return 200 or 307

# Check booking page loads
curl -s "https://www.solen.ch/de/salon/example/booking" -I | head -3  # Should not be 404
```

### Browser Testing Checklist

- [ ] Booking flow loads without errors (check browser console)
- [ ] Each step's UI renders correctly (fonts, colors, spacing match V5 design)
- [ ] Service selection: Adding/removing services updates the total
- [ ] Staff selection: Filtering by service eligibility works
- [ ] Date selection: Calendar disables unavailable dates
- [ ] Time selection: Available slots display grouped by time of day
- [ ] Confirmation: Summary shows all details correctly
- [ ] Payment: Both "Online" and "In-Person" options render
- [ ] Booking submission: Creates a booking in the DB (check Supabase)
- [ ] Confirmation page: Displays success + booking summary
- [ ] "My Bookings" page: Loads upcoming/past/cancelled bookings
- [ ] Mobile responsiveness: All pages render well on mobile (375px width)
- [ ] Dark mode: All components have proper dark mode colors (no white backgrounds)

---

## Risk Analysis & Breakage Points

| Risk | Likelihood | Mitigation |
|---|---|---|
| DB schema mismatch (selecting columns that don't exist) | HIGH | Verify all selected columns in `_rules/DB_SCHEMA.md` before querying |
| API routes not found (missing route.ts files) | HIGH | Create all 4 API routes BEFORE calling them from components |
| Missing i18n keys (German/English/French/Italian translation keys) | MEDIUM | Add keys to all 4 locale files in `messages/` for every user-facing string |
| Booking state not persisting across step transitions | MEDIUM | Test Context state updates work correctly; log state changes to console during dev |
| Availability slots miscalculation (wrong duration/time filtering) | MEDIUM | Test with multiple service/staff combinations; verify slot filtering logic |
| Stripe integration breaks if payment method not set | MEDIUM | Validate `paymentMethod` is set before creating payment intent |
| Mobile layout breaks on narrow screens | MEDIUM | Test on iPhone 375px width; use mobile-first responsive design |
| Dark mode colors break (white text on white bg) | LOW | Use CSS variables (`--base`, `--raised`, `--dm-text`) instead of hardcoded colors |

---

## Summary

**Total Tasks: 12**
- Phase 1 (6 steps): 9 tasks
- Phase 2 (multi-service): 1 task (already built, just wired)
- Phase 3 (management): 2 tasks

**Estimated Implementation Time: ~8-10 hours** (with full TDD and verification)

**Key Files Created: 20+**
- 6 step components
- 1 wizard router
- 1 main booking page
- 1 confirmation page
- 4 API routes
- 2 management UI components
- 1 context provider
- Multiple supporting utilities

---

## Next Steps

1. **Execute this plan** using either:
   - `superpowers:subagent-driven-development` (recommended for fresh subagents per task)
   - `superpowers:executing-plans` (inline execution with checkpoints)

2. **After completion**, run:
   - Full test suite (if available)
   - Lighthouse audit (performance, accessibility)
   - Visual regression testing (screenshot comparisons)

3. **Before deploying to production**:
   - Load testing (simulate 100+ concurrent bookings)
   - Stripe sandbox testing (payment flow)
   - SMS/email confirmation testing (if integrated)
