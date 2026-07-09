'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'motion/react'; // mockup-ok: applying owner-approved Direction B (/dev/stylist-directions) + ENTER RECIPE
import { ArrowRight, ShoppingCart, Users, Check, Star } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatCurrency } from '@/lib/format-currency';
import { Avatar, useStaggerVariants, butterPress } from '@/app/[locale]/_components/primitives';
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
 *   B7. Selection-only: the "Profil ansehen" deep link into the stylist's full
 *       profile (`setViewStaffId` + the embedded <StaffProfilePage> sheet) is
 *       removed. The standalone staff profile page/route is untouched, this
 *       step no longer opens it mid-booking.
 *
 * Also drops the ALL-CAPS language tag entirely (copy rule 4: a tag must add
 * a decision-relevant fact not already on the row; matches the /dev direction
 * mockup, which dropped it for the same reason). No "soonest slot" line either:
 * there is no live per-staff next-availability endpoint to source one from, and
 * inventing a time would be fabricated data (same call the mockup's own
 * exists-check documented).
 */
export default function StaffStep({
  staffList,
  staffServices,
}: {
  staffList: StaffMember[];
  staffServices: StaffService[];
  /** No longer used inside this selection-only step (B7); kept optional so
   *  existing callers passing salonSlug do not need to change. */
  salonSlug?: string;
}) {
  const t = useTranslations('booking.staffStep') as any;
  const tSel = useTranslations('booking.serviceSelection') as any;
  const locale = useLocale();
  const { formData, updateFormData, goToStep } = useBooking();

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

  const rowCls = (active: boolean) =>
    `flex w-full items-center gap-3.5 rounded-[16px] p-4 text-left ${butterPress('row')} ${
      active ? 'bg-s-bg-sunken' : 'bg-white'
    }`;

  return (
    <div className="pb-32">
      <motion.ul variants={rowsContainer} initial="hidden" animate="visible" className="flex flex-col gap-2.5 pt-1">
        {/* Egal (no preference), pinned first */}
        <motion.li variants={rowItem}>
          <button
            type="button"
            onClick={() => pick('any')}
            aria-pressed={selected === 'any'}
            className={rowCls(selected === 'any')}
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white">
              <Users size={22} strokeWidth={2} className="text-s-ink" aria-hidden />
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
          const specialty = st.specialties?.[0] ?? null;
          return (
            <motion.li key={st.id} variants={rowItem}>
              <button
                type="button"
                onClick={() => pick(st.id)}
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
                  {specialty && (
                    <span className="mt-0.5 block truncate text-[13px] text-s-ink-2">{specialty}</span>
                  )}
                  {rating != null && reviewCount > 0 && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-s-ink-2">
                      <Star size={11} strokeWidth={0} className="fill-s-star" aria-hidden />
                      {rating.toFixed(1)} ({reviewCount})
                    </span>
                  )}
                </span>
                {active ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Bottom bar, same anatomy as the services step */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-body text-xl font-extrabold leading-none tabular-nums text-s-ink">
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
            <ArrowRight size={16} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
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
