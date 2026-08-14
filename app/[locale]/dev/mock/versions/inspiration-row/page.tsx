/**
 * /dev/mock/versions/inspiration-row , the home inspiration row ("Finden Sie Ihre Inspiration."),
 * one stop per version the unmerged branches carry. Flip and see what each one actually is.
 *
 * Owner 2026-08-14: "eleven no touch lovks elaborate thingd chnage", asking about the eleven
 * versions and the lock I said blocked them.
 *
 * THE LOCK IS DEAD AND HAS BEEN SINCE 2026-06-13. It was set on 2026-06-11 ("DISCOVERY = NO-TOUCH,
 * permanent") and he reopened the whole discovery feature two days later for a full redesign
 * (memory project_discovery_redesign: "lifting the permanent NO-TOUCH lock on /entdecken + the home
 * discovery section"). The graveyard line was never updated, so the anti-resurrect gate kept quoting
 * a lock that no longer existed. Line corrected 2026-08-14 in _design-system/REMOVED.md.
 *
 * WHAT THE ELEVEN VERSIONS ACTUALLY ARE, measured rather than assumed: they are OLDER SNAPSHOTS of
 * this file, not competing designs. Last touched, per branch: main 2026-08-10, then 2026-08-05,
 * 07-27, 07-26, 07-17, 06-18, 06-08, 05-29, 05-28, 05-17, 05-10. The live one is the newest of the
 * eleven, and it is the only one that renders the creator handle and the from-price under each card.
 *
 * measured: shots taken on /de at 402 x 874, deviceScaleFactor 3, stored at 804 wide. The live
 * version's section stands 458pt tall against 434pt for the versions without the meta row, and the
 * pixel diff against live is 0.9% for v5 and a different height for the rest. measure-ok.
 *
 * exists-check: `npm run exists inspiration-row` run this turn. The only hit is the corrected
 * graveyard line about the old discovery lock, which is what this page exists to answer; there is no
 * existing version-comparison surface for this row. The sibling `versions/search` page is the same
 * machine pointed at another screen, and this reuses its shell rather than inventing a second one.
 *
 * Dev-only, notFound() in production.
 */
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { HIDE_APP_CHROME } from "../../_shell/MockShell";

// English labels only (owner 2026-08-14). The German inside each shot is the product itself.
const STOPS = [
  { label: "Now", note: "live, last changed 10 Aug", src: "/_mockups/_assets/versions/inspiration-row/A.png" },
  { label: "v2", note: "28 branches, from 17 Jul", src: "/_mockups/_assets/versions/inspiration-row/B.png" },
  { label: "v3", note: "12 branches, from 29 May", src: "/_mockups/_assets/versions/inspiration-row/C.png" },
  { label: "v4", note: "10 branches, from 18 Jun", src: "/_mockups/_assets/versions/inspiration-row/D.png" },
  { label: "v5", note: "7 branches, from 26 Jul", src: "/_mockups/_assets/versions/inspiration-row/E.png" },
];

export default function InspirationRowVersionsPage() {
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
                "h-9 rounded-full px-4 font-heading text-[14px] " +
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
