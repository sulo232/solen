"use client";

/**
 * /dev/map-v2 , MOCKUP (owner 2026-07-02, from refs IMG_6254-6263). English (mockup rule).
 * Exists-check: `npm run exists map-v2` = 0; real map = components-legacy/MapView + SearchTemplate.
 * Translates the Fresha map references to Solen (white surfaces, ink, sparse blue, yellow star):
 *   #4 search bar (6257/6260): back arrow INSIDE + query + subtitle + map/list toggle.
 *   pins (6260): white pill, star + rating, NO count (settled).
 *   #2 store preview (6254/6255/6261): photo + carousel dots + name + star + dist/addr + cat/reviews + X.
 *   #5 filter sheet (6263): icon chips + Clear/Apply footer.
 *   results card (6257/6258): photo + heart + name + star + dist/addr + cat/reviews + service rows + "N services" link.
 * Real tokens, Lucide, no CDN. Photos = neutral placeholder blocks (layout mock).
 */
import { ArrowLeft, Search, Map as MapIcon, Star, X, SlidersHorizontal, Tag, Users, Clock, Heart } from "lucide-react";
import { notFound } from "next/navigation";

const SHADOW = "shadow-[0_1px_2px_rgba(10,10,10,0.10),0_6px_20px_rgba(10,10,10,0.09)]";
const CARD = "shadow-[0_1px_2px_rgba(10,10,10,0.08),0_10px_30px_rgba(10,10,10,0.10)]";

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">{label}</h2>
      <div className="w-[330px] overflow-hidden rounded-[26px] border border-s-border bg-s-bg-sunken">
        <div className="relative min-h-[520px]">{children}</div>
      </div>
    </div>
  );
}

// star + rating pin, no count (settled)
function Pin({ selected, top, left }: { selected?: boolean; top: string; left: string }) {
  return (
    <span className="absolute flex flex-col items-center" style={{ top, left }}>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold ${SHADOW} ${selected ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white text-s-ink"}`}>
        <Star size={12} className={selected ? "fill-white text-white" : "fill-s-star text-s-star"} strokeWidth={0} /> 4.6
      </span>
      <span className={`-mt-1 h-2 w-2 rotate-45 ${selected ? "bg-s-accent" : "bg-white border-b border-r border-s-border"}`} />
    </span>
  );
}

export default function MapV2Mockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , map experience v2 (from your references)</p>
        <h1 className="mt-1 font-heading text-[20px] font-bold text-s-ink">Map, preview, filters , Solen skin</h1>
        <p className="mt-1 max-w-[680px] text-[13px] text-s-ink-2">Fresha structure, Solen aesthetic: white pills (never black), yellow star, sparse blue for the one clickable link. Photos are placeholders.</p>

        <div className="mt-7 flex flex-wrap gap-8">

          {/* 1. MAP with search bar + pins + store preview */}
          <Phone label="Map , bar + pins + pin-tap preview (#4, #2)">
            <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_25px,rgba(10,10,10,0.045)_26px),repeating-linear-gradient(90deg,transparent,transparent_25px,rgba(10,10,10,0.045)_26px)]" />
            <div className={`absolute inset-x-3 top-3 flex items-center gap-2 rounded-[20px] border border-s-border bg-white px-2 py-2 ${SHADOW}`}>
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink active:scale-95"><ArrowLeft size={20} strokeWidth={2.2} /></button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-s-ink">Buzz cut</p>
                <p className="truncate text-[12px] text-s-ink-2">Any time , Basel</p>
              </div>
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink active:scale-95"><MapIcon size={18} strokeWidth={2} /></button>
            </div>
            <Pin top="120px" left="40px" />
            <Pin top="170px" left="150px" selected />
            <Pin top="150px" left="235px" />
            <Pin top="235px" left="90px" />
            <div className={`absolute inset-x-3 bottom-3 overflow-hidden rounded-[20px] border border-s-border bg-white ${CARD}`}>
              <div className="relative h-[130px] bg-s-bg-sunken">
                <button className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-s-border bg-white text-s-ink-2"><X size={15} /></button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-s-ink/60" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" /><span className="h-1.5 w-1.5 rounded-full bg-s-ink/25" />
                </div>
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-heading text-[15px] font-bold text-s-ink">Supreme Style &amp; Barber</p>
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 4.9</span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">Hauptstrasse 38, Brugg</p>
                <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">Barber , 22 reviews</p>
                <button className="mt-3 w-full rounded-full bg-s-ink py-2.5 text-[14px] font-bold text-white" /* selected-ok: primary commit CTA */>Book</button>
              </div>
            </div>
          </Phone>

          {/* 2. FILTER SHEET */}
          <Phone label="Filter sheet (#5) , icon chips + Clear/Apply">
            <div className="absolute inset-0 bg-s-ink/20" />
            <div className="absolute inset-x-0 bottom-0 rounded-t-[26px] bg-white pb-4 pt-3">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-s-border" />
              <div className="flex items-center justify-between px-5 pb-3">
                <span className="font-heading text-[16px] font-bold text-s-ink">Filters</span>
                <button className="grid h-8 w-8 place-items-center rounded-full border border-s-border text-s-ink-2"><X size={15} /></button>
              </div>
              <div className="space-y-4 px-5">
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-s-ink">Booking options</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-s-accent px-3 py-1.5 text-[13px] font-medium text-s-accent"><Tag size={14} /> Offers</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-s-border px-3 py-1.5 text-[13px] font-medium text-s-ink-2"><Users size={14} /> Groups</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-s-border px-3 py-1.5 text-[13px] font-medium text-s-ink-2"><Clock size={14} /> Open now</span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-s-ink">For whom</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-s-accent px-3 py-1.5 text-[13px] font-medium text-s-accent">All</span>
                    <span className="rounded-full border border-s-border px-3 py-1.5 text-[13px] font-medium text-s-ink-2">Women</span>
                    <span className="rounded-full border border-s-border px-3 py-1.5 text-[13px] font-medium text-s-ink-2">Men</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex gap-3 px-5">
                <button className="flex-1 rounded-full border border-s-border py-3 text-[14px] font-semibold text-s-ink">Clear</button>
                <button className="flex-1 rounded-full bg-s-ink py-3 text-[14px] font-bold text-white" /* selected-ok: primary commit CTA */>Apply</button>
              </div>
            </div>
          </Phone>

          {/* 3. RESULTS LIST CARD */}
          <Phone label="Results list card (#4 list view)">
            <div className="absolute inset-0 overflow-y-auto bg-white p-3">
              <div className={`mb-3 flex items-center gap-2 rounded-[18px] border border-s-border bg-white px-2 py-2 ${SHADOW}`}>
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink"><ArrowLeft size={18} strokeWidth={2.2} /></button>
                <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-bold text-s-ink">Buzz cut</p><p className="truncate text-[12px] text-s-ink-2">Any time , Basel</p></div>
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink"><Search size={16} /></button>
              </div>
              <div className="mb-2 flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-s-border px-3 py-1.5 text-[12.5px] font-medium text-s-ink"><SlidersHorizontal size={13} /> Filters</span>
                <span className="rounded-full border border-s-border px-3 py-1.5 text-[12.5px] font-medium text-s-ink">Best match</span>
              </div>
              <div className="overflow-hidden rounded-[18px] border border-s-border bg-white">
                <div className="relative h-[140px] bg-s-bg-sunken">
                  <button className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white text-s-ink-2"><Heart size={15} /></button>
                </div>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-heading text-[15px] font-bold text-s-ink">Zoltan Hair Zurich</p>
                    <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-s-ink"><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 5.0</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">1.7 km , Nussgasse 3, Zurich</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">Hair salon , 22 reviews</p>
                  <div className="mt-3 space-y-1">
                    {[["Buzz Cut", "20 min", "50"], ["Shampoo, Cut & Style", "45 min", "100"]].map(([n, d, p]) => (
                      <div key={n} className="flex items-center justify-between rounded-xl bg-s-bg-sunken px-3 py-2 text-[13px]">
                        <span className="min-w-0"><span className="block truncate text-s-ink">{n}</span><span className="text-[12px] text-s-ink-3">{d}</span></span>
                        <span className="shrink-0 font-semibold text-s-ink">CHF {p}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-2.5 text-[13px] font-semibold text-s-accent">Show 53 services</button>
                </div>
              </div>
            </div>
          </Phone>

        </div>

        <ul className="mt-8 max-w-[680px] space-y-2 text-[13px] text-s-ink-2">
          <li><b className="text-s-ink">Search bar</b> , back arrow inside + query + subtitle + a map/list toggle, matching the reference but on a white pill.</li>
          <li><b className="text-s-ink">Pins</b> , the settled white pill (star + 4.6, no count), blue when selected.</li>
          <li><b className="text-s-ink">Pin tap</b> , the store-preview card slides up (photo + carousel + name + rating + address + category/reviews + Book).</li>
          <li><b className="text-s-ink">Filter sheet</b> , icon chips (selected = blue border, no fill) + Clear/Apply, from your reference.</li>
          <li><b className="text-s-ink">Results card</b> , photo + save heart + rating + services + a blue "Show N services" link.</li>
        </ul>
      </div>
    </main>
  );
}
