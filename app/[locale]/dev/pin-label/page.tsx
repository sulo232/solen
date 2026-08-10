"use client";

/**
 * /dev/pin-label , MOCKUP (owner 2026-07-01 #3, SETTLED 2026-07-02). English (mockup rule).
 * Exists-check: `npm run exists pin-label` = 0. Real pins render in MapView.tsx (~line 213).
 * SETTLED by owner (voice 2026-07-02): white pill, star + rating (4.6), NO count (dropping the
 * count made A==B, owner: "I don't know the difference between b and a" , correct). Keep WHITE +
 * blue inline (do NOT copy the black Fresha pill in ref IMG_6260). Selected = blue s-accent fill
 * (design contract: selected map element = blue, like a picked date/slot). Real tokens, Lucide.
 */
import { Star } from "lucide-react";
import { notFound } from "next/navigation";

const SHADOW = "shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]";

// White pill, yellow star + rating, NO count. Selected = blue fill (inline blue).
function Pin({ selected }: { selected?: boolean }) {
  return (
    <span className={`relative inline-flex flex-col items-center`}>
      <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold ${SHADOW} ${
        selected ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white text-s-ink"}`}>
        <Star size={13} className={selected ? "fill-white text-white" : "fill-s-star text-s-star"} strokeWidth={0} /> 4.6
      </span>
      {/* teardrop pointer, like the Fresha ref (IMG_6260) but white/blue not black */}
      <span className={`-mt-1 h-2.5 w-2.5 rotate-45 border-b border-r ${selected ? "border-s-accent bg-s-accent" : "border-s-border bg-white"}`} />
    </span>
  );
}

export default function PinLabelMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[460px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-2">Mockup , map pin label (#3) , SETTLED</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">White pill, star + rating, no count</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">Dropping the count made A and B identical, so it is one design now. White resting, blue when selected (never black like Fresha).</p>

        <h2 className="mt-6 text-[13px] font-semibold text-s-ink-2">Resting + selected on the map</h2>
        <div className="mt-2 flex flex-wrap items-start gap-4 rounded-[22px] border border-s-border bg-s-bg-sunken p-6">
          <Pin /><Pin /><Pin selected /><Pin /><Pin />
        </div>

        <ul className="mt-6 space-y-2 text-[13px] text-s-ink-2">
          <li>Yellow star + rating (4.6), NO review count.</li>
          <li>White pill + hairline resting; the selected pin fills blue (inline blue), never black.</li>
          <li>Teardrop pointer like the reference, in white/blue not the Fresha black.</li>
        </ul>
      </div>
    </main>
  );
}
