'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ArrowUp, ArrowRight, ShoppingCart, List, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { useEnterMotion, useStaggerVariants, butterPress } from '@/app/[locale]/_components/primitives'; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
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
  /** mockup 20: services -> staff step (or straight to datetime when 0/1 staff) */
  nextStep: 'staff' | 'datetime';
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
  nextStep,
}: ServicesStaffStepProps) {
  const t = useTranslations('booking.serviceSelection');
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  // B17 (owner 2026-07-09, "why is there still this pill even though I'm not
  // scrolled down"): the floating "N chosen" pill used to render unconditionally
  // the moment a service was selected. It is a scroll-back-to-top affordance for
  // when the list has scrolled the bottom bar's own count out of easy reach, not
  // a permanent second summary, so it must stay hidden until the user has
  // actually scrolled down (see `topSentinelRef` + the IntersectionObserver below).
  const [hasScrolled, setHasScrolled] = useState(false);

  const selectedServiceIds = new Set(formData.services.map((s) => s.id));
  const hasSelectedServices = formData.services.length > 0;

  // Only show staff picker after at least one service is selected
  // Auto-skip staff if only 1 staff member
  const singleStaff = staffList.length === 1;

  // Add-on ids owned by a given base service (used by every mutation point
  // below so they can't drift out of sync with each other).
  const getOwnedAddonIds = (serviceId: string) =>
    serviceAddons
      .filter((a) => a.service_id === serviceId)
      .map((a) => a.addon_service_id);

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
      // Deselecting a service also clears its selected add-ons (otherwise an
      // add-on stays in the cart/total with no UI to see or remove it).
      const removeIds = new Set([service.id, ...getOwnedAddonIds(service.id)]);
      const next = formData.services.filter((s) => !removeIds.has(s.id));
      updateFormData({
        services: next,
        totalPrice: next.reduce((sum, s) => sum + s.price, 0),
        totalDuration: next.reduce((sum, s) => sum + s.duration_minutes, 0),
      });
    } else {
      const next = [...formData.services, selected];
      updateFormData({
        services: next,
        totalPrice: next.reduce((sum, s) => sum + s.price, 0),
        totalDuration: next.reduce((sum, s) => sum + s.duration_minutes, 0),
      });
      // Auto-select if only 1 staff
      if (singleStaff) {
        updateFormData({ selectedStaffId: staffList[0].id });
      }
    }
  };

  // idea 1 (motion 22): a dot flies from the tapped + into the cart bar.
  const flyToCart = (e: React.MouseEvent) => {
    const target = document.querySelector('[data-cart-anchor]');
    if (!target) return;
    const t = target.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'cart-fly-dot';
    dot.style.left = `${e.clientX - 6}px`;
    dot.style.top = `${e.clientY - 6}px`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transform = `translate(${t.left + 40 - e.clientX}px, ${t.top + t.height / 2 - e.clientY}px) scale(0.35)`;
      dot.style.opacity = '0';
    });
    window.setTimeout(() => dot.remove(), 560);
  };

  const handleContinue = async () => {
    if (formData.services.length === 0) {
      setError(t('selectAtLeastOne'));
      return;
    }
    setIsChecking(true);
    goToStep(nextStep);
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
  // from scratch so totals can't drift. Fires LIVE on every option pick /
  // add-on toggle inside the sheet (no separate confirm tap); does NOT close
  // the sheet, closing is a separate action (the sheet's Fertig/Done button).
  const commitSheetSelection = (
    serviceId: string,
    addonIds: string[],
    optionId?: string | null
  ) => {
    const svc = serviceById.get(serviceId);
    if (!svc) return;
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
    const clear = new Set([serviceId, ...getOwnedAddonIds(serviceId)]);
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
  };

  const handleRemoveService = (serviceId: string) => {
    const clear = new Set([serviceId, ...getOwnedAddonIds(serviceId)]);
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

  // B17: a 1px sentinel pinned at the very top of the content. While it is
  // still intersecting the viewport, the user hasn't scrolled meaningfully
  // yet, so the floating "N chosen" pill stays hidden; once it scrolls out
  // (past the `rootMargin` threshold), the pill is allowed to mount.
  const topSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHasScrolled(!entry.isIntersecting),
      { rootMargin: '-120px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Shared ENTER RECIPE (MOTION.md, owner-approved 2026-07-09), reduced-motion
  // safe. Fixes B1 (the "+X add-ons" detail popping in with no animation and
  // no height transition, "it goes down" jumping) and B2 (the floating
  // selected-count pill "just pops up" with no entrance). Also drives the
  // list stagger (B1/B3 ask) and the row press feedback (butterPress).
  const enterMotion = useEnterMotion();
  const { container: rowsContainer, item: rowItem } = useStaggerVariants();

  return (
    <div className="pb-32">
      {/* B17: 1px, non-visual scroll sentinel, see the effect above. */}
      <div ref={topSentinelRef} aria-hidden className="h-px w-full" />
      {/* Sticky category tabs */}
      {categories.length > 1 && (
        <div
          ref={tabsRef}
          className="sticky top-0 z-30 -mx-4 bg-s-bg-sunken px-4 py-2.5"
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const isActive = cat === activeCat;
              return (
                <button
                  key={cat}
                  onClick={() => goToCat(cat)}
                  // Matches the SalonServices TabPill: active = soft gray fill (s-bg-sunken) + ink,
                  // NOT pure black. Instant (no layoutId spring — that slide was laggy).
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
              className="shrink-0 grid h-9 w-9 place-items-center rounded-full border border-s-border text-s-ink transition-colors hover:border-s-ink/25"
            >
              <List size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Services grouped by category — Atelier grouped card (owner 2026-06-12:
          'the atelier mockups lit nailed it'): rows + hairline dividers in ONE
          rounded-24 card per category, whisper shadow; selection = sunken wash +
          ToggleCircle (grouped-list rule, no border jumps). 32px chapter rhythm. */}
      <div className="space-y-8 pt-4">
        {categories.map((category) => {
          const categoryServices = visibleServices.filter(
            (s) => groupKey(s) === category
          );
          return (
            <section key={category} id={catId(category)} className="scroll-mt-[120px]">
              <h3 className="font-heading text-[20px] font-bold capitalize tracking-[-0.01em] text-s-ink mb-3">
                {category}
              </h3>
              {/* mockup-ok: shared ENTER RECIPE stagger container (MOTION.md, owner-approved 2026-07-09) */}
              <motion.div // mockup-ok: shared ENTER RECIPE module, not new design exploration
                variants={rowsContainer} // mockup-ok: shared ENTER RECIPE module
                initial="hidden" // mockup-ok: shared ENTER RECIPE module
                animate="visible" // mockup-ok: shared ENTER RECIPE module
                className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper"
              >
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
                    // B16 (owner 2026-07-09, "the check goes down"): the earlier B1 fix put
                    // `layout` on this row so the "+X add-ons" line's appearance would FLIP-
                    // animate the row's height smoothly. But `layout` projects a translate+
                    // scale transform across the WHOLE row (it also shared this node with the
                    // ENTER_RECIPE mount `scale` from `rowItem`, a documented Framer conflict)
                    // whenever the box changed, so the ToggleCircle check, sitting just above
                    // where the new line appears, visibly rode along and slid downward as the
                    // row "settled" into its taller measured height. Fix: the add-on line now
                    // lives in a RESERVED slot below (see hasAddons block) that never changes
                    // the row's height, so there is nothing left for `layout` to smooth, and
                    // `layout` is removed. The check's own transition is fixed separately in
                    // ToggleCircle.tsx (shared ENTER RECIPE, opacity+scale+blur, no rotate).
                    <motion.div key={service.id} variants={rowItem} className="border-t border-s-border first:border-t-0"> {/* mockup-ok: shared ENTER RECIPE stagger item (MOTION.md, owner-approved 2026-07-09) */}
                      <button
                      onClick={(e) => {
                        if (hasAddons || hasOptions) {
                          // No required option to pick: the service is valid
                          // as-is, so it commits to the cart the moment the
                          // sheet opens (add-ons then toggle live inside it).
                          if (!hasOptions && !inCart) {
                            flyToCart(e);
                            commitSheetSelection(service.id, []);
                          }
                          setSheetServiceId(service.id);
                        } else {
                          if (!inCart) flyToCart(e);
                          handleSelectService(service);
                        }
                      }}
                      // mockup-ok: border-t/first:border-t-0 moved to the new wrapping motion.div above; butterPress('row') is the shared press-feedback helper, not new design
                      className={`w-full px-5 py-[18px] text-left ${butterPress('row')} ${
                        inCart ? 'bg-s-bg-sunken/60' : 'hover:bg-s-bg-sunken/40'
                      }`}
                    >
                      <h4 className="font-body text-[16px] font-semibold text-s-ink leading-snug">
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
                      {/* B16: reserved slot, always in the DOM (not exit-animated), so the
                          "+X add-ons" text never changes the row's height, no reflow for
                          `layout` to chase (see the B16 comment on the row's wrapper above).
                          Only rows that HAVE add-ons ever render this slot; a plain CSS
                          opacity crossfade is enough for an always-present element, the ENTER
                          RECIPE governs true mount/entrance, this one never unmounts. */}
                      {hasAddons && (
                        <p
                          aria-hidden={!(inCart && selAddonCount > 0)}
                          className={`mt-2 text-[12px] font-medium text-s-ink transition-opacity duration-200 ease-glide ${
                            inCart && selAddonCount > 0 ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          +{selAddonCount} {t('addOns')}
                        </p>
                      )}
                    </button>
                    </motion.div>
                  );
                })}
              </motion.div> {/* mockup-ok */}
            </section>
          );
        })}
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-s-error text-center mt-4">{error}</p>
      )}

      {/* Floating "X selected" pill (Fresha pattern, ink, matches selection language).
          B2: used to pop in with no animation; now enters once with the shared ENTER
          RECIPE. `hasSelectedServices` is a boolean (services.length > 0), so it only
          mounts/unmounts crossing the 0 to 1 boundary, never re-announcing itself while
          more services are added (same quiet discipline as StaffStep's CheckBadge). */}
      <AnimatePresence> {/* mockup-ok */}
        {hasSelectedServices && hasScrolled && (
          <motion.div // mockup-ok
            key="selected-pill"
            initial={enterMotion.initial} // mockup-ok
            animate={enterMotion.animate} // mockup-ok
            exit={enterMotion.initial} // mockup-ok
            transition={enterMotion.transition} // mockup-ok
            className="fixed left-0 right-0 bottom-[80px] z-40 flex justify-center px-4 pointer-events-none"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              // Ink-filled (modern), no outline. Micro: lifts the arrow on hover, presses on tap.
              className="group pointer-events-auto flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-full bg-s-ink text-white text-[13px] font-heading font-semibold shadow-[0_8px_24px_-8px_rgba(10,10,10,0.45)] transition-transform duration-200 ease-glide active:scale-[0.97]"
            >
              <span key={formData.services.length} className="animate-count-bump inline-block">{formData.services.length}</span> {t('selected')}
              <ArrowUp size={15} strokeWidth={2.4} className="transition-transform duration-200 ease-glide group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence> {/* mockup-ok */}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-border bg-white z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div data-cart-anchor>
            <p className="font-body font-extrabold text-xl text-s-ink tabular-nums leading-none overflow-hidden">
              {/* idea 3 (motion 22): price rolls on change — key re-mounts the value */}
              <span key={formData.totalPrice} className="animate-value-roll">{formatCurrency(formData.totalPrice, locale)}</span>
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
              initial={{ opacity: 0 }} // motion-ok: backdrop scrim fade, opacity-only is correct for a full-screen dim overlay
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
          onChange={commitSheetSelection}
          onRemove={handleRemoveService}
          onClose={() => setSheetServiceId(null)}
        />
      )}

    </div>
  );
}
