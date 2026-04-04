/**
 * lib/booking-state.ts
 * Booking wizard state types and interfaces
 * Defines the shape of data flowing through the multi-step booking context
 */

// Active 4-step flow uses: 'services-staff' | 'datetime' | 'confirm' | 'payment'
// Legacy step names retained for backwards compatibility with old step components
export type BookingStep = 'services-staff' | 'datetime' | 'confirm' | 'payment' | 'services' | 'staff' | 'date' | 'time';

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
