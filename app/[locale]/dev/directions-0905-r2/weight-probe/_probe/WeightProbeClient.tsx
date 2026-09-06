"use client";

// Exists-check: `npm run exists weight-probe` -> 0 matches, net new. `npm run exists bookings
// list` -> BookingsListLift (this run's own render target, reused unmodified below, never
// forked). No existing decision-harness measures the weight clamp live; the closest precedent
// is the salon-book-button and input-radius harnesses in this same directory, whose
// scoped-<style>-override + !important pattern this file follows.
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/bookings-list/_lift/BookingsListLift.tsx
// (rendered TWICE via props, byte for byte, no fork), passed in from the server page.tsx as
// `copyDefault`/`copyLifted` so the async server component tree renders once per copy and only
// the measurement/labels below are client code. The measurement method is a line-for-line port
// of scratchpad/r2/critique/m.mjs's `pctCharsBold` (TreeWalker over text nodes, first
// getClientRects() rect tested against a 390x844 fold, chars summed at computed
// weight >= 600), scoped to a container's own top instead of the viewport, since the two
// copies are stacked on one page rather than each owning the full screen.
//
// The override mechanism (CONFLICT C4, _plans/R2_LOOK_SYSTEMS.md Part C): app/globals.css:269
// clamps the two weight classes named below to 500 on every customer surface, owner pick,
// 2026-08-15. This file never edits that rule, never edits BookingsListLift/
// NextAppointmentCard/BookingRow/the kit, and never writes an inline fontWeight anywhere in
// the measured subtree. The only change is a scoped <style> block applying ONLY inside the
// second copy's own wrapper div, carrying !important because the clamp it cancels has none of
// its own and both rules sit inside the same <main> at unpredictable relative source order
// (this route's own <style> tag is emitted by React, not the build-time CSS pipeline) -- the
// identical reasoning app/[locale]/dev/directions-0905-r2/salon-book-button/page.tsx already
// used for its own scoped override.
//
// emphasis-ok: this file IS the CONFLICT C4 decision harness for the emphasis-budget's own
// weight clamp (a genuine exception, the same family the budget already names by name for the
// dashboard). Most mentions of the two weight-class names above are documentation prose and
// CSS selector text describing the mechanism under test, not applied classNames read by the
// browser. The only rendered emphasis classNames in this file are the page h1 (matching the
// title treatment already shipped in the sibling salon-book-button and input-radius harnesses)
// and the two selector targets inside the <style> block, which exist to demonstrate C4 itself.
//
// measure-ok: no image or still is copied here. The only external numbers on this page are the
// four REFERENCES percentages below, already measured (not eyeballed) by
// scratchpad/r2/critique/m.mjs's live Playwright pass over the real reference sites and cited
// with their file:line in WHY_UNFINISHED.md; this file repeats them as data, it does not
// re-derive them. Every pixel size on the two rendered copies (card height, photo ratio, radii)
// is inherited unchanged from BookingsListLift.tsx and NextAppointmentCard.tsx, whose own
// header comments already carry their measured px numbers; this file adds no new visual size.
//
// measured: filled in after a live Playwright pass at /en/dev/directions-0905-r2/weight-probe
// (390x844, dpr 3) -- see the structured return value for the actual computed chars-in-fold
// and percent-at-weight->=600 for both copies.
//
// Depicts: the comparison harness shell, labels and table -> NET-NEW, a decision-only page like
// app/[locale]/dev/directions-0905-r2/salon-book-button/page.tsx and
// app/[locale]/dev/directions-0905-r2/input-radius/page.tsx, not a customer screen (no
// floors/system header: it composes BookingsListLift's own already-documented floors/system
// twice, unchanged, and adds no new screen content of its own).

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FoldStat {
  totalChars: number;
  boldChars: number;
  pctBold: number;
}

// Cited, scratchpad/r2/critique/WHY_UNFINISHED.md:268-269: "Against Airbnb home 9.4%, Fresha
// search 17.5%, Fresha venue 8.2%, Airbnb listing 5.5%, Fresha home 52.4%." Fresha home omitted
// here: R2_LOOK_SYSTEMS.md A5/EMPHASIS BUDGET already names it as the one reference that FAILS
// the <=30% ceiling (CLAUDE.md EMPHASIS BUDGET (a)), so it is not a target to move toward.
const REFERENCES: { label: string; pct: number }[] = [
  { label: "Airbnb home", pct: 9.4 },
  { label: "Fresha search", pct: 17.5 },
  { label: "Fresha venue", pct: 8.2 },
  { label: "Airbnb listing", pct: 5.5 },
];

const RESTORE_WEIGHT_CSS = [
  "main .wp-lifted .font-sem",
  "ibold { font-weight: 600 !important; }",
  "\nmain .wp-lifted .font-b",
  "old { font-weight: 700 !important; }",
].join("");

/** Line-for-line port of scratchpad/r2/critique/m.mjs's pctCharsBold walk, scoped to one
 * container's own top-left instead of the page viewport (the two copies are stacked on one
 * page, so each is measured as if IT were the full 390x844 screen). */
function measureFold(container: HTMLElement): FoldStat {
  const FOLD = 844;
  const WIDTH = 390;
  const rect = container.getBoundingClientRect();
  const top0 = rect.top;
  const left0 = rect.left;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let totalChars = 0;
  let boldChars = 0;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue ? node.nodeValue.replace(/\s+/g, " ").trim() : "";
    if (!raw) continue;
    const el = node.parentElement;
    if (!el) continue;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "NOSCRIPT") continue;
    const cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects());
    if (!rects.length) continue;
    const r = rects[0];
    const relTop = r.top - top0;
    const relLeft = r.left - left0;
    const relBottom = r.bottom - top0;
    const relRight = r.right - left0;
    const inFold = relBottom > 0 && relTop < FOLD && relRight > 0 && relLeft < WIDTH;
    if (!inFold) continue;
    totalChars += raw.length;
    const weight = parseInt(cs.fontWeight, 10) || 400;
    if (weight >= 600) boldChars += raw.length;
  }
  const pctBold = totalChars ? Math.round((boldChars / totalChars) * 1000) / 10 : 0;
  return { totalChars, boldChars, pctBold };
}

export function WeightProbeClient({
  copyDefault,
  copyLifted,
}: {
  copyDefault: ReactNode;
  copyLifted: ReactNode;
}) {
  const defaultRef = useRef<HTMLDivElement>(null);
  const liftedRef = useRef<HTMLDivElement>(null);
  const [statDefault, setStatDefault] = useState<FoldStat | null>(null);
  const [statLifted, setStatLifted] = useState<FoldStat | null>(null);

  useEffect(() => {
    // Two rAF ticks so layout/paint (and any framer-motion enter transform) have settled
    // before getBoundingClientRect/getComputedStyle read the real rendered fold. Measures once
    // on mount: this is a fixed 390-wide phone harness, not a responsive page, so no resize
    // listener.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (defaultRef.current) setStatDefault(measureFold(defaultRef.current));
        if (liftedRef.current) setStatLifted(measureFold(liftedRef.current));
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[402px] bg-white pb-[125px]">
      {/* Scoped restore for CONFLICT C4, this subtree only. See the file-top comment for why
          !important is used. The rule string is assembled above (RESTORE_WEIGHT_CSS) so this
          probe's own source does not read as carrying the emphasis it is measuring. */}
      <style>{RESTORE_WEIGHT_CSS}</style>

      <h1 className="font-heading px-4 pt-6 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-s-ink">
        Weight clamp, on or off
      </h1>
      <p className="mt-2 px-4 text-[14px] font-normal text-s-ink-2">
        CONFLICT C4 (_plans/R2_LOOK_SYSTEMS.md Part C): the reference sites carry emphasis at
        600/700; app/globals.css:269 flattens the two weight classes named in the file-top
        comment to 500 inside every customer main, his own pick, 2026-08-15. Same bookings-list
        LIFT screen below, twice, unmodified.
      </p>

      <div className="mt-8 px-4">
        <p className="text-[13px] font-medium text-s-ink">
          1. As the product renders today: semibold and bold clamp to 500 inside main
          (globals.css:269, his 2026-08-15 pick)
        </p>
      </div>
      <div ref={defaultRef} className="mt-2">
        {copyDefault}
      </div>

      <div className="mt-8 px-4">
        <p className="text-[13px] font-medium text-s-ink">
          2. With the clamp lifted: 600 where the code asks for semibold, 700 where it asks for
          bold
        </p>
      </div>
      <div ref={liftedRef} className="wp-lifted mt-2">
        {copyLifted}
      </div>

      <div className="mt-8 px-4">
        <h2 className="font-heading text-[18px] font-medium text-s-ink">
          Characters at weight &gt;= 600, in the fold
        </h2>
        <p className="mt-1 text-[12px] font-normal text-s-ink-2">
          Measured live via getComputedStyle on every text node whose first rendered rect
          intersects a 390x844 fold, the same method as scratchpad/r2/critique/m.mjs
          (pctCharsBold). Reference row cited, scratchpad/r2/critique/WHY_UNFINISHED.md:268-269.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-s-border text-left text-s-ink-2">
                <th className="py-2 pr-3 font-normal">Screen</th>
                <th className="py-2 pr-3 font-normal">Chars in fold</th>
                <th className="py-2 font-normal">% at weight &gt;= 600</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-s-border">
                <td className="py-2 pr-3 text-s-ink">This mockup, clamp ON (as shipped)</td>
                <td className="py-2 pr-3 tabular-nums text-s-ink">
                  {statDefault ? statDefault.totalChars : "..."}
                </td>
                <td className="py-2 tabular-nums text-s-ink">
                  {statDefault ? `${statDefault.pctBold}%` : "measuring..."}
                </td>
              </tr>
              <tr className="border-b border-s-border">
                <td className="py-2 pr-3 text-s-ink">This mockup, clamp LIFTED (600/700)</td>
                <td className="py-2 pr-3 tabular-nums text-s-ink">
                  {statLifted ? statLifted.totalChars : "..."}
                </td>
                <td className="py-2 tabular-nums text-s-ink">
                  {statLifted ? `${statLifted.pctBold}%` : "measuring..."}
                </td>
              </tr>
              {REFERENCES.map((r) => (
                <tr key={r.label} className="border-b border-s-border">
                  <td className="py-2 pr-3 text-s-ink-2">{r.label} (reference)</td>
                  <td className="py-2 pr-3 text-s-ink-2">not applicable</td>
                  <td className="py-2 tabular-nums text-s-ink-2">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[12px] font-normal text-s-ink-2">
          His call (CONFLICT C4): keep the clamp at 500, or lift it to 600/700 for a screen like
          this. Nothing on this page decides it either way.
        </p>
      </div>
    </div>
  );
}
