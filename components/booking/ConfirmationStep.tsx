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
  const tGeneral = useTranslations('booking');
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

  // Generate cancellation policy text from context
  const getCancellationPolicy = () => {
    const hours = salon.cancellation_window_hours || 24;
    const fee = salon.cancellation_fee_percent || 0;
    return tGeneral('cancellationPolicy', { hours, fee });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.06] transition-colors"
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
        {salon.cover_photo_url && (
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={salon.cover_photo_url}
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
            {getCancellationPolicy()}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.97] transition-[transform,filter,border-color,background-color] duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleContinue}
            disabled={isChecking}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continuePayment')}
          </button>
        </div>
      </div>
    </div>
  );
}
