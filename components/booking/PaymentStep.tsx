'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, Wallet } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import Spinner from '@/components/ui/Spinner';

interface PaymentStepProps {
  salonId: string;
}

export default function PaymentStep({ salonId }: PaymentStepProps) {
  const t = useTranslations('booking.payment');
  const tGeneral = useTranslations('booking');
  const router = useRouter();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPaymentMethod = (method: 'online' | 'in_person') => {
    updateFormData({ paymentMethod: method });
    setError(null);
  };

  const handleConfirmBooking = async () => {
    if (!formData.paymentMethod) {
      setError(t('selectPaymentMethod'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form data completeness
      if (!formData.selectedDate || !formData.selectedTime || formData.services.length === 0) {
        setError('Bitte fülle alle erforderlichen Felder aus');
        setIsSubmitting(false);
        return;
      }

      // Build the start time (ISO format)
      const dateStr = formData.selectedDate.toISOString().split('T')[0];
      const startsAt = new Date(`${dateStr}T${formData.selectedTime}:00Z`).toISOString();

      // Create booking via API
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          service_id: formData.services[0].id, // First service for now
          staff_member_id: formData.selectedStaffId === 'any' ? null : formData.selectedStaffId,
          starts_at: startsAt,
          payment_method: formData.paymentMethod,
          promo_code: formData.promoCode || null,
          gift_card_code: formData.giftCardCode || null,
          total_price: formData.totalPrice,
          is_first_visit: true,
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        throw new Error(errorData.message || t('bookingFailed'));
      }

      const booking = await bookingRes.json();

      // Redirect to confirmation page
      router.push(`/confirmation?booking_id=${booking.data.id}`);
    } catch (err) {
      console.error('[PaymentStep] Booking failed:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    goToStep('confirm');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label={t('back')}
          className="p-2 rounded-pill hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ChevronLeft size={20} className="text-s-ink dark:text-s-dm-text" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-s-ink dark:text-s-dm-text">
            {t('title')}
          </h2>
        </div>
      </div>

      {/* Payment method options */}
      <div className="space-y-3">
        {/* Online Payment */}
        <button
          onClick={() => handleSelectPaymentMethod('online')}
          className={`w-full flex items-center gap-4 p-4 rounded-[14px] border-2 transition-[border-color,background-color] duration-150 ${
            formData.paymentMethod === 'online'
              ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
              : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
          }`}
        >
          <CreditCard size={24} className="text-s-ink/60 dark:text-s-dm-text/60" />
          <div className="flex-1 text-left">
            <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
              {t('online')}
            </h3>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
              {t('onlineDescription')}
            </p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-150 ${
              formData.paymentMethod === 'online'
                ? 'bg-s-coral border-s-coral'
                : 'border-s-ink/20 dark:border-white/20'
            }`}
          >
            {formData.paymentMethod === 'online' && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
        </button>

        {/* In-Person Payment */}
        <button
          onClick={() => handleSelectPaymentMethod('in_person')}
          className={`w-full flex items-center gap-4 p-4 rounded-[14px] border-2 transition-[border-color,background-color] duration-150 ${
            formData.paymentMethod === 'in_person'
              ? 'border-s-coral bg-s-coral/[0.04] dark:bg-s-coral/[0.08]'
              : 'border-s-ink/[0.08] dark:border-white/[0.08] hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
          }`}
        >
          <Wallet size={24} className="text-s-amber" />
          <div className="flex-1 text-left">
            <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
              {t('inPerson')}
            </h3>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
              {t('inPersonDescription')}
            </p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-150 ${
              formData.paymentMethod === 'in_person'
                ? 'bg-s-coral border-s-coral'
                : 'border-s-ink/20 dark:border-white/20'
            }`}
          >
            {formData.paymentMethod === 'in_person' && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
        </button>
      </div>

      {/* Order summary */}
      <div className="bg-[--raised] dark:bg-s-dm-surface rounded-card p-4 border border-s-ink/[0.06] dark:border-white/[0.08]">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text mb-3">
          {tGeneral('cart.total')}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-s-ink/60 dark:text-s-dm-text/60 text-sm">
            {formData.services.length > 0
              ? `${formData.services[0].name_de} (${formData.services[0].duration_minutes} min)`
              : 'Service'}
          </span>
          <span className="font-heading font-bold text-s-ink dark:text-s-dm-text">
            {formatCurrency(formData.totalPrice)}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] dark:border-white/[0.08] bg-[--raised] dark:bg-s-dm-surface p-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-3">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] hover:bg-s-ink/[0.02] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter,border-color,background-color] duration-150"
          >
            {t('back')}
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!formData.paymentMethod || isSubmitting}
            className="flex-1 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-xs uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Spinner size="sm" invert />}
            {t('confirmBooking')}
          </button>
        </div>
      </div>
    </div>
  );
}
