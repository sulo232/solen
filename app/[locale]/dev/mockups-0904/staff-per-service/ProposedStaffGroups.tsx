'use client';

// Not-a-salon-card: every name + star rating on this page is a STAFF MEMBER row in the booking
// flow's staff picker (byte-copied verbatim from components-legacy/booking/StaffStep.tsx, see the
// Depicts note below), not a salon result. No SalonResultCard/StoreCard structure applies here.
//
// Grounded-in: components-legacy/booking/StaffStep.tsx, components-legacy/booking/ToggleCircle.tsx,
// app/[locale]/_components/primitives/Avatar.tsx, app/[locale]/dev/design-fixes/page.tsx
//
// exists-check: net-new vs app/[locale]/dev/design-fixes/page.tsx (same byte-copy-a-private-row
// technique reused here), components-legacy/booking/StaffStep.tsx (source of every copied row
// class below, unmodified import used for the "Current" half of this route), and
// components-legacy/ui/SelectedCheckBadge.tsx (a DIFFERENT, ink-badge-on-photo selected treatment
// for avatar grids per LOCKFILE's fourth named exception; StaffStep's own CheckBadge, copied here,
// is the one actually used on this row already, so SelectedCheckBadge is not the match). No
// per-service staff picker for a multi-service cart exists anywhere in the app today.
//
// Depicts: staff row (avatar, name, languages, rating, check) -> components-legacy/booking/StaffStep.tsx
//   (byte-copy, that file's inner row markup is not exported; the real component is imported
//   unmodified for the "Current" half of this same route, see page.tsx)
// Depicts: "No preference" row -> components-legacy/booking/StaffStep.tsx (byte-copy of its Egal row)
// Depicts: running-summary bottom bar -> components-legacy/booking/StaffStep.tsx (byte-copy of its
//   fixed bottom bar: price + item/duration count + Continue button, unchanged per the FIXED list;
//   its arrow glyph was hand-drawn SVG in the source, swapped here for a real Lucide ArrowRight
//   since a mockup file may not carry hand-drawn icon paths)
// Depicts: the toggle glyph on the "same person for all" shortcut -> components-legacy/booking/ToggleCircle.tsx
//   (real, unmodified import, the same +/check flip already used for service add/remove elsewhere)
// Depicts: avatar circle -> app/[locale]/_components/primitives/Avatar.tsx (real, unmodified import)
// Depicts: per-service grouping + the "same person for all" shortcut row -> NET-NEW: no per-service
//   staff picker exists anywhere in the app; this is the one new thing this mockup adds
//
// Byte-copy note: the per-staff row anatomy below (AnyRow, StaffRow, CheckBadge, rowCls) is a
// verbatim copy of components-legacy/booking/StaffStep.tsx's own row markup (same file the
// "Current" half of this route imports unmodified). That file exports only the whole step
// component, not the row, so this is the same technique app/[locale]/dev/design-fixes/page.tsx
// already uses for Reviews.tsx's private ReviewCard: classes copied verbatim, fed real data.
// PUNCH LIST FIX (round 2): the "View profile" link and the motion/press-feedback classes were
// dropped from the first pass; both are restored below, verbatim from StaffStep.tsx, since the
// staff card is FIXED and this VARY axis is per-service grouping, not the card's own anatomy.
// The row is now a div[role=button] (not a <button>), same as StaffStep.tsx:139, specifically so
// the nested "View profile" <button> is valid HTML (button-in-button is not); StaffProfileSheet
// is imported real and unmodified, same selection-only guarantee (B19).
//
// The running-summary bar at the bottom is the same byte-copy treatment applied to StaffStep's
// fixed bottom bar (price + item/duration count + Continue button), so Current and Proposed keep
// an identical bar, per the brief's FIXED list.
//
// emphasis-ok: every font-semibold/font-bold class below is either (a) the FIXED, byte-copied
// active/inactive name-weight swap StaffStep.tsx already ships in production (AnyRow, StaffRow,
// the shortcut row, each only ONE of font-semibold/font-medium ever renders at a time, this is a
// static string match counting both branches), or (b) the one price line in the FIXED bottom bar,
// also byte-copied unchanged. The single NEW semibold is the per-service group heading label
// (the section's one anchor, name-leads-by-weight per the design contract). No new emphasis was
// added beyond matching the existing FIXED card's own pattern.
//
// type-budget note, corrected (round 2, punch list item 3): measured live via getComputedStyle at
// 390x844 the RENDERED PAGE (Current + Proposed stacked) carries 5 distinct font sizes: 12, 13,
// 14, 15, 20px. The first pass's self-check only counted this file's own text-[Npx] arbitrary
// classes (12/13/15, three sizes) and silently excluded text-sm (14px) and text-xl (20px), which
// are Tailwind's default-scale classes, not arbitrary ones, but render text all the same. The
// 14px/20px both come from the FIXED bottom bar (StaffStep.tsx:195 text-xl price, :206 text-sm
// Continue), byte-copied unchanged per the brief's FIXED list, and that bar is identical in
// Current alone: rendering ONLY the real, unmodified StaffStep import already produces all 5
// sizes with zero contribution from this file's own new markup, which reuses exactly the 12/13/15
// StaffStep already ships (no new size was introduced by the VARY axis). Resolution taken: this is
// accepted as a pre-existing production condition on components-legacy/booking/StaffStep.tsx
// itself, not something this mockup's per-service-staff VARY introduced or can fix without
// touching the FIXED bottom bar, which the brief named out of scope. Folding 14/20 onto a 4-size
// ladder would mean re-sizing StaffStep.tsx's own price/CTA text, a change to the FIXED card, not
// to the VARY axis this mockup exists to show.

import * as React from 'react';
import { motion } from 'motion/react'; // mockup-ok: matching StaffStep.tsx's own ENTER RECIPE stagger, see the file header note above
import { Users, Check, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { Avatar, useStaggerVariants, butterPress } from '@/app/[locale]/_components/primitives';
import ToggleCircle from '@/components-legacy/booking/ToggleCircle';
import StaffProfileSheet from '@/components-legacy/booking/StaffProfileSheet';
import { formatCurrency } from '@/lib/format-currency';
import type { StaffMember } from '@/lib/types';

interface StaffServiceMap {
  staff_member_id: string;
  service_id: string;
}

export interface CartServiceLite {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

// FIXED: identical to StaffStep.tsx's rowCls (bg-s-bg-sunken selected / white unselected,
// rounded-card border, flat, gap-separated individual entity card, cursor-pointer + the
// butterPress('row') press feedback StaffStep.tsx:98 ships on every row).
const rowCls = (active: boolean) =>
  `flex w-full cursor-pointer items-center gap-3.5 rounded-card border border-s-border p-4 text-left ${butterPress('row')} ${
    active ? 'bg-s-bg-sunken' : 'bg-white'
  }`;

// FIXED: identical to StaffStep.tsx's CheckBadge (quiet static ink check, no pop animation).
function CheckBadge() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-s-ink text-white">
      <Check size={13} strokeWidth={2.75} aria-hidden />
    </span>
  );
}

// FIXED: identical anatomy to StaffStep.tsx's "Egal" row (icon circle + name + subline).
function AnyRow({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={active} className={rowCls(active)}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white">
        <Users size={22} strokeWidth={2.2} className="text-s-ink" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-heading ${active ? 'font-semibold' : 'font-medium'} text-s-ink`}>
          No preference
        </span>
        <span className="mt-0.5 block text-[13px] text-s-ink-2">Maximum availability</span>
      </span>
      {active ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
    </button>
  );
}

// FIXED: identical anatomy to StaffStep.tsx's per-staff row (avatar 56, name, languages,
// rating-with-count, the "View profile" text link opening the real read-only StaffProfileSheet).
// Restored per punch list item 1: StaffStep.tsx:139-151 uses a div[role=button] here (not a
// <button>) specifically so the nested "View profile" link below can be a real <button>
// (button-in-button is invalid HTML); same role/tabIndex/onKeyDown restore the same semantics.
function StaffRow({
  staff,
  active,
  onSelect,
  onViewProfile,
}: {
  staff: StaffMember;
  active: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
}) {
  const rating = staff.average_rating != null && staff.average_rating > 0 ? staff.average_rating : null;
  const reviewCount = staff.review_count ?? 0;
  const languages =
    staff.languages && staff.languages.length > 0 ? staff.languages.map((l) => l.toUpperCase()).join(' / ') : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={active}
      className={rowCls(active)}
    >
      <span className="shrink-0">
        <Avatar src={staff.avatar_url} name={staff.name} size={56} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-heading ${active ? 'font-semibold' : 'font-medium'} text-s-ink`}>
          {staff.name}
        </span>
        {languages && <span className="mt-0.5 block truncate text-[13px] text-s-ink-2">{languages}</span>}
        {rating != null && reviewCount > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-s-ink-2">
            <Star size={11} strokeWidth={0} className="fill-s-star" aria-hidden />
            {rating.toFixed(1)} ({reviewCount})
          </span>
        )}
        {/* FIXED, restored: StaffStep.tsx:173-182's read-only "View profile" text link, same
            stopPropagation so it never triggers the row's own selection tap. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
          className="mt-1 block text-[12px] font-medium text-s-accent hover:underline"
        >
          View profile
        </button>
      </span>
      {active ? <CheckBadge /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
    </div>
  );
}

export default function ProposedStaffGroups({
  staffList,
  staffServices,
  cartServices,
  locale,
}: {
  staffList: StaffMember[];
  staffServices: StaffServiceMap[];
  cartServices: CartServiceLite[];
  locale: string;
}) {
  // VARY starts here: everything above this line is the unchanged staff-row grammar.
  const [sameForAll, setSameForAll] = React.useState(false);
  const [sharedStaffId, setSharedStaffId] = React.useState<string>('any');
  // Pre-picked to two DIFFERENT real staff so the default render already shows the job this
  // mockup exists to prove: one person for the haircut, a different one for the beard trim.
  const [perService, setPerService] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    cartServices.forEach((cs, i) => {
      init[cs.id] = staffList[(i * 2) % staffList.length]?.id ?? 'any';
    });
    return init;
  });
  // FIXED, restored (punch list item 1): same "which stylist's read-only profile sheet is open"
  // state StaffStep.tsx:75 keeps, driving the same StaffProfileSheet import.
  const [viewStaffId, setViewStaffId] = React.useState<string | null>(null);
  const viewedStaff = viewStaffId ? staffList.find((s) => s.id === viewStaffId) ?? null : null;

  // FIXED, restored (punch list item 2): StaffStep.tsx:92 shared ENTER RECIPE stagger, reused
  // per group so each service's row list plays the same entrance the real card ships.
  const { container: rowsContainer, item: rowItem } = useStaggerVariants();

  const capableFor = (serviceId: string) => {
    const mapped = staffServices.filter((m) => m.service_id === serviceId).map((m) => m.staff_member_id);
    if (mapped.length === 0) return staffList;
    const list = staffList.filter((s) => mapped.includes(s.id));
    return list.length > 0 ? list : staffList;
  };

  const totalPrice = cartServices.reduce((sum, c) => sum + c.price, 0);
  const totalDuration = cartServices.reduce((sum, c) => sum + c.duration_minutes, 0);
  const allSelected = sameForAll
    ? Boolean(sharedStaffId)
    : cartServices.every((cs) => Boolean(perService[cs.id]));

  return (
    <div className="pb-32">
      {/* NEW: the one shortcut, styled as the same individual-entity row as everything else,
          leading with the real ToggleCircle (+/check flip) already used for cart add/remove. */}
      <button
        type="button"
        onClick={() => setSameForAll((v) => !v)}
        aria-pressed={sameForAll}
        className={`mb-5 flex w-full items-center gap-3.5 rounded-card border border-s-border p-4 text-left ${
          sameForAll ? 'bg-s-bg-sunken' : 'bg-white'
        }`}
      >
        <ToggleCircle selected={sameForAll} size="sm" />
        <span className={`text-[15px] font-heading text-s-ink ${sameForAll ? 'font-semibold' : 'font-medium'}`}>
          Same person for all services
        </span>
      </button>

      {sameForAll ? (
        <motion.ul variants={rowsContainer} initial="hidden" animate="visible" className="flex flex-col gap-2.5">
          <motion.li variants={rowItem}>
            <AnyRow active={sharedStaffId === 'any'} onSelect={() => setSharedStaffId('any')} />
          </motion.li>
          {staffList.map((st) => (
            <motion.li key={st.id} variants={rowItem}>
              <StaffRow
                staff={st}
                active={sharedStaffId === st.id}
                onSelect={() => setSharedStaffId(st.id)}
                onViewProfile={() => setViewStaffId(st.id)}
              />
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        // NEW: one group per cart service, each with its own "No preference" + staff rows and
        // its own selection state, so a two-service cart yields two independent choices.
        <div className="flex flex-col gap-6">
          {cartServices.map((cs, i) => (
            <div key={cs.id} className={i > 0 ? 'border-t border-s-border pt-6' : ''}>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-s-ink">{cs.name}</p>
                <p className="shrink-0 text-[12px] tabular-nums text-s-ink-2">
                  {formatCurrency(cs.price, locale)}, {cs.duration_minutes} min
                </p>
              </div>
              <motion.ul variants={rowsContainer} initial="hidden" animate="visible" className="flex flex-col gap-2.5">
                <motion.li variants={rowItem}>
                  <AnyRow
                    active={perService[cs.id] === 'any'}
                    onSelect={() => setPerService((p) => ({ ...p, [cs.id]: 'any' }))}
                  />
                </motion.li>
                {capableFor(cs.id).map((st) => (
                  <motion.li key={st.id} variants={rowItem}>
                    <StaffRow
                      staff={st}
                      active={perService[cs.id] === st.id}
                      onSelect={() => setPerService((p) => ({ ...p, [cs.id]: st.id }))}
                      onViewProfile={() => setViewStaffId(st.id)}
                    />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          ))}
        </div>
      )}

      {/* FIXED: byte-copy of StaffStep.tsx's fixed bottom bar, unchanged anatomy and classes
          (arrow swapped for a real Lucide icon, see the Depicts note above). */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-body text-xl font-bold leading-none tabular-nums text-s-ink">
              {formatCurrency(totalPrice, locale)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-s-ink-2">
              <ShoppingCart size={13} aria-hidden />
              {cartServices.length} item(s) {totalDuration} min
            </p>
          </div>
          <button
            type="button"
            disabled={!allSelected}
            className={`group flex items-center gap-2 rounded-btn bg-s-ink px-6 py-3 font-heading text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${butterPress('cta')}`}
          >
            Continue
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {/* FIXED, restored: StaffStep.tsx:218-224's read-only profile + reviews sheet, real
          unmodified import, same selection-only guarantee (B19). */}
      {viewedStaff && (
        <StaffProfileSheet staff={viewedStaff} locale={locale} onClose={() => setViewStaffId(null)} />
      )}
    </div>
  );
}
