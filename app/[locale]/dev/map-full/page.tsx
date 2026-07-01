"use client";

/**
 * /dev/map-full , FULL-PAGE production mockup (owner 2026-07-02: "make it a full page, not
 * components, accurate aspect ratio, refine for production, match design rules"). English (mockup).
 * Exists-check: `npm run exists map-full` = 0; real map = SearchTemplate map overlay + MapView.
 * ONE full phone screen at 390px (iPhone), natural height. Rendered via a PORTAL to document.body
 * behind a fixed overlay, so it covers the app header/footer/cookie chrome (a transformed ancestor
 * breaks plain `fixed`) , the owner sees ONE clean screen, no double header. Matches the real app's
 * language (Suchen pill + map toggle + Open-now/Price/For-whom chips) plus the batch-2 additions:
 * back arrow inside the bar, white star+rating pins (no count), pin-tap store preview. Design rules:
 * white surfaces, ink text, sparse blue (link only), yellow star, selected = blue (never black),
 * s-border hairlines, no focus ring, >=12px, no em-dash/middot. Real tokens.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Map as MapIcon, SlidersHorizontal, ChevronDown, Star, X } from "lucide-react";
import { notFound } from "next/navigation";

const FROST = "bg-white/95 backdrop-blur-xl border border-s-border shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

function Pin({ selected, top, left }: { selected?: boolean; top: string; left: string }) {
  return (
    <span className="absolute flex -translate-x-1/2 flex-col items-center" style={{ top, left }}>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)] ${selected ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white text-s-ink"}`}>
        <Star size={12} className={selected ? "fill-white text-white" : "fill-s-star text-s-star"} strokeWidth={0} /> 4.6
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 ${selected ? "bg-s-accent" : "border-b border-r border-s-border bg-white"}`} />
    </span>
  );
}

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-s-ink/10">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white">
        {/* map surface */}
        <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

        {/* search bar , back arrow inside + query + subtitle + map/list toggle */}
        <div className="absolute inset-x-3 top-3 z-10">
          <div className={`flex items-center gap-1 rounded-[22px] px-2 py-2 ${FROST}`}>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink active:scale-95" aria-label="Back"><ArrowLeft size={21} strokeWidth={2.2} /></button>
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-[15px] font-bold leading-tight text-s-ink">Buzz cut</p>
              <p className="truncate text-[12.5px] leading-tight text-s-ink-2">Any time in Basel</p>
            </div>
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95" aria-label="List view"><MapIcon size={19} strokeWidth={2} /></button>
          </div>
          {/* filter chips */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${FROST}`} aria-label="Filters"><SlidersHorizontal size={16} className="text-s-ink" /></button>
            <button className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>Open now</button>
            <button className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>Price <ChevronDown size={14} className="text-s-ink-2" /></button>
            <button className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium text-s-ink ${FROST}`}>For whom <ChevronDown size={14} className="text-s-ink-2" /></button>
          </div>
        </div>

        {/* pins */}
        <Pin top="300px" left="90px" />
        <Pin top="360px" left="220px" />
        <Pin top="410px" left="150px" selected />
        <Pin top="330px" left="300px" />
        <Pin top="470px" left="265px" />

        {/* "Search this area" pill (appears on pan) */}
        <button className={`absolute left-1/2 top-[190px] z-10 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-s-accent ${FROST}`}>Search this area</button>

        {/* store preview card (pin tap) , docked bottom */}
        <div className="absolute inset-x-3 bottom-4 z-10 overflow-hidden rounded-[22px] border border-s-border bg-white shadow-[0_1px_2px_rgba(10,10,10,0.10),0_16px_40px_rgba(10,10,10,0.16)]">
          <div className="relative h-[150px] bg-s-bg-sunken">
            <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-s-border bg-white text-s-ink-2" aria-label="Close"><X size={16} /></button>
            <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-s-ink/70" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-heading text-[16px] font-bold text-s-ink">Supreme Style &amp; Barber</p>
              <span className="flex shrink-0 items-center gap-1 text-[13.5px] font-semibold text-s-ink"><Star size={14} className="fill-s-star text-s-star" strokeWidth={0} /> 4.9</span>
            </div>
            <p className="mt-1 truncate text-[13px] text-s-ink-2">Barber in Kleinbasel</p>
            <p className="mt-0.5 truncate text-[13px] text-s-ink-2">Hauptstrasse 38 , 400 m away</p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <button className="flex-1 rounded-full bg-s-ink py-3 text-[15px] font-bold text-white active:scale-[0.99]" /* selected-ok: primary commit CTA */>Book</button>
              <button className="rounded-full border border-s-border px-4 py-3 text-[14px] font-semibold text-s-ink">Details</button>
            </div>
          </div>
        </div>

        {/* home indicator */}
        <div className="absolute bottom-1.5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-s-ink/25" />
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
