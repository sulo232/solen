"use client";

/**
 * /dev/pin-label , MOCKUP (owner 2026-07-01, #3). English copy (mockup rule). Exists-check:
 * `npm run exists pin-label` = 0. Real pins render in MapView.tsx (~line 213, "ab CHF" pill).
 * Owner: swap the from-PRICE for the RATING (stars) + review COUNT, and do NOT make it black like
 * Fresha (keep the calm white pill). This shows current vs proposed. The exact Fresha styling is
 * BLOCKED on the owner's Fresha reference screenshot , this covers the price->rating swap only.
 * Real tokens, Lucide, no CDN.
 */
import { Star } from "lucide-react";
import { notFound } from "next/navigation";

function Pin({ children, selected }: { children: React.ReactNode; selected?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-semibold shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)] ${
      selected ? "border-s-ink bg-s-ink text-white" /* selected-ok: selected map pin */ : "border-s-border bg-white text-s-ink"}`}>
      {children}
    </span>
  );
}

function Board({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-s-border bg-s-bg-sunken p-5">{children}</div>;
}

export default function PinLabelMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[440px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , map pin label (#3)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Rating + reviews instead of price</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">Kept the calm white pill , NOT black like Fresha.</p>

        <h2 className="mt-6 text-[13px] font-semibold text-s-ink-2">Now , from-price</h2>
        <Board>
          <Pin>from CHF 15</Pin>
          <Pin>from CHF 35</Pin>
          <Pin selected>from CHF 20</Pin>
        </Board>

        <h2 className="mt-7 text-[13px] font-semibold text-s-ink-2">Proposed , rating + review count</h2>
        <Board>
          <Pin><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 4.8 <span className="font-normal text-s-ink-2">(16)</span></Pin>
          <Pin><Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 4.3 <span className="font-normal text-s-ink-2">(11)</span></Pin>
          <Pin selected><Star size={13} className="fill-s-star text-white" strokeWidth={0} /> 4.6 <span className="font-normal text-white/70">(25)</span></Pin>
        </Board>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>Star (yellow) + rating + the review count in a lighter weight.</li>
          <li>Same white pill + hairline as today , NOT a black Fresha pill.</li>
          <li>Selected pin still fills ink (unchanged), so the picked one stands out.</li>
          <li>Blocked: the exact Fresha look needs your screenshot , this is the price to rating swap.</li>
        </ul>
      </div>
    </main>
  );
}
