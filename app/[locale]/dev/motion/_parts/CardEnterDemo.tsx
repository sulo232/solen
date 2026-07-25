"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { motion } from "motion/react";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import type { SalonCardData } from "@/app/[locale]/_components/homepage/salonCardData";
import { DemoCard } from "./DemoCard";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, STAGGER_STEP, FAST_TIER_S, SLOW_TIER_S } from "./speeds";

/**
 * Interaction (d) , Card enter, real salons (`getTopSalonIds` + `getSalonCardDataMap`, page.tsx)
 * rendered with the real `SalonCard`, entering with a small stagger. Both tiers reuse the
 * codebase's own ENTER RECIPE shape verbatim (opacity 0->1, scale 0.96->1, blur(8px)->0, glide
 * easing, `STAGGER_STEP` between cards, LOCKED , motion.ts) so the only variable across the two
 * columns is duration, never the recipe itself.
 *
 * Real content arriving to browse, the same job Airbnb's own card grids do: the reveal tier fits.
 */
function CardRow({
  salons,
  on,
  durationS,
}: {
  salons: { id: string; data: SalonCardData }[];
  on: boolean;
  durationS: number;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {salons.map(({ id, data }, i) => (
        <motion.div
          key={id}
          initial={false}
          animate={
            on
              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
              : { opacity: 0, scale: 0.96, filter: "blur(8px)" }
          }
          transition={{ duration: durationS, ease: [...GLIDE_EASE], delay: on ? i * STAGGER_STEP : 0 }}
        >
          <SalonCard
            slug={data.slug ?? ""}
            salonId={id}
            name={data.name ?? "?"}
            rating={data.rating}
            photoUrl={data.photoUrl ?? undefined}
            category={data.category ?? "coiffeur"}
            variant="service"
            priceFromCHF={data.priceFromCHF}
            postalCode={data.postalCode ?? undefined}
            city={data.city ?? undefined}
            widthClassName="w-[128px] shrink-0"
          />
        </motion.div>
      ))}
    </div>
  );
}

export function CardEnterDemo({
  globalTick,
  salons,
}: {
  globalTick: number;
  salons: { id: string; data: SalonCardData }[];
}) {
  const { on, toggle } = useDemoToggle(globalTick);

  return (
    <DemoCard
      index={4}
      title="Card enter"
      description="Real salon cards entering with a stagger, the codebase's own ENTER RECIPE shape."
      verdict="Content the user browses, same job as Airbnb's own card grids: reveal tier (300ms) fits, it gives the cards weight without a distracting flash."
      onPlay={toggle}
    >
      <CardRow salons={salons} on={on} durationS={FAST_TIER_S} />
      <CardRow salons={salons} on={on} durationS={SLOW_TIER_S} />
    </DemoCard>
  );
}
