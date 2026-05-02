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
          className="p-2 rounded-pill hover:bg-s-ink/[0.04]:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink">
            {t('title')}
          </h2>
          <p className="text-sm text-s-ink/60 mt-1">
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] bg-[--raised] p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] text-s-ink font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.97] transition-[transform,filter,border-color,background-color] duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!formData.selectedStaffId || isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
