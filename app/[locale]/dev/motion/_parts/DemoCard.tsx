"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { Play } from "lucide-react";
import { FAST_TIER_LABEL, SLOW_TIER_LABEL } from "./speeds";

/**
 * DemoCard , the shared shell every "same interaction, two speeds" demo (section 2) renders
 * inside: an index + title + one-line description, a Play trigger, the fast-tier stage then the
 * slow-tier stage (fast first, per the task brief's own order: "fast tier vs slow tier"), and a
 * one-line English verdict naming which tier fits the job and why. English chrome only (this
 * route sits under /dev, the mockup-english-gate applies to authored chrome; any real salon copy
 * inside a demo comes through as a variable, never a literal string here).
 *
 * Fast/slow stack VERTICALLY (full width each), not side by side: at the mobile-first 390px
 * target a 2-column split leaves too narrow a lane for the actual primitives (toggle, chip row,
 * sheet chrome) to render as they do in production. Stacking keeps every demo at full, honest
 * width, fast tier always first so it reads top-to-bottom as "quick flip, then a slower reveal".
 */
export function DemoCard({
  index,
  title,
  description,
  verdict,
  onPlay,
  children,
}: {
  index: number;
  title: string;
  description: string;
  /** One-line English recommendation: which tier fits this job, and why. */
  verdict: string;
  onPlay: () => void;
  children: React.ReactNode;
}) {
  const [fast, slow] = React.Children.toArray(children);
  return (
    <section className="rounded-2xl border border-s-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[12px] font-semibold text-s-ink-3">Demo {index}</p>
          <h3 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.01em] text-s-ink">
            {title}
          </h3>
          <p className="mt-1 font-body text-[13px] leading-[1.4] text-s-ink-2">{description}</p>
        </div>
        <button
          type="button"
          onClick={onPlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-s-ink text-white transition-transform duration-150 ease-glide active:scale-[0.94]"
          aria-label={`Replay demo ${index}: ${title}`}
        >
          <Play size={18} strokeWidth={2.25} className="ml-0.5" aria-hidden />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-s-bg-sunken p-3">
          <p className="font-body text-[12px] font-semibold text-s-ink">{FAST_TIER_LABEL}</p>
          <div className="mt-2">{fast}</div>
        </div>
        <div className="rounded-xl bg-s-bg-sunken p-3">
          <p className="font-body text-[12px] font-semibold text-s-accent">{SLOW_TIER_LABEL}</p>
          <div className="mt-2">{slow}</div>
        </div>
      </div>

      <p className="mt-3 font-body text-[12px] leading-[1.4] text-s-ink-2">{verdict}</p>
    </section>
  );
}
