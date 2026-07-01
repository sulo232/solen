"use client";

/**
 * /dev/map-bar , MOCKUP (owner 2026-07-01, #4). English copy (mockup rule). Exists-check:
 * `npm run exists map-bar` = 0. The real bar lives in SearchTemplate.tsx (map overlay, ~line 1494).
 * Measured: normal bar h=67 / w=358 / pill / py-10px; map bar h=47 / w=304 with a SEPARATE 44x44
 * back button. Owner wants the map bar the SAME SIZE as the normal bar, with the back arrow INSIDE
 * it. This shows current vs proposed. Real tokens, Lucide, no CDN. Ships only on owner approval.
 */
import { ArrowLeft, Search } from "lucide-react";
import { notFound } from "next/navigation";

// a calm backdrop (stands in for the map) so the bar reads in context
function MapBackdrop({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[22px] border border-s-border bg-s-bg-sunken p-3">{children}</div>;
}

export default function MapBarMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[440px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , map search bar (#4)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Same size as the normal bar, back arrow inside</h1>

        <h2 className="mt-6 text-[13px] font-semibold text-s-ink-2">Now , small bar + separate back button</h2>
        <MapBackdrop>
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]">
              <ArrowLeft size={20} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-s-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]">
              <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
              <span className="truncate text-[14px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2"> | Basel</span></span>
            </span>
          </div>
        </MapBackdrop>

        <h2 className="mt-7 text-[13px] font-semibold text-s-ink-2">Proposed , one full-width bar, back arrow inside</h2>
        <MapBackdrop>
          <div className="flex w-full items-center gap-1.5 rounded-pill border border-s-border bg-white py-2.5 pl-2 pr-4 shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]">
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-s-ink active:scale-95">
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>
            <span className="h-6 w-px shrink-0 bg-s-border" />
            <Search size={17} strokeWidth={2} className="ml-1.5 shrink-0 text-s-ink-2" />
            <span className="truncate text-[15px] font-medium text-s-ink">Barber<span className="ml-1.5 font-normal text-s-ink-2"> | Basel</span></span>
          </div>
        </MapBackdrop>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>Full width, same height + pill as the normal search bar (measured: h~67, radius pill).</li>
          <li>Back arrow moved INSIDE the bar (left), split by a thin divider , no separate floating button.</li>
          <li>One tap target for search; the back arrow is its own tap zone on the left.</li>
        </ul>
      </div>
    </main>
  );
}
