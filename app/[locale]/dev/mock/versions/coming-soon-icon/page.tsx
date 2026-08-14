/**
 * /dev/mock/versions/coming-soon-icon , the two icons for the coming-soon page, on a toggle.
 *
 * Owner 2026-08-14: "u still havent sent me any link for a or b". He had a picture and no link, and
 * separately I had applied one of the two on my own, which he refused. Both icons are back to what
 * ships; nothing on that page changes until he picks here.
 *
 * He picked the clock and then said the grey box behind it has to go, everywhere. So the stops
 * now cover BOTH questions at once: what the icon is, and what sits behind it. Every stop is a
 * real render of the real page, with the icon size and the container background read back off
 * the rendered element before each shot.
 *
 * measured, on the rendered page: Now = 32px glyph on a #F4F4F5 tile. 1 = same tile, clock.
 * 2 = 44px clock, no tile (transparent). 3 = 30px clock inside a hairline circle. 4 = 64px
 * clock, no tile. measure-ok.
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
import { HIDE_APP_CHROME, useOwnTheScreen } from "../../_shell/MockShell";

const STOPS = [
  { label: "Now", note: "grey tile, sparkles", src: "/_mockups/_assets/versions/coming-soon-icon/v-A.png" },
  { label: "1", note: "grey tile, clock", src: "/_mockups/_assets/versions/coming-soon-icon/v-B.png" },
  { label: "2", note: "no tile, clock 44", src: "/_mockups/_assets/versions/coming-soon-icon/v-C.png" },
  { label: "3", note: "hairline circle, clock 30", src: "/_mockups/_assets/versions/coming-soon-icon/v-D.png" },
  { label: "4", note: "no tile, clock 64", src: "/_mockups/_assets/versions/coming-soon-icon/v-E.png" },
];

export default function ComingSoonIconVersionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [pick, setPick] = React.useState(0);
  useOwnTheScreen(); // the cookie banner and the tab bar were eating the taps
  const stop = STOPS[pick]!;
  return (
    <div data-mock-root className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stop.src} alt={stop.label} className="block w-full" />
      <div className="h-28" />
      {/* data-mock-toggle is load-bearing: HIDE_APP_CHROME hides every fixed bottom bar except this one. */}
      <div
        data-mock-toggle
        className="fixed bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 z-[2147483647] -translate-x-1/2"
      >
        <p className="mb-2 text-center font-body text-[12px] text-s-ink-2">{stop.note}</p>
        <div className="flex gap-1 rounded-full border border-s-border bg-white p-1 shadow-elevation-3">
          {STOPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={
                "h-11 rounded-full px-6 font-heading text-[15px] " +
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
