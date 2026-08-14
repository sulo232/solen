/**
 * /dev/mock/versions/business-teaser , the last grey box on the home page, with and without it.
 *
 * Owner 2026-08-14: "i never want this anywhere". Every other grey tile behind a glyph is gone; this
 * one is different enough to ask about, because deleting it removes a whole slot rather than a
 * decoration around an icon.
 *
 * WHY IT IS THERE, which is the part worth knowing: on 2026-05-26 he removed the real illustration
 * from this section (V3-D166, "real illustration removed per user") and the code left a grey square
 * with an image glyph "while a replacement is in flight". The replacement never came and nothing was
 * tracking it, so a temporary state has been the design for two and a half months.
 *
 * It is NOT replaced with another picture on purpose: a baked-in decorative image is refused by the
 * imagery floor and by the no-decorative-image gate, which say that slot has to be real salon
 * content or nothing. The old files are still under public/illustrations/business/ if that reverses.
 *
 * measured, on the rendered home page at 402pt: the section is 723pt tall today and 325pt with the
 * box gone, so this removes 398pt of empty grey, more than half the section. measure-ok.
 *
 * exists-check: `npm run exists "business teaser placeholder"` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { HIDE_APP_CHROME, useOwnTheScreen } from "../../_shell/MockShell";

const STOPS = [
  { label: "Now", note: "grey box, 723pt tall", src: "/_mockups/_assets/versions/business-teaser/teaser-Now.png" },
  { label: "1", note: "box gone, text left, 325pt", src: "/_mockups/_assets/versions/business-teaser/teaser-1.png" },
  { label: "2", note: "box gone, text centred, 325pt", src: "/_mockups/_assets/versions/business-teaser/teaser-2.png" },
];

export default function BusinessTeaserVersionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [pick, setPick] = React.useState(0);
  useOwnTheScreen();
  const stop = STOPS[pick]!;
  return (
    <div data-mock-root className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stop.src} alt={stop.label} className="block w-full" />
      <div className="h-28" />
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
                "h-11 rounded-full px-5 font-heading text-[15px] " +
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
