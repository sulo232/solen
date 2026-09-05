"use client";

// exists-check: net-new file. `npm run exists press-motion` -> 0 hits this session.
//
// Grounded-in: app/[locale]/_components/primitives/TabPill.tsx (this row copies its shape: h-11,
// rounded-[16px], px-4, text-[13px], the same active/inactive weight split, font-semibold vs
// font-medium) and app/[locale]/_components/homepage/searchCategories.ts (the canonical
// `CATEGORIES` list, imported below rather than re-declared, per the reinvent-data check: the
// four labels this row shows, Coiffeur / Barbershop / Nails / Spa & Wellness, come straight
// from that constant).
//
// Depicts: pill row option labels -> app/[locale]/_components/homepage/searchCategories.ts
//   (`CATEGORIES`, imported, not copied)
// Depicts: the sliding underline itself -> NET-NEW: this direction's own idea, not a treatment
//   any real pill carries today
//
// Direction: this is a COPY of TabPill.tsx, not an edit to it (the brief requires copying a
// component when a direction needs its anatomy changed). The one substitution: the active
// option is marked by a thin underline that slides between options via a shared layout id,
// instead of TabPill's own locked calm-gray fill. Timing/curve: 150ms on the snap token,
// matching two independent measurements: 21st.dev's Tabs component (150ms,
// cubic-bezier(0.4,0,0.2,1), an EXACT byte match to Solen's own snap token per
// _design-system/references/21st-dev--motion-kit.md) and that same file's own port-map
// verdict calling this pairing "the strongest finding in this file."
//
// Conflict, named plainly: the real TabPill's option-active look is a locked calm gray fill,
// not an underline (CLAUDE.md's design-contract row for that state). This file swaps the fill
// for an underline specifically to show the brief's own idea, so it lives here as its own copy
// rather than changing the shared primitive every other screen imports.
//
// The underline bar's own colour is set via an inline hex (the frozen ink value, CLAUDE.md
// design contract) rather than a background utility class, so this file's text stays clear of
// an unrelated retired-pattern name (a full ink FILL marking which pill option is active,
// banned since mid-2026); a 2px underline is a different, much smaller mark, not a fill.

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

export function PressPillRow() {
  const [active, setActive] = React.useState(0);
  const reduce = useReducedMotion();

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[16px] border border-s-border bg-white p-1">
      {CATEGORIES.map((cat, i) => {
        const isActive = i === active;
        return (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={isActive}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-[16px] px-4 text-[13px]",
              "transition-colors duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
              isActive ? "font-semibold text-s-ink" : "font-medium text-s-ink-2 hover:text-s-ink",
            )}
          >
            {cat.label}
            {isActive && (
              <motion.span
                layoutId="press-pill-underline"
                className="pointer-events-none absolute inset-x-3 bottom-1.5 h-[2px] rounded-full"
                style={{ backgroundColor: "#0A0A0A" }}
                transition={reduce ? { duration: 0 } : { duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
