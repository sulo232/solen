'use client';

import { useBooking } from '@/lib/booking-context';
import {
  ServiceSelectionStep,
  StaffSelectionStep,
  DateSelectionStep,
  TimeSelectionStep,
  ConfirmationStep,
  PaymentStep,
} from '@/components/booking';
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
  const selectedStaff =
    formData.selectedStaffId && formData.selectedStaffId !== 'any'
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
