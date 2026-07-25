"use client";

// exists-check: `npm run exists "motion speed ladder demo card blur"` (2026-07-25), 0 matches ,
// net-new. Interaction (g) , the ONE open contradiction between two owner-approved rules: THE
// ENTER RECIPE (MOTION.md line 16, 420ms) and THE SPEED LAW (MOTION.md line 119, "reveal" tier
// 250-300ms). Per `_design-system/research/TASTE_MOTION.md` finding 3: "that is a side-by-side
// the owner can feel, in the same form as /de/dev/motion, not a question to answer in prose."
// This demo IS that side-by-side, so unlike demos 1-6 it carries NO verdict, only a neutral
// tradeoff line , the owner supplies the verdict here.
//
// Real booking-step shape, not an abstract box: a step title + the grouped rows card
// (`rounded-[24px] border border-s-border bg-white shadow-whisper`, the real chrome
// ServicesStaffStep.tsx renders per category) holding two REAL salon services (name + duration +
// price, `salon.services` from the SAME `loadSalonDetailWithStatus` loader page.tsx already calls
// for Demo 6, never a fabricated row) + the real `ToggleCircle` row control + a commit CTA in the
// real ink-pill shape.
//
// Column A = 420ms (ENTER RECIPE, `ENTER_DURATION` re-exported verbatim from
// `primitives/motion.ts`, never re-typed). Column B = 280ms (SPEED LAW reveal) with the IDENTICAL
// opacity/scale/blur recipe , duration is the ONLY variable between A and B. Column C = 280ms with
// blur removed, the CONTROL per finding 10 (Chang & Ungar, UIST '93: motion blur buys
// comprehensibility at speed): if B reads the same as A but C reads worse than B, the blur was
// doing the work, not the extra 140ms.
//
// Replay: each column reuses the exact `useDemoToggle(globalTick)` mechanic every other demo on
// this page uses (so the page's own "Replay all" flips all three together, same as it flips every
// other demo), called three times so the three columns ALSO stay independently replayable , the
// same "shared trigger + a per-side trigger" split SheetDemo.tsx already established (its two
// separate "Open" buttons), not a new mechanism.

import * as React from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import ToggleCircle from "@/components-legacy/booking/ToggleCircle";
import { PriceFrom } from "@/app/[locale]/_components/primitives";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, ENTER_DURATION, SPEED_LAW_REVEAL_S } from "./speeds";

export interface DemoService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

function StepCard({
  label,
  durationS,
  blur,
  on,
  onReplay,
  services,
}: {
  label: string;
  durationS: number;
  blur: boolean;
  on: boolean;
  onReplay: () => void;
  services: DemoService[];
}) {
  const shown = { opacity: 1, scale: 1, filter: "blur(0px)" };
  const hidden = { opacity: 0, scale: 0.96, filter: blur ? "blur(8px)" : "blur(0px)" };

  return (
    <div className="rounded-xl bg-s-bg-sunken p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-body text-[12px] font-semibold text-s-ink" data-duration-ms={durationS * 1000}>
          {label}
        </p>
        <button
          type="button"
          onClick={onReplay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-s-border text-s-ink-2 transition-transform duration-150 ease-glide active:scale-[0.94]"
          aria-label={`Replay column: ${label}`}
        >
          <RotateCcw size={13} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <motion.div
        className="mt-2"
        initial={false}
        animate={on ? shown : hidden}
        transition={{ duration: durationS, ease: [...GLIDE_EASE] as [number, number, number, number] }}
      >
        <h4 className="font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">Services</h4>
        <div className="mt-2 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
          {services.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-4 py-3 ${i > 0 ? "border-t border-s-border" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <h5 className="truncate font-body text-[15px] font-semibold text-s-ink">{s.name}</h5>
                <p className="mt-0.5 font-body text-[13px] text-s-ink-3 tabular-nums">{s.durationMinutes} min</p>
                <div className="mt-1.5 font-body text-[14px] font-bold text-s-ink">
                  <PriceFrom amount={s.price} />
                </div>
              </div>
              <ToggleCircle selected={false} size="sm" />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-s-ink font-body text-[15px] font-semibold text-white"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}

export function BlurSpeedDemo({
  globalTick,
  services,
}: {
  globalTick: number;
  services: DemoService[];
}) {
  const enterRecipe = useDemoToggle(globalTick);
  const speedLaw = useDemoToggle(globalTick);
  const control = useDemoToggle(globalTick);

  const playAll = React.useCallback(() => {
    enterRecipe.toggle();
    speedLaw.toggle();
    control.toggle();
  }, [enterRecipe, speedLaw, control]);

  return (
    <section className="rounded-2xl border border-s-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[12px] font-semibold text-s-ink-3">Demo 7</p>
          <h3 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.01em] text-s-ink">
            Enter recipe vs speed law
          </h3>
          <p className="mt-1 font-body text-[13px] leading-[1.4] text-s-ink-2">
            A real booking step entering (title, services, Continue). Same opacity/scale/blur
            recipe in every column, only the duration, and column C&apos;s blur, differ.
          </p>
        </div>
        <button
          type="button"
          onClick={playAll}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-s-ink text-white transition-transform duration-150 ease-glide active:scale-[0.94]"
          aria-label="Replay demo 7: enter recipe vs speed law"
        >
          <RotateCcw size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <StepCard
          label="420ms (ENTER RECIPE)"
          durationS={ENTER_DURATION}
          blur
          on={enterRecipe.on}
          onReplay={enterRecipe.toggle}
          services={services}
        />
        <StepCard
          label="280ms (SPEED LAW reveal)"
          durationS={SPEED_LAW_REVEAL_S}
          blur
          on={speedLaw.on}
          onReplay={speedLaw.toggle}
          services={services}
        />
        <StepCard
          label="280ms, blur removed (control)"
          durationS={SPEED_LAW_REVEAL_S}
          blur={false}
          on={control.on}
          onReplay={control.toggle}
          services={services}
        />
      </div>

      <p className="mt-3 font-body text-[12px] leading-[1.4] text-s-ink-2">
        420ms costs 140ms more than 280ms on every booking step. What the owner is choosing: keep
        420ms, or move to 280ms with the blur intact. Column C is a control, not a third option ,
        it shows what 280ms looks like if the blur were also dropped.
      </p>
    </section>
  );
}
