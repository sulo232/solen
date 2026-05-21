/**
 * lib/booking-state.ts
 * Booking wizard state types and interfaces
 * Defines the shape of data flowing through the multi-step booking context
 */

// Q55 (locked 2026-05-02): collapsed to 3-step flow:
//   'services-staff' | 'datetime' | 'pay-confirm'
// Legacy step names ('confirm' + 'payment' from V5 4-step) retained for backwards
// compatibility with in-progress sessions; BookingWizard normalizes them to 'pay-confirm'.
// Even older step names ('services'|'staff'|'date'|'time') kept for any legacy state
// that might still exist in browser storage.
export type BookingStep = 'services-staff' | 'datetime' | 'pay-confirm' | 'confirm' | 'payment' | 'services' | 'staff' | 'date' | 'time';

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
  selectedTime: string | null; // '09:00', '09:30', etc.
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
