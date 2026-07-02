"use client";

/**
 * /dev/suggest-full , search-suggestions, TWO full-screen variations to compare (owner 2026-07-02:
 * "make me two"). English (mockup rule). Exists-check: `npm run exists suggest-full` = 0; real =
 * SearchOverlay + /api/search/suggest. Two 390px screens side by side:
 *   A , tabbed list (All / Treatments / Salons, gray-selected tab) + flat lists + Show more (Fresha-like, refined).
 *   B , discovery-first (recent chips + popular categories grid + top salons with thumbs).
 * Design rules: white, ink, sparse blue (Show more link), gray-selected (NEVER blue/black), >=12px.
 */
import { ArrowLeft, Search, Clock, Scissors, Sparkles, Star, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">{label}</h2>
      <div className="h-[720px] w-[340px] overflow-y-auto rounded-[28px] border border-s-border bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function Bar() {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/95 px-3 py-3 backdrop-blur-xl">
      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink"><ArrowLeft size={19} strokeWidth={2.2} /></button>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-s-border bg-white px-3.5 py-2.5">
        <Search size={16} className="shrink-0 text-s-ink-2" />
        <span className="truncate text-[14px] font-medium text-s-ink">Buzz cut</span>
      </div>
    </div>
  );
}

// A: tabbed list
function VariantA() {
  return (
    <>
      <Bar />
      <div className="px-4 pb-6">
        <div className="mb-4 flex gap-2">
          <span className="rounded-full bg-s-bg-sunken px-3 py-1.5 text-[12.5px] font-semibold text-s-ink">All</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-s-border px-3 py-1.5 text-[12.5px] font-medium text-s-ink-2">Treatments <span className="text-s-ink-3">30</span></span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-s-border px-3 py-1.5 text-[12.5px] font-medium text-s-ink-2">Salons <span className="text-s-ink-3">2</span></span>
        </div>
        <p className="mb-2 text-[13px] font-semibold text-s-ink">Treatments</p>
        <div className="space-y-0.5">
          {["Buzz Cut", "Haircut", "Wet cut", "Dry cut", "Skin fade"].map((t) => (
            <div key={t} className="flex items-center gap-3 py-2 text-[13.5px] text-s-ink"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken"><Scissors size={15} className="text-s-ink-2" /></span> {t}</div>
          ))}
        </div>
        <button className="mt-1 text-[13px] font-semibold text-s-accent">Show more</button>
        <p className="mb-2 mt-5 text-[13px] font-semibold text-s-ink">Salons</p>
        <div className="space-y-2.5">
          {[["Golden Cut", "Hair salon , Basel", "2.1 km"], ["Disco Cut", "Barber , Zurich", "> 50 km"]].map(([n, s, d]) => (
            <div key={n} className="flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 rounded-full bg-s-bg-sunken" />
              <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium text-s-ink">{n}</p><p className="truncate text-[12px] text-s-ink-2">{s}</p></div>
              <span className="shrink-0 text-[12px] text-s-ink-3">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// B: discovery-first
function VariantB() {
  return (
    <>
      <Bar />
      <div className="px-4 pb-6">
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-s-ink"><Clock size={14} className="text-s-ink-3" /> Recent</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {["Buzz cut", "Balayage", "Beard trim"].map((c) => <span key={c} className="rounded-full bg-s-bg-sunken px-3 py-1.5 text-[13px] text-s-ink">{c}</span>)}
        </div>
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-s-ink"><TrendingUp size={14} className="text-s-ink-3" /> Popular services</p>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[["Buzz Cut", Scissors], ["Skin Fade", Scissors], ["Colour", Sparkles], ["Beard trim", Scissors]].map(([n, Icon]) => {
            const I = Icon as typeof Scissors;
            return <div key={n as string} className="flex items-center gap-2.5 rounded-2xl border border-s-border p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-bg-sunken"><I size={16} className="text-s-ink-2" /></span><span className="truncate text-[13.5px] font-medium text-s-ink">{n as string}</span></div>;
          })}
        </div>
        <p className="mb-2 text-[13px] font-semibold text-s-ink">Top salons</p>
        <div className="space-y-2.5">
          {[["Golden Cut", "4.9", "Basel"], ["Disco Cut", "4.8", "Zurich"]].map(([n, r, c]) => (
            <div key={n} className="flex items-center gap-3">
              <span className="h-11 w-11 shrink-0 rounded-2xl bg-s-bg-sunken" />
              <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium text-s-ink">{n}</p><p className="truncate text-[12px] text-s-ink-2">Barber , {c}</p></div>
              <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-s-ink"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {r}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function SuggestFullMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[820px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , search suggestions , 2 variations</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Two directions to compare</h1>
        <p className="mt-1 max-w-[640px] text-[13px] text-s-ink-2">Recommend <b className="text-s-ink">B</b> for a cold search bar (recents + popular guide the user); A is better once they&apos;ve typed a query.</p>
        <div className="mt-6 flex flex-wrap gap-8">
          <Phone label="A , tabbed list (typed query)"><VariantA /></Phone>
          <Phone label="B , discovery-first (recents + popular)"><VariantB /></Phone>
        </div>
      </div>
    </main>
  );
}
