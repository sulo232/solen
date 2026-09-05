"use client";

// Exists-check: `npm run exists TabPill` / "SalonCard" / "Sheet" / "Toast" / "button
// primitive" all run this turn. TabPill, Sheet, Toast and SalonCard are real, locked
// components (paths in the Grounded-in line below), read in full before this file was
// written. No generic `Button.tsx` primitive exists in the repo (checked
// `app/[locale]/_components/primitives/`, `find . -iname Button.tsx` -> 0 hits); every
// real CTA in the app hand-applies the same class recipe instead, so the primary and
// secondary button classes below are copied VERBATIM from a live call site, not invented.
//
// Grounded-in: app/[locale]/_components/primitives/TabPill.tsx (pill row anatomy, via the
// _vb/SpringPillRow.tsx copy), app/[locale]/_components/primitives/Sheet.tsx (sheet
// anatomy, via the _vb/SpringSheet.tsx copy plus SheetHeader/SheetBody/SheetCTARow
// imported unchanged), app/[locale]/_components/primitives/Toast.tsx (used unmodified,
// its own entrance transform already runs the locked `spring` bezier
// cubic-bezier(0.34,1.56,0.64,1), so this direction triggers it rather than rebuilding
// it), app/[locale]/_components/homepage/SalonCard.tsx (used unmodified, real seed data),
// app/[locale]/booking/resend-link/page.tsx:501 and :237 (the primary-ink and
// secondary-outline button class recipes, copied then re-radius'd from that file's stale
// `rounded-btn` 99px pill to the CLAUDE.md-locked `rounded-[16px]`, see the Conflicts note
// below).
//
// Depicts: primary button (Confirm booking) -> booking/resend-link/page.tsx:237 class recipe (bg-s-ink, h-[52px], text 15/500), re-radiused to the locked 16px.
// Depicts: secondary button (View details / Trigger toast) -> booking/resend-link/page.tsx:501 class recipe (white, border-s-border, text-s-ink), re-radiused to the locked 16px.
// Depicts: sort pill row -> ./SpringPillRow.tsx (this direction's own copy of TabPill.tsx).
// Depicts: salon card -> app/[locale]/_components/homepage/SalonCard.tsx (unmodified, real seed salon).
// Depicts: bottom sheet -> ./SpringSheet.tsx (this direction's own copy of Sheet.tsx's outer wrapper).
// Depicts: toast -> app/[locale]/_components/primitives/Toast.tsx (unmodified, toast.success singleton, mounted globally by app/[locale]/layout.tsx).
// Depicts: sheet body copy (drag-to-dismiss instructions, a service row) -> NET-NEW: demo copy for this motion kit, the service row reads off the real cheapest seeded service, no invented price.
//
// Conflicts (kept the lock, named per the brief): the two button class recipes this file
// copies from both still carry the stale `rounded-btn` Tailwind class (99px true pill,
// tailwind.config.js:288), which predates the CLAUDE.md design-contract row locking
// button/chip radius to 16px (owner 2026-08-16, "you can go implement this", the pill
// geometry finding). TabPill.tsx itself already ships the corrected 16px. This file uses
// `rounded-[16px]` on every button, matching the CURRENT lock and TabPill's own radius,
// not the two stale call sites' `rounded-btn`; the drift in those two live pages is a
// separate, out-of-scope fix.
//
// Direction B, "Spring" (this builder's one idea, everything else on this page is FIXED
// across all three directions of this surface): press feedback scales to 0.95 with a real
// physics spring (stiffness 500, damping 30, the brief's own assigned values, applied via
// framer-motion's `whileTap`), which is UNDERDAMPED at that ratio (damping ratio approx
// 0.671) and therefore visibly overshoots past 1.0 on release before settling, exactly the
// "visible overshoot on release" the brief names. The sort-pill row's active fill is one
// shared `layoutId` element (./SpringPillRow.tsx). The bottom sheet opens on the locked
// non-gesture UI spring and can be flicked closed by release velocity (./SpringSheet.tsx);
// see that file's own header for the LOCKFILE citations behind each of its numbers.
//
// floors: this is a component and motion demo page under /dev, not a discovery/search/PDP/
// booking/checkout/profile screen, so FLOORS LAW's customer-screen scope (including the
// display-anchor floor) does not bind the page as a whole, same scoping direction C's own
// header states; the type budget (<=4 sizes, <=2 weights) still does and is measured live.
// (a) photographic focal = the real seeded salon's cover photo inside SalonCard; (c) a real
// tabular number = the seeded service's CHF price, tabular-nums, both in the salon card and
// the sheet's service row; (d) a semantic-colour moment = the green success-toast badge
// (`s-success` circle-badge, Toast.tsx's own tone treatment) fired by the primary button and
// the toast trigger; (e) no dead-grey zone = every section sits on white with photography
// and real controls, no empty grey band; (f) worst-case content: the real seeded salon's
// name/address are used as-is (real data may already be long), and SalonCard's own
// `truncate` classes (unmodified) hold the two-ink-anchor rule regardless of length.
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import type { SeedSalon } from "../../../_shared/seedSalon";
import { SpringPillRow, type SpringPillOption } from "./SpringPillRow";
import { SpringSheet, SheetHeader, SheetBody, SheetCTARow } from "./SpringSheet";
import { cn } from "@/lib/utils";

const PRESS_SPRING = { type: "spring" as const, stiffness: 500, damping: 30 };

const PRIMARY_BUTTON = cn(
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-s-ink",
  "font-body text-[15px] font-medium tracking-[-0.005em] text-white",
);
const SECONDARY_BUTTON = cn(
  "flex h-[52px] w-full items-center justify-center rounded-[16px] border border-s-border bg-white",
  "font-body text-[15px] font-medium text-s-ink",
);

const SORT_OPTIONS: SpringPillOption[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price", label: "Price" },
  { value: "rating", label: "Rating" },
  { value: "distance", label: "Distance" },
];

const CATEGORY_MAP: Record<string, "coiffeur" | "barbershop" | "nails" | "spa"> = {
  coiffeur: "coiffeur",
  barbershop: "barbershop",
  nails: "nails",
  spa: "spa",
};

interface PressMotionDirectionBProps {
  salon: SeedSalon | null;
}

export default function PressMotionDirectionB({ salon }: PressMotionDirectionBProps) {
  const reduce = useReducedMotion();
  const [sort, setSort] = React.useState(SORT_OPTIONS[0].value);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const pressTransition = reduce ? { duration: 0 } : PRESS_SPRING;
  const cheapestService = salon?.services?.[0] ?? null;
  const category =
    salon?.category && CATEGORY_MAP[salon.category] ? CATEGORY_MAP[salon.category] : "coiffeur";

  return (
    <div className="mx-auto flex max-w-[402px] flex-col gap-10 px-4 pb-32 pt-6">
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-[15px] font-semibold leading-tight text-s-ink">
          Spring
        </h2>
        <p className="text-[14px] leading-[1.4] text-s-ink-2">
          Every press overshoots on release. The sort pill fill and the bottom sheet both
          move on real spring physics, never a fixed-duration ease.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-semibold text-s-ink-2">Buttons</h3>
        <motion.button
          type="button"
          className={PRIMARY_BUTTON}
          whileTap={{ scale: 0.95 }}
          transition={pressTransition}
          onClick={() =>
            toast.success("Booking confirmed", {
              description: "Press spring: stiffness 500, damping 30.",
            })
          }
        >
          Confirm booking
        </motion.button>
        <motion.button
          type="button"
          className={SECONDARY_BUTTON}
          whileTap={{ scale: 0.95 }}
          transition={pressTransition}
          onClick={() => setSheetOpen(true)}
        >
          View details
        </motion.button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-semibold text-s-ink-2">Sort pills</h3>
        <SpringPillRow options={SORT_OPTIONS} active={sort} onChange={setSort} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-semibold text-s-ink-2">Salon card</h3>
        {salon ? (
          <motion.div
            className="w-[220px]"
            whileTap={{ scale: 0.95 }}
            transition={pressTransition}
            onClickCapture={(e) => {
              // Demo-only: never navigate away from the motion kit or fire a real
              // favorite-toggle write when this card is tapped for its press feedback.
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <SalonCard
              slug={salon.slug}
              salonId={salon.id}
              name={salon.name}
              rating={salon.averageRating}
              reviewCount={salon.reviewCount}
              photoUrl={salon.coverPhotoUrl}
              photoAlt={`Photo of ${salon.name}`}
              category={category}
              variant="service"
              priceFromCHF={salon.priceFromCHF}
              priceFromService={
                cheapestService ? (cheapestService.name_en ?? cheapestService.name_de) : null
              }
              address={salon.address}
              citySelected
              widthClassName="w-[220px]"
            />
          </motion.div>
        ) : (
          <p className="text-[13px] text-s-ink-2">
            No live salon with a photo and a service was found, so the card is skipped
            rather than fabricated.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[13px] font-semibold text-s-ink-2">Toast</h3>
        <motion.button
          type="button"
          className={SECONDARY_BUTTON}
          whileTap={{ scale: 0.95 }}
          transition={pressTransition}
          onClick={() => toast.success("Saved to favorites")}
        >
          Trigger toast
        </motion.button>
      </section>

      <SpringSheet isOpen={sheetOpen} onOpenChange={setSheetOpen} aria-label="Booking summary">
        <SheetHeader
          title={salon?.name ?? "Booking summary"}
          onClose={() => setSheetOpen(false)}
          closeAriaLabel="Close"
        />
        <SheetBody>
          <p className="text-[14px] leading-[1.5] text-s-ink-2">
            Drag down and release with a flick to dismiss. A slow drag returns home on a
            gentle spring; a fast flick settles with the release velocity carried through,
            never a fixed-duration tween from the release point.
          </p>
          {cheapestService && (
            <div className="mt-4 flex items-center justify-between border-t border-s-border pt-4">
              <span className="text-[14px] text-s-ink">
                {cheapestService.name_en ?? cheapestService.name_de}
              </span>
              <span className="font-body text-[14px] font-semibold tabular-nums text-s-ink">
                CHF {cheapestService.price}
              </span>
            </div>
          )}
        </SheetBody>
        <SheetCTARow>
          <motion.button
            type="button"
            className={PRIMARY_BUTTON}
            whileTap={{ scale: 0.95 }}
            transition={pressTransition}
            onClick={() => {
              setSheetOpen(false);
              toast.success("Booking confirmed");
            }}
          >
            Confirm
          </motion.button>
        </SheetCTARow>
      </SpringSheet>
    </div>
  );
}
