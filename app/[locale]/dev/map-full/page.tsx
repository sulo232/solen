"use client";

/**
 * /dev/map-full , FULL-PAGE map mockup (owner 2026-07-02 v3). English (mockup rule).
 * Exists-check: `npm run exists map-full` = 0; real map = SearchTemplate map overlay + MapView.
 * v3 owner corrections:
 *   - photo aspect ratio -> the REAL card ratio aspect-[3/2] (SalonResultCard "card" variant).
 *   - REMOVED the swipe-between-pins pager (rejected) , stores are a SCROLLABLE feed of distinct
 *     CARDS (scroll down, full page), NOT thin rectangle rows, NOT one-at-a-time swipe.
 *   - REMOVED the Book button (owner: people mis-click; tap the card instead).
 *   - REMOVED the bottom nav bar (FABRICATED , Solen has none). Logged in REMOVED.md.
 * Kept (owner said figured-out): pill search bar, filter chips, auto "Updating this area", pins.
 * Real tokens, Lucide. Grounded in SalonResultCard, nothing invented.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Map as MapIcon, SlidersHorizontal, ChevronDown, Star, Loader2, Heart } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

const STORES = [
  { name: "Supreme Style & Barber", rating: "4.9", count: 172, meta: "Barber , Kleinbasel , 400 m", from: "45" },
  { name: "Old Town Barbers", rating: "4.7", count: 88, meta: "Barber , Steinenvorstadt , 700 m", from: "40" },
  { name: "Zoltan Hair", rating: "5.0", count: 22, meta: "Hair salon , Nussgasse , 1.1 km", from: "50" },
  { name: "Clipper & Co", rating: "4.6", count: 61, meta: "Barber , Gerbergasse , 1.4 km", from: "38" },
];

function Pin({ selected, top, left }: { selected?: boolean; top: string; left: string }) {
  return (
    <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top, left, zIndex: selected ? 5 : 1 }}>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold ${selected ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
        <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> 4.6
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${selected ? "bg-s-bg-sunken" : "bg-white"}`} />
    </span>
  );
}

// distinct rich card , real SalonResultCard "card" variant: aspect-[3/2] photo on top, name + rating
// (inline count), cat/city/distance meta, from-price. NO Book button (tap the whole card).
function StoreCard({ s }: { s: (typeof STORES)[number] }) {
  return (
    <button className="w-full overflow-hidden rounded-card border border-s-border bg-white text-left shadow-[0_1px_2px_rgba(10,10,10,0.06),0_6px_20px_rgba(10,10,10,0.08)] active:scale-[0.99]">
      <div className="relative aspect-[3/2] w-full bg-s-bg-sunken">
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[15.5px] font-bold text-s-ink">{s.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating} <span className="font-normal text-s-ink-2">({s.count})</span></span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">{s.meta}</p>
        <p className="mt-1 text-[13.5px] font-semibold text-s-ink">from CHF {s.from}</p>
      </div>
    </button>
  );
}

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      <div className="relative mx-auto h-full min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white">
        {/* map surface */}
        <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

        {/* search bar (PILL) + filter chips , figured-out, unchanged */}
        <div className="absolute inset-x-3 top-3 z-20">
          <div className={`flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 ${FROST}`}>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink active:scale-95" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Buzz cut</p>
              <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Any time in Basel</p>
            </div>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
          </div>
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${FROST}`} aria-label="Filters"><SlidersHorizontal size={16} className="text-s-ink" /></button>
            <button className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>Open now</button>
            <button className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>Price <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>For whom <ChevronDown size={14} className="text-s-ink-2" /></button>
          </div>
        </div>

        {/* auto search-this-area , figured-out */}
        <div className={`absolute left-1/2 top-[150px] z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-s-ink-2 ${FROST}`}>
          <Loader2 size={13} className="animate-spin text-s-ink-3" /> Updating this area
        </div>

        {/* pins */}
        <Pin top="230px" left="90px" />
        <Pin top="275px" left="235px" />
        <Pin top="315px" left="150px" selected />
        <Pin top="250px" left="300px" />

        {/* SCROLLABLE feed of distinct store CARDS (scroll down for more). No pager, no Book, no nav. */}
        <div className="absolute inset-x-0 bottom-0 top-[400px] z-20 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]">
          <div className="flex shrink-0 justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-s-border" /></div>
          <p className="shrink-0 px-4 pb-1 pt-2 text-[13px] text-s-ink-2"><b className="text-s-ink">19 salons</b> here</p>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STORES.map((s) => <StoreCard key={s.name} s={s} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapFullMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
