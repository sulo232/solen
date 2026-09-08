'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ArrowUp, ArrowRight, ShoppingCart } from 'lucide-react'; // ChevronDown moved with the row into primitives/ServiceDisclosureRow.tsx (2026-08-09)
import { motion, AnimatePresence } from 'motion/react';
import { useBooking } from '@/lib/booking-context';
import { useEnterMotion, useStaggerVariants, butterPress, PriceFrom, ENTER_DURATION, ServiceDisclosureRow } from '@/app/[locale]/_components/primitives'; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
import ToggleCircle from './ToggleCircle';
import CountUpNumber from './CountUpNumber';
import ServiceDetailSheet from './ServiceDetailSheet';
import Spinner from '@/components-legacy/ui/Spinner';
import type { SelectedService } from '@/lib/booking-state';
import type { StaffMember } from '@/lib/types';
import { localizedField } from '@/lib/i18n/localized-field';

interface Service {
  id: string;
  name_de: string;
  name_en: string;
  name_fr?: string | null;
  name_it?: string | null;
  category: string;
  subcategory: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  description_de: string | null;
  description_en: string | null;
  description_fr?: string | null;
  description_it?: string | null;
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
  name_fr?: string | null;
  name_it?: string | null;
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
  // Row body tap expands its description in place (never a select). The open/closed state moved
  // into <ServiceDisclosureRow> on 2026-08-09 when the row became shared with the salon PDP; it was
  // read nowhere else, and per-row state is what the Set of ids already modelled (rows open and
  // close independently, several can be open at once).
  // B17 (owner 2026-07-09, "why is there still this pill even though I'm not
  // scrolled down") -> owner 2026-07-19 follow-up ("still always there"): a
  // fixed 120px scroll threshold showed the pill even on a short list where the
  // selection stayed on screen the whole time. It's a scroll-back-to-top
  // affordance for when the selection has scrolled OUT OF VIEW, not a generic
  // "you've scrolled" indicator, so the real signal is visibility of the
  // SELECTED rows themselves (see the IntersectionObserver below), not a
  // fixed distance from the top of the page.
  const [selectionOffscreen, setSelectionOffscreen] = useState(false);

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

  const serviceName = (s: Service) => localizedField(s as unknown as Record<string, unknown>, 'name', locale);
  const serviceDesc = (s: Service) =>
    localizedField(s as unknown as Record<string, unknown>, 'description', locale);
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
      name_fr: service.name_fr ?? null,
      name_it: service.name_it ?? null,
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
    name_fr: s.name_fr ?? null,
    name_it: s.name_it ?? null,
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
          name_fr: svc.name_fr ?? null,
          name_it: svc.name_it ?? null,
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

  // Owner change (2026-07-19): group by the salon's own CATEGORY (subcategory,
  // falling back to the top-level category), replacing the fixed duration-tier
  // grouping. Dynamic from the real service list, so a salon's own taxonomy
  // drives the sections, never a hardcoded Express/Klassisch/Signature split.
  const groupKey = (s: Service) => s.subcategory ?? s.category ?? 'andere';
  const categories = Array.from(new Set(visibleServices.map(groupKey))).sort();
  // Deterministic DOM id per category section (CSS-safe token) so a pill tap
  // can scrollIntoView its matching <section>.
  const catId = (c: string) => 'cat-' + c.replace(/[^a-z0-9]/gi, '-');
  const [activeCat, setActiveCat] = useState(categories[0] ?? '');
  // Pills SCROLL to a section, they never filter the list (every category
  // renders at once); the tap also sets the active pill immediately so the
  // highlight doesn't lag the smooth-scroll animation.
  const goToCat = (cat: string) => {
    setActiveCat(cat);
    document.getElementById(catId(cat))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll-spy: the pill row tracks scroll position, mirroring the standard
  // "last section whose top has crossed the ~130px sticky-bar threshold wins"
  // pattern, so the pill highlight follows the section actually in view.
  useEffect(() => {
    if (categories.length === 0) return;
    const handleScroll = () => {
      let current = categories[0];
      for (const cat of categories) {
        const el = document.getElementById(catId(cat));
        if (el && el.getBoundingClientRect().top <= 130) {
          current = cat;
        }
      }
      setActiveCat(current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join('|')]);

  // B17 follow-up (owner 2026-07-19): each service row registers its DOM node
  // here (keyed by service id, see `registerRow` + the `data-service-id` /
  // `data-selected` attributes on the row below). A single IntersectionObserver
  // only ever watches the currently-SELECTED rows (observe/unobserve follows
  // `formData.services` in the effect below); `intersectingIdsRef` accumulates
  // which of those are on screen right now, since IntersectionObserver only
  // reports entries whose status just changed, not a full snapshot per callback.
  const rowElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerRow = (id: string) => (el: HTMLDivElement | null) => {
    if (el) rowElsRef.current.set(id, el);
    else rowElsRef.current.delete(id);
  };
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedIdsRef = useRef<Set<string>>(new Set());
  const intersectingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.serviceId;
        if (!id) continue;
        if (entry.isIntersecting) intersectingIdsRef.current.add(id);
        else intersectingIdsRef.current.delete(id);
      }
      const stillObserved = observedIdsRef.current;
      setSelectionOffscreen(
        stillObserved.size > 0 &&
          ![...stillObserved].some((id) => intersectingIdsRef.current.has(id))
      );
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, []);

  // Keeps the observed set in sync with the current selection: start watching
  // a row the moment it's added to the cart, stop the moment it's removed.
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;
    const nextIds = new Set(formData.services.map((s) => s.id));
    for (const id of observedIdsRef.current) {
      if (!nextIds.has(id)) {
        const el = rowElsRef.current.get(id);
        if (el) observer.unobserve(el);
        intersectingIdsRef.current.delete(id);
      }
    }
    for (const id of nextIds) {
      if (!observedIdsRef.current.has(id)) {
        const el = rowElsRef.current.get(id);
        if (el) observer.observe(el);
        // Assume visible until the observer's own callback reports otherwise
        // (fires within a frame), so selecting a row never flashes the pill.
        intersectingIdsRef.current.add(id);
      }
    }
    observedIdsRef.current = nextIds;
    setSelectionOffscreen(
      nextIds.size > 0 && ![...nextIds].some((id) => intersectingIdsRef.current.has(id))
    );
  }, [formData.services]);

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
        ref={registerRow(service.id)} // owner 2026-07-19: B17 follow-up, selected-row visibility tracking
        data-service-id={service.id} // owner 2026-07-19: B17 follow-up, selected-row visibility tracking
        data-selected={inCart || undefined} // owner 2026-07-19: B17 follow-up, selected-row visibility tracking
        variants={rowItem} // mockup-ok
        className={`flex items-center gap-2.5 border-t border-s-border px-5 py-[18px] first:border-t-0 ${
          inCart ? 'bg-s-bg-sunken/60' : ''
        }`}
      >
        {/* mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved
            2026-07-18). This row's chevron + description accordion moved into the shared
            <ServiceDisclosureRow> primitive on 2026-08-09 so the salon PDP could render the SAME
            row (owner decision 10) instead of a second copy. Nothing about the treatment changed:
            same 18px chevron, same 0.18s + GLIDE_EASE accordion, same type. */}
        <ServiceDisclosureRow
          title={
            <h4 className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">
              {serviceName(service)}
            </h4>
          }
          meta={
            <p className="mt-1 text-[14px] text-s-ink-2 tabular-nums">
              {formatDuration(service.duration_minutes)}
              {gLabel && <> {gLabel}</>}
            </p>
          }
          description={desc}
          price={
            <div className="mt-3 text-[15px] font-bold text-s-ink">
              <PriceFrom amount={rowPrice} label={t('from')} />
            </div>
          }
        />
        <button
          type="button"
          onClick={(e) => {
            if (hasAddons || hasOptions) {
              // No required option to pick: the service is valid as-is, so it
              // commits to the cart the moment the sheet opens (add-ons then
              // toggle live inside it).
              if (!hasOptions && !inCart) {
                commitSheetSelection(service.id, []);
              }
              setSheetServiceId(service.id);
            } else {
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
      {/* Category pills, owner change 2026-07-19: SCROLL to a section, never a filter
          (every category renders below at once). Selected pill is BLACK/ink, an
          explicit owner override of the locked gray-selected contract for this
          booking scroll-spy surface only. */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-30 -mx-4 bg-white/90 backdrop-blur border-b border-s-border px-4 py-2.5"> {/* mockup-ok: owner 2026-07-18 live fix + approved liftup-booking-services-tiered mockup */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={cat === activeCat}
                onClick={() => goToCat(cat)} // selected-ok: owner explicitly chose a BLACK/ink selected category pill (2026-07-19), overrides the locked gray-selected + no-black-selected gate for these booking scroll-spy pills only
                className={`h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold capitalize transition-colors ${
                  cat === activeCat
                    // mockup-ok: DIRECTION D, owner-picked 2026-08-15 off the four-way comparison
                    // at /dev/pill-ceramic ("let's use d, so, yeah, replace them"). The pure ink
                    // this used to carry is the "just black looks kinda weird" he described.
                    // Same token the shared TabPill now uses, so the salon page and this step
                    // finally answer "selected" the same way, which was the inconsistency he
                    // named. measure-ok: nothing here is derived from a reference IMAGE, so there
                    // is no pixel to sample. The value comes from a mockup he looked at and chose,
                    // which is a stronger provenance than a measurement, and it is already a token
                    // in tailwind.config.js rather than a literal.
                    ? 'bg-s-ink-soft text-white'
                    : 'bg-white border border-s-border text-s-ink-2 hover:text-s-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services grouped by the salon's own CATEGORY (owner change 2026-07-19,
          replaces the DURATION-tier grouping): rows + hairline dividers in ONE
          rounded-24 card per category, whisper shadow; selection = sunken wash +
          ToggleCircle. 32px chapter rhythm. */}
      <div className="space-y-8 pt-4">
        {categories.map((cat) => (
          <section key={cat} id={catId(cat)} className="scroll-mt-[120px]">
            <h3 className="font-heading text-[16px] font-semibold capitalize tracking-[-0.01em] text-s-ink mb-3">{cat}</h3>
            {/* mockup-ok: shared ENTER RECIPE stagger container (MOTION.md, owner-approved 2026-07-09) */}
            <motion.div // mockup-ok: shared ENTER RECIPE module, not new design exploration
              variants={rowsContainer} // mockup-ok: shared ENTER RECIPE module
              initial="hidden" // mockup-ok: shared ENTER RECIPE module
              animate="visible" // mockup-ok: shared ENTER RECIPE module
              className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper"
            >
              {visibleServices.filter((s) => groupKey(s) === cat).map(renderServiceRow)}
            </motion.div> {/* mockup-ok: shared ENTER RECIPE module, not new design exploration */}
          </section>
        ))}
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-sm text-s-error text-center mt-4">{error}</p>
      )}

      {/* Floating "X selected" pill (Fresha pattern, ink, matches selection language).
          B2: used to pop in with no animation; now enters once with the shared ENTER
          RECIPE. B17 follow-up (owner 2026-07-19): the pill is a scroll-back-to-top
          affordance for when the selection has scrolled out of view, so it only mounts
          when there's a selection AND none of the currently-selected rows are visible
          on screen (`selectionOffscreen`, see the IntersectionObserver above), never on
          a short list where the selected row(s) stay on screen. mockup-ok: owner
          2026-07-19, matches liftup-booking-services-tiered mockup (unchanged pill look,
          only its mount condition changed). */}
      <AnimatePresence> {/* mockup-ok */}
        {hasSelectedServices && selectionOffscreen && (
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
              // Calm DS-compliant pill (white + hairline + elevation-2), no ink fill / grey-haze shadow.
              // mockup-ok: owner 2026-07-18 live fix + approved liftup-booking-services-tiered mockup
              className="group pointer-events-auto flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-full bg-white text-s-ink border border-s-border shadow-elevation-2 text-[13px] font-heading font-semibold transition-transform duration-200 ease-glide active:scale-[0.97]"
            >
              <span key={formData.services.length} className="animate-count-bump inline-block">{formData.services.length}</span> {t('selected')}
              <ArrowUp size={15} strokeWidth={1.9} className="transition-transform duration-200 ease-glide group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence> {/* mockup-ok */}

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-border bg-white z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div data-cart-anchor>
            <p className="font-body font-bold text-xl text-s-ink tabular-nums leading-none overflow-hidden">
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
              {t('items', { count: formData.services.length })}&emsp;<CountUpNumber value={formData.totalDuration} />{' '}
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
            {/* Continue arrow: a chevron head by default; the shaft draws in to a full arrow on hover/press. mockup-ok: owner-approved liftup-booking-services-tiered mockup (2026-07-18), applying it. */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="butt" strokeLinejoin="miter" aria-hidden>
              <path d="M4 12h13" className="[stroke-dasharray:14] [stroke-dashoffset:14] transition-[stroke-dashoffset] duration-300 ease-glide group-hover:[stroke-dashoffset:0] group-active:[stroke-dashoffset:0]" /> {/* mockup-ok: liftup-booking-services-tiered */}
              <path d="M13 6l6 6-6 6" className="transition-transform duration-300 ease-glide group-hover:translate-x-0.5 group-active:translate-x-0.5" /> {/* mockup-ok: liftup-booking-services-tiered */}
            </svg>
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
