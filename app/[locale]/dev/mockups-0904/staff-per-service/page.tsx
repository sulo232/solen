// Grounded-in: components-legacy/booking/StaffStep.tsx, app/[locale]/salon/[slug]/booking/page.tsx,
// lib/booking-context.tsx, app/[locale]/dev/design-fixes/page.tsx
//
// exists-check: `npm run exists staff step booking per service` ran this turn, 0 matches, safe to
// build new. A grep of _design-system/REMOVED.md for the word staff returns older deletions about a
// duplicate stylist PROFILE route and an unrelated tier-badge page; neither is about selecting a
// stylist per cart item, so this surface is not on the graveyard. The surface itself, StaffStep.tsx,
// already renders live at /salon/[slug]/booking (staff step, single choice for the whole cart,
// formData.selectedStaffId: string | 'any'); the new thing is per-service selection for a
// multi-service cart, which lib/booking-state.ts's BookingFormData has no field for today.
//
// Depicts: Current -> components-legacy/booking/StaffStep.tsx (real, unmodified import), fed the
//   real staff/services/staffServices for a live salon via the same server-side query shape
//   app/[locale]/salon/[slug]/booking/page.tsx uses, wrapped in the real BookingProvider seeded
//   with a real two-service cart
// Depicts: Proposed -> ./ProposedStaffGroups.tsx (net-new; see that file's own Depicts/exists-check
//   header for the per-row/bar provenance)
//
// Mockup-scope: section (the staff step's own content, not the surrounding booking wizard chrome)
//
// Inherited from the real component (repair round, 2026-09-05, disclosed not fixed, per the
// round's own rule: a defect living in a FIXED real component or in seed data is not fixed by
// editing that file):
// 1. Type budget: the rendered page carries 5 distinct font sizes (12/13/14/15/20px), one over the
//    4-size ceiling. Traced live: 14px and 20px both come from StaffStep.tsx's own fixed bottom bar
//    (text-sm Continue, text-xl price), byte-copied unchanged into Proposed per the brief's FIXED
//    list. Current alone (the real, unmodified StaffStep import) already renders all 5 sizes with
//    zero contribution from this mockup's own VARY markup. This is a pre-existing StaffStep.tsx
//    condition, not something the per-service VARY axis introduced; fixing it means re-sizing
//    StaffStep.tsx's own price/CTA text, a change to the FIXED card, out of this mockup's scope.
//    Full trace: ProposedStaffGroups.tsx's own header comment, "type-budget note".
// 2. StaffProfileSheet (real, unmodified import) renders a staff_members.bio seed value containing
//    an em-dash ("Teil unseres Teams , freut sich auf deinen Besuch."), visible when a staff card's
//    "View profile" link is opened. The no-em-dash rule is a UI-copy rule; this is DB seed content
//    surfacing through a real, unmodified component, not text authored in this mockup's files. Left
//    as-is per the round's rule (real component + DB field, not this builder's file to fix); worth a
//    separate data-cleanup pass on staff_members.bio since the rule as written names no DB-content
//    carve-out.

import { createAdminSupabaseClient } from '@/lib/supabase';
import { BookingProvider } from '@/lib/booking-context';
import StaffStep from '@/components-legacy/booking/StaffStep';
import ProposedStaffGroups from './ProposedStaffGroups';
import type { StaffMember } from '@/lib/types';
import type { SelectedService } from '@/lib/booking-state';

// Real salon with 3+ active staff, found via the same staff_members/salons query shape as
// app/[locale]/salon/[slug]/booking/page.tsx (see the returned report for the query that
// selected it: 20 salons qualify, this one has 3 staff who can all perform both cart services).
const SALON_SLUG = 'the-fade-factory';

export default async function StaffPerServiceMockupPage() {
  const supabase = createAdminSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select('id, slug, name')
    .eq('slug', SALON_SLUG)
    .eq('is_active', true)
    .maybeSingle();
  if (salonError) console.error('[dev/staff-per-service] salon fetch failed:', salonError);

  if (!salon) {
    return (
      <main className="min-h-[100dvh] bg-white px-4 pt-6">
        <p className="text-[13px] text-s-ink-2">Salon &quot;{SALON_SLUG}&quot; did not resolve from the live query.</p>
      </main>
    );
  }

  // Same select shape as the real booking page (id, name, avatar_url, specialties, is_active,
  // average_rating, review_count, bio, languages).
  const { data: staffRaw, error: staffError } = await supabase
    .from('staff_members')
    .select('id, name, avatar_url, specialties, is_active, average_rating, review_count, bio, languages')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('name');
  if (staffError) console.error('[dev/staff-per-service] staff fetch failed:', staffError);
  const staffList = (staffRaw ?? []) as StaffMember[];

  // Two real services from the same salon (Men's Haircut, Beard Trim), same select shape as the
  // real booking page.
  const { data: servicesRaw, error: servicesError } = await supabase
    .from('services')
    .select('id, name_de, name_en, duration_minutes, price, is_active')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .in('name_en', ["Men's Haircut", 'Beard Trim']);
  if (servicesError) console.error('[dev/staff-per-service] services fetch failed:', servicesError);
  const servicesRows = (servicesRaw ?? []) as {
    id: string;
    name_de: string;
    name_en: string;
    duration_minutes: number;
    price: number;
  }[];

  const staffIds = staffList.map((s) => s.id);
  const { data: staffServicesRaw, error: staffServicesError } = staffIds.length
    ? await supabase.from('staff_services').select('staff_member_id, service_id').in('staff_member_id', staffIds)
    : { data: [], error: null };
  if (staffServicesError) console.error('[dev/staff-per-service] staff_services fetch failed:', staffServicesError);
  const staffServices = staffServicesRaw ?? [];

  const initialServices: SelectedService[] = servicesRows.map((s) => ({
    id: s.id,
    name_de: s.name_de,
    name_en: s.name_en,
    price: s.price,
    duration_minutes: s.duration_minutes,
  }));

  const cartServices = servicesRows.map((s) => ({
    id: s.id,
    name: s.name_en,
    price: s.price,
    duration_minutes: s.duration_minutes,
  }));

  const ready = staffList.length >= 3 && cartServices.length === 2;

  return (
    <main className="min-h-[100dvh] bg-white pb-40">
      <div className="mx-auto max-w-[390px] px-4 pt-6">
        <h1 className="text-[20px] font-semibold text-s-ink">Staff step: per-service selection</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          Booking staff step with a two-service cart from {salon.name}, real staff and real services.
          Current picks one stylist for the whole cart. Proposed lets a different stylist be picked
          per service, with a shortcut back to one person for everyone.
        </p>

        {!ready && (
          <p className="mt-4 text-[13px] text-s-ink-2">
            Expected 3+ active staff and 2 matching services from {SALON_SLUG}, got {staffList.length}{' '}
            staff and {cartServices.length} services. Check the live data.
          </p>
        )}

        {ready && (
          <>
            <p className="mb-2 mt-6 text-[13px] font-semibold text-s-ink">Current</p>
            <p className="mb-3 text-[12px] text-s-ink-2">
              The real StaffStep component: one selection applies to every service in the cart.
            </p>
            {/* isolate + a transform makes this div the containing block for StaffStep's own
                `fixed bottom-0` price bar (its real, unchanged CSS, unmodified import), so the bar
                pins to the bottom of THIS block instead of the actual browser viewport. Without
                this, stacking two real fixed-bottom bars (Current's and Proposed's) on one
                scrollable page would make them overlap each other and the site's own BottomNav. */}
            <div className="relative isolate rounded-card border border-s-border [transform:translateZ(0)]">
              <BookingProvider salonId={salon.id} initialServices={initialServices}>
                <StaffStep staffList={staffList} staffServices={staffServices} salonSlug={salon.slug} />
              </BookingProvider>
            </div>

            <p className="mb-2 mt-10 text-[13px] font-semibold text-s-ink">Proposed</p>
            <p className="mb-3 text-[12px] text-s-ink-2">
              Each cart service gets its own staff row, plus a &quot;Same person for all services&quot;
              shortcut at the top.
            </p>
            <div className="relative isolate rounded-card border border-s-border [transform:translateZ(0)]">
              <ProposedStaffGroups
                staffList={staffList}
                staffServices={staffServices}
                cartServices={cartServices}
                locale="en"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
