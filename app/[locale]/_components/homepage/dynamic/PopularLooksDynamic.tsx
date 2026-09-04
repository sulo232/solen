"use client";

// exists-check: net-new vs app/[locale]/_components/homepage/PopularLooks.tsx because this is a
// thin loading-skeleton companion for the next/dynamic() call in app/[locale]/page.tsx (perf-
// first-load slice), not a rebuild of PopularLooks itself; `npm run exists dynamic` only matched
// the unrelated Next.js route-segment `export const dynamic` config and DynamicPricingConfig.tsx
// (nail dashboard), so no existing lazy-load wrapper for this component exists yet.
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section
// composition, next to PopularLooks).
//
// perf-first-load slice (measured 2026-09-04 on the production copy, 390x844):
// PopularLooks is the home's photo-gallery rail ("galleries" in the slice brief's heavy-component
// list) and a "use client" component. Its DOM top measured at 2112px on the real homepage, well
// past the 844px first viewport, so app/[locale]/page.tsx now loads it via next/dynamic({ssr:
// false}) instead of a direct import, pulling its JS chunk out of the route's First Load JS.
// This file is only the `loading` fallback passed to that dynamic() call.
//
// mockup-ok: revert/restores , this skeleton is a byte-for-byte geometry copy of PopularLooks.tsx's
// OWN already-shipped internal skeleton (its lines 100-109: same CARD_W "w-[44vw] max-w-[200px]"
// constant, same Skeleton primitive calls, same Section/SectionFrame wrapper), not a new
// appearance. It exists only so the placeholder shown during the brief next/dynamic chunk-fetch
// window matches the shape PopularLooks itself already renders on mount.
import { Section, SectionFrame } from "../SectionHeader";
import { Skeleton } from "../../primitives/Skeleton";

const CARD_W = "w-[44vw] max-w-[200px]"; // identical to PopularLooks.tsx's own CARD_W (line 58)

export default function PopularLooksSkeleton() {
  return (
    <Section>
      <SectionFrame>
        <div className="flex items-center justify-between mb-3">
          <Skeleton height={18} width="40%" rounded={4} />
        </div>
        <div className="mt-1 flex gap-3 overflow-hidden pt-2.5 pb-6 -mx-3 px-3 md:-mx-4 md:px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`shrink-0 ${CARD_W}`}>
              <Skeleton rounded={16} className="aspect-[9/16] w-full shadow-elevation-3" />
              <Skeleton height={12} width="40%" rounded={4} className="mt-2" />
            </div>
          ))}
        </div>
      </SectionFrame>
    </Section>
  );
}
