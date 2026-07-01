"use client";

/**
 * /dev/pin-label , MOCKUP (owner 2026-07-01, #3). English copy (mockup rule). Exists-check:
 * `npm run exists pin-label` = 0. Real pins render in MapView.tsx (~line 213, "ab CHF" pill).
 * Owner: swap the from-PRICE for the RATING (stars) + review COUNT, and do NOT make it black like
 * Fresha (keep the calm white pill). Owner also asked for 3+ VARIATIONS (was shipped as 1 , fixed).
 * Selected pin = blue s-accent FILL (design contract: selected map element = blue, like date/slot;
 * NOT ink/black). Exact Fresha styling BLOCKED on the owner's Fresha ref. Real tokens, Lucide.
 */
import { Star } from "lucide-react";
import { notFound } from "next/navigation";

const SHADOW = "shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]";
const SEL = "border-s-accent bg-s-accent text-white";
const REST = "border-s-border bg-white text-s-ink";

function Board({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-[13px] font-semibold text-s-ink">{title}</h2>
      <p className="mb-2 text-[12px] text-s-ink-2">{note}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-s-border bg-s-bg-sunken p-5">{children}</div>
    </div>
  );
}

// A: inline pill , star + rating + count together
function PinInline({ selected }: { selected?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${SHADOW} ${selected ? SEL : REST}`}>
      <Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 4.8
      <span className={`font-normal ${selected ? "text-white/75" : "text-s-ink-2"}`}>(16)</span>
    </span>
  );
}

// B: compact , rating only; the count reveals on the SELECTED pin (dense-map friendly)
function PinCompact({ selected }: { selected?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[12.5px] font-semibold ${SHADOW} ${selected ? SEL : REST}`}>
      <Star size={13} className="fill-s-star text-s-star" strokeWidth={0} /> 4.8
      {selected && <span className="font-normal text-white/75">(16)</span>}
    </span>
  );
}

// C: map-native circular marker , rating inside a round badge + a small pointer, count on a chip
function PinMarker({ selected }: { selected?: boolean }) {
  return (
    <span className="relative inline-flex flex-col items-center">
      <span className={`grid h-9 w-9 place-items-center rounded-full border text-[12.5px] font-bold ${SHADOW} ${selected ? SEL : REST}`}>4.8</span>
      <span className={`-mt-1 h-2.5 w-2.5 rotate-45 border-b border-r ${selected ? "border-s-accent bg-s-accent" : "border-s-border bg-white"}`} />
      <span className="mt-1 flex items-center gap-0.5 text-[12px] font-medium text-s-ink-2">
        <Star size={11} className="fill-s-star text-s-star" strokeWidth={0} /> 16
      </span>
    </span>
  );
}

export default function PinLabelMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[460px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-3">Mockup , map pin label (#3) , 3 variations</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">Rating + reviews instead of price</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">Calm white pill, NOT black like Fresha. Three directions to pick from. Selected pin fills blue (like a picked date), never black.</p>

        <p className="mt-4 rounded-xl bg-s-bg-sunken px-3 py-2 text-[12.5px] text-s-ink-2">
          <b className="text-s-ink">Recommend A</b> , it reads at a glance (rating is the decision, count is the trust), one line, no interaction needed.
        </p>

        <p className="mt-6 text-[12px] font-semibold text-s-ink-3">Now , from-price (what ships today)</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-[22px] border border-s-border bg-s-bg-sunken p-5">
          <span className={`inline-flex items-center rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-semibold text-s-ink ${SHADOW}`}>from CHF 15</span>
          <span className={`inline-flex items-center rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-semibold text-s-ink ${SHADOW}`}>from CHF 35</span>
        </div>

        <Board title="A , inline pill (recommended)" note="Star + rating + count on one line. Instant read, works unselected.">
          <PinInline /><PinInline /><PinInline selected />
        </Board>

        <Board title="B , compact, count on select" note="Rating only by default; the (16) reveals on the selected pin. Cleanest on a dense map.">
          <PinCompact /><PinCompact /><PinCompact selected />
        </Board>

        <Board title="C , map-native marker" note="Round rating badge with a pointer (Google-Maps feel) + count chip below. Most map-like, least pill-like.">
          <PinMarker /><PinMarker /><PinMarker selected />
        </Board>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>Star = yellow s-star; rating bold ink; count lighter. Same white pill + hairline as today, never a black Fresha pill.</li>
          <li>Selected pin fills blue (design contract: selected map element = blue, like a picked date/slot).</li>
          <li>BLOCKED: the EXACT Fresha look still needs your screenshot , this covers the price-to-rating swap + 3 directions.</li>
        </ul>
      </div>
    </main>
  );
}
