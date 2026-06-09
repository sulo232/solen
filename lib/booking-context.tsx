'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { BookingContextType, BookingFormData, BookingStep, SelectedService } from './booking-state';

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
}: {
  children: ReactNode;
  salonId: string;
  initialStaffId?: string;
  initialService?: SelectedService;
  initialServices?: SelectedService[];
  initialStart?: string;
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
