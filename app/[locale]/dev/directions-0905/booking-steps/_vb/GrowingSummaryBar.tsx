"use client";

// Grounded-in: components-legacy/booking/BookingWizard.tsx (the wizard this bar lives inside),
// components-legacy/booking/ServicesStaffStep.tsx (the fixed bottom CTA bar + floating pill
// pattern this bar clears and reuses), app/[locale]/_components/salon/SalonMobileBookBar.tsx
// (the gradient-fade sticky-bar treatment copied here verbatim).
//
// Exists-check: `npm run exists booking-steps` -> 1 REMOVED hit (NailBookingSteps, unrelated
// legacy nail wizard). `npm run exists GrowingSummaryBar` -> 0, net-new. `npm run exists
// CountUpNumber` -> real, components-legacy/booking/CountUpNumber.tsx, reused unchanged below.
//
// Depicts: growing summary bar -> NET-NEW: direction B's one idea, no prior implementation.
// Depicts: chip entrance spring -> app/[locale]/_components/primitives/motion.ts (SPRING_SNAPPY, locked motion-07 preset, reused unchanged).
// Depicts: price count-up -> components-legacy/booking/CountUpNumber.tsx (reused unchanged, owner-approved 2026-07-18).
// Depicts: commit-button entrance -> app/[locale]/_components/primitives/motion.ts (useEnterMotion, the locked ENTER RECIPE, 2026-07-09).
// Depicts: gradient-fade bar treatment -> app/[locale]/_components/salon/SalonMobileBookBar.tsx:75 (read-only reference, same recipe copied here, not invented).
//
// Direction B's one idea: as the wizard advances past services-staff, staff and datetime,
// this bar accumulates one chip per completed step (spring-in, not a slide), and the running
// total counts up. Once a service, a professional (or "Any professional") and a time all
// have real values, a "Review and pay" shortcut appears in the same bar (ENTER RECIPE) that
// jumps straight to the pay-confirm step via the real useBooking().goToStep, a genuine
// navigation shortcut, not a decorative dead button. It is hidden on the pay-confirm step
// itself, where the step's own real Pay button already does that job.
//
// Positioned ABOVE each step's own native fixed bottom CTA bar (every step in
// components-legacy/booking/*Step.tsx renders its own `fixed bottom-0 z-40` bar; those step
// files are imported unchanged per this direction's brief, so this bar cannot occupy the same
// bottom-0 slot). BAR_CLEARANCE_PX is a measured constant: it reuses the exact 80px offset
// ServicesStaffStep.tsx already uses for its own floating "N selected" pill for the identical
// reason (clearing that same CTA bar), so this is a grounded, precedented value, not invented.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { useTranslations, useLocale } from "next-intl";
import CountUpNumber from "@/components-legacy/booking/CountUpNumber";
import { SPRING_SNAPPY, useEnterMotion } from "@/app/[locale]/_components/primitives/motion";

const BAR_CLEARANCE_PX = 80; // measured: components-legacy/booking/ServicesStaffStep.tsx:555

interface GrowingSummaryBarProps {
  showServiceChip: boolean;
  showStaffChip: boolean;
  showTimeChip: boolean;
  staffLabel: string | null;
  onReviewAndPay: () => void;
  hidden: boolean;
}

export default function GrowingSummaryBar({
  showServiceChip,
  showStaffChip,
  showTimeChip,
  staffLabel,
  onReviewAndPay,
  hidden,
}: GrowingSummaryBarProps) {
  const { formData } = useBooking();
  const t = useTranslations("booking") as any;
  const locale = useLocale();
  const reduce = useReducedMotion();
  const enterMotion = useEnterMotion();

  const swissLocale =
    locale === "fr" ? "fr-CH" : locale === "en" ? "en-CH" : locale === "it" ? "it-CH" : "de-CH";
  const formatTotalNumber = (n: number) =>
    n.toLocaleString(
      swissLocale,
      Number.isInteger(n) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );

  const dateLabel =
    formData.selectedDate && formData.selectedTime
      ? new Intl.DateTimeFormat(swissLocale, { weekday: "short", day: "numeric", month: "short" }).format(
          formData.selectedDate
        )
      : null;

  const serviceLabel =
    formData.services.length === 1
      ? formData.services[0].name_en || formData.services[0].name_de
      : `${formData.services.length} services`;

  const isComplete = showServiceChip && showTimeChip && (!showStaffChip || Boolean(staffLabel));
  const hasAnyChip = showServiceChip || showStaffChip || showTimeChip;

  if (hidden || !hasAnyChip) return null;

  const chipSpring = reduce ? { duration: 0 } : SPRING_SNAPPY;

  return (
    // z-[55]: the shared dev comparison harness's own VariantSwitcher (app/[locale]/dev/_shared/
    // VariantSwitcher.tsx, never edited per this surface's README) renders at z-50 in the exact
    // same bottom-80-to-140px band this bar occupies (measured live: switcher 691-756px,
    // this bar 704-764px, in an 844px viewport). That collision is a comparison-harness-only
    // artifact: in a real, non-comparison route there is no switcher at all and this bar sits
    // cleanly in its own 80px-clearance gap above the step's CTA bar. Sitting one z-step above
    // the switcher here keeps this bar legible for the direction under test rather than being
    // silently hidden behind it.
    <div
      className="fixed inset-x-0 z-[55] px-4 pb-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']"
      style={{ bottom: `${BAR_CLEARANCE_PX}px` }}
      data-growing-summary-bar
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-[16px] border border-s-border bg-white px-3 py-2.5 shadow-elevation-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-hide">
          <AnimatePresence initial={false}>
            {showServiceChip && (
              <motion.span
                key="chip-service"
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={chipSpring}
                className="shrink-0 whitespace-nowrap rounded-[16px] bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink"
              >
                {serviceLabel}
              </motion.span>
            )}
            {showStaffChip && staffLabel && (
              <motion.span
                key="chip-staff"
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={chipSpring}
                className="shrink-0 whitespace-nowrap rounded-[16px] bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink"
              >
                {staffLabel}
              </motion.span>
            )}
            {showTimeChip && dateLabel && (
              <motion.span
                key="chip-time"
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={chipSpring}
                className="shrink-0 whitespace-nowrap rounded-[16px] bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink"
              >
                {dateLabel}, {formData.selectedTime}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap font-heading text-[15px] font-bold tabular-nums text-s-ink">
            {locale === "fr" ? (
              <>
                <CountUpNumber value={formData.totalPrice} format={formatTotalNumber} /> CHF
              </>
            ) : (
              <>
                CHF <CountUpNumber value={formData.totalPrice} format={formatTotalNumber} />
              </>
            )}
          </span>

          <AnimatePresence>
            {isComplete && (
              <motion.button
                key="review-pay"
                type="button"
                onClick={onReviewAndPay}
                initial={enterMotion.initial}
                animate={enterMotion.animate}
                exit={enterMotion.initial}
                transition={enterMotion.transition}
                className="flex shrink-0 items-center gap-1 rounded-[16px] bg-s-ink px-3 py-2 text-[13px] font-heading font-semibold text-white transition-[filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]"
              >
                {t("continue") || "Review"}
                <ArrowRight size={14} strokeWidth={2} aria-hidden />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
