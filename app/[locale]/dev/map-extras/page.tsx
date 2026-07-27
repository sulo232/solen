"use client";

/**
 * /dev/map-extras , MOCKUP (owner 2026-07-01, #2 + #1). English (mockup rule). Exists-check:
 * `npm run exists map-extras` = 0. Grounds the store preview in the REAL SalonResultCard fields
 * (name, rating, review count, category, quartier, distance, priceFrom, next slot) , not invented.
 *   #2 STORE PREVIEW , tapping a pin opens this card (today it does nothing). First version in the
 *      app's card language; the EXACT look is BLOCKED on the owner's reference screenshot.
 *   #1 MAP-BAR CITY , the bar shows the SEARCH city, not the pan viewport. LEAD RECOMMENDATION:
 *      a "Search this area" button on pan (Google/Airbnb standard; MapView.onAreaSearch already
 *      exists), instead of the bar silently tracking the pan. Still a fork the owner confirms.
 * Real tokens, Lucide, no CDN.
 */
import { Star, MapPin, Clock, X } from "lucide-react";
import { notFound } from "next/navigation";

const SHADOW = "shadow-[0_1px_2px_rgba(10,10,10,0.10),0_8px_24px_rgba(10,10,10,0.10)]";

export default function MapExtrasMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[460px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-2">Mockup , map pin preview + area search (#2 + #1)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Tapping a pin, and the stuck city bar</h1>

        {/* #2 STORE PREVIEW */}
        <h2 className="mt-6 text-[13px] font-semibold text-s-ink-2">#2 , pin tap opens a store preview (first version)</h2>
        <p className="mb-3 text-[12px] text-s-ink-2">Same fields as the result card. Exact look BLOCKED on your reference screenshot.</p>
        <div className={`overflow-hidden rounded-[20px] border border-s-border bg-white ${SHADOW}`}>
          <div className="flex gap-3 p-3">
            <div className="h-[92px] w-[92px] shrink-0 rounded-2xl bg-s-bg-sunken" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-heading text-[15px] font-bold text-s-ink">Old Town Barbers</p>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-s-border text-s-ink-2"><X size={14} /></span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2">
                <Star size={13} className="fill-s-star text-s-star" strokeWidth={0} />
                <span className="font-semibold text-s-ink">4.8</span>
                <span className="text-s-accent">(16)</span>
              </p>
              <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">Barber , Kleinbasel , 400 m</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-s-ink">from CHF 35</span>
                {/* next-availability = day granularity only (today/tomorrow), never a clock time on a card (no-times-in-listings) */}
                <span className="flex items-center gap-1 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-medium text-s-ink-2"><Clock size={12} /> Available today</span>
              </div>
            </div>
          </div>
          <button className="w-full border-t border-s-border bg-s-ink py-3 text-[15px] font-bold text-white" /* selected-ok: primary commit CTA */>
            Book
          </button>
        </div>

        {/* #1 SEARCH THIS AREA */}
        <h2 className="mt-9 text-[13px] font-semibold text-s-ink-2">#1 , the bar shows your SEARCH city, not the map</h2>
        <p className="mb-3 text-[12px] text-s-ink-2">
          Panning to Zurich never changes &ldquo;Basel&rdquo; because the bar = your search, not the viewport.
          <b className="text-s-ink"> Recommend:</b> a &ldquo;Search this area&rdquo; button on pan (Google/Airbnb standard), so the bar stays your search and the map is explicit. The other option (bar silently tracks the pan) is non-standard and confusing.
        </p>
        <div className="relative h-[220px] overflow-hidden rounded-[20px] border border-s-border bg-s-bg-sunken">
          {/* stand-in map surface */}
          <div className="absolute inset-0 opacity-[0.5] [background:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(10,10,10,0.05)_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,rgba(10,10,10,0.05)_24px)]" />
          {/* the search bar, unchanged = your search */}
          <div className={`absolute inset-x-3 top-3 flex items-center gap-2 rounded-pill border border-s-border bg-white px-4 py-2.5 ${SHADOW}`}>
            <MapPin size={16} className="text-s-ink-2" />
            <span className="text-[14px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2">Basel</span></span>
          </div>
          {/* the recommended button, appears after a pan */}
          <button className={`absolute left-1/2 top-[52%] -translate-x-1/2 rounded-full border border-s-border bg-white px-4 py-2 text-[13px] font-semibold text-s-accent ${SHADOW}`}>
            Search this area
          </button>
        </div>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>#2: first version in the real card language , BLOCKED on your reference for the exact look.</li>
          <li>#1: recommendation drawn , a &ldquo;Search this area&rdquo; button (onAreaSearch already exists). Confirm this over the bar-tracks-pan option and I wire it.</li>
        </ul>
      </div>
    </main>
  );
}
