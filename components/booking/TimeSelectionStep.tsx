'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Clock } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import Spinner from '@/components/ui/Spinner';

interface TimeSelectionStepProps {
  salonId: string;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface TimeGroup {
  label: string;
  slots: TimeSlot[];
}

export default function TimeSelectionStep({ salonId }: TimeSelectionStepProps) {
  const t = useTranslations('booking.timeSelection');
  const { formData, updateFormData, goToStep } = useBooking();
  const [timeGroups, setTimeGroups] = useState<TimeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!formData.selectedDate) {
        setError(t('selectDateFirst'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          salon_id: salonId,
          date: formData.selectedDate.toISOString().split('T')[0],
          staff_id: formData.selectedStaffId === 'any' ? '' : formData.selectedStaffId,
          service_ids: formData.services.map((s) => s.id).join(','),
          duration_minutes: formData.totalDuration.toString(),
        });

        const res = await fetch(`/api/availability/time-slots?${params}`);
        if (!res.ok) throw new Error('Failed to fetch time slots');

        const data = await res.json();

        // Group by time of day
        const groups: TimeGroup[] = [
          {
            label: t('morning'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 8 && hour < 12;
            }),
          },
          {
            label: t('afternoon'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 12 && hour < 17;
            }),
          },
          {
            label: t('evening'),
            slots: data.slots.filter((s: any) => {
              const hour = parseInt(s.time.split(':')[0]);
              return hour >= 17 && hour < 21;
            }),
          },
        ].filter((g) => g.slots.length > 0);

        setTimeGroups(groups);
      } catch (err) {
        console.error('[TimeSelectionStep] Failed to fetch time slots:', err);
        setError(t('errorFetchingSlots'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeSlots();
  }, [salonId, formData.selectedDate, formData.selectedStaffId, formData.services, t]);

  const handleSelectTime = (time: string) => {
    updateFormData({ selectedTime: time });
  };

  const handleContinue = () => {
    if (!formData.selectedTime) {
      alert(t('selectTime'));
      return;
    }
    setIsChecking(true);
    goToStep('confirm');
    setIsChecking(false);
  };

  const handleBack = () => {
    goToStep('date');
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
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">
            {formData.selectedDate?.toLocaleDateString()}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-s-ink/60 dark:text-s-dm-text/60">{error}</p>
        </div>
      ) : timeGroups.length === 0 ? (
        <div className="text-center py-8">
          <Clock size={40} className="mx-auto text-s-ink/20 dark:text-s-dm-text/20 mb-3" />
          <p className="text-s-ink/60 dark:text-s-dm-text/60">{t('noSlotsAvailable')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timeGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {group.slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSelectTime(slot.time)}
                    className={`py-3 rounded-[12px] border text-sm font-heading font-semibold transition-[border-color,background-color] duration-150 ${
                      formData.selectedTime === slot.time
                        ? 'bg-s-coral border-s-coral text-white'
                        : 'border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink dark:text-s-dm-text hover:border-s-coral/40 bg-[--raised] dark:bg-s-dm-surface'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
            disabled={!formData.selectedTime || isChecking}
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
