// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// search-trending` -> 0. Three "liftup" directions for the search overlay's idle Trending
// section (currently flat grey chips). Real tokens, English. Neutral tiles stand in for
// the real trend photos. Owner asked for a mockup of the trending liftup.
"use client";

import { notFound } from "next/navigation";
import { TrendingUp, ArrowUpRight, ImageIcon } from "lucide-react";

const TRENDS = ["Balayage", "Skin fade", "Bob cut", "Maniküre", "Bart trim", "Coloration"];
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-[28px] border border-s-border bg-white p-4" style={{ minHeight: 300 }}>{children}</div>
);
const Cap = ({ t, d }: { t: string; d: string }) => (
  <div className="mb-2"><div className="text-[13px] font-semibold text-s-ink">{t}</div><div className="text-[12px] text-s-ink-2">{d}</div></div>
);

// V1: current , flat grey pill chips
function V1() {
  return (
    <Frame>
      <p className="mb-2 text-[13px] font-semibold text-s-ink">Im Trend</p>
      <div className="flex flex-wrap gap-2">
        {TRENDS.map((t) => <span key={t} className="rounded-full bg-s-bg-sunken px-4 py-2 text-[13px] font-medium text-s-ink-2">{t}</span>)}
      </div>
    </Frame>
  );
}
// V2: photo tiles , each trend a small look-card (photo + label), horizontal
function V2() {
  return (
    <Frame>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-s-ink"><TrendingUp size={15} strokeWidth={2.2} /> Im Trend</p>
      <div className="-mx-1 flex gap-2.5 overflow-hidden px-1">
        {TRENDS.slice(0, 5).map((t) => (
          <div key={t} className="flex w-[92px] shrink-0 flex-col gap-1.5">
            <div className="grid h-[104px] w-full place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-s-bg-sunken to-s-border/70 text-s-ink-2"><ImageIcon size={20} strokeWidth={1.5} /></div>
            <span className="truncate px-0.5 text-[13px] font-semibold text-s-ink">{t}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
// V3: ranked list , numbered trend rows with a rise arrow
function V3() {
  return (
    <Frame>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-s-ink"><TrendingUp size={15} strokeWidth={2.2} /> Im Trend</p>
      <div className="divide-y divide-s-border">
        {TRENDS.slice(0, 5).map((t, i) => (
          <button key={t} className="flex w-full items-center gap-3 py-2.5 text-left">
            <span className="w-4 shrink-0 font-heading text-[15px] font-bold tabular-nums text-s-ink-2">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-s-ink">{t}</span>
            <ArrowUpRight size={16} className="shrink-0 text-s-accent" />
          </button>
        ))}
      </div>
    </Frame>
  );
}

export default function SearchTrendingMock() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">Trending , liftup variations</h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-s-ink-2">
          The idle search Trending section, elevated from flat grey chips. Recommended: <b>V2 photo tiles</b> , it makes trending feel discovery-driven (photo-forward like the Looks) and gives each trend a tap-worthy visual; V3 is the leaner text option if you want it compact.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div><Cap t="V1 , chips (current)" d="Flat grey pills. Functional but low energy, reads as filler." /><V1 /></div>
          <div><Cap t="V2 , photo tiles (rec.)" d="Each trend is a small look card (photo + label). Photo-forward, discovery vibe, tappable." /><V2 /></div>
          <div><Cap t="V3 , ranked list" d="Numbered rows + rise arrow. Compact, communicates 'what's hot', text-only." /><V3 /></div>
        </div>
      </div>
    </div>
  );
}
