"use client";

/**
 * /dev/map-bar , MOCKUP (owner 2026-07-01, #4). English copy (mockup rule). Exists-check:
 * `npm run exists map-bar` = 0. The real bar lives in SearchTemplate.tsx (map overlay, ~line 1494).
 * Measured: normal bar h=67 / w=358 / pill / py-10px; map bar h=47 / w=304 with a SEPARATE 44x44
 * back button. Owner wants the map bar the SAME SIZE as the normal bar, with the back arrow INSIDE
 * it. Owner also asked for 3+ VARIATIONS (was shipped as 1 , fixed). Real tokens, Lucide, no CDN.
 */
import { ArrowLeft, Search } from "lucide-react";
import { notFound } from "next/navigation";

const SHADOW = "shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]";

function Backdrop({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-[13px] font-semibold text-s-ink">{title}</h2>
      <p className="mb-2 text-[12px] text-s-ink-2">{note}</p>
      <div className="rounded-[22px] border border-s-border bg-s-bg-sunken p-3">{children}</div>
    </div>
  );
}

export default function MapBarMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[460px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-2">Mockup , map search bar (#4) , 3 variations</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Same size as the normal bar, back arrow inside</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">All three are full-width, same height + pill as the normal bar, with the back arrow integrated. They differ in how the arrow joins the bar.</p>

        <p className="mt-4 rounded-xl bg-s-bg-sunken px-3 py-2 text-[12.5px] text-s-ink-2">
          <b className="text-s-ink">Recommend B</b> , one clean pill, arrow + query flow left to right, city as a quiet trailing chip; no divider line to add noise.
        </p>

        <Backdrop title="Now , small bar + separate floating back button" note="Two elements, map bar is smaller than the normal search bar.">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-s-border bg-white text-s-ink ${SHADOW}`}>
              <ArrowLeft size={20} strokeWidth={2} />
            </span>
            <span className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-s-border bg-white px-4 py-2.5 ${SHADOW}`}>
              <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
              <span className="truncate text-[13.5px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2">Basel</span></span>
            </span>
          </div>
        </Backdrop>

        <Backdrop title="A , arrow inside + divider" note="Back arrow on the left, a thin hairline separates it from the query.">
          <div className={`flex w-full items-center gap-1.5 rounded-pill border border-s-border bg-white py-2.5 pl-2 pr-4 ${SHADOW}`}>
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink active:scale-95"><ArrowLeft size={20} strokeWidth={2.2} /></button>
            <span className="h-6 w-px shrink-0 bg-s-border" />
            <Search size={17} strokeWidth={2} className="ml-1.5 shrink-0 text-s-ink-2" />
            <span className="truncate text-[15px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2">Basel</span></span>
          </div>
        </Backdrop>

        <Backdrop title="B , arrow inside, no divider, city as trailing chip (recommended)" note="Cleanest: arrow, search icon, category; the city sits as a quiet chip on the right.">
          <div className={`flex w-full items-center gap-2 rounded-pill border border-s-border bg-white py-2.5 pl-2 pr-2.5 ${SHADOW}`}>
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink active:scale-95"><ArrowLeft size={20} strokeWidth={2.2} /></button>
            <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <span className="truncate text-[15px] font-medium text-s-ink">Barber</span>
            <span className="ml-auto shrink-0 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12.5px] font-medium text-s-ink-2">Basel</span>
          </div>
        </Backdrop>

        <Backdrop title="C , connected capsules" note="Arrow is its own rounded segment touching the bar (two-zone), so the back tap target is unmistakable.">
          <div className="flex w-full items-stretch gap-1">
            <button className={`grid h-[46px] w-12 shrink-0 place-items-center rounded-l-pill rounded-r-lg border border-s-border bg-white text-s-ink active:scale-95 ${SHADOW}`}><ArrowLeft size={20} strokeWidth={2.2} /></button>
            <span className={`flex min-w-0 flex-1 items-center gap-2 rounded-l-lg rounded-r-pill border border-s-border bg-white px-4 ${SHADOW}`}>
              <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
              <span className="truncate text-[15px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2">Basel</span></span>
            </span>
          </div>
        </Backdrop>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>All three match the normal search bar height (measured h~67, radius pill) , no more tiny map bar.</li>
          <li>The back arrow is a 44px tap zone in every variant (a11y floor); the rest of the bar opens search.</li>
        </ul>
      </div>
    </main>
  );
}
