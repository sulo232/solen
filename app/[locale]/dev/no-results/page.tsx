// exists-check: dev-only mockup route (notFound in prod), net-new. `npm run exists
// no-results-variants` -> 0. Three tight takes on the "one clear CTA" no-results
// direction (owner picked C, wanted less text + variations). English copy only
// (mockups are always English). Real Tailwind tokens; shipped state = SearchTemplate.
"use client";

import { notFound } from "next/navigation";
import { Globe, Scissors, MapPinOff, SearchX } from "lucide-react";

// C1 , single CTA: calm, one ink commit button + one secondary text link.
function C1() {
  return (
    <div className="flex flex-col items-center px-6 pt-11 pb-9 text-center">
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-s-bg-sunken shadow-[0_2px_8px_rgba(10,10,10,0.06)]">
        <MapPinOff size={30} strokeWidth={1.5} className="text-s-ink" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        No salons in Bern
      </h2>
      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black">
        <Globe size={18} strokeWidth={2} /> Search all of Switzerland
      </button>
      <button className="mt-4 text-[14px] font-medium text-s-accent hover:underline">
        Browse Coiffeur (8)
      </button>
    </div>
  );
}

// C2 , two choices: headline + two buttons side by side (ink primary + neutral outline).
function C2() {
  return (
    <div className="flex flex-col items-center px-6 pt-11 pb-9 text-center">
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-s-bg-sunken">
        <SearchX size={30} strokeWidth={1.5} className="text-s-ink" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Nothing in Bern
      </h2>
      <div className="mt-6 flex w-full gap-3">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-s-ink px-4 py-3 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-black">
          <Globe size={16} strokeWidth={2} /> Switzerland 12
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-btn border border-s-border bg-white px-4 py-3 text-[14px] font-semibold text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken">
          <Scissors size={16} strokeWidth={2} /> Coiffeur 8
        </button>
      </div>
    </div>
  );
}

// C3 , minimal: one ink CTA only, most restrained + a tiny escape link.
function C3() {
  return (
    <div className="flex flex-col items-center px-6 pt-12 pb-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-s-bg-sunken">
        <SearchX size={28} strokeWidth={1.5} className="text-s-ink-2" />
      </div>
      <h2 className="font-display mt-5 text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        No match
      </h2>
      <p className="font-body mt-2 text-[14px] text-s-ink-2">Nothing for that in Bern.</p>
      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black">
        Search everywhere (12)
      </button>
      <button className="mt-4 text-[13px] font-medium text-s-ink-3 transition-colors hover:text-s-ink">
        New search
      </button>
    </div>
  );
}

const VARIANTS: { key: string; label: string; note: string; el: React.ReactNode }[] = [
  { key: "C1", label: "C1 , Single CTA", note: "One ink button + one text link. Calm.", el: <C1 /> },
  { key: "C2", label: "C2 , Two choices", note: "Two buttons side by side. Compact.", el: <C2 /> },
  { key: "C3", label: "C3 , Minimal", note: "One button only. Most restrained.", el: <C3 /> },
];

export default function NoResultsVariantsPage() {
  if (process.env.NODE_ENV === "production") notFound(); // dev preview only

  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[440px]">
        <h1 className="font-display text-[24px] font-bold tracking-[-0.02em] text-s-ink">
          No results , 3 takes on C
        </h1>
        <p className="font-body mt-2 text-[14px] text-s-ink-2">
          One clear CTA, tighter copy. Pick one. My take: C1.
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {VARIANTS.map((v) => (
            <div key={v.key}>
              <div className="mb-2">
                <div className="font-body text-[13px] font-semibold text-s-ink">{v.label}</div>
                <div className="font-body text-[12px] text-s-ink-3">{v.note}</div>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-s-border bg-white">
                {v.el}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
