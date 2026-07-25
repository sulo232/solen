"use client";

// exists-check: net-new /dev support component (`npm run exists "home imagery"` = 0 hits). Crops its
// children to a fixed 390x844 box , no drawn phone bezel/status-bar/notch/home-indicator, per the
// owner's 2026-07-21 "no fake phone" call (real-component-gate.py / no-fake-phone-gate.py lineage):
// this is a comparison CROP BOUNDARY, not simulated device chrome. So the owner judges the FIRST
// VIEWPORT only, exactly like the 4.66% baseline was measured.
//
// Measures the REAL rendered photo area on mount using the SAME method as scripts/check-geometry.mjs's
// F2 IMAGERY floor: any <img> plus any element with a CSS backgroundImage url(), clipped to the frame,
// deduped so a bg-image container wrapping an <img> only counts once. The number is computed from the
// live DOM every time, not hand-typed, so the claim is checkable rather than asserted.

import * as React from "react";
import { cn } from "@/lib/utils";

const FRAME_W = 390;
const FRAME_H = 844;
const FLOOR_PCT = 33;

function measureImageryPct(frame: HTMLElement): number {
  const frameRect = frame.getBoundingClientRect();
  const frameArea = frameRect.width * frameRect.height;
  if (frameArea <= 0) return 0;

  const all = Array.from(frame.querySelectorAll<HTMLElement>("*"));
  const candidates: { el: HTMLElement; area: number }[] = [];
  for (const el of all) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
    const isImg = el.tagName.toLowerCase() === "img";
    const hasBgImage = /url\(/.test(style.backgroundImage || "");
    if (!isImg && !hasBgImage) continue;
    const r = el.getBoundingClientRect();
    const left = Math.max(r.left, frameRect.left);
    const top = Math.max(r.top, frameRect.top);
    const right = Math.min(r.right, frameRect.right);
    const bottom = Math.min(r.bottom, frameRect.bottom);
    const w = Math.max(0, right - left);
    const h = Math.max(0, bottom - top);
    const area = w * h;
    if (area > 0) candidates.push({ el, area });
  }

  // Dedupe nested matches: an <img> inside a bg-image container counts once, not twice.
  const set = new Set(candidates.map((c) => c.el));
  let sum = 0;
  for (const { el, area } of candidates) {
    let ancestor = el.parentElement;
    let nested = false;
    while (ancestor) {
      if (set.has(ancestor)) {
        nested = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    if (!nested) sum += area;
  }

  return (sum / frameArea) * 100;
}

export function ImageryFrame({ children }: { children: React.ReactNode }) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [pct, setPct] = React.useState<number | null>(null);

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setPct(measureImageryPct(frame));
    };

    run();
    // Re-measure once more shortly after mount to cover web-font swap / late layout settle. The photo
    // elements themselves are pre-sized (fixed height or aspect-ratio boxes), so the measurement itself
    // does not depend on image bytes finishing download, only on layout having run.
    const t = window.setTimeout(run, 300);
    const ro = new ResizeObserver(run);
    ro.observe(frame);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [children]);

  const pass = pct !== null && pct >= FLOOR_PCT;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-[4px] border border-s-border bg-white"
        style={{ width: FRAME_W, height: FRAME_H }}
      >
        {children}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-body text-[13px]">
        <span className="text-s-ink-3">
          {FRAME_W}×{FRAME_H} first viewport
        </span>
        <span className="font-semibold text-s-ink tabular-nums">
          {pct === null ? "measuring…" : `${pct.toFixed(2)}% photographic`}
        </span>
        <span className="text-s-ink-3">(floor {FLOOR_PCT}%)</span>
        {pct !== null && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
              pass ? "bg-s-success-bg text-s-success" : "bg-s-love-soft text-s-love-deep",
            )}
          >
            {pass ? "PASS" : "FAIL"}
          </span>
        )}
      </div>
    </div>
  );
}
