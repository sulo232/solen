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
