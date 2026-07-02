"use client";

/**
 * /dev/results-full , FULL-PAGE production mockup (owner 2026-07-02). English (mockup rule).
 * Exists-check: `npm run exists results-full` = 0; real = SearchTemplate list + SalonResultCard.
 * ONE full phone screen (390px, portal). Owner: "search bar keeps being a rectangle" -> PILL;
 * "refine the result list card." Refined card = wide photo + save heart + name + star + one meta
 * line + the searched service's PRICE row + a blue "more" link. Pill search bar + chips + bottom
 * nav (consistent with map). Design rules: white, ink, sparse blue, yellow star, no black/blue-
 * selected, >=12px, no em-dash/middot. Real tokens.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, Star, Heart, Home, Sparkles, CalendarDays, User, Map as MapIcon } from "lucide-react";
import { notFound } from "next/navigation";

const SALONS = [
  { name: "Zoltan Hair Zurich", rating: "5.0", count: 22, meta: "Hair salon , Zurich , 1.7 km", from: "50", svc: "Buzz Cut", dur: "20 min", price: "50" },
  { name: "Supreme Style & Barber", rating: "4.9", count: 172, meta: "Barber , Basel , 2.0 km", from: "45", svc: "Buzz Cut", dur: "25 min", price: "45" },
  { name: "Old Town Barbers", rating: "4.7", count: 88, meta: "Barber , Basel , 2.4 km", from: "40", svc: "Buzz Cut", dur: "20 min", price: "40" },
];

// mirrors the real SalonResultCard "card" variant: name ink-anchor, rating + inline count,
// cat/city/distance meta, from-price, a featured service, "View all services".
function Card({ s }: { s: (typeof SALONS)[number] }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-s-border bg-white">
      <div className="relative h-[150px] bg-s-bg-sunken">
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-s-ink-2 shadow-sm" aria-label="Save"><Heart size={16} /></button>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[15.5px] font-bold text-s-ink">{s.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating} <span className="font-normal text-s-ink-2">({s.count})</span></span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">{s.meta}</p>
        <p className="mt-1 text-[13.5px] font-semibold text-s-ink">from CHF {s.from}</p>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-s-bg-sunken px-3 py-2.5 text-[13px]">
          <span className="min-w-0"><span className="block truncate font-medium text-s-ink">{s.svc}</span><span className="text-[12px] text-s-ink-3">{s.dur}</span></span>
          <span className="shrink-0 font-semibold tabular-nums text-s-ink">CHF {s.price}</span>
        </div>
        <button className="mt-2 text-[13px] font-semibold text-s-accent">View all services</button>
      </div>
    </div>
  );
}

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] bg-white pb-20">
        {/* sticky pill search bar + chips */}
        <div className="sticky top-0 z-10 bg-white/95 px-3 pb-2 pt-3 backdrop-blur-xl">
          <div className="flex items-center gap-1 rounded-full border border-s-border bg-white py-1.5 pl-1.5 pr-1.5 shadow-[0_1px_2px_rgba(10,10,10,0.08),0_4px_16px_rgba(10,10,10,0.06)]">
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink" aria-label="Back"><ArrowLeft size={20} strokeWidth={2.2} /></button>
            <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <div className="min-w-0 flex-1 pl-1"><p className="truncate text-[14.5px] font-bold leading-tight text-s-ink">Buzz cut</p><p className="truncate text-[12px] leading-tight text-s-ink-2">Any time in Basel</p></div>
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink" aria-label="Map view"><MapIcon size={18} strokeWidth={2} /></button>
          </div>
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border" aria-label="Filters"><SlidersHorizontal size={15} className="text-s-ink" /></button>
            <button className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Open now</button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Price <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">For whom <ChevronDown size={14} className="text-s-ink-2" /></button>
          </div>
        </div>

        <div className="px-3 pt-1">
          <p className="px-1 pb-2 text-[13px] text-s-ink-2"><b className="text-s-ink">19 salons</b> in this area</p>
          <div className="space-y-3">{SALONS.map((s) => <Card key={s.name} s={s} />)}</div>
        </div>

        <nav className="absolute inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around border-t border-s-border bg-white/95 backdrop-blur-xl">
          {[[Home, "Home", false], [Search, "Search", true], [Sparkles, "Inspo", false], [CalendarDays, "Bookings", false], [User, "Profile", false]].map(([Icon, label, on], i) => {
            const I = Icon as typeof Home;
            return <span key={i} className={`flex flex-col items-center gap-0.5 text-[12px] ${on ? "font-semibold text-s-ink" : "text-s-ink-3"}`}><I size={21} strokeWidth={on ? 2.4 : 2} /> {label as string}</span>;
          })}
        </nav>
      </div>
    </div>
  );
}

export default function ResultsFullMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
