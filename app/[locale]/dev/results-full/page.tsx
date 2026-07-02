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
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, Star, Heart, Map as MapIcon } from "lucide-react";
import { notFound } from "next/navigation";

const SALONS = [
  { name: "Zoltan Hair Zurich", rating: "5.0", count: "22", dist: "1.7 km", addr: "Nussgasse 3", cat: "Hair salon",
    services: [["Buzz Cut", "20 min", "CHF 50"], ["Shampoo, Cut & Style S", "45 min", "CHF 100"]], more: 53 },
  { name: "Supreme Style & Barber", rating: "4.9", count: "172", dist: "2.0 km", addr: "Kleinbasel", cat: "Barber",
    services: [["Buzz Cut", "25 min", "CHF 45"], ["Skin Fade", "35 min", "CHF 65"]], more: 31 },
  { name: "Old Town Barbers", rating: "4.7", count: "88", dist: "2.4 km", addr: "Steinenvorstadt", cat: "Barber",
    services: [["Buzz Cut", "20 min", "CHF 40"]], more: 18 },
];

// same BORDERLESS card as the map (owner: use this style on the normal search page too): rounded
// photo + text on white + gray service rows (max 3) + "View N". Prices show for the searched service.
function Card({ s }: { s: (typeof SALONS)[number] }) {
  return (
    <button className="w-full text-left active:opacity-90">
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-s-bg-sunken">
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={16} /></span>
        <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /><span className="h-1.5 w-1.5 rounded-full bg-white/55" /></span>
      </div>
      <div className="pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[16px] font-bold text-s-ink">{s.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}</span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{s.dist}, {s.addr}</p>
        <p className="truncate text-[13px] text-s-ink-2">{s.cat}, {s.count} reviews</p>
        <div className="mt-2.5 space-y-1.5">
          {s.services.slice(0, 3).map(([n, d, p]) => (   /* RULE: max 3 service rows */
            <div key={n} className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px]">
              <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-3">{d}</span></span>
              <span className="shrink-0 font-semibold tabular-nums text-s-ink">{p}</span>
            </div>
          ))}
        </div>
        <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">View {s.more} matching services</span>
      </div>
    </button>
  );
}

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] bg-white pb-8">
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
            <button className="flex shrink-0 items-center gap-1 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Rating <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className="shrink-0 rounded-full border border-s-border px-3.5 py-2 text-[13px] font-medium text-s-ink">Deals</button>
          </div>
        </div>

        <div className="px-4 pt-1">
          <p className="pb-3 pt-1 text-center text-[13px] text-s-ink-2">19 salons in this area</p>
          <div className="space-y-6">{SALONS.map((s) => <Card key={s.name} s={s} />)}</div>
        </div>
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
