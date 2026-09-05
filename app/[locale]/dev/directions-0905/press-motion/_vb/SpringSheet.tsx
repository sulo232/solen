"use client";

// Exists-check: `npm run exists Sheet` -> the real, locked bottom-sheet primitive
// (app/[locale]/_components/primitives/Sheet.tsx), read in full before writing this
// file. `npm run exists "flick close"` / "drag to dismiss sheet" -> 0 hits beyond the
// real Sheet's own pointer-based drag handle (translateY follows the finger, dismisses
// past a bare 90px threshold, no velocity read at all).
//
// Grounded-in: app/[locale]/_components/primitives/Sheet.tsx. This is a COPY of the
// OUTER wrapper only, per the brief's explicit allowance for a direction that needs a
// component's anatomy changed: direction B's assigned idea needs the sheet to open on a
// real physics spring and to read RELEASE VELOCITY on a flick close, which the real
// Sheet's CSS `transition-transform` open + bare-position-threshold drag handle cannot
// do. `SheetHeader`, `SheetBody` and `SheetCTARow` need no anatomy change (plain markup,
// no motion of their own) so they are IMPORTED UNCHANGED from the real file, not copied.
//
// Depicts: header, body, footer anatomy -> Sheet.tsx (SheetHeader/SheetBody/SheetCTARow, imported unchanged).
// Depicts: backdrop dim and blur -> Sheet.tsx (ModalOverlay bg/backdrop-blur values, same rgba(26,18,9,0.40) + 4px).
// Depicts: sheet content (a booking summary) -> NET-NEW: demo copy for this motion kit, not a real booking sheet, no invented prices or times.
//
// Motion sources (every number here is either LOCKFILE's own house value or the
// brief's own assigned press physics, never invented):
// - Open transition: LOCKFILE _design-system/LOCKFILE.md S16.5.4 "Return home / any
//   default UI spring" row (damping/bounce 0, response .35-.4s), exposed as the named
//   SPRING_GENTLE constant in app/[locale]/_components/primitives/motion.ts (duration
//   .38, bounce 0), imported rather than re-typed. This is a SCRIPTED open (a button
//   tap, not a finger), and S16.5.4 says overshoot is earned by gesture momentum only,
//   so the open stays critically damped, no bounce, even though the direction's name is
//   Spring: a bounce on something that merely faded in is the exact thing that section
//   bans.
// - Flick-dismiss decision: LOCKFILE S16.5.2's own velocity-first formula, ported as-is:
//   vy > 250 dismisses regardless of position, vy < -250 returns home regardless of
//   position, otherwise project momentum with d = 0.998 and dismiss when the projected
//   offset clears 25 percent of the sheet's own height.
// - Flick-dismiss settle: SPRING_SNAPPY (motion.ts, S16.5.4's "momentum release" row,
//   bounce .2, duration .3s), the tier S16.5.4 reserves for a release a real flick
//   preceded, seeded with the drag's own release velocity per S16.5.3's velocity
//   handoff rule (never a fixed-duration tween from the release point).
// - Non-gesture close (X button, backdrop tap, Escape): the real Sheet's own ease-thud
//   200ms exit (LOCKFILE S4, THE CURVE RULE: exits accelerate), unchanged.
// - Rubber-band at the top edge while dragging: approximated with Framer's built-in
//   `dragElastic` rather than S16.5.5's exact `follow = (over*dim*c)/(dim+c*|over|)`
//   formula; noted as a simplification, not a re-derivation of that formula.
// - Reduced motion: drag tracking is DISABLED outright (a simplification of S16.5.8,
//   which asks for tracking to stay live and only the release to collapse); the sheet
//   instead cross-fades open/closed with no transform, per the real Sheet's own
//   motion-reduce behavior.
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";
import { SheetHeader, SheetBody, SheetCTARow } from "@/app/[locale]/_components/primitives/Sheet";
import { SPRING_GENTLE, SPRING_SNAPPY } from "@/app/[locale]/_components/primitives/motion";

const THUD_EASE = [0.7, 0, 0.84, 0] as const;
const THUD_EXIT = { duration: 0.2, ease: THUD_EASE };

interface SpringSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Direction B's bottom sheet: opens on the locked non-gesture UI spring, tracks a
 * downward drag 1:1, and decides dismiss-vs-return by release VELOCITY (not a bare
 * position threshold), settling a real flick into a momentum spring seeded with that
 * velocity. See the file header for exactly which LOCKFILE section backs each number.
 */
export function SpringSheet({ isOpen, onOpenChange, children, ...aria }: SpringSheetProps) {
  const reduce = useReducedMotion();
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const lastVelocity = React.useRef(0);
  const [exitFlicked, setExitFlicked] = React.useState(false);

  React.useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (isOpen) main.classList.add("sheet-scale-back");
    else main.classList.remove("sheet-scale-back");
    return () => main.classList.remove("sheet-scale-back");
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onOpenChange]);

  const decideOnDragEnd = (_e: unknown, info: PanInfo) => {
    const vy = info.velocity.y;
    const dy = info.offset.y;
    lastVelocity.current = vy;
    const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 400;

    let dismiss: boolean;
    if (vy > 250) {
      dismiss = true;
    } else if (vy < -250) {
      dismiss = false;
    } else {
      const d = 0.998;
      const project = (v: number) => (v / 1000) * d / (1 - d);
      const projected = dy + project(vy);
      dismiss = projected > 0.25 * sheetHeight;
    }

    if (dismiss) {
      setExitFlicked(true);
      onOpenChange(false);
    }
    // else: framer's own dragConstraints snap the sheet back to y:0 (return home).
  };

  return (
    <AnimatePresence onExitComplete={() => setExitFlicked(false)}>
      {isOpen && [
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[60] bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.1 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onOpenChange(false)}
        />,
        <motion.div
          key="sheet"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label={aria["aria-label"]}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[61]",
            "flex max-h-[calc(100dvh-64px)] h-[75dvh] flex-col overflow-hidden",
            "rounded-t-[28px] bg-white",
            "shadow-[0_-4px_28px_rgba(50,47,44,0.12),0_-2px_8px_rgba(50,47,44,0.06)]",
          )}
          drag={reduce ? false : "y"}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={decideOnDragEnd}
          initial={reduce ? { opacity: 0 } : { y: "100%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={
            reduce
              ? { opacity: 0 }
              : exitFlicked
                ? { y: "100%", transition: { type: "spring", velocity: lastVelocity.current, ...SPRING_SNAPPY } }
                : { y: "100%", transition: THUD_EXIT }
          }
          transition={reduce ? { duration: 0.1 } : SPRING_GENTLE}
        >
          <div
            className="flex cursor-grab touch-none justify-center pb-2 pt-3 shrink-0 active:cursor-grabbing"
            aria-hidden="true"
          >
            <div className="w-9 h-1 rounded-full bg-s-ink/20" />
          </div>
          {children}
        </motion.div>,
      ]}
    </AnimatePresence>
  );
}

export { SheetHeader, SheetBody, SheetCTARow };
