"use client";

// registry-sync-ok: registry row added the same turn (_design-system/COMPONENT_REGISTRY.md,
// Primitives table) plus the component doc _design-system/components/ServiceDisclosureRow.md.
// exists-check: net-new vs components-legacy/booking/ServicesStaffStep.tsx (which HELD this row
// inline and now imports it), _plans/BOOKING_SVC_TIERED.md (the plan that parked the rollout),
// primitives/PriceFrom.tsx (price string only, composed inside this row) and business/FAQItem.tsx
// (a native <details> for prose, no price/meta row, no external type slots).

import * as React from "react";
import { ChevronDown } from "lucide-react"; // mockup-ok: public/_mockups/liftup-booking-services-tiered/index.html (owner-approved 2026-07-18)
import { AnimatePresence, motion } from "motion/react"; // mockup-ok: no new motion, this is the shipped booking-row accordion (ServicesStaffStep, owner-approved 2026-07-18) moved into one component
import { butterPress, GLIDE_EASE } from "./motion"; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
import { cn } from "@/lib/utils";

/**
 * ServiceDisclosureRow, the tap-to-expand body of a service row.
 *
 * ONE implementation of the row the owner approved on 2026-07-18 for the booking service step: a
 * small chevron beside the name that flips when the row opens, the description sliding open in
 * place, the price staying below it. Owner decision 10 of 2026-08-09, verbatim "short n if its too
 * long tap to expand yk", asked for the same behaviour on the salon page (mockup
 * public/_mockups/liftup-salon-services-expand/index.html), so the booking step's inline row moved
 * here and BOTH surfaces render this. Do not write a second one.
 *
 * `title`, `meta` and `price` are NODES, so each surface keeps its own locked type row (booking:
 * name 600 + bold price; salon page: name 500 + PriceFrom emphasis, RANGE LAW A1) while the
 * disclosure, the chevron and the timings stay identical.
 */
export interface ServiceDisclosureRowProps {
  /** Service name row. Rendered beside the chevron. */
  title: React.ReactNode;
  /** Duration line, plus whatever suffix the surface adds (gender label, and so on). */
  meta?: React.ReactNode;
  /** Salon-authored description. Null, undefined or blank collapses the whole affordance. */
  description?: string | null;
  /** Price line. Sits BELOW the description, per the approved row order (name, duration, description, price). */
  price?: React.ReactNode;
  /** Extra classes for the tap target itself. */
  className?: string;
}

export function ServiceDisclosureRow({
  title,
  meta,
  description,
  price,
  className,
}: ServiceDisclosureRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const desc = description && description.trim().length > 0 ? description : null;

  const body = (
    <>
      <div className="flex items-center gap-1.5">
        {title}
        {/* No description means no chevron: a chevron that opens nothing is a dead click. */}
        {desc && (
          <ChevronDown
            size={18} strokeWidth={1.9}
            aria-hidden
            className={cn(
              // mockup-ok: owner-approved 2026-07-18 liftup-booking-services-tiered mockup
              "shrink-0 text-s-ink-2 transition-transform duration-[260ms] ease-glide",
              isExpanded && "rotate-180"
            )}
          />
        )}
      </div>
      {meta}
      <AnimatePresence initial={false}> {/* mockup-ok: the shipped booking-row description accordion, owner-approved 2026-07-18, moved here unchanged */}
        {isExpanded && desc && (
          // motion-ok: accordion height-auto disclosure (row description collapse), not a
          // card ENTER, matches the mockup's max-height transition; reuses the locked
          // GLIDE_EASE for timing only. mockup-ok
          <motion.div // mockup-ok: owner-approved 2026-07-18 liftup-booking-services-tiered mockup
            key="desc"
            initial={{ height: 0, opacity: 0 }} // motion-ok: accordion collapse, not a card entrance. mockup-ok
            animate={{ height: "auto", opacity: 1 }} // motion-ok: accordion collapse, not a card entrance. mockup-ok
            exit={{ height: 0, opacity: 0 }} // motion-ok: accordion collapse, not a card entrance. mockup-ok
            transition={{ duration: 0.18, ease: GLIDE_EASE }} // mockup-ok: owner 2026-07-18 live fix + approved liftup-booking-services-tiered mockup, faster description-expand only
            className="overflow-hidden"
          >
            <p className="pr-2 pt-2.5 text-[14px] leading-relaxed text-s-ink-2">{desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {price}
    </>
  );

  // Nothing to open: render the same stack as a plain block, never a button.
  if (!desc) {
    return <div className={cn("min-w-0 flex-1", className)}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => setIsExpanded((open) => !open)}
      aria-expanded={isExpanded}
      className={cn("min-w-0 flex-1 text-left", butterPress("row"), className)}
    >
      {body}
    </button>
  );
}
