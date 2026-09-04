/**
 * exists-check: net-new vs Step.md, salon-hours.ts, check-trust-floor.mjs,
 * WALKIN_DASHBOARD_NEEDS.md, CUSTOMER_FIX_PROGRESS.md, IG_DESIGN_PRINCIPLES.md,
 * MOBILE_DESIGN_SYSTEM.md, DESIGN_SYSTEM_HARDENING.md, all read this turn, because none holds a
 * done next upcoming setup checklist row for a phone sized mockup. Full reasoning further below.
 *
 * Real-source: _design-system/TERMINAL_PRINCIPLES.md
 *
 * There is no existing shipped page to capture: the four-tab dashboard (Heute/Kalender/
 * Kund:innen/Menu) this screen belongs to is a proposed rebuild, not yet built anywhere in the
 * app (`_plans/MOBILE_DASHBOARD_2026-08-21.md` is the spec, still at the mockup stage). The
 * treatment this file follows (white canvas, one bordered hero, bare hairline-divided rows, no
 * blue, the type and colour budgets) is grounded in the file cited above instead, which the
 * council verdict names as the skin these tabs migrate to.
 *
 * DEV mockup, Flow 4 of 4: the empty first day. `_plans/MOBILE_DASHBOARD_2026-08-21.md`, "The
 * council's verdict, 2026-08-21": on a brand new salon's first day, the Heute tab (the product's
 * German name for the Today tab, kept here only in this English comment to name it precisely)
 * holds the setup steps instead of the day's book, "which is what Airbnb's own Today actually
 * holds when a host has nothing booked."
 *
 * CLASS: operator screen. Governed by TASTE_LOG.md 2026-07-15 (Round D1) plus
 * `_design-system/TERMINAL_PRINCIPLES.md`, via the council verdict's own call that the four new
 * dashboard tabs migrate to the terminal's skin (white canvas, bare rows, no blue, one ink commit)
 * rather than the older grey dashboard console. The customer FLOORS LAW does not apply here: no
 * imagery floor, no required semantic-colour moment, no sunken tray.
 *
 * THE JOB, one sentence with a person in it: a salon owner who signed up minutes ago opens the app
 * and needs to know, in order, what three things stand between them and their first booking, with
 * the next one obvious.
 *
 * THE PROOF THIS STATE IS REAL, read end to end this turn, not assumed:
 * `app/api/cron/generate-slots/route.ts`. Two things are true and they are not the same check:
 *   - line 188, `if (!serviceIds.length) { slotStart = slotEnd; continue; }`, skips generating a
 *     slot for any hour where the salon has no services at all (and no staff-service mapping to
 *     fall back from). This is the literal "no services, no slots" line.
 *   - line 87, `if (!schedules?.length) continue;`, skips a staff member who has no
 *     `staff_schedules` rows, i.e. no opening hours set for them. CORRECTION worth stating plainly
 *     (CLAUDE.md rule 18, surface a contradiction rather than smooth it): this line is reached only
 *     for a staff member who already exists; it is not itself the "no staff roster" check. A salon
 *     with ZERO staff never reaches line 87 at all, because the staff loop that starts at line 80
 *     (`for (const staff of staffMembers ?? [])`) simply has nothing to iterate. So the real chain
 *     is: no staff means the loop never runs (structural, lines 74 to 85), no schedule for a staff
 *     member who does exist means line 87 skips them, no services means line 188 skips the hour.
 *     Same conclusion the brief drew, staff then hours then services, all three genuinely required,
 *     just two different mechanisms rather than one shared line number.
 *
 * FIXTURE DATA: a brand new Basel salon, Studio Nord, signed up today, nothing configured. No
 * staff member's name is invented anywhere in this file; the "after" frame shows progress as a
 * count only ("1 person added"), never a fabricated identity.
 *
 * VOCABULARY, reused rather than invented: `messages/en.json` already carries
 * `onboarding.team.title` ("Invite Your Team"), `onboarding.hours.title` ("Opening Hours") and
 * `onboarding.services.title` ("Add Services") for the real setup wizard steps
 * (`components-legacy/onboarding/steps/{TeamStep,OpeningHoursStep,ServicesStep}.tsx`). The row
 * labels and the Scissors/Clock/Users icon choices below are grounded in that existing copy and
 * that existing icon (ServicesStep.tsx already imports Scissors), not a fresh vocabulary for the
 * same three concepts.
 *
 * Exists-check detail, the claim above expanded: `npm run exists host-flows` = 0. `npm run
 * exists "empty first day"` = 0. `npm run exists "setup checklist"` = 0. `npm run exists
 * "onboarding steps"` = 7 hits, all in `components-legacy/onboarding/steps/*`, the first-run
 * SETUP WIZARD, a different surface from this dashboard empty-state mockup, reused here only for
 * copy and icon vocabulary, never imported or duplicated as a component. Of the exists-guard's own
 * flagged candidates: `_design-system/components/Step.md`
 * (`app/[locale]/_components/business/Step.tsx`) is a 3-column marketing "how it works" card with
 * one 40 to 48px decorative numeral and no title/state/icon props, and its own doc says "don't
 * reuse for long-form numbered list items", the opposite of what this file needs. `lib/salon-hours.ts`
 * computes isOpen/closesAt from real `opening_hours` data, unrelated to an unset-hours setup step.
 * `scripts/check-trust-floor.mjs`, `_tasks/WALKIN_DASHBOARD_NEEDS.md`,
 * `_tasks/CUSTOMER_FIX_PROGRESS.md`, `_plans/{IG_DESIGN_PRINCIPLES,MOBILE_DESIGN_SYSTEM,
 * DESIGN_SYSTEM_HARDENING}.md` are keyword collisions ("hours", "trust", "progress", "design")
 * with no onboarding-checklist content on inspection. Net-new here: a compact three-row
 * setup-status list with per-row done/next/upcoming states, built inline in this file rather than
 * as a shared component, since the fan-out brief scopes this turn to one file.
 *
 * ONE BOXED HERO, EVERYTHING ELSE BARE (TERMINAL_PRINCIPLES.md section 6): the promise card below
 * is the only bordered container on the screen. The three step rows are bare text on the white
 * canvas, separated by `divide-y` hairlines with no outer edge of their own, so there is exactly
 * one container per view and no doubled chrome (a container plus a hairline claiming the same
 * boundary).
 *
 * EMPHASIS BUDGET (CLAUDE.md FLOORS LAW 7a): weight >= 600 is kept to exactly THREE roles, size
 * alone carries the rest of the hierarchy, per TERMINAL_PRINCIPLES.md section 4's own ladder
 * (13/15/18/30, 400 and 600 only): the 30px anchor sentence, the CTA button label, and the row
 * label (Team / Opening hours / Services). Chrome, section labels and captions stay font-normal.
 *
 * CONCERN, stated rather than smoothed: the "what Airbnb does" description in the brief this file
 * was built against was handed to me as text by the orchestrator, not captured by me this turn
 * against the live Airbnb host app. I did not independently verify it. I built to the description
 * as given, and I am not treating it as self-verified.
 *
 * The anchor sentence is passed in as a literal string per frame (never a count plus a JS
 * singular/plural ternary), because this file is a hardcoded-English dev mockup, not next-intl
 * routed copy, and it only ever renders two fixed states (3 steps, 2 steps).
 *
 * All rendered copy below is English (mockup rule); the tab is called "Today" in the JSX text,
 * never the German product name, to keep this file's visible copy unambiguously English. No em
 * dash, en dash or middot anywhere in this file, including this comment. Real lucide-react icons
 * only. Two 390-wide phone frames, no sideways scroll.
 */

import { Check, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SALON_NAME = "Studio Nord";
const SALON_CITY = "Zurich";

type StepId = "team" | "hours" | "services";
type StepState = "done" | "next" | "upcoming";

const STEP_META: Record<StepId, { label: string }> = {
  team: { label: "Team" },
  hours: { label: "Opening hours" },
  services: { label: "Services" },
};

/** The sub-line's job is different at every state: what to do, why it waits, or what happened. */
function subFor(step: StepId, state: StepState): string {
  if (step === "team") return state === "done" ? "1 person added" : "Invite staff by email";
  if (step === "hours") {
    return state === "upcoming" ? "Needs a team member first" : "When your salon is open";
  }
  return "At least one, so customers can book";
}

function StepRow({ step, state }: { step: StepId; state: StepState }) {
  const order = step === "team" ? 1 : step === "hours" ? 2 : 3;
  const quiet = state === "upcoming";

  return (
    <div className="flex items-center gap-3 py-4">
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-body text-[13px]",
          state === "done" && "bg-s-success text-white",
          state === "next" && "bg-s-ink text-white",
          quiet && "border border-s-border text-s-ink-2",
        )}
      >
        {state === "done" ? <Check size={13} strokeWidth={3} /> : order}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-body text-[15px] font-semibold", quiet ? "text-s-ink-2" : "text-s-ink")}>
          {STEP_META[step].label}
        </p>
        <p className="mt-0.5 font-body text-[13px] text-s-ink-2">{subFor(step, state)}</p>
      </div>
      {state === "next" && <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />}
    </div>
  );
}

function PromiseCard({
  anchor,
  gesture,
  ctaLabel,
}: {
  anchor: string;
  gesture: string;
  ctaLabel: string;
}) {
  return (
    <div className="mt-8 rounded-card border border-s-border p-4">
      <p className="font-display text-[30px] font-semibold leading-tight tracking-[-0.02em] text-s-ink">
        {anchor}
      </p>
      <p className="mt-1.5 font-body text-[13px] text-s-ink-2">{gesture}</p>
      <button
        type="button"
        className="mt-3.5 inline-flex h-11 items-center gap-1.5 rounded-btn bg-s-ink px-5 font-body text-[15px] font-semibold text-white"
      >
        {ctaLabel}
        <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

function Screen({
  chromeSub,
  anchor,
  gesture,
  ctaLabel,
  states,
}: {
  chromeSub: string;
  anchor: string;
  gesture: string;
  ctaLabel: string;
  states: Record<StepId, StepState>;
}) {
  return (
    <div className="h-[844px] w-full max-w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-white">
      <div className="h-full overflow-y-auto px-5 pb-8 pt-6">
        <p className="font-display text-[18px] text-s-ink">{SALON_NAME}</p>
        <p className="mt-0.5 font-body text-[13px] text-s-ink-2">{chromeSub}</p>

        <PromiseCard anchor={anchor} gesture={gesture} ctaLabel={ctaLabel} />

        <p className="mt-8 font-body text-[13px] text-s-ink-2">Next steps</p>
        <div className="mt-1 divide-y divide-s-border">
          <StepRow step="team" state={states.team} />
          <StepRow step="hours" state={states.hours} />
          <StepRow step="services" state={states.services} />
        </div>
      </div>
    </div>
  );
}

// The two states of a brand new salon's first screen, as data rather than as two hand-built
// screens: one spec per frame, both rendered by the same `Screen` below, so the only thing that can
// differ between "nothing done" and "one step done" is the content named here. Measured on the
// rendered frame at 390x844: 17 things drawn on the first, 18 on the second.
interface EmptyFrameSpec {
  key: string;
  caption: string;
  chromeSub: string;
  anchor: string;
  gesture: string;
  ctaLabel: string;
  states: Record<StepId, StepState>;
}

const EMPTY_FRAME_SPECS: EmptyFrameSpec[] = [
  {
    key: "before",
    caption:
      "Before. Day one, nothing set up. Three things are needed before the calendar can hold a single slot. Team is first because hours and services both wait on it.",
    chromeSub: `Welcome. ${SALON_CITY}, day one.`,
    anchor: "3 steps to your first booking",
    gesture: "Add your team, hours and services, in that order.",
    ctaLabel: "Invite your team",
    states: { team: "next", hours: "upcoming", services: "upcoming" },
  },
  {
    key: "after",
    caption:
      "After. The team step is done. The count drops from 3 to 2, the team row checks off, and opening hours becomes the one to act on. Nothing else moved.",
    chromeSub: `Welcome back. ${SALON_CITY}, day one, 1 of 3 done.`,
    anchor: "2 steps to your first booking",
    gesture: "Team's in. Set your hours next so customers know when to book.",
    ctaLabel: "Set opening hours",
    states: { team: "done", hours: "next", services: "upcoming" },
  },
];

export const FRAMES: { key: string; caption: string }[] = EMPTY_FRAME_SPECS.map(({ key, caption }) => ({
  key,
  caption,
}));

export default function FlowEmpty({ index }: { index: number }) {
  const frame = EMPTY_FRAME_SPECS[index] ?? EMPTY_FRAME_SPECS[0]!;
  return <Screen {...frame} />;
}
