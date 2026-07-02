"use client";

/**
 * /dev/map-full , FULL-PAGE production mockup (owner 2026-07-02 v2). English (mockup rule).
 * Exists-check: `npm run exists map-full` = 0; real map = SearchTemplate map overlay + MapView.
 * ONE full phone screen (390px, portal to body so no double header). v2 owner refinements:
 *   - search bar = PILL (rounded-full), like the normal search bar , not a rounded rectangle.
 *   - "Search this area" is AUTOMATIC on pan (no tap button); a brief "Updating" pill conveys it.
 *   - store preview = draggable BOTTOM SHEET (grab handle) that coexists with a bottom nav bar.
 *   - preview photo BIGGER + WIDER (16:9), + matching SERVICE PRICES (searched "buzz cut"), + more detail.
 *   - selected pin = GRAY sunken + elevated (never blue/black , owner "sync it out grayed").
 * (Exact drag interaction awaits the owner's screenshot; this is the first version.) Real tokens.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Map as MapIcon, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Star, Loader2, Home, CalendarDays, User, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

function Pin({ selected, top, left }: { selected?: boolean; top: string; left: string }) {
  // resting = white pill; selected = GRAY sunken + scaled + elevated (not blue, not black)
  return (
    <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top, left, zIndex: selected ? 5 : 1 }}>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition ${selected ? "border-s-border bg-s-bg-sunken text-s-ink scale-110 shadow-[0_2px_6px_rgba(10,10,10,0.16),0_10px_24px_rgba(10,10,10,0.14)]" : "border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]"}`}>
        <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> 4.6
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border ${selected ? "bg-s-bg-sunken" : "bg-white"}`} />
    </span>
  );
}

const SERVICES = [["Buzz Cut", "20 min", "50"], ["Skin Fade", "35 min", "65"], ["Beard trim", "15 min", "30"]];

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-s-ink/10">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white">
        {/* map surface */}
        <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

        {/* search bar , PILL (rounded-full) + filter chips */}
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

        {/* AUTO search-this-area , no tap button; a brief pill shows it updating on pan */}
        <div className={`absolute left-1/2 top-[150px] z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-s-ink-2 ${FROST}`}>
          <Loader2 size={13} className="animate-spin text-s-ink-3" /> Updating this area
        </div>

        {/* pins */}
        <Pin top="255px" left="90px" />
        <Pin top="300px" left="230px" />
        <Pin top="340px" left="150px" selected />
        <Pin top="275px" left="300px" />

        {/* draggable BOTTOM SHEET store preview (grab handle) , sits ABOVE the bottom nav */}
        <div className="absolute inset-x-0 bottom-[64px] z-20 rounded-t-[24px] border-t border-s-border bg-white shadow-[0_-2px_8px_rgba(10,10,10,0.06),0_-16px_40px_rgba(10,10,10,0.12)]">
          <div className="flex justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-s-border" /></div>
          {/* multi-store pager: one preview per pin; swipe / arrows page between the 19 pins (NOT a list) */}
          <div className="flex items-center justify-between px-4 pb-0.5 pt-2">
            <button className="grid h-7 w-7 place-items-center rounded-full border border-s-border text-s-ink-2 active:scale-95" aria-label="Previous salon"><ChevronLeft size={15} /></button>
            <span className="text-[12px] font-medium text-s-ink-2">2 of 19 , swipe between pins</span>
            <button className="grid h-7 w-7 place-items-center rounded-full border border-s-border text-s-ink-2 active:scale-95" aria-label="Next salon"><ChevronRight size={15} /></button>
          </div>
          <div className="px-4 pb-4 pt-2">
            {/* bigger, WIDER photo (16:9) */}
            <div className="relative h-[128px] w-full overflow-hidden rounded-[16px] bg-s-bg-sunken">
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-s-ink/70" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" />
              </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-heading text-[16px] font-bold text-s-ink">Supreme Style &amp; Barber</p>
                <p className="truncate text-[12.5px] text-s-ink-2">Barber in Kleinbasel , 400 m , open until 19:00</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[13.5px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> 4.9</span>
            </div>
            {/* matching service PRICES for the searched service */}
            <div className="mt-3 space-y-1">
              {SERVICES.map(([n, d, p]) => (
                <div key={n} className="flex items-center justify-between rounded-xl bg-s-bg-sunken px-3 py-2 text-[13px]">
                  <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-3">{d}</span></span>
                  <span className="shrink-0 font-semibold tabular-nums text-s-ink">CHF {p}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full rounded-full bg-s-ink py-3 text-[15px] font-bold text-white active:scale-[0.99]" /* selected-ok: primary commit CTA */>Book</button>
          </div>
        </div>

        {/* bottom NAV bar (the owner's "we have this bottom bar too") */}
        <nav className="absolute inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around border-t border-s-border bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          {[[Home, "Home", false], [Search, "Search", true], [Sparkles, "Inspo", false], [CalendarDays, "Bookings", false], [User, "Profile", false]].map(([Icon, label, on], i) => {
            const I = Icon as typeof Home;
            return (
              <span key={i} className={`flex flex-col items-center gap-0.5 text-[12px] ${on ? "font-semibold text-s-ink" : "text-s-ink-3"}`}>
                <I size={21} strokeWidth={on ? 2.4 : 2} /> {label as string}
              </span>
            );
          })}
        </nav>
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
