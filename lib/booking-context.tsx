'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { BookingContextType, BookingFormData, BookingStep, SelectedService } from './booking-state';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// GAP #5 punch (round 2, 2026-07-18): own redundant copy of the round-trip calendar-date
// check (defense-in-depth alongside booking/page.tsx's server-side validation). A NaN-only
// Date() check does not catch day-of-month overflow (JS silently normalizes "2026-02-30" ->
// "2026-03-02"), so this round-trips the y/m/d through a LOCAL-time Date and requires them
// to read back identically before initialDate is ever allowed to seed selectedDate.
function isRealCalendarDate(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
}

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
  currentStep: 'services-staff' as BookingStep,
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

export function BookingProvider({
  children,
  salonId,
  initialStaffId,
  initialService,
  initialServices,
  initialStart,
  initialDate,
  initialNote,
  initialBundleId,
}: {
  children: ReactNode;
  salonId: string;
  initialStaffId?: string;
  initialService?: SelectedService;
  initialServices?: SelectedService[];
  initialStart?: string;
  /** GAP #5: ?date=YYYY-MM-DD from a search result / PDP link. Seeds ONLY selectedDate
   *  (never selectedTime), so the user still picks a real slot. Ignored when initialStart
   *  is also present (a concrete slot already carries a more specific date and time). */
  initialDate?: string;
  /** ?note=… — the discovery cut-instruction auto-fills the booking note (HairStep reads formData.customerNote). */
  initialNote?: string;
  /** A5 BUG-1: ?bundle=<id> from the PDP bundle card. Seeds formData.bundleId so PayConfirmStep's POST includes bundle_id. */
  initialBundleId?: string;
}) {
  const [state, dispatch] = useReducer(bookingReducer, initialState, (base) => {
    let fd = base.formData;
    if (initialStaffId) fd = { ...fd, selectedStaffId: initialStaffId };
    // V3-D379: arriving from a card slot pill (?service=<id>) seeds the cart with
    // that service + its totals, so the user lands mid-flow, not on an empty step.
    // V3-D (2026-06-09): ?services=<csv> (multi-select from the PDP "Alle ansehen" sheet)
    // seeds the cart with ALL chosen services; ?service=<id> (single) is the fallback.
    const seedServices =
      initialServices && initialServices.length
        ? initialServices
        : initialService
          ? [initialService]
          : null;
    if (seedServices) {
      fd = {
        ...fd,
        services: seedServices,
        totalPrice: seedServices.reduce((sum, s) => sum + (s.price || 0), 0),
        totalDuration: seedServices.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
      };
    }
    // V3-D380: ?start=<ISO> (the tapped slot's time) seeds the date + time so the
    // datetime step lands pre-filled on that slot. selectedTime is "HH:MM" (local,
    // 24h) to match DateTimeStep's slot.time format.
    if (initialStart) {
      const d = new Date(initialStart);
      if (!Number.isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        fd = { ...fd, selectedDate: d, selectedTime: `${hh}:${mm}` };
      }
    } else if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && isRealCalendarDate(initialDate)) {
      // GAP #5: a searched date (already format/range/round-trip-validated server-side
      // in booking/page.tsx, re-checked here for defense-in-depth) seeds ONLY the date.
      // selectedTime stays null so the user still picks a real slot on the
      // DateTimePicker, exactly like a manual date tap. "T00:00:00" (no Z) forces
      // local-time parsing, avoiding the UTC-midnight date-only Date() gotcha that can
      // shift the day in negative-offset timezones.
      fd = { ...fd, selectedDate: new Date(`${initialDate}T00:00:00`) };
    }
    // Discovery "book this look": the cut-instruction arrives as ?note= and seeds the booking note, so the user
    // reaches the hair step with "how to cut it" already written (owner 2026-06-14).
    if (initialNote && initialNote.trim()) {
      fd = { ...fd, customerNote: initialNote.trim() };
    }
    // A5 BUG-1: ?bundle=<id> (validated server-side against the active bundles of this salon) rides
    // through to the POST /api/bookings body, so the server prices the discounted bundle, not the sum.
    if (initialBundleId) {
      fd = { ...fd, bundleId: initialBundleId };
    }
    return fd === base.formData ? base : { ...base, formData: fd };
  });

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
