'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { StaffPicker } from '@/components/booking';
import Spinner from '@/components/ui/Spinner';
import type { SelectedService } from '@/lib/booking-state';
import type { StaffMember } from '@/lib/types';

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

interface ServicesStaffStepProps {
  services: Service[];
  staffList: StaffMember[];
  salonId: string;
}

export default function ServicesStaffStep({
  services,
  staffList,
  salonId,
}: ServicesStaffStepProps) {
  const t = useTranslations('booking.serviceSelection');
  const tStaff = useTranslations('booking.staffSelection');
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServiceIds = new Set(formData.services.map((s) => s.id));
  const hasSelectedServices = formData.services.length > 0;

  // Only show staff picker after at least one service is selected
  // Auto-skip staff if only 1 staff member
  const singleStaff = staffList.length === 1;

  const handleSelectService = (service: Service) => {
    setError(null);
    const selected: SelectedService = {
      id: service.id,
      name_de: service.name_de,
      name_en: service.name_en,
      price: service.price,
      duration_minutes: service.duration_minutes,
    };

    if (selectedServiceIds.has(service.id)) {
      updateFormData({
        services: formData.services.filter((s) => s.id !== service.id),
        totalPrice: formData.totalPrice - service.price,
        totalDuration: formData.totalDuration - service.duration_minutes,
      });
    } else {
      updateFormData({
        services: [...formData.services, selected],
        totalPrice: formData.totalPrice + service.price,
        totalDuration: formData.totalDuration + service.duration_minutes,
      });
      // Auto-select if only 1 staff
      if (singleStaff) {
        updateFormData({ selectedStaffId: staffList[0].id });
      }
    }
  };

  const handleSelectStaff = (staffId: string) => {
    updateFormData({ selectedStaffId: staffId });
  };

  const handleContinue = async () => {
    if (formData.services.length === 0) {
      setError(t('selectAtLeastOne'));
      return;
    }
    setIsChecking(true);
    goToStep('datetime');
    setIsChecking(false);
  };

  // Group services by category
  const categories = Array.from(
    new Map(services.map((s) => [s.category, s])).keys()
  ).sort();

  return (
    <div className="space-y-6 pb-28">
      {/* Services */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category === category);
          return (
            <div key={category}>
              <h3 className="text-xs font-heading uppercase tracking-[.16em] text-s-ink/40 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryServices.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className={`w-full flex items-start gap-3 p-4 rounded-input border-2 transition-[border-color,background-color] duration-200 ${
                        isSelected
                          ? 'border-s-coral bg-s-coral/[0.12]'
                          : 'border-s-ink/[0.08] hover:border-s-coral/30 bg-[--raised]'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-[border-color,background-color] mt-0.5 ${
                          isSelected
                            ? 'bg-s-coral border-s-coral'
                            : 'border-s-ink/20'
                        }`}
                      >
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
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
                        <h4 className="font-heading text-sm text-s-ink">
                          {locale === 'en' ? service.name_en : service.name_de}
                        </h4>
                        <span className="inline-block mt-1 bg-s-ink/[0.05] text-xs text-s-ink/50 px-2 py-0.5 rounded-full">
                          {service.duration_minutes} {t('minutes')}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="font-body font-bold text-base text-s-ink tabular-nums">
                          {formatCurrency(service.price, locale)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff picker — slides in after service selected, hidden for single-staff salons */}
      <AnimatePresence>
        {hasSelectedServices && !singleStaff && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="border-t border-s-ink/[0.06] pt-5">
              <p className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 mb-3 px-1">
                {tStaff('title')}
              </p>
              <StaffPicker
                staffList={staffList}
                selectedStaff={formData.selectedStaffId}
                onSelect={handleSelectStaff}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-s-coral text-center">{error}</p>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] bg-[--raised] p-4 space-y-3 z-40">
        <div className="max-w-2xl mx-auto px-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/50">
              {formData.services.length} {t('selected')}
            </p>
            <p className="font-body font-bold text-xl text-s-ink tabular-nums">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={formData.services.length === 0 || isChecking}
            className="px-6 py-3 rounded-btn bg-s-coral text-white font-heading text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
