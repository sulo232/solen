"use client";

import * as React from "react";
import { Clock, Users, Info } from "lucide-react";

/**
 * DEV mockup — walk-in status BAR content, 3 directions (owner 2026-07-24 "make me mockups...
 * I like the shape, but the content is too cluttered"). Same pill shape (rounded-[20px] border
 * shadow-whisper), 3 ways to declutter the content. English only (mockup rule). Sample data.
 */
const GREEN = "#1F8900";
const S = { low: 55, high: 70, ahead: 5 };

function Dot({ ping = true }: { ping?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {ping && <span className="absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: GREEN, animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }} />}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GREEN }} />
    </span>
  );
}

const PILL = "flex items-center gap-3 rounded-[20px] border border-s-border bg-white shadow-whisper px-5 py-3.5";

/* Current (for reference): dot + Open | clock + range | users + N ahead | (i) — 4 things */
function Current() {
  return (
    <div className={PILL}>
      <span className="inline-flex shrink-0 items-center gap-2"><Dot /><span className="font-display text-[14px] font-semibold" style={{ color: GREEN }}>Open</span></span>
      <span className="h-4 w-px shrink-0 bg-s-border" />
      <span className="inline-flex items-center gap-1.5 text-s-ink"><Clock className="h-4 w-4 text-s-ink-2" /><span className="font-display text-[15px] font-semibold tabular-nums">{S.low}–{S.high} min</span></span>
      <span className="ml-auto inline-flex items-center gap-1 text-s-ink-2"><Users className="h-3.5 w-3.5" /><span className="font-body text-[12px] tabular-nums">{S.ahead} ahead</span></span>
      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-s-ink-2"><Info className="h-[15px] w-[15px]" /></button>
    </div>
  );
}

/* A — Minimal: just status + wait. Drops the queue count + info icon. */
function OptA() {
  return (
    <div className={PILL}>
      <span className="inline-flex shrink-0 items-center gap-2"><Dot /><span className="font-display text-[14px] font-semibold" style={{ color: GREEN }}>Open</span></span>
      <span className="mx-1 text-s-ink-3">·</span>
      <span className="font-display text-[15px] font-semibold tabular-nums tracking-[-.01em] text-s-ink">{S.low}–{S.high} min</span>
      <span className="font-body text-[13px] text-s-ink-2">wait</span>
    </div>
  );
}

/* B — Wait-first: the wait is the hero, status shrinks to a labelled dot; info stays. */
function OptB() {
  return (
    <div className={PILL}>
      <Dot />
      <span className="font-display text-[16px] font-semibold tabular-nums tracking-[-.02em] text-s-ink">{S.low}–{S.high} min</span>
      <span className="font-body text-[13px] text-s-ink-2">wait · open now</span>
      <button className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-s-ink-2"><Info className="h-[15px] w-[15px]" /></button>
    </div>
  );
}

/* C — One phrase: fold queue + wait into a single natural line, keep the status + info. */
function OptC() {
  return (
    <div className={PILL}>
      <span className="inline-flex shrink-0 items-center gap-2"><Dot /><span className="font-display text-[14px] font-semibold" style={{ color: GREEN }}>Open</span></span>
      <span className="font-body text-[13.5px] text-s-ink-2"><span className="font-semibold tabular-nums text-s-ink">{S.ahead}</span> ahead · <span className="font-semibold tabular-nums text-s-ink">~1h</span> wait</span>
      <button className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-s-ink-2"><Info className="h-[15px] w-[15px]" /></button>
    </div>
  );
}

/* D — Waiting room: grounded in the waitlist-app pattern (restaurant/queue apps). The two
   facts a walk-in customer checks — the wait and the position — get real room and equal weight,
   split by a hairline; status is just the green dot, and details live behind a tap. No labels
   competing for space, no clock icon, no inline (i). */
function OptD() {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-s-border bg-white shadow-whisper px-5 py-3.5">
      <span className="inline-flex shrink-0 items-center gap-1.5">
        <Dot />
        <span className="font-body text-[13px] font-medium text-s-ink-2">Open</span>
      </span>
      <span className="ml-auto inline-flex items-baseline gap-1.5">
        <span className="font-display text-[22px] font-bold leading-none tabular-nums tracking-[-.03em] text-s-ink">{S.low}–{S.high}</span>
        <span className="font-body text-[13px] font-medium text-s-ink-2">min</span>
      </span>
      <span className="mx-0.5 h-4 w-px bg-s-border" />
      <span className="font-body text-[13px] font-medium tabular-nums text-s-ink-2">{S.ahead} ahead</span>
    </div>
  );
}

/* E — Reference-grounded (Mobbin: Waymo "number 2 in line" + Greg position bar + Binance
   "estimated time" hero). ONE hero (the wait), a Greg-style queue progress bar for position,
   status as the dot. Slightly taller than a pill because that's what makes it read as a real
   app's queue status instead of a cramped label. */
function OptE() {
  const pct = 62; // 5 ahead -> ~62% through a typical queue, illustrative
  return (
    <div className="rounded-[20px] border border-s-border bg-white shadow-whisper px-5 py-4">
      <span className="inline-flex items-center gap-2">
        <Dot />
        <span className="font-display text-[13px] font-semibold tracking-[-.01em]" style={{ color: GREEN }}>Open</span>
      </span>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="font-display text-[26px] font-bold leading-none tabular-nums tracking-[-.03em] text-s-ink">{S.low}–{S.high}</span>
        <span className="font-body text-[14px] font-medium text-s-ink-2">min wait</span>
      </div>
      <div className="mt-3.5 flex items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: GREEN }} />
        </div>
        <span className="shrink-0 font-body text-[12px] font-medium tabular-nums text-s-ink-2">{S.ahead} ahead</span>
      </div>
    </div>
  );
}

function Row({ tag, name, note, rec, children }: { tag: string; name: string; note: string; rec?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-9 first:mt-6">
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

export default function WalkinStatusBarOptions() {
  return (
    <main className="mx-auto min-h-screen max-w-[440px] bg-white px-4 py-8">
      <h1 className="font-display text-[23px] font-bold tracking-[-.02em] text-s-ink">Walk-in status bar · declutter</h1>
      <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
        Same pill shape you liked, lighter content. Pick a direction and I&apos;ll wire it live.
        My pick: <span className="font-semibold text-s-ink">E</span>, grounded in real Mobbin queue screens
        (Waymo, Greg, Binance): one hero number for the wait + a progress bar for your position. That structure
        is what makes it read like a real app instead of a cramped label.
      </p>
      <div className="mt-6">
        <p className="mb-2 font-body text-[12px] font-semibold uppercase tracking-wide text-s-ink-3">Now (too busy)</p>
        <Current />
      </div>
      <Row tag="A" name="Minimal" note="Status + wait only. Drops the '5 ahead' count and the info icon; queue detail lives in the info popup you already have.">
        <OptA />
      </Row>
      <Row tag="B" name="Wait-first" note="The wait time is the hero; status shrinks to a labelled dot. Best if the wait is the #1 thing people look at.">
        <OptB />
      </Row>
      <Row tag="C" name="One phrase" note="Folds the queue + wait into a single sentence ('5 ahead · ~1h wait'). Keeps the count but reads as one calm line.">
        <OptC />
      </Row>
      <Row tag="D" name="Waiting room" note="Wait + position on one line, split by a hairline. Compact, but flatter than a real queue status.">
        <OptD />
      </Row>
      <Row tag="E" name="Reference (Mobbin)" rec note="Grounded in real queue screens (Waymo, Greg, Binance): the wait is the hero number, a Greg-style progress bar shows your position, status is the dot. This is the one that reads like a real app.">
        <OptE />
      </Row>
      <div className="h-16" />
    </main>
  );
}
