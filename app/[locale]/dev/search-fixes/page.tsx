// exists-check: dev-only mockup route (notFound in prod). Council-informed (3 lenses:
// search UX, gallery density, DS card spec) synthesis for the Inspo look card + the
// empty-bottom fill. Shows the decided card, the one genuine fork (inline Looks strip
// vs grid), and the filled short-results state. Real tokens, English. Neutral tiles
// stand in for real Inspo photos , the card TREATMENT + sizing is what's under review.
"use client";

import { notFound } from "next/navigation";
import { Search, ArrowUpLeft, Store, Star, ArrowRight, ImageIcon, Heart, ChevronRight, Clock } from "lucide-react";

// The decided look card: borderless photo (3:4) + name below + save heart, flat. Fills its parent.
function LookCard({ name }: { name: string }) {
  return (
    <a className="group flex w-full flex-col gap-2">
      <span className="relative block w-full overflow-hidden rounded-[16px]" style={{ aspectRatio: "3 / 4" }}>
        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-s-bg-sunken to-s-border/70 text-s-ink-3"><ImageIcon size={20} strokeWidth={1.5} /></span>
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/75 text-s-ink-3 backdrop-blur-sm"><Heart size={15} /></span>
      </span>
      <span className="truncate px-0.5 text-[14px] font-semibold text-s-ink">{name}</span>
    </a>
  );
}

const LOOKS = ["Skin fade", "Textured crop", "Buzz cut fade", "Low taper", "Crew cut", "Mid drop fade", "Classic buzz", "Line up"];
const Frame = ({ children, h }: { children: React.ReactNode; h: number }) => (
  <div className="relative overflow-hidden rounded-[28px] border border-s-border bg-white" style={{ height: h }}>{children}</div>
);
const Cap = ({ t, d }: { t: string; d: string }) => (
  <div className="mb-2"><div className="text-[13px] font-semibold text-s-ink">{t}</div><div className="text-[12px] text-s-ink-3">{d}</div></div>
);
const Field = ({ q }: { q: string }) => (
  <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-[16px] border border-s-ink bg-white px-4 py-3">
    <Search size={18} strokeWidth={2} className="text-s-ink-3" /><span className="text-[15px] font-medium text-s-ink">{q}</span>
  </div>
);
const Auto = ({ terms }: { terms: string[] }) => (
  <div className="mx-4 mt-1 divide-y divide-s-border">
    {terms.map((t, i) => (
      <div key={t} className="flex items-center gap-3 py-2.5"><Search size={16} className="shrink-0 text-s-ink-3" /><span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${i === 0 ? "font-semibold" : "font-medium"}`}>{t}</span><ArrowUpLeft size={15} className="shrink-0 text-s-ink-3" /></div>
    ))}
  </div>
);
const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-2 mt-4 px-4 text-[13px] font-semibold text-s-ink">{children}</p>;
const SalonRow = () => (
  <div className="px-4">
    <div className="flex items-stretch gap-3 rounded-card border border-s-border bg-white p-3">
      <span className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3"><Store size={20} strokeWidth={1.5} /></span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate text-[15px] font-semibold text-s-ink">Old Town Barbers</span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px] text-s-ink-3"><span className="inline-flex items-center gap-1"><Star size={12} className="fill-s-star text-s-star" /> 4.3</span><span>Basel</span></span>
        <span className="mt-1 text-[13px] font-semibold text-s-ink">from CHF 35</span>
      </span>
      <ArrowRight size={18} className="shrink-0 self-center text-s-ink" />
    </div>
  </div>
);
const SeeAll = () => (
  <button className="mt-2 flex w-full items-center justify-center gap-1 px-4 text-[13px] font-semibold text-s-accent">See all in Inspo <ChevronRight size={15} /></button>
);
const Strip = ({ w, n }: { w: number; n: number }) => (
  <div className="flex gap-2.5 overflow-hidden px-4 pb-1">
    {LOOKS.slice(0, n).map((name) => <div key={name} className="shrink-0" style={{ width: w }}><LookCard name={name} /></div>)}
  </div>
);
const Grid = ({ n }: { n: number }) => (
  <div className="grid grid-cols-2 gap-3 px-4">{LOOKS.slice(0, n).map((name) => <LookCard key={name} name={name} />)}</div>
);

// B1: inline Looks as a horizontal STRIP (recommended inline)
const StripVariant = () => (
  <Frame h={430}><Field q="buzz" /><Auto terms={["buzz cut", "buzzcut", "skin fade"]} /><Label>Salons</Label><SalonRow /><Label>Looks</Label><Strip w={110} n={5} /><SeeAll /></Frame>
);
// B2: inline Looks as a 2-col GRID
const GridVariant = () => (
  <Frame h={430}><Field q="buzz" /><Auto terms={["buzz cut", "buzzcut", "skin fade"]} /><Label>Salons</Label><SalonRow /><Label>Looks</Label><Grid n={4} /></Frame>
);
// C: short results -> bottom filled with content
const FilledVariant = () => (
  <Frame h={640}>
    <Field q="undercut" /><Auto terms={["undercut", "undercut fade"]} /><Label>Salons</Label><SalonRow /><Label>Looks</Label><Strip w={100} n={5} />
    <p className="mb-2 mt-8 px-4 text-[12px] font-semibold text-s-ink-3">Zuletzt gesucht</p>
    <div className="mx-4 divide-y divide-s-border">
      {["fade", "balayage"].map((t) => <div key={t} className="flex items-center gap-3 py-2.5"><Clock size={16} className="text-s-ink-3" /><span className="flex-1 text-[14px] text-s-ink">{t}</span></div>)}
    </div>
    <h2 className="mt-8 px-4 font-heading text-[18px] font-bold tracking-[-0.01em] text-s-ink">Beliebte Looks</h2>
    <div className="mt-3"><Grid n={4} /></div>
  </Frame>
);
// D: /inspo feed with the same card, 2-col
const FeedVariant = () => (
  <Frame h={640}>
    <div className="px-4 pt-4"><h2 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">Inspo</h2></div>
    <div className="mt-3"><Grid n={8} /></div>
  </Frame>
);

export default function SearchFixesMock() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">Search + Inspo , council-informed</h1>
        <p className="mt-2 max-w-[720px] text-[14px] text-s-ink-2">
          3-lens council synthesis. The look CARD is decided: borderless 3:4 photo, style name 1-line below, a save heart top-right, flat (no shadow), whole card opens the look. The one open FORK is the inline search Looks , strip vs grid (below). Empty bottom is filled with content (recents + Beliebte Looks grid), not a resizing sheet.
        </p>

        <h2 className="mt-8 font-heading text-[17px] font-bold text-s-ink">Fork , inline search Looks: strip vs grid</h2>
        <p className="mt-1 text-[13px] text-s-ink-2">Recommended: <b>B1 strip</b> for the inline preview (compact, keeps Salons on top), and use the 2-col grid only to FILL a short sheet (section C).</p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div><Cap t="B1 , Looks strip (rec. inline)" d="110px cards, 4 + peek, horizontal. Compact preview; Salons stay the focus. 'See all in Inspo' text link." /><StripVariant /></div>
          <div><Cap t="B2 , Looks 2-col grid" d="~170px cards, 4 shown. Bigger, more browsable, but pushes Salons up and can outrank them on short results." /><GridVariant /></div>
        </div>

        <h2 className="mt-12 font-heading text-[17px] font-bold text-s-ink">C , short results: bottom filled with content</h2>
        <p className="mt-1 text-[13px] text-s-ink-2">No resizing sheet. When results are short, fill down with Zuletzt gesucht then a 2-col Beliebte Looks grid (32/12/16 rhythm).</p>
        <div className="mt-4 max-w-[360px]"><FilledVariant /></div>

        <h2 className="mt-12 font-heading text-[17px] font-bold text-s-ink">D , /inspo feed with the same card (2-col)</h2>
        <p className="mt-1 text-[13px] text-s-ink-2">Same card, ~170px, 3:4 uniform (masonry is a v2). Load 20, then 12 per scroll.</p>
        <div className="mt-4 max-w-[360px]"><FeedVariant /></div>
      </div>
    </div>
  );
}
