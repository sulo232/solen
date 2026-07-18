'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ArrowUp, ArrowRight, ShoppingCart, ChevronDown } from 'lucide-react'; // mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved 2026-07-18)
import { motion, AnimatePresence } from 'motion/react';
import { useBooking } from '@/lib/booking-context';
import { useEnterMotion, useStaggerVariants, butterPress, PriceFrom, ENTER_DURATION, GLIDE_EASE } from '@/app/[locale]/_components/primitives'; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
import { TabPill } from '@/app/[locale]/_components/primitives/TabPill'; // mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved 2026-07-18)
import { capitalize } from '@/app/[locale]/_components/salon/_shared'; // mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved 2026-07-18)
import ToggleCircle from './ToggleCircle';
import CountUpNumber from './CountUpNumber';
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
  // Swiss thousands grouping ("1'200") for the animated total, mirroring
  // formatCurrency's SWISS_LOCALES map so a >= CHF 1000 total keeps its
  // separator while it counts up (bare locale strings would render the
  // German "1.200" grouping instead of the Swiss apostrophe).
  const swissLocale =
    locale === 'fr' ? 'fr-CH' : locale === 'en' ? 'en-CH' : locale === 'it' ? 'it-CH' : 'de-CH';
  // Mirrors formatCurrency's own hasFraction logic (lib/format-currency.ts) so the
  // count-up's settled value matches it exactly: a fractional total keeps both
  // decimals ("65.50", never "65.5" or a rounded "66"), a whole total stays bare
  // ("85") with Swiss thousands grouping.
  const formatTotalNumber = (n: number) =>
    n.toLocaleString(
      swissLocale,
      Number.isInteger(n) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
  const { formData, updateFormData, goToStep } = useBooking();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  // Row body tap expands its description in place (never a select); a plain
  // Set of expanded row ids, mirroring the mockup's per-row `.row.open` state.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
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
  // Text-only duration, no Clock icon (SalonServices.tsx formatDurationDE parity).
  const formatDuration = (mins: number) => `${mins} ${t('minutes')}`;
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

  // Group by subcategory (Schnitt / Farbe / Styling / etc.) like the locked
  // SalonServicesSheet, falling back to the top-level category. Drives both
  // the filter pills below and the tier grouping (SalonServices.tsx pattern).
  const groupKey = (s: Service) => s.subcategory ?? s.category;
  const realCategories = Array.from(new Set(visibleServices.map(groupKey))).sort();
  // Synthetic "alle" tab so the pill row is never empty (SalonServices.tsx fix #6).
  const filterCategories = realCategories.length > 0 ? ['alle', ...realCategories] : [];
  const [activeFilter, setActiveFilter] = useState<string>('alle');
  const filtered =
    activeFilter === 'alle'
      ? visibleServices
      : visibleServices.filter((s) => groupKey(s) === activeFilter);

  // Owner mockup service-grouping (2026-06-10, mirrored from SalonServices.tsx):
  // the list groups by DURATION tier (Express / Klassisch / Signature) under
  // the subcategory filter pills. Pure derivation from duration_minutes.
  const TIERS: { key: string; label: string; range: string; match: (d: number) => boolean }[] = [
    { key: 'express', label: t('tierExpress'), range: t('tierExpressRange'), match: (d) => d > 0 && d <= 30 },
    { key: 'classic', label: t('tierClassic'), range: t('tierClassicRange'), match: (d) => d > 30 && d <= 60 },
    { key: 'signature', label: t('tierSignature'), range: t('tierSignatureRange'), match: (d) => d > 60 },
  ];
  const tiered = TIERS
    .map((tier) => ({ tier, rows: filtered.filter((s) => tier.match(s.duration_minutes ?? 0)) }))
    .filter((g) => g.rows.length > 0);
  // Services with no usable duration fall outside every tier, kept visible as an untiered card.
  const untiered = filtered.filter((s) => !TIERS.some((tier) => tier.match(s.duration_minutes ?? 0)));

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

  // One tiered-card row: the left column is a tap target that only expands
  // the description (never selects); the ToggleCircle is a separate sibling
  // button on the right and is the ONLY select control.
  const renderServiceRow = (service: Service) => {
    const inCart = selectedServiceIds.has(service.id);
    const isExpanded = expandedIds.has(service.id);
    const desc = serviceDesc(service);
    const gLabel = genderLabel(service);
    const ownOptions = serviceOptions.filter((o) => o.service_id === service.id);
    const hasOptions = ownOptions.length > 0;
    const ownAddons = serviceAddons.filter((a) => a.service_id === service.id);
    const hasAddons = ownAddons.length > 0;
    const minOptionPrice = hasOptions ? Math.min(...ownOptions.map((o) => o.price)) : null;
    const rowPrice = hasOptions ? minOptionPrice! : service.price;

    return (
      <motion.div // mockup-ok: shared ENTER RECIPE stagger item (MOTION.md, owner-approved 2026-07-09)
        key={service.id}
        variants={rowItem} // mockup-ok
        className={`flex items-center gap-2.5 border-t border-s-border px-5 py-[18px] first:border-t-0 ${
          inCart ? 'bg-s-bg-sunken/60' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => toggleExpanded(service.id)}
          aria-expanded={isExpanded}
          className={`min-w-0 flex-1 text-left ${butterPress('row')}`}
        >
          <div className="flex items-center gap-1.5">
            <h4 className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">
              {serviceName(service)}
            </h4>
            <ChevronDown
              size={18}
              aria-hidden
              className={`shrink-0 text-s-ink-3 transition-transform duration-[260ms] ease-glide ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
          <p className="mt-1 text-[14px] text-s-ink-3 tabular-nums">
            {formatDuration(service.duration_minutes)}
            {gLabel && <> {gLabel}</>}
          </p>
          {/* mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved 2026-07-18) */}
          <AnimatePresence initial={false}>
            {isExpanded && desc && (
              // motion-ok: accordion height-auto disclosure (row description collapse), not a
              // card ENTER, matches the mockup's max-height transition; reuses locked
              // ENTER_DURATION/GLIDE_EASE for timing only. mockup-ok
              <motion.div
                key="desc"
                initial={{ height: 0, opacity: 0 }} // motion-ok: accordion collapse, not a card entrance
                animate={{ height: 'auto', opacity: 1 }} // motion-ok: accordion collapse, not a card entrance
                exit={{ height: 0, opacity: 0 }} // motion-ok: accordion collapse, not a card entrance
                transition={{ duration: ENTER_DURATION, ease: GLIDE_EASE }}
                className="overflow-hidden"
              >
                <p className="pr-2 pt-2.5 text-[14px] leading-relaxed text-s-ink-2">{desc}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-3 text-[15px] font-bold text-s-ink">
            <PriceFrom amount={rowPrice} label={t('from')} />
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (hasAddons || hasOptions) {
              // No required option to pick: the service is valid as-is, so it
              // commits to the cart the moment the sheet opens (add-ons then
              // toggle live inside it).
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
          aria-label={inCart ? t('remove') : t('add')}
          className={`shrink-0 ${butterPress('icon')}`}
        >
          <ToggleCircle selected={inCart} />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="pb-32">
      {/* B17: 1px, non-visual scroll sentinel, see the effect above. */}
      <div ref={topSentinelRef} aria-hidden className="h-px w-full" />
      {/* Subcategory filter pills, owner-approved mockup public/_mockups/liftup-booking-services-tiered/index.html (2026-07-18) */}
      {filterCategories.length > 0 && (
        <div className="sticky top-0 z-30 -mx-4 bg-s-bg-sunken px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterCategories.map((cat) => (
              <TabPill key={cat} active={activeFilter === cat} onClick={() => setActiveFilter(cat)}>
                {cat === 'alle' ? 'Alle' : capitalize(cat)}
              </TabPill>
            ))}
          </div>
        </div>
      )}

      {/* Services grouped by DURATION TIER (Express / Klassisch / Signature), owner-approved
          mockup public/_mockups/liftup-booking-services-tiered/index.html (2026-07-18): rows +
          hairline dividers in ONE rounded-24 card per tier, whisper shadow; selection = sunken
          wash + ToggleCircle. 32px chapter rhythm. */}
      <div className="space-y-8 pt-4">
        {tiered.map(({ tier, rows }) => (
          <div key={tier.key}>
            <div className="mb-3 flex items-baseline gap-2">
              <h3 className="font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">{tier.label}</h3>
              <span className="text-[13px] tabular-nums text-s-ink-3">{tier.range}</span>
            </div>
            {/* mockup-ok: shared ENTER RECIPE stagger container (MOTION.md, owner-approved 2026-07-09) */}
            <motion.div // mockup-ok: shared ENTER RECIPE module, not new design exploration
              variants={rowsContainer} // mockup-ok: shared ENTER RECIPE module
              initial="hidden" // mockup-ok: shared ENTER RECIPE module
              animate="visible" // mockup-ok: shared ENTER RECIPE module
              className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper"
            >
              {rows.map(renderServiceRow)}
            </motion.div>
          </div>
        ))}
        {untiered.length > 0 && (
          <motion.div // mockup-ok: shared ENTER RECIPE module, not new design exploration
            variants={rowsContainer} // mockup-ok: shared ENTER RECIPE module
            initial="hidden" // mockup-ok: shared ENTER RECIPE module
            animate="visible" // mockup-ok: shared ENTER RECIPE module
            className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper"
          >
            {untiered.map(renderServiceRow)}
          </motion.div>
        )}
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
              {/* Owner-approved count-up (2026-07-18 comparison lab, public/_mockups/
                  liftup-services-motion): only the NUMBER animates on change, the CHF
                  label stays static. fr-CH is a suffix locale (formatCurrency renders
                  "65 CHF", not "CHF 65", verified via Intl.NumberFormat), so the
                  label's position follows locale while the label text itself never moves. */}
              {locale === 'fr' ? (
                <>
                  <CountUpNumber
                    value={formData.totalPrice}
                    format={formatTotalNumber}
                  />{' '}
                  CHF
                </>
              ) : (
                <>
                  CHF{' '}
                  <CountUpNumber
                    value={formData.totalPrice}
                    format={formatTotalNumber}
                  />
                </>
              )}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-s-ink-2 mt-1.5 tabular-nums">
              <ShoppingCart size={13} aria-hidden />
              {formData.services.length} {t('items')}&emsp;<CountUpNumber value={formData.totalDuration} />{' '}
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

      {/* Service detail sheet (Fresha options + add-ons, Variant A) */}
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
