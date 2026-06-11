'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ArrowUp, ArrowRight, ShoppingCart, List, X, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { StaffPicker, StaffListSheet } from '@/components-legacy/booking';
import ToggleCircle from './ToggleCircle';
import ServiceDetailSheet from './ServiceDetailSheet';
import Spinner from '@/components-legacy/ui/Spinner';
import type { SelectedService } from '@/lib/booking-state';
import type { StaffMember } from '@/lib/types';

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  category: string;
  subcategory: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  description_de: string | null;
  description_en: string | null;
  suitable_gender: string[] | null;
}

interface StaffService {
  staff_member_id: string;
  service_id: string;
}
interface ServiceAddon {
  service_id: string;
  addon_service_id: string;
  sort_order: number | null;
}
interface ServiceOption {
  id: string;
  service_id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
  sort_order: number | null;
}

interface ServicesStaffStepProps {
  services: Service[];
  staffList: StaffMember[];
  salonId: string;
  salonSlug: string;
  staffServices: StaffService[];
  serviceAddons: ServiceAddon[];
  serviceOptions: ServiceOption[];
}

const catId = (category: string) => `cat-${category.replace(/[^a-z0-9]/gi, '-')}`;

export default function ServicesStaffStep({
  services,
  staffList,
  salonId,
  salonSlug,
  staffServices,
  serviceAddons,
  serviceOptions,
}: ServicesStaffStepProps) {
  const t = useTranslations('booking.serviceSelection');
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [showStaffList, setShowStaffList] = useState(false);
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);

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
      // Deselecting a service also clears its selected add-ons — otherwise an
      // add-on stays in the cart/total with no UI to see or remove it.
      const addonIds = serviceAddons
        .filter((a) => a.service_id === service.id)
        .map((a) => a.addon_service_id);
      const removeIds = new Set([service.id, ...addonIds]);
      const removed = formData.services.filter((s) => removeIds.has(s.id));
      const removedPrice = removed.reduce((sum, s) => sum + s.price, 0);
      const removedDuration = removed.reduce(
        (sum, s) => sum + s.duration_minutes,
        0
      );
      updateFormData({
        services: formData.services.filter((s) => !removeIds.has(s.id)),
        totalPrice: formData.totalPrice - removedPrice,
        totalDuration: formData.totalDuration - removedDuration,
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

  // #6: when a specific stylist is picked, show only the services they offer
  // (fall back to all if that stylist has no mapped services).
  const selStaffId = formData.selectedStaffId;
  const stylistServiceIds =
    selStaffId && selStaffId !== 'any'
      ? new Set(
          staffServices
            .filter((m) => m.staff_member_id === selStaffId)
            .map((m) => m.service_id)
        )
      : null;
  const visibleServices =
    stylistServiceIds && stylistServiceIds.size > 0
      ? services.filter((s) => stylistServiceIds.has(s.id))
      : services;

  // #7: look up add-on services by id (from the full list, so add-ons still
  // resolve even when the main list is filtered by stylist)
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const toSel = (s: Service): SelectedService => ({
    id: s.id,
    name_de: s.name_de,
    name_en: s.name_en,
    price: s.price,
    duration_minutes: s.duration_minutes,
  });

  // Commit the service + its chosen add-ons as one unit, rebuilding the cart
  // from scratch so totals can't drift. Backs both "Add" and "Update".
  const handleSheetConfirm = (
    serviceId: string,
    addonIds: string[],
    optionId?: string | null
  ) => {
    const svc = serviceById.get(serviceId);
    if (!svc) {
      setSheetServiceId(null);
      return;
    }
    // A chosen required option replaces the service's base price + duration.
    const opt = optionId ? serviceOptions.find((o) => o.id === optionId) : null;
    const svcLine: SelectedService = opt
      ? {
          id: svc.id,
          name_de: svc.name_de,
          name_en: svc.name_en,
          price: opt.price,
          duration_minutes: opt.duration_minutes,
        }
      : toSel(svc);
    const ownAddonIds = serviceAddons
      .filter((a) => a.service_id === serviceId)
      .map((a) => a.addon_service_id);
    const clear = new Set([serviceId, ...ownAddonIds]);
    const kept = formData.services.filter((s) => !clear.has(s.id));
    const additions = [
      svcLine,
      ...addonIds
        .map((id) => serviceById.get(id))
        .filter((s): s is Service => !!s)
        .map(toSel),
    ];
    const next = [...kept, ...additions];
    updateFormData({
      services: next,
      totalPrice: next.reduce((sum, s) => sum + s.price, 0),
      totalDuration: next.reduce((sum, s) => sum + s.duration_minutes, 0),
      ...(singleStaff ? { selectedStaffId: staffList[0].id } : {}),
    });
    setError(null);
    setSheetServiceId(null);
  };

  const handleRemoveService = (serviceId: string) => {
    const ownAddonIds = serviceAddons
      .filter((a) => a.service_id === serviceId)
      .map((a) => a.addon_service_id);
    const clear = new Set([serviceId, ...ownAddonIds]);
    const next = formData.services.filter((s) => !clear.has(s.id));
    updateFormData({
      services: next,
      totalPrice: next.reduce((sum, s) => sum + s.price, 0),
      totalDuration: next.reduce((sum, s) => sum + s.duration_minutes, 0),
    });
    setSheetServiceId(null);
  };

  // Active-sheet data
  const sheetService = sheetServiceId
    ? services.find((s) => s.id === sheetServiceId) ?? null
    : null;
  const sheetAddons = sheetService
    ? serviceAddons
        .filter((a) => a.service_id === sheetService.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((a) => serviceById.get(a.addon_service_id))
        .filter((s): s is Service => !!s)
    : [];
  const sheetInitialAddonIds = sheetAddons
    .filter((a) => selectedServiceIds.has(a.id))
    .map((a) => a.id);
  const sheetInCart = sheetService
    ? selectedServiceIds.has(sheetService.id)
    : false;
  const sheetOptions = sheetService
    ? serviceOptions
        .filter((o) => o.service_id === sheetService.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const sheetCartLine = sheetService
    ? formData.services.find((s) => s.id === sheetService.id) ?? null
    : null;
  const sheetInitialOptionId =
    sheetCartLine && sheetOptions.length
      ? sheetOptions.find(
          (o) =>
            o.price === sheetCartLine.price &&
            o.duration_minutes === sheetCartLine.duration_minutes
        )?.id ?? null
      : null;

  // Group by subcategory (Schnitt / Farbe / Styling / …) like the locked
  // SalonServicesSheet, falling back to the top-level category. This is what
  // populates the scrolling category pills.
  const groupKey = (s: Service) => s.subcategory ?? s.category;
  const categories = Array.from(new Set(visibleServices.map(groupKey))).sort();

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
          // Bar blends into the sunken step body (the white patch on grey read as a
          // contrast bug, owner 2026-06-11); occlusion comes from the bg, not a border.
          className="sticky top-[60px] z-30 -mx-4 px-4 py-2.5 bg-s-bg-sunken"
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const isActive = cat === activeCat;
              return (
                <button
                  key={cat}
                  onClick={() => goToCat(cat)}
                  // On the sunken bar a soft-grey active fill vanishes, so the active
                  // pill uses the ink-selected TabPill language (mockup 18 ptab.on).
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-heading capitalize whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-200 ${
                    isActive
                      ? 'border-s-ink bg-s-ink text-white'
                      : 'border-s-border bg-white text-s-ink-2 hover:text-s-ink hover:shadow-[0_2px_10px_-2px_rgba(10,10,10,0.12)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            {/* Fresha ☰ — opens the categories quick-jump sheet */}
            <button
              type="button"
              onClick={() => setShowCatSheet(true)}
              aria-label={t('categories')}
              className="shrink-0 grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink transition-colors hover:border-s-ink/25"
            >
              <List size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Staff picker — top, always visible (stylist-first) */}
      {!singleStaff && (
        <div className="pt-5">
          {/* Mockup-04 verify (2026-06-11): heading row added; See-all = ink + chevron (1.5 v3) */}
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-heading text-[15px] font-semibold text-s-ink">{t("yourStylist")}</h3>
            <button
              type="button"
              onClick={() => setShowStaffList(true)}
              className="inline-flex items-center gap-0.5 font-body text-[14px] font-semibold text-s-ink transition-colors hover:text-s-ink-2"
            >
              {t("seeAll")}
              <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
          <StaffPicker
            staffList={staffList}
            selectedStaff={formData.selectedStaffId}
            onSelect={handleSelectStaff}
          />
        </div>
      )}

      {/* Services grouped by category */}
      <div className={`space-y-7 pt-5 ${!singleStaff ? 'border-t border-s-border mt-5' : ''}`}>
        {categories.map((category) => {
          const categoryServices = visibleServices.filter(
            (s) => groupKey(s) === category
          );
          return (
            <section key={category} id={catId(category)} className="scroll-mt-[120px]">
              <h3 className="font-heading text-lg font-bold capitalize text-s-ink mb-3">
                {category}
              </h3>
              {/* Grouped card per category (Atelier pattern, owner 2026-06-11): rows + dividers */}
              <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
                {categoryServices.map((service) => {
                  const inCart = selectedServiceIds.has(service.id);
                  const desc = serviceDesc(service);
                  const gLabel = genderLabel(service);
                  const ownAddons = serviceAddons.filter(
                    (a) => a.service_id === service.id
                  );
                  const hasAddons = ownAddons.length > 0;
                  const ownOptions = serviceOptions.filter(
                    (o) => o.service_id === service.id
                  );
                  const hasOptions = ownOptions.length > 0;
                  const minOptionPrice = hasOptions
                    ? Math.min(...ownOptions.map((o) => o.price))
                    : null;
                  const selAddonCount = ownAddons.filter((a) =>
                    selectedServiceIds.has(a.addon_service_id)
                  ).length;
                  return (
                    <button
                      key={service.id}
                      onClick={() =>
                        hasAddons || hasOptions
                          ? setSheetServiceId(service.id)
                          : handleSelectService(service)
                      }
                      className="w-full border-t border-s-border px-5 py-[18px] text-left transition-colors duration-200 first:border-t-0 hover:bg-s-bg-sunken/50"
                    >
                      <h4 className="font-heading text-[15px] font-semibold text-s-ink leading-snug">
                        {serviceName(service)}
                      </h4>
                      <p className="flex items-center gap-1 text-xs text-s-ink-2 mt-1">
                        <Clock size={13} strokeWidth={1.9} aria-hidden />
                        {service.duration_minutes} {t('minutes')}
                        {gLabel && <> {gLabel}</>}
                      </p>
                      {desc && (
                        <p className="text-[13px] text-s-ink-2 leading-relaxed mt-1.5 line-clamp-2">
                          {desc}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-body font-bold text-[15px] text-s-ink tabular-nums">
                          {hasOptions
                            ? `${t('from')} ${formatCurrency(minOptionPrice!, locale)}`
                            : formatCurrency(service.price, locale)}
                        </span>
                        <ToggleCircle selected={inCart} />
                      </div>
                      {inCart && selAddonCount > 0 && (
                        <p className="mt-2 text-[12px] font-medium text-s-ink">
                          +{selAddonCount} {t('addOns')}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-s-error text-center mt-4">{error}</p>
      )}

      {/* Floating "X selected" pill — Fresha pattern, ink (matches selection language) */}
      {hasSelectedServices && (
        <div className="fixed left-0 right-0 bottom-[80px] z-40 flex justify-center px-4 pointer-events-none">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            // Ink-filled (modern), no outline. Micro: lifts the arrow on hover, presses on tap.
            className="group pointer-events-auto flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-full bg-s-ink text-white text-[13px] font-heading font-semibold shadow-[0_8px_24px_-8px_rgba(10,10,10,0.45)] transition-transform duration-200 ease-glide active:scale-[0.97]"
          >
            {formData.services.length} {t('selected')}
            <ArrowUp size={15} strokeWidth={2.4} className="transition-transform duration-200 ease-glide group-hover:-translate-y-0.5" />
          </button>
        </div>
      )}

      {/* Bottom bar */}
      {/* Solid white — --raised is 95%-alpha and content ghosted through (no blur) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-border bg-white z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <p className="font-body font-extrabold text-xl text-s-ink tabular-nums leading-none">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-s-ink-2 mt-1.5">
              <ShoppingCart size={13} aria-hidden />
              {formData.services.length} {t('items')} {formData.totalDuration}{' '}
              {t('minutes')}
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={formData.services.length === 0 || isChecking}
            className="group px-6 py-3 rounded-btn bg-s-ink text-white font-heading text-sm font-semibold hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,filter] duration-150 flex items-center gap-2"
          >
            {isChecking && <Spinner size="sm" invert />}
            {t('continue')}
            <ArrowRight size={16} strokeWidth={2} aria-hidden className="transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Categories bottom sheet — Fresha ☰ quick-jump (IMG_4830) */}
      <AnimatePresence>
        {showCatSheet && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCatSheet(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white px-5 pt-3 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-s-ink/15" />
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold text-s-ink">
                  {t('categories')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCatSheet(false)}
                  aria-label={t('categories')}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-s-bg-sunken"
                >
                  <X size={20} className="text-s-ink" />
                </button>
              </div>
              <div className="divide-y divide-s-ink/[0.06]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      goToCat(cat);
                      setShowCatSheet(false);
                    }}
                    className={`w-full py-3.5 text-left text-[15px] capitalize ${
                      cat === activeCat
                        ? 'font-semibold text-s-ink'
                        : 'text-s-ink/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Service detail sheet — Fresha options + add-ons (Variant A) */}
      {sheetService && (
        <ServiceDetailSheet
          service={sheetService}
          addons={sheetAddons}
          options={sheetOptions}
          initialAddonIds={sheetInitialAddonIds}
          initialOptionId={sheetInitialOptionId}
          isInCart={sheetInCart}
          locale={locale}
          onConfirm={handleSheetConfirm}
          onRemove={handleRemoveService}
          onClose={() => setSheetServiceId(null)}
        />
      )}

      {/* Full-screen "Select professional" list (Fresha pattern) */}
      {showStaffList && (
        <StaffListSheet
          staffList={staffList}
          selectedStaff={formData.selectedStaffId}
          onSelect={handleSelectStaff}
          onClose={() => setShowStaffList(false)}
          salonSlug={salonSlug}
        />
      )}
    </div>
  );
}
