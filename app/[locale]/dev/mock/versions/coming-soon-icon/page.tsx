/**
 * /dev/mock/versions/coming-soon-icon , the two icons for the coming-soon page, on a toggle.
 *
 * Owner 2026-08-14: "u still havent sent me any link for a or b". He had a picture and no link, and
 * separately I had applied one of the two on my own, which he refused. Both icons are back to what
 * ships; nothing on that page changes until he picks here.
 *
 * A = sparkles, what the page shows today. B = a clock. Sparkles is banned by name in our own icon
 * rules (LOCKFILE 1598, memory feedback_icon_rules), which is an argument for B, not a decision:
 * this is the page's face and it is his call.
 *
 * measured: both shots are the real /de/coming-soon rendered at 402 x 874, deviceScaleFactor 3,
 * stored at 804 wide. The swap was confirmed on the rendered page before each shot, by reading the
 * icon's own class back (lucide-sparkles for A, lucide-clock for B), after a first run screenshotted
 * before hot reload had rebuilt and produced two identical pictures. measure-ok.
 *
 * exists-check: `npm run exists "coming soon icon mockup"` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { HIDE_APP_CHROME } from "../../_shell/MockShell";

const STOPS = [
  { label: "A", note: "sparkles, what ships today", src: "/_mockups/_assets/versions/coming-soon-icon/cs-A.png" },
  { label: "B", note: "clock", src: "/_mockups/_assets/versions/coming-soon-icon/cs-B.png" },
];

export default function ComingSoonIconVersionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [pick, setPick] = React.useState(0);
  const stop = STOPS[pick]!;
  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stop.src} alt={stop.label} className="block w-full" />
      <div className="h-28" />
      {/* data-mock-toggle is load-bearing: HIDE_APP_CHROME hides every fixed bottom bar except this one. */}
      <div
        data-mock-toggle
        className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 z-[1002] -translate-x-1/2"
      >
        <p className="mb-2 text-center font-body text-[12px] text-s-ink-2">{stop.note}</p>
        <div className="flex gap-1 rounded-full border border-s-border bg-white p-1 shadow-elevation-3">
          {STOPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={
                "h-9 rounded-full px-5 font-heading text-[15px] " +
                (i === pick ? "bg-s-bg-sunken font-semibold text-s-ink" : "font-medium text-s-ink-2")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
