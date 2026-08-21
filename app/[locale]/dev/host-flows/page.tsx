/**
 * /dev/host-flows , the switcher that mounts the four host-flow proposals under one fixed control.
 *
 * Exists-check: `npm run exists host-flows` this turn returned 2 matches, both components in this
 * same folder: _flow-phone.tsx (default export FlowPhone) and _flow-empty.tsx (default export
 * FlowEmpty). `npm run exists "flow switcher"` returned 0. Nothing in `_design-system/REMOVED.md`
 * names host-flows, a flow switcher, or any of the four flow files. Net-new here is only this page
 * shell: a segmented control plus the mount points. It carries no flow content of its own.
 *
 * SCREEN CLASS: operator screen. Governed by `_design-system/TERMINAL_PRINCIPLES.md`, not the
 * customer FLOORS LAW, per that file's section 1: no imagery floor, no required semantic-colour
 * moment, no sunken-tray canvas requirement for grouped content. This page has no grouped content
 * of its own to sink, only a title, one description line and a segmented control.
 *
 * THE JOB, one sentence: let the owner flip between four flow proposals from a fixed eye position,
 * so the only thing that changes on the screen is the flow itself, never the control that picked it.
 *
 * FlowTabs, FlowCalendar, FlowPhone and FlowEmpty have all landed on disk and are wired in below.
 *
 * The control is a fixed block above the content, copied in approach from the working example at
 * app/[locale]/dev/calendar-agenda/page.tsx:279-312 (segmented pill row, one active option swaps
 * the panel underneath, the control itself never re-renders on switch). Same sunken-pill grammar,
 * same white-selected-pill-plus-shadow treatment, reused rather than re-invented.
 *
 * Type budget on the chrome this file adds (not the mounted flows, which carry their own budgets):
 * two sizes, 30px for the page title and 13px for everything else (the description line, the four
 * control labels, the two placeholder captions); two weights, 600 (title, active/inactive control
 * label) and 400 (description, placeholder caption). Both inside the four-size/two-weight ceiling.
 *
 * White canvas only, no dark mode, no grey page background; tokens throughout (s-ink, s-ink-2,
 * s-border, s-bg-sunken, rounded-card); English copy; no em dash, en dash or middot anywhere in
 * this file, including this comment. Dev-only, `notFound()` in production like every other route
 * under app/[locale]/dev/.
 */
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import FlowPhone from "./_flow-phone";
import FlowEmpty from "./_flow-empty";
import FlowCalendar from "./_flow-calendar";
import FlowTabs from "./_flow-tabs";

type FlowKey = "tabs" | "calendar" | "phone" | "first-day";

const FLOW_OPTIONS: { key: FlowKey; label: string }[] = [
  { key: "tabs", label: "Tabs and Menu" },
  { key: "calendar", label: "Calendar" },
  { key: "phone", label: "Phone booking" },
  { key: "first-day", label: "First day" },
];

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mx-auto mt-8 flex min-h-[320px] w-full max-w-[390px] items-center justify-center rounded-card border border-s-border px-6 text-center">
      <p className="font-body text-[13px] font-normal text-s-ink-2">
        The {label} flow is still being written.
      </p>
    </div>
  );
}

export default function HostFlowsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [flow, setFlow] = useState<FlowKey>("tabs");

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
              onClick={() => setFlow(o.key)}
              className={[
                "flex-1 rounded-full py-[7px] font-body text-[13px] font-semibold transition-colors",
                flow === o.key ? "bg-white text-s-ink shadow-[0_1px_3px_rgba(0,0,0,0.09)]" : "text-s-ink-2",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {flow === "tabs" && <FlowTabs />}
        {flow === "calendar" && <FlowCalendar />}
        {flow === "phone" && <FlowPhone />}
        {flow === "first-day" && <FlowEmpty />}
      </div>
    </div>
  );
}
