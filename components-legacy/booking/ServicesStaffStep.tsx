'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Plus, Check, ArrowUp, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { StaffPicker } from '@/components-legacy/booking';
import Spinner from '@/components-legacy/ui/Spinner';
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
  description_de: string | null;
  description_en: string | null;
  suitable_gender: string[] | null;
}

interface ServicesStaffStepProps {
  services: Service[];
  staffList: StaffMember[];
  salonId: string;
}

const catId = (category: string) => `cat-${category.replace(/[^a-z0-9]/gi, '-')}`;

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

  const serviceName = (s: Service) => (locale === 'en' ? s.name_en : s.name_de);
  const serviceDesc = (s: Service) =>
    locale === 'en' ? s.description_en : s.description_de;
  // Gender suffix only when a service is restricted to a single gender (Fresha pattern)
  const genderLabel = (s: Service) => {
    const g = s.suitable_gender;
    if (!g || g.length !== 1) return null;
    if (g[0] === 'male') return t('menOnly');
    if (g[0] === 'female') return t('womenOnly');
    return null;
  };

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

  // Sticky category tabs — scroll-spy (matches Fresha: all sections stay in DOM)
  const [activeCat, setActiveCat] = useState<string>(categories[0] ?? '');
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length <= 1) return;
    const onScroll = () => {
      let current = categories[0];
      for (const cat of categories) {
        const el = document.getElementById(catId(cat));
        if (el && el.getBoundingClientRect().top <= 130) current = cat;
      }
      setActiveCat(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join('|')]);

  const goToCat = (cat: string) => {
    setActiveCat(cat);
    document
      .getElementById(catId(cat))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pb-32">
      {/* Sticky category tabs */}
      {categories.length > 1 && (
        <div
          ref={tabsRef}
          className="sticky top-[60px] z-30 -mx-4 px-4 py-2.5 bg-[--base] border-b border-s-ink/[0.06]"
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const isActive = cat === activeCat;
              return (
                <button
                  key={cat}
                  onClick={() => goToCat(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-heading capitalize whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? 'bg-s-ink text-white'
                      : 'bg-[--raised] text-s-ink border border-s-ink/[0.12] hover:border-s-ink/25'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Services grouped by category */}
      <div className="space-y-7 pt-5">
        {categories.map((category) => {
          const categoryServices = services.filter(
            (s) => s.category === category
          );
          return (
            <section key={category} id={catId(category)} className="scroll-mt-[120px]">
              <h3 className="font-heading text-lg font-bold capitalize text-s-ink mb-3">
                {category}
              </h3>
              <div className="space-y-2.5">
                {categoryServices.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id);
                  const desc = serviceDesc(service);
                  const gLabel = genderLabel(service);
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className={`w-full text-left p-4 rounded-input border-2 bg-[--raised] transition-[border-color] duration-200 ${
                        isSelected
                          ? 'border-s-accent'
                          : 'border-s-ink/[0.08] hover:border-s-accent/30'
                      }`}
                    >
                      <h4 className="font-heading text-[15px] font-semibold text-s-ink leading-snug">
                        {serviceName(service)}
                      </h4>
                      <p className="text-xs text-s-ink/55 mt-1">
                        {service.duration_minutes} {t('minutes')}
                        {gLabel && <> · {gLabel}</>}
                      </p>
                      {desc && (
                        <p className="text-[13px] text-s-ink/55 leading-relaxed mt-1.5 line-clamp-2">
                          {desc}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-body font-bold text-[15px] text-s-ink tabular-nums">
                          {formatCurrency(service.price, locale)}
                        </span>
                        <span
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            isSelected
                              ? 'bg-s-accent text-white'
                              : 'border border-s-ink/15 text-s-ink/50'
                          }`}
                          aria-hidden
                        >
                          {isSelected ? (
                            <Check size={17} strokeWidth={2.5} />
                          ) : (
                            <Plus size={17} strokeWidth={2} />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
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
            <div className="border-t border-s-ink/[0.06] mt-7 pt-5">
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
        <p className="text-sm text-s-error text-center mt-4">{error}</p>
      )}

      {/* Floating "X selected" pill — Fresha pattern, in s-accent */}
      {hasSelectedServices && (
        <div className="fixed left-0 right-0 bottom-[80px] z-40 flex justify-center px-4 pointer-events-none">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-full bg-[--raised] border-[1.5px] border-s-accent text-s-accent text-[13px] font-heading font-semibold shadow-[0_6px_18px_-6px_rgba(24,92,224,0.42)]"
          >
            {formData.services.length} {t('selected')}
            <ArrowUp size={15} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] bg-[--raised] z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <p className="font-body font-extrabold text-xl text-s-ink tabular-nums leading-none">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-s-ink/55 mt-1.5">
              <ShoppingCart size={13} aria-hidden />
              {formData.services.length} {t('items')} · {formData.totalDuration}{' '}
              {t('minutes')}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={formData.services.length === 0 || isChecking}
            className="px-6 py-3 rounded-btn bg-s-ink text-white font-heading text-sm font-semibold hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
