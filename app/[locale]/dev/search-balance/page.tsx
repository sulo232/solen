// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// search-balance` -> 0. Proposes (1) specificity-driven store-vs-inspo BALANCE in the
// search overlay's typing state, wiring the RICH Inspo feed (search_discovery, ~203
// looks for "fade") in place of the thin style-suggest strip, and (2) the date card
// hugging the calendar + expanding the time picker on date-pick. English copy; real
// tokens; the real overlay's calendar/location steps are otherwise untouched.
"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { Search, Star, Store, ArrowUpLeft, ArrowRight, ChevronRight, ChevronLeft, MapPin, ImageIcon } from "lucide-react";

const SALONS = [
  { name: "Cuts & Culture", rating: 4.8, area: "Elsässerstrasse 10, Basel", from: 35 },
  { name: "Old Town Barbers", rating: 4.3, area: "Münsterplatz 11, Basel", from: 35 },
  { name: "The Fade Factory", rating: 4.9, area: "Gundeldingen, Basel", from: 38 },
];

function Field({ q }: { q: string }) {
  return (
    <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-[16px] border border-s-border bg-white px-4 py-3">
      <Search size={18} strokeWidth={2} className="text-s-ink-3" />
      <span className="text-[15px] font-medium text-s-ink">{q}</span>
    </div>
  );
}

function Auto({ terms }: { terms: string[] }) {
  return (
    <div className="mx-4 mt-1 divide-y divide-s-border">
      {terms.map((t, i) => (
        <button key={t} className="flex w-full items-center gap-3 py-2.5 text-left">
          <Search size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
          <span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${i === 0 ? "font-semibold" : "font-medium"}`}>{t}</span>
          <ArrowUpLeft size={15} strokeWidth={2} className="shrink-0 text-s-ink-3" />
        </button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-5 px-4 text-[13px] font-semibold text-s-ink">{children}</p>;
}

function SalonCard({ s }: { s: typeof SALONS[number] }) {
  return (
    <div className="flex items-stretch gap-3 rounded-card border border-s-border bg-white p-3">
      <span className="grid h-[70px] w-[70px] shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3">
        <Store size={22} strokeWidth={1.5} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate text-[15px] font-semibold text-s-ink">{s.name}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px] text-s-ink-3">
          <span className="inline-flex shrink-0 items-center gap-1 text-s-ink-2"><Star size={12} className="fill-s-star text-s-star" /> {s.rating.toFixed(1)}</span>
          <span className="inline-flex min-w-0 items-center gap-0.5"><MapPin size={11} className="shrink-0" /> <span className="truncate">{s.area}</span></span>
        </span>
        <span className="mt-1.5 text-[13px] font-semibold text-s-ink">from CHF {s.from}</span>
      </span>
      <ArrowRight size={18} className="shrink-0 self-center text-s-ink" />
    </div>
  );
}

// A representative "photo" tile (neutral; real UI uses the Inspo item image).
function LookTile({ h }: { h: number }) {
  return (
    <div className="mb-2 grid w-full place-items-center rounded-[14px] bg-gradient-to-br from-s-bg-sunken to-s-border/60 text-s-ink-3" style={{ height: h }}>
      <ImageIcon size={20} strokeWidth={1.5} />
    </div>
  );
}

// #1 State A: SPECIFIC query -> store-led (salons + prices focal, small looks strip)
function StoreLed() {
  return (
    <div className="pb-6">
      <Field q="buzzcut" />
      <Auto terms={["buzzcut", "buzzcut fade", "skin fade", "crew cut"]} />
      <Label>Salons</Label>
      <div className="flex flex-col gap-2.5 px-4">
        {SALONS.map((s) => <SalonCard key={s.name} s={s} />)}
        <button className="mt-1 flex items-center justify-center gap-1 py-1 text-[13px] font-semibold text-s-ink">
          See all results <ChevronRight size={15} />
        </button>
      </div>
      <Label>Looks</Label>
      <div className="flex gap-2 overflow-hidden px-4">
        {[0, 1].map((i) => <div key={i} className="grid h-16 w-16 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-3"><ImageIcon size={16} strokeWidth={1.5} /></div>)}
      </div>
    </div>
  );
}

// #1 State B: EXPLORATORY query -> inspo-led (rich look gallery leads, stores tucked)
function InspoLed() {
  const heights = [150, 110, 120, 160, 130, 100, 140, 120, 150, 110];
  return (
    <div className="pb-6">
      <Field q="buzz" />
      <Auto terms={["buzz cut", "buzzcut", "classic tapered buzz cut", "buzz cut fade"]} />
      <div className="mb-1 mt-5 flex items-center justify-between px-4">
        <p className="text-[13px] font-semibold text-s-ink">Looks</p>
        <button className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-s-accent">Open in Inspo <ChevronRight size={14} /></button>
      </div>
      <div className="columns-2 gap-2 px-4">
        {heights.map((h, i) => <LookTile key={i} h={h} />)}
      </div>
      <button className="mx-4 mt-3 flex w-[calc(100%-32px)] items-center justify-between rounded-card border border-s-border bg-white px-4 py-3 text-left">
        <span className="text-[14px] font-medium text-s-ink">Search salons for "buzz"</span>
        <ArrowRight size={16} className="text-s-ink" />
      </button>
    </div>
  );
}

// #2: date card hugs the calendar; the time picker expands it on date-pick
function CalExpand() {
  const [picked, setPicked] = useState<number | null>(null);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="p-3">
      <div className="rounded-[20px] bg-white px-4 pb-4 pt-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
        <h2 className="mb-3 font-heading text-[24px] font-bold tracking-[-0.02em] text-s-ink">When?</h2>
        <div className="mb-3 flex rounded-full bg-s-bg-sunken p-1 text-[13px]">
          <span className="flex-1 rounded-full bg-white py-2 text-center font-semibold text-s-ink shadow-sm">Dates</span>
          <span className="flex-1 py-2 text-center font-medium text-s-ink-3">Flexible</span>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-heading text-[17px] font-bold text-s-ink">July 2026</p>
          <div className="flex gap-1 text-s-ink-3"><ChevronLeft size={18} /><ChevronRight size={18} /></div>
        </div>
        <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-3">
          {["M","T","W","T","F","S","S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((d) => (
            <div key={d} className="flex justify-center">
              <button onClick={() => setPicked(d)}
                className={`grid h-9 w-9 place-items-center rounded-full text-[14px] transition-colors ${picked === d ? "bg-s-accent font-bold text-white" : "font-medium text-s-ink hover:bg-s-bg-sunken"}`}>
                {d}
              </button>
            </div>
          ))}
        </div>
        <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${picked ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
          <p className="mb-2 mt-3 text-[13px] font-semibold text-s-ink">Time</p>
          <div className="flex gap-2">
            {["Morning","Afternoon","Evening"].map((t) => (
              <button key={t} className="shrink-0 rounded-full border border-s-border px-4 py-2 text-[13px] font-medium text-s-ink-2 hover:bg-s-bg-sunken">{t}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 px-1 text-center text-[12px] text-s-ink-3">
        {picked ? "Date picked: card grew, time picker popped up." : "No date yet: card hugs the calendar (no dead space). Tap a day."}
      </p>
    </div>
  );
}

const FRAMES: { key: string; label: string; note: string; el: React.ReactNode }[] = [
  { key: "a", label: "#1 State A , specific query (store-led)", note: "\"buzzcut\" matches real salons -> Salons + prices lead, See-all, small Looks strip.", el: <StoreLed /> },
  { key: "b", label: "#1 State B , exploratory query (inspo-led)", note: "\"buzz\" -> few/no salons, so a RICH Inspo gallery leads (wired to the discovery feed, ~200 looks for \"fade\"); stores tucked as a secondary row.", el: <InspoLed /> },
  { key: "c", label: "#2 , calendar hugs + expands on pick", note: "Interactive: no dead card space before picking; tapping a day grows the card + reveals the time picker.", el: <CalExpand /> },
];

export default function SearchBalanceMock() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">Search , balance + calendar</h1>
        <p className="font-body mt-2 text-[14px] text-s-ink-2">
          Root cause: search Looks used the thin style-suggest (6 tiles); the real Inspo feed has ~200. Fix: wire the feed in + let query specificity drive the store-vs-inspo balance. Plus the calendar card hugging + expanding.
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {FRAMES.map((f) => (
            <div key={f.key}>
              <div className="mb-2">
                <div className="font-body text-[13px] font-semibold text-s-ink">{f.label}</div>
                <div className="font-body text-[12px] text-s-ink-3">{f.note}</div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-s-border bg-white pb-2">{f.el}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
