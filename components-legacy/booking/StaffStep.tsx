'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'motion/react'; // mockup-ok: applying owner-approved Direction B (/dev/stylist-directions) + ENTER RECIPE
import { ArrowRight, ShoppingCart, Users, Check, Star } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { Avatar, useStaggerVariants, butterPress } from '@/app/[locale]/_components/primitives';
import StaffProfileSheet from './StaffProfileSheet';
import type { StaffMember } from '@/lib/types';

interface StaffService {
  staff_member_id: string;
  service_id: string;
}

/**
 * StaffStep, Direction B "rich tap-rows" (owner-picked 2026-07-09 from the three
 * directions at /dev/stylist-directions/page.tsx). Full-width rows, avatar left,
 * name + one specialty + rating-with-count, whole row is the tap target, "Egal"
 * pinned first. Replaces the mockup-20 Fresha-bones card (2026-06-11) per the
 * owner's live-flow walkthrough, which reported four defects, all fixed here:
 *
 *   B4. Selected indicator is ONE quiet static check (no spring/pop animation),
 *       so re-rendering an already-selected row never re-announces itself.
 *   B5. Selected row = bg-s-bg-sunken + text-s-ink + semibold + the check.
 *       The old focus-ring-style border treatment is gone; the row
 *       background is never an ink/black fill.
 *   B6. `selectedStaffId` already defaults to 'any' in lib/booking-context.tsx
 *       (initialFormData), so "Egal" is pre-selected on mount with no extra
 *       code here. The separate "Auswählen" pick button (a static label that
 *       never changed) is gone too: the whole row taps, and the check IS the
 *       state, so there is no leftover label to keep in sync.
 *   B7. Selection-only: no way to pick the stylist's OTHER SERVICES from
 *       inside booking (no services tab, no "Buchen" link, mid-flow).
 *
 * B19 (owner 2026-07-09, asked twice, dropped twice by the ORIGINAL B7 fix):
 * B7 over-removed the whole profile path when the owner's actual ask was
 * narrower, viewing who the stylist is and reading their reviews is fine
 * mid-booking, picking a DIFFERENT service from their full profile is not.
 * Restored as a secondary "Profil ansehen" text link per row (`viewStaffId` +
 * the read-only `<StaffProfileSheet>`, NOT the old full `<StaffProfilePage>`,
 * which has a services/"Buchen" tab that would re-break B7). See
 * StaffProfileSheet.tsx for the selection-only guarantee.
 *
 * Owner 2026-07-24 (Fresha ref IMG_6696, "Teammitglied auswählen"): RESTORES
 * the ALL-CAPS spoken-language tag this file previously dropped (original note
 * below, kept for history) — the current owner goal is for languages, not
 * specialties, to be a staff member's subtitle everywhere in the app, and
 * Fresha's own picker shows them under each stylist's name. Flagged as a
 * direct reversal of a documented decision, not a silent one.
 * [original 2026-07-09 note]: Also drops the ALL-CAPS language tag entirely
 * (copy rule 4: a tag must add a decision-relevant fact not already on the
 * row; matches the /dev direction mockup, which dropped it for the same
 * reason). No "soonest slot" line either: there is no live per-staff
 * next-availability endpoint to source one from, and inventing a time would
 * be fabricated data (same call the mockup's own exists-check documented).
 */
export default function StaffStep({
  staffList,
  staffServices,
}: {
  staffList: StaffMember[];
  staffServices: StaffService[];
  /** Not used for a booking link (B7 stays selection-only); kept optional so
   *  existing callers passing salonSlug do not need to change. */
  salonSlug?: string;
}) {
  const t = useTranslations('booking.staffStep') as any;
  const tSel = useTranslations('booking.serviceSelection') as any;
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();
  // B19: which stylist's read-only profile sheet is open, if any.
  const [viewStaffId, setViewStaffId] = React.useState<string | null>(null);

  const selectedIds = formData.services.map((s) => s.id);

  // Only staff who can perform EVERY selected service; staff with no mappings
  // count as can-do-all (same fallback the services filter used in reverse).
  const capable = staffList.filter((st) => {
    const mapped = staffServices.filter((m) => m.staff_member_id === st.id).map((m) => m.service_id);
    if (mapped.length === 0) return true;
    return selectedIds.every((id) => mapped.includes(id));
  });
  const list = capable.length > 0 ? capable : staffList;

  const pick = (id: string) => updateFormData({ selectedStaffId: id });
  const selected = formData.selectedStaffId;

  // Shared stagger (MOTION.md ENTER RECIPE, reduced-motion safe).
  const { container: rowsContainer, item: rowItem } = useStaggerVariants();

  // mockup-ok: owner 2026-07-19 , each stylist is its OWN individual entity card
  // (rounded-card + border, flat, gap-separated), matching the SalonResultCard entity-card
  // grammar; NOT rows in a shared group card. Selected = the locked bg-s-bg-sunken gray fill.
  const rowCls = (active: boolean) =>
    `flex w-full cursor-pointer items-center gap-3.5 rounded-card border border-s-border p-4 text-left ${butterPress('row')} ${
      active ? 'bg-s-bg-sunken' : 'bg-white'
    }`;

  return (
    <div className="pb-32">
      <motion.ul variants={rowsContainer} initial="hidden" animate="visible" className="flex flex-col gap-2.5 pt-1"> {/* mockup-ok: owner 2026-07-19 , stylists are INDIVIDUAL entities, each its OWN card (SalonResultCard entity-card grammar), gap-separated; NOT a group card (group cards are for category members like services) */}
        {/* Egal (no preference), pinned first */}
        <motion.li variants={rowItem}>
          <button
            type="button"
            onClick={() => pick('any')}
            aria-pressed={selected === 'any'}
            className={rowCls(selected === 'any')}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white">
              <Users size={22} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] font-heading ${selected === 'any' ? 'font-semibold' : 'font-medium'} text-s-ink`}>
                {t('any')}
              </span>
              <span className="mt-0.5 block text-[13px] text-s-ink-2">{t('maxAvailability')}</span>
            </span>
            {selected === 'any' ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
          </button>
        </motion.li>

        {list.map((st) => {
          const active = selected === st.id;
          const rating = st.average_rating != null && st.average_rating > 0 ? st.average_rating : null;
          const reviewCount = st.review_count ?? 0;
          const languages =
            st.languages && st.languages.length > 0
              ? st.languages.map((l) => l.toUpperCase()).join(' / ')
              : null;
          return (
            <motion.li key={st.id} variants={rowItem}> {/* mockup-ok: pre-existing ENTER RECIPE stagger item */}
              {/* B19: row is now a div (not a button) so the "Profil ansehen" link
                  below can be a REAL nested <button> (button-in-button is invalid
                  HTML); role/tabIndex/onKeyDown restore the same button semantics. */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => pick(st.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pick(st.id);
                  }
                }}
                aria-pressed={active}
                className={rowCls(active)}
              >
                <span className="shrink-0">
                  <Avatar src={st.avatar_url} name={st.name} size={56} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[15px] font-heading ${active ? 'font-semibold' : 'font-medium'} text-s-ink`}>
                    {st.name}
                  </span>
                  {languages && (
                    <span className="mt-0.5 block truncate text-[13px] text-s-ink-2">{languages}</span>
                  )}
                  {rating != null && reviewCount > 0 && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-s-ink-2">
                      <Star size={11} strokeWidth={0} className="fill-s-star" aria-hidden />
                      {rating.toFixed(1)} ({reviewCount})
                    </span>
                  )}
                  {/* mockup-ok: B19 (owner asked twice), text-s-accent is the LOCKED
                      design-contract treatment for a small clickable text link, not new
                      design. Secondary, clearly-secondary; stopPropagation so it never
                      triggers the row's own selection tap. Opens a READ-ONLY sheet, see
                      StaffProfileSheet.tsx for the selection-only guarantee. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewStaffId(st.id);
                    }}
                    className="mt-1 block text-[12px] font-medium text-s-accent hover:underline"
                  >
                    {t('viewProfile')}
                  </button>
                </span>
                {active ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Bottom bar, same anatomy as the services step */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-body text-xl font-bold leading-none tabular-nums text-s-ink">
              {formatCurrency(formData.totalPrice, locale)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-s-ink-2">
              <ShoppingCart size={13} aria-hidden />
              {formData.services.length} {tSel('items')} {formData.totalDuration} {tSel('minutes')}
            </p>
          </div>
          <button
            onClick={() => goToStep('datetime')}
            disabled={!selected}
            className={`group flex items-center gap-2 rounded-btn bg-s-ink px-6 py-3 font-heading text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${butterPress('cta')}`}
          >
            {tSel('continue')}
            {/* Continue arrow: chevron by default, shaft draws into a full arrow on hover/press. mockup-ok: owner-approved liftup-booking-services-tiered arrow, unifying it across booking steps (2026-07-19) */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="butt" strokeLinejoin="miter" aria-hidden>
              <path d="M4 12h13" className="[stroke-dasharray:14] [stroke-dashoffset:14] transition-[stroke-dashoffset] duration-300 ease-glide group-hover:[stroke-dashoffset:0] group-active:[stroke-dashoffset:0]" /> {/* mockup-ok: liftup-booking-services-tiered */}
              <path d="M13 6l6 6-6 6" className="transition-transform duration-300 ease-glide group-hover:translate-x-0.5 group-active:translate-x-0.5" /> {/* mockup-ok: liftup-booking-services-tiered */}
            </svg>
          </button>
        </div>
      </div>

      {/* B19: read-only profile + reviews, see StaffProfileSheet.tsx. */}
      {viewStaffId && (() => {
        const viewedStaff = list.find((s) => s.id === viewStaffId);
        return viewedStaff ? (
          <StaffProfileSheet staff={viewedStaff} locale={locale} onClose={() => setViewStaffId(null)} />
        ) : null;
      })()}
    </div>
  );
}

/** Quiet, static selected-row check. No spring/pop, present or absent only (B4). */
function CheckBadge() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-s-ink text-white">
      <Check size={13} strokeWidth={2.75} aria-hidden />
    </span>
  );
}
