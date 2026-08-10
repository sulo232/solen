"use client";

/**
 * /dev/filter-refine , MOCKUP (owner 2026-07-02 v2). English (mockup rule). Exists-check:
 * `npm run exists filter-refine` = 0; real sheet = FilterSheet.tsx. Owner v2 corrections:
 *   - selected chip = GRAY sunken (bg-s-bg-sunken + ink + semibold), NOT blue and NOT ink-border.
 *     ("filter when selected, the blue thingy, just sync it out grayed.")
 *   - DO NOT refine the price , revert the min-max range, keep the single control. ("don't do that.")
 * Now (the live drift: ink border + gray fill) vs Refined (clean gray). Real tokens, Lucide.
 */
import { X } from "lucide-react";
import { notFound } from "next/navigation";

// now = the live drift (ink border + gray fill); refined = clean GRAY sunken (no colored border).
function Pill({ children, selected, refined }: { children: React.ReactNode; selected?: boolean; refined?: boolean }) {
  const sel = refined
    ? "bg-s-bg-sunken text-s-ink font-semibold border-transparent"          // refined: gray sunken, no border
    : "border-s-ink bg-s-bg-sunken text-s-ink font-semibold";                // now (drift): ink border /* selected-ok: before/comparison */
  return (
    <span className={`inline-flex items-center rounded-full border px-3.5 py-2 text-[13px] ${selected ? sel : "border-s-border text-s-ink-2"}`}>
      {children}
    </span>
  );
}

function Sheet({ refined }: { refined?: boolean }) {
  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-[24px] border border-s-border bg-white">
      <div className="flex items-center justify-between border-b border-s-border px-5 py-3.5">
        <span className="font-heading text-[16px] font-bold text-s-ink">Filter</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-s-border text-s-ink-2"><X size={16} /></span>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2.5 text-[13px] font-semibold text-s-ink">Sort</p>
          <div className="flex flex-wrap gap-2"><Pill selected refined={refined}>Popular</Pill><Pill refined={refined}>Price</Pill><Pill refined={refined}>Newest</Pill></div>
        </div>
        <div>
          {/* price UNCHANGED , single control, no min-max range (owner: don't refine the price) */}
          <p className="mb-2 text-[13px] font-semibold text-s-ink">Price</p>
          <p className="mb-2 text-[13px] text-s-ink-2">Any price</p>
          <div className="relative h-1 rounded-full bg-s-bg-sunken">
            <span className="absolute inset-0 rounded-full bg-s-ink" />
            <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-s-ink bg-white" />
          </div>
          <div className="mt-1 flex justify-between text-[12px] text-s-ink-2"><span>CHF 20</span><span>CHF 300+</span></div>
        </div>
        <div>
          <p className="mb-2.5 text-[13px] font-semibold text-s-ink">For whom</p>
          <div className="flex flex-wrap gap-2"><Pill selected refined={refined}>All</Pill><Pill refined={refined}>Women</Pill><Pill refined={refined}>Men</Pill></div>
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
        <p className="text-[12px] font-semibold text-s-ink-2">Mockup , filter sheet (#5) v2</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Selected = gray, price untouched</h1>
        <p className="mt-1 max-w-[620px] text-[13px] text-s-ink-2">Selected chip is now calm GRAY sunken (no blue, no ink border). Price control left exactly as-is , no min-max range.</p>

        <div className="mt-7 flex flex-wrap gap-8">
          <div><h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">Now (ink-border selected)</h2><Sheet /></div>
          <div><h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">Refined (gray selected)</h2><Sheet refined /></div>
        </div>

        <ul className="mt-7 max-w-[620px] space-y-2 text-[13px] text-s-ink-2">
          <li><b className="text-s-ink">Selected = gray sunken</b> , bg-s-bg-sunken + ink text + semibold, no colored border. Not blue, not black.</li>
          <li><b className="text-s-ink">Price untouched</b> , kept the single control (reverted the min-max range).</li>
        </ul>
      </div>
    </main>
  );
}
