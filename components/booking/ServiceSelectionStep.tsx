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
                    className={`w-full flex items-start gap-3 p-4 rounded-[12px] border-2 transition-[border-color,background-color] duration-200 ${
                      selectedServiceIds.has(service.id)
                        ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
                        : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`shrink-0 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-[border-color,background-color] mt-0.5 ${
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
                      <p className="font-body font-bold text-base text-s-ink dark:text-s-dm-text tabular-nums">
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4 space-y-3 z-40">
        <div className="max-w-2xl mx-auto px-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">
              {formData.services.length} {t('selected')}
            </p>
            <p className="font-body font-bold text-xl text-s-ink dark:text-s-dm-text tabular-nums">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={formData.services.length === 0 || isChecking}
            className="px-6 py-3 rounded-btn bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
