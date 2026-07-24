"use client";

import * as React from "react";
import { Clock, Users } from "lucide-react";

/**
 * DEV mockup — walk-in status-bar NUMBER, renewed (owner 2026-07-24: "I don't like the number
 * how it looks", pointing at the "55–70 Min" RANGE). Same pill shape; only the WAIT number
 * changes — all SINGLE numbers, no range. English only (mockup rule). Sample data (55–70 -> ~62).
 */
const GREEN = "#1F8900";
const AHEAD = 5;

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: GREEN, animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GREEN }} />
    </span>
  );
}
const PILL = "flex items-center gap-3 rounded-[20px] border border-s-border bg-white shadow-whisper px-5 py-3.5";

/* Reusable bar; only the middle wait node swaps. */
function Bar({ wait }: { wait: React.ReactNode }) {
  return (
    <div className={PILL}>
      <span className="inline-flex shrink-0 items-center gap-2"><Dot /><span className="font-display text-[14px] font-semibold tracking-[-.01em]" style={{ color: GREEN }}>Open</span></span>
      <span className="h-4 w-px shrink-0 bg-s-border" />
      <span className="inline-flex min-w-0 items-center gap-1.5 text-s-ink"><Clock className="h-4 w-4 shrink-0 text-s-ink-2" />{wait}</span>
      <span className="ml-auto inline-flex items-center gap-1 text-s-ink-2"><Users className="h-3.5 w-3.5" /><span className="font-body text-[12px] tabular-nums">{AHEAD} ahead</span></span>
    </div>
  );
}

function Row({ tag, name, note, rec, children }: { tag: string; name: string; note: string; rec?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-6">
      <div className="mb-2 flex items-center gap-2">
        <span className={`grid h-6 w-6 place-items-center rounded-full font-display text-[13px] font-bold ${rec ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink"}`}>{tag}</span>
        <span className="font-display text-[16px] font-semibold text-s-ink">{name}</span>
        {rec && <span className="rounded-full bg-s-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Pick</span>}
      </div>
      <p className="mb-3 font-body text-[13px] leading-relaxed text-s-ink-2">{note}</p>
      {children}
    </section>
  );
}

export default function WalkinNumberOptions() {
  return (
    <main className="mx-auto min-h-screen max-w-[440px] bg-white px-4 py-8">
      <h1 className="font-display text-[23px] font-bold tracking-[-.02em] text-s-ink">Walk-in wait number, renewed</h1>
      <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
        Same bar, only the wait number changes. The problem is the range (&quot;55&ndash;70 min&quot; reads as a
        guess), so every option below is a SINGLE number. Pick a letter and I&apos;ll wire only that into the
        live bar. My pick: <span className="font-semibold text-s-ink">A</span> &mdash; one soft round number is
        the calmest and matches how ride/delivery ETAs read.
      </p>

      <div className="mt-6">
        <p className="mb-2 font-body text-[12px] font-semibold uppercase tracking-wide text-s-ink-3">Now (the range you don&apos;t like)</p>
        <Bar wait={<span className="font-display text-[15px] font-semibold tabular-nums tracking-[-.01em]">55&ndash;70 min</span>} />
      </div>

      <Row tag="A" name="Soft round" rec note="One rounded estimate, friendly. Reads like an ETA ('about an hour'), never a false-precise range.">
        <Bar wait={<span className="font-display text-[15px] font-semibold tabular-nums tracking-[-.01em]">~1 h</span>} />
      </Row>
      <Row tag="B" name="Single minutes" note="One number in minutes. More precise than 'A', still no range.">
        <Bar wait={<span className="font-display text-[15px] font-semibold tabular-nums tracking-[-.01em]">~60 min</span>} />
      </Row>
      <Row tag="C" name="Ceiling" note="Honest worst-case: you'll wait AT MOST this. Sets expectations low, then beats them.">
        <Bar wait={<span className="font-display text-[15px] font-semibold tabular-nums tracking-[-.01em]">up to 70 min</span>} />
      </Row>
      <Row tag="D" name="Qualitative" note="No minutes at all, just a bracket. Calmest, but least specific.">
        <Bar wait={<span className="font-display text-[15px] font-semibold tracking-[-.01em]">under 1 h</span>} />
      </Row>
      <div className="h-16" />
    </main>
  );
}
