"use client";

/**
 * /dev/suggest-full , search suggestions, FULL-PAGE (owner 2026-07-02 v2). English (mockup rule).
 * Exists-check: `npm run exists suggest-full` = 0; real API = /api/search/suggest.
 * CORRECTED: the previous version invented "popular services" + "recents" , those DO NOT EXIST.
 * The real /api/search/suggest returns ONLY { services[<=5], salons[<=3] } for the typed query.
 * So this is one HONEST version: matching Services + matching Salons, nothing fabricated. Uses the
 * real SalonResultCard "suggest" row shape for salons (photo + name + rating/address + from-price).
 * Design rules: white, ink, sparse blue, yellow star, gray-selected, >=12px, no em-dash/middot.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, Scissors, Star, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

// matches the real API shape: services[<=5], salons[<=3] for the query "buzz cut"
const SERVICES = ["Buzz Cut", "Haircut", "Wet cut", "Dry cut", "Skin fade"];
const SALONS = [
  { name: "Zoltan Hair Zurich", meta: "Hair salon , Nussgasse 3, Zurich", rating: "5.0", from: "50" },
  { name: "Supreme Style & Barber", meta: "Barber , Hauptstrasse 38, Brugg", rating: "4.9", from: "45" },
  { name: "Old Town Barbers", meta: "Barber , Steinenvorstadt 8, Basel", rating: "4.7", from: "40" },
];

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] bg-white">
        {/* our current search bar style */}
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/95 px-3 py-3 backdrop-blur-xl">
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink" aria-label="Back"><ArrowLeft size={19} strokeWidth={2.2} /></button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-s-border bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(10,10,10,0.06),0_4px_16px_rgba(10,10,10,0.06)]">
            <Search size={17} className="shrink-0 text-s-ink-2" />
            <span className="truncate text-[14.5px] font-medium text-s-ink">Buzz cut</span>
          </div>
        </div>

        <div className="px-4 pb-8 pt-1">
          {/* Services , matching (real: services[<=5]) */}
          <p className="mb-1 mt-2 text-[13px] font-semibold text-s-ink">Services</p>
          <div>
            {SERVICES.map((t) => (
              <button key={t} className="flex w-full items-center gap-3 py-2.5 text-left text-[14px] text-s-ink">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-bg-sunken"><Scissors size={16} className="text-s-ink-2" /></span>
                <span className="min-w-0 flex-1 truncate">{t}</span>
              </button>
            ))}
          </div>

          {/* Salons , matching (real: salons[<=3]), SalonResultCard "suggest" row shape */}
          <p className="mb-1 mt-5 text-[13px] font-semibold text-s-ink">Salons</p>
          <div>
            {SALONS.map((s) => (
              <button key={s.name} className="flex w-full items-center gap-3 py-2.5 text-left">
                <span className="h-[52px] w-[52px] shrink-0 rounded-2xl bg-s-bg-sunken" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-s-ink">{s.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-s-ink-2">
                    <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {s.rating}
                    <span className="truncate">{s.meta}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] font-medium text-s-ink">from CHF {s.from}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 self-center text-s-ink-2" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuggestFullMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
