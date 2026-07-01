"use client";

/**
 * /dev/filter-refine , MOCKUP (owner 2026-07-01, #5 "refine each filter"). English (mockup rule).
 * Exists-check: `npm run exists filter-refine` = 0; the real sheet is FilterSheet.tsx (opened from
 * SearchTemplate). This is NOT net-new UI , it refines the existing sheet. Investigated live (real
 * sheet screenshotted): 3 concrete refinements, each backed by a locked rule, replacing the earlier
 * "needs owner specifics" punt.
 *   R1 filter pills selected = BLUE border + blue text, NO fill (locked V3-D450). Live drift:
 *      FilterSheet.tsx:252 uses `border-s-ink bg-s-bg-sunken` (ink border + gray fill).
 *   R2 price = min-max RANGE (ab / bis), not a single max slider labelled "Beliebiger Preis".
 *   R3 tighter section rhythm (32 between groups, 12 label->control) so the sheet reads as one scale.
 * Real tokens, Lucide, no CDN.
 */
import { X } from "lucide-react";
import { notFound } from "next/navigation";

function Pill({ children, selected, blue }: { children: React.ReactNode; selected?: boolean; blue?: boolean }) {
  const sel = blue
    ? "border-s-accent text-s-accent font-semibold" // R1 refined: blue border, blue text, NO fill (V3-D450)
    : "border-s-ink bg-s-bg-sunken text-s-ink font-semibold"; // current (drift): ink border + gray fill
  return (
    <span className={`inline-flex items-center rounded-full border px-3.5 py-2 text-[13px] ${selected ? sel : "border-s-border text-s-ink-2"}`}>
      {children}
    </span>
  );
}

function Sheet({ title, blue }: { title: string; blue?: boolean }) {
  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-[24px] border border-s-border bg-white">
      <div className="flex items-center justify-between border-b border-s-border px-5 py-3.5">
        <span className="font-heading text-[16px] font-bold text-s-ink">Filter</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-s-border text-s-ink-2"><X size={16} /></span>
      </div>
      <div className={blue ? "space-y-6 p-5" : "space-y-5 p-5"}>
        <div>
          <p className="mb-2.5 text-[13px] font-semibold text-s-ink">Sort</p>
          <div className="flex flex-wrap gap-2">
            <Pill selected blue={blue}>Popular</Pill><Pill blue={blue}>Price</Pill><Pill blue={blue}>Newest</Pill>
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-[13px] font-semibold text-s-ink">Price</p>
          {blue ? (
            <>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="flex-1 rounded-xl border border-s-border px-3 py-2 text-s-ink">from CHF 20</span>
                <span className="text-s-ink-3">,</span>
                <span className="flex-1 rounded-xl border border-s-border px-3 py-2 text-s-ink">to CHF 120</span>
              </div>
              <div className="relative mt-3 h-1 rounded-full bg-s-bg-sunken">
                <span className="absolute left-[10%] right-[35%] h-1 rounded-full bg-s-ink" />
                <span className="absolute left-[10%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-s-ink bg-white" />
                <span className="absolute right-[35%] top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-s-ink bg-white" />
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-[13px] text-s-ink-2">Any price</p>
              <div className="relative h-1 rounded-full bg-s-bg-sunken">
                <span className="absolute inset-0 rounded-full bg-s-ink" />
                <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-s-ink bg-white" />
              </div>
              <div className="mt-1 flex justify-between text-[12px] text-s-ink-3"><span>CHF 20</span><span>CHF 300+</span></div>
            </>
          )}
        </div>
        <div>
          <p className="mb-2.5 text-[13px] font-semibold text-s-ink">For whom</p>
          <div className="flex flex-wrap gap-2">
            <Pill selected blue={blue}>All</Pill><Pill blue={blue}>Women</Pill><Pill blue={blue}>Men</Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilterRefineMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , refine each filter (#5)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Filter sheet refinements</h1>
        <p className="mt-1 max-w-[620px] text-[13px] text-s-ink-2">Investigated the live sheet. Three refinements, each backed by a locked rule , not a guess.</p>

        <div className="mt-7 flex flex-wrap gap-8">
          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">Now (what ships)</h2>
            <Sheet title="now" />
          </div>
          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">Refined (recommended)</h2>
            <Sheet title="refined" blue />
          </div>
        </div>

        <ul className="mt-7 max-w-[620px] space-y-2 text-[13px] text-s-ink-2">
          <li><b className="text-s-ink">R1 , selected pill = blue border, no fill</b> , the locked filter-pill rule (V3-D450). The live sheet drifts to an ink border + gray fill (FilterSheet.tsx:252).</li>
          <li><b className="text-s-ink">R2 , price is a min-max range</b> , &ldquo;from / to&rdquo; with two handles, instead of one max slider labelled &ldquo;any price&rdquo; (which reads ambiguously with the handle pinned right).</li>
          <li><b className="text-s-ink">R3 , tighter, even rhythm</b> , 24px between groups, 12px label to control, so the sheet reads as one scale.</li>
        </ul>
      </div>
    </main>
  );
}
