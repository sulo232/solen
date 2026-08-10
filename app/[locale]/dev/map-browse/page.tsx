"use client";

/**
 * /dev/map-browse , MAP page NO-SEARCH (browse) state (owner 2026-07-02). English (mockup rule).
 * Exists-check: `npm run exists map-browse` = 0; the SEARCHED state is /dev/map-full (approved).
 * Two states of the same page: SEARCHED (map-full) shows the matching service PRICE rows + "View
 * N"; this BROWSE state (no service typed) shows the salon ONLY , no haircut options: photo + name
 * + rating + "distance, address" + "category, N reviews" + a from-price. Same borderless card, same
 * pinned filters + centered count. Real tokens; grounded in SalonResultCard. No pager/Book/nav.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Map as MapIcon, SlidersHorizontal, ChevronDown, Star, Loader2, Heart } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

const STORES = [
  { name: "Supreme Style & Barber", rating: "4.9", count: "1'722", dist: "400 m", addr: "Kleinbasel", cat: "Barber", from: "35" },
  { name: "Lashere Beauty", rating: "5.0", count: "1'156", dist: "700 m", addr: "Kreis 5", cat: "Nails", from: "40" },
  { name: "Zoltan Hair", rating: "5.0", count: "22", dist: "1.1 km", addr: "Nussgasse 3", cat: "Hair salon", from: "50" },
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

// BROWSE card , salon only, NO service rows (no service was searched). from-price instead.
function StoreCard({ s }: { s: (typeof STORES)[number] }) {
  return (
    <button className="w-full text-left active:opacity-90">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-s-bg-sunken">
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
        <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
      </div>
      {/* price on the RIGHT, beneath the rating (owner: balanced right, gap under the review) */}
      <div className="flex items-start justify-between gap-3 pt-2.5">
        <div className="min-w-0">
          <p className="truncate font-heading text-[16px] font-bold text-s-ink">{s.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{s.dist}, {s.addr}</p>
          <p className="truncate text-[13px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="flex items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
          <span className="text-[13.5px] font-semibold text-s-ink">from CHF {s.from}</span>
        </div>
      </div>
    </button>
  );
}

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      <div className="relative mx-auto h-full min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white">
        <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

        {/* browse: the query field is empty (no service typed) */}
        <div className="absolute inset-x-3 top-3 z-20">
          <div className={`flex items-center gap-1 rounded-full py-1.5 pl-1.5 pr-1.5 ${FROST}`}>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink active:scale-95" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Search hair & beauty</p>
              <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Basel</p>
            </div>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
          </div>
        </div>

        <div className={`absolute left-1/2 top-[86px] z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-s-ink-2 ${FROST}`}>
          <Loader2 size={13} className="animate-spin text-s-ink-2" /> Updating this area
        </div>

        <Pin top="230px" left="90px" />
        <Pin top="275px" left="235px" />
        <Pin top="315px" left="150px" selected />
        <Pin top="250px" left="300px" />

        <div className="absolute inset-x-0 bottom-0 top-[300px] z-20 flex flex-col rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]">
          <div className="flex shrink-0 justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-s-border" /></div>
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-2 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border" aria-label="Filters"><SlidersHorizontal size={15} className="text-s-ink" /></button>
            <button className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Open now</button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Price <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">For whom <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Rating <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Deals</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className="pb-3 pt-1 text-center text-[13px] text-s-ink-2">19 salons in this area</p>
            <div className="space-y-6">{STORES.map((s) => <StoreCard key={s.name} s={s} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapBrowseMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
