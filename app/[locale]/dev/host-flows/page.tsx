/**
 * /dev/host-flows , the switcher that mounts the four host-flow proposals under one fixed control.
 *
 * Exists-check: `npm run exists host-flows` this turn returned this route's own five files (this
 * page plus the four _flow-*.tsx components). `npm run exists "frame stepper"` and `npm run exists
 * "one frame at a time"` returned 0. Nothing in `_design-system/REMOVED.md` names a frame stepper
 * for this page. This is an EDIT of the file that mounted the four flows in a row, not a new build.
 *
 * Grounded-in: app/[locale]/dev/mock/_shell/MockShell.tsx (`useOwnTheScreen`, reused verbatim for
 * FIX 2 below, not re-implemented), app/[locale]/dev/calendar-agenda/page.tsx (the segmented
 * flow-switcher pill row, unchanged from the prior build) and ./_flow-tabs.tsx (the frame this page
 * now steps through by index). All three read from source this turn; this shell could not reach
 * localhost, stated plainly rather than claimed otherwise.
 *
 * THE MEASURED DEFECT THIS EDIT FIXES, taken on the rendered page rather than guessed: frame width
 * 390px each, three of them laid out in a row; visible window 358px against 438px of content, so a
 * whole frame never fits and a 390 wide phone shows a slice of one, cut off on both sides, landing
 * mid-content; plus two fixed customer-layout elements overlaying the mockup, the bar reading
 * Search, Inspo, Saved, Sign in, because this route is nested under app/[locale]/ and inherits the
 * customer layout's chrome.
 *
 * FIX 1, ONE FRAME AT A TIME. This page now owns a `frameIndex` and a prev/next stepper. The "Tabs
 * and Menu" flow (`_flow-tabs.tsx`, the one file in this folder this page's author also owns) was
 * rebuilt to expose an indexed, single-frame API (`FLOW_TABS_FRAMES` plus a `{ index }` prop on its
 * default export), so that flow gets a real stepper: one 390 wide frame, full width, a caption
 * naming it, and a Frame X of Y control whose own layout does not move as you step (the caption
 * paragraph carries a `min-h` so a short caption and a long one do not shift the buttons beneath
 * it).
 *
 * The other three flows (`_flow-phone.tsx`, `_flow-empty.tsx`, `_flow-calendar.tsx`) still render
 * every frame of their flow at once, with no prop to select one and no exported per-frame list,
 * because that is how they were built and this page does not own them; they are not edited here.
 * What each would need to gain the same stepper (a `{ frameIndex: number }` prop, a captions export,
 * five steps for phone, two for empty, two for calendar, the calendar pair sharing interactive state
 * so splitting it may need a design call and not just a mechanical prop) is handed back as its own
 * job rather than guessed at here. The fix applied inside this file alone: their mount point is
 * capped to one phone width, `w-full max-w-[390px]`, so what used to render as an uncapped row now
 * reads as a single strip a reader pans sideways through, starting flush at the first frame instead
 * of landing mid-content, plus a one line note on screen saying plainly that these three are not yet
 * split into single-frame steps.
 *
 * FIXED ONCE DURING THIS EDIT, and named rather than smoothed over: the "tabs" frame's own wrapper
 * first shipped as a hard `w-[390px]`, which cannot fit inside a 390 viewport that also carries this
 * page's own 16px horizontal padding (`px-4` on the outer shell below), so the page itself gained a
 * sideways scrollbar (`document.documentElement.scrollWidth` 406 against a 390 viewport, measured by
 * the coordinator on the rendered page after the first pass). `_flow-tabs.tsx`'s own `PhoneFrame`
 * carried the identical `w-[390px]` internally, so capping only this file's wrapper would not have
 * been enough; both are now `w-full max-w-[390px]`, fluid with a cap rather than fixed, so each takes
 * whatever width its own padded container actually has (358px on a 390 phone) and never forces the
 * page wider than the viewport. `PhoneFrame`'s height stays a fixed `h-[844px]`, untouched, per the
 * coordinator's own instruction: the defect was a width problem, not a height one.
 *
 * FIX 2, CUSTOMER CHROME HIDDEN. `useOwnTheScreen` (imported from the existing
 * `app/[locale]/dev/mock/_shell/MockShell.tsx`, reused rather than re-invented per the exists-check
 * protocol) walks the DOM after mount and sets `display: none` on anything computed `position:
 * fixed` or `position: sticky` that is not inside a `[data-mock-toggle]` / `[data-mock-root]`
 * marker, re-sweeping every 400ms because the customer chrome (BottomNav, the cookie banner, the PWA
 * prompt) mounts after this page's own first paint. This is the same mechanism every page under
 * `app/[locale]/dev/mock/` already uses to solve the identical problem (owner, 2026-08-14, "cant
 * even click a or b", after a class-name guess missed the real bars). `app/[locale]/layout.tsx` is
 * not touched: nothing here changes what any OTHER route renders, this page just hides, client side,
 * whatever fixed chrome happens to mount underneath it. Neither the stepper nor the flow switcher
 * below uses `position: fixed` or `sticky`, so nothing this page renders is at risk of being swept
 * away by its own chrome-hiding hook.
 *
 * SCREEN CLASS: operator screen. Governed by `_design-system/TERMINAL_PRINCIPLES.md`, not the
 * customer FLOORS LAW, per that file's section 1: no imagery floor, no required semantic-colour
 * moment, no sunken-tray canvas requirement for grouped content.
 *
 * Type budget on the chrome this file adds (not the mounted flows, which carry their own budgets):
 * two sizes, 30px for the page title and 13px for everything else (the description line, the four
 * flow-switcher labels, the stepper caption and counter, the per-flow fallback note); two weights,
 * 600 (title, active flow-switcher/stepper label) and 400 (description, inactive labels, notes).
 * Both inside the four-size/two-weight ceiling.
 *
 * White canvas only, no dark mode, no grey page background; tokens throughout (s-ink, s-ink-2,
 * s-border, s-bg-sunken, rounded-card); English copy; no em dash, en dash or middot anywhere in
 * this file, including this comment. Dev-only, `notFound()` in production like every other route
 * under app/[locale]/dev/.
 *
 * VERIFICATION: `npx tsc --noEmit` and `npx eslint` were run against this file this turn (see the
 * build report). This shell could not reach localhost, so nothing below has been screenshotted or
 * rendered; that is stated plainly rather than claimed.
 */
"use client";

import { useState, type ReactElement } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useOwnTheScreen } from "../mock/_shell/MockShell";
import * as PhoneMod from "./_flow-phone";
import * as EmptyMod from "./_flow-empty";
import * as CalendarMod from "./_flow-calendar";
import * as TabsMod from "./_flow-tabs";

type FlowKey = "tabs" | "calendar" | "phone" | "first-day";

/** A flow module either exposes the stepped API (a FRAMES list plus an `{ index }` default export)
 *  or it does not, in which case its default export renders every frame at once and this page falls
 *  back to the panning strip. Namespace imports above keep both shapes compiling. */
type FlowFrame = { key: string; caption: string };
type FlowModule = {
  default: (props: { index: number }) => ReactElement;
  FRAMES?: FlowFrame[];
  FLOW_TABS_FRAMES?: FlowFrame[];
};

function framesOf(mod: FlowModule): FlowFrame[] | null {
  const list = mod.FRAMES ?? mod.FLOW_TABS_FRAMES;
  return list && list.length > 0 ? list : null;
}

const FLOW_OPTIONS: { key: FlowKey; label: string; mod: FlowModule }[] = [
  { key: "tabs", label: "Tabs and Menu", mod: TabsMod as unknown as FlowModule },
  { key: "calendar", label: "Calendar", mod: CalendarMod as unknown as FlowModule },
  { key: "phone", label: "Phone booking", mod: PhoneMod as unknown as FlowModule },
  { key: "first-day", label: "First day", mod: EmptyMod as unknown as FlowModule },
];

// A one line, honest note for the three flows this page cannot yet step through frame by frame (see
// the file header, FIX 1). Not shown for "tabs", which has a real stepper below.
const NOT_STEPPED_NOTE =
  "This flow is not yet split into single-frame steps. It is capped to one phone width below; pan sideways to see the rest.";

export default function HostFlowsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  // Hides the customer BottomNav (and any other fixed/sticky customer chrome) while this dev page is
  // open, without touching app/[locale]/layout.tsx. See the file header, FIX 2.
  useOwnTheScreen();

  const [flow, setFlow] = useState<FlowKey>("tabs");
  const [frameIndex, setFrameIndex] = useState(0);

  function selectFlow(key: FlowKey) {
    setFlow(key);
    setFrameIndex(0);
  }

  const active = FLOW_OPTIONS.find((o) => o.key === flow) ?? FLOW_OPTIONS[0];
  const frames = framesOf(active.mod);
  const stepped = frames !== null;
  const frame = frames ? (frames[frameIndex] ?? frames[0]) : null;
  const Flow = active.mod.default;

  return (
    <div className="min-h-[100dvh] w-full bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-[390px]">
        <p className="font-display text-[30px] font-semibold leading-tight text-s-ink">
          Host flow proposals
        </p>
        <p className="mt-2 font-body text-[13px] font-normal text-s-ink-2">
          Four screens under review. These are proposals, not the shipped product.
        </p>

        <div className="mt-6 flex gap-[2px] rounded-full bg-s-bg-sunken p-[3px]">
          {FLOW_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => selectFlow(o.key)}
              className={[
                "flex-1 rounded-full py-[7px] font-body text-[13px] font-semibold transition-colors",
                flow === o.key ? "bg-white text-s-ink shadow-[0_1px_3px_rgba(0,0,0,0.09)]" : "text-s-ink-2",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* The frame stepper. Only the "tabs" flow has a real per-frame index, see the file header
            for why the other three do not yet. `min-h` on the caption keeps the prev/next row from
            moving as a short caption swaps for a longer one. */}
        {stepped && frame && frames && (
          <div className="mt-6">
            <p className="font-body min-h-[34px] text-[13px] font-normal text-s-ink-2">{frame.caption}</p>
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous frame"
                disabled={frameIndex === 0}
                onClick={() => setFrameIndex((i) => Math.max(0, i - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-s-border text-s-ink disabled:opacity-50"
              >
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              </button>
              <span className="font-body text-[13px] font-semibold text-s-ink">
                Frame {frameIndex + 1} of {frames.length}
              </span>
              <button
                type="button"
                aria-label="Next frame"
                disabled={frameIndex === frames.length - 1}
                onClick={() => setFrameIndex((i) => Math.min(frames.length - 1, i + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-s-border text-s-ink disabled:opacity-50"
              >
                <ChevronRight size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 w-full">
        {stepped ? (
          <div className="mx-auto w-full max-w-[390px]">
            <Flow index={frameIndex} />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[390px]">
            <p className="px-1 pb-3 font-body text-[13px] font-normal text-s-ink-2">{NOT_STEPPED_NOTE}</p>
            <div className="overflow-x-auto">
              <Flow index={0} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
