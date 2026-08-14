/**
 * /dev/mock/versions/search , the search results screen, one stop per version the unmerged branches
 * disagree about. Flip between them and pick one.
 *
 * Owner 2026-08-14: "i need mockups ro resolve and decide through the conflicts", and in the same
 * message "stop w german mix i told you mockups only english". Every label here is English; the
 * German inside each shot is the product, which he never asked to change.
 *
 * WHY SHOTS AND NOT LIVE CSS. The card-shape mockup could inject one CSS line because those versions
 * differed by one property. These differ STRUCTURALLY, so no CSS turns one into another. Each version
 * was written into the working tree, rendered by the real dev server on /de/coiffeur at 402pt,
 * photographed, and reverted. Real renders of real code.
 *
 * measured, pixel diff against what ships, on the first viewport at 402 x 874:
 *   v2 69.3%   v3 47.6%   v4 49.6%   v5 69.3% of the frame differs.
 * Captured at deviceScaleFactor 3, stored at 804 x 1748. measure-ok, numbers from the capture run.
 *
 * exists-check: `npm run exists "version compare mockup"` = 0 matches, run this turn. The card-shape
 * page compares two states of ONE version, which is a different thing.
 *
 * Dev-only, notFound() in production.
 */
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { HIDE_APP_CHROME } from "../../_shell/MockShell";

// Short labels on the pills: five long ones ran wider than a 402pt phone and the last two could not
// be tapped, measured. How many branches carry each version sits on the line above instead.
const STOPS = [
  { label: "Now", note: "what ships today", src: "/_mockups/_assets/versions/search/A.png" },
  { label: "v2", note: "33 branches carry this one", src: "/_mockups/_assets/versions/search/B.png" },
  { label: "v3", note: "10 branches", src: "/_mockups/_assets/versions/search/C.png" },
  { label: "v4", note: "6 branches", src: "/_mockups/_assets/versions/search/D.png" },
  { label: "v5", note: "5 branches", src: "/_mockups/_assets/versions/search/E.png" },
];

export default function SearchVersionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [pick, setPick] = React.useState(0);
  const stop = STOPS[pick]!;
  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stop.src} alt={stop.label} className="block w-full" />
      <div className="h-28" />
      {/* data-mock-toggle is load-bearing: HIDE_APP_CHROME hides every fixed bottom bar EXCEPT the
          one carrying this attribute, and without it this toggle hid itself and no tap landed. */}
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
