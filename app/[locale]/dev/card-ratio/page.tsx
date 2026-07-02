"use client";

/**
 * /dev/card-ratio , A3 store-card photo ASPECT RATIO before/after (owner 2026-07-02: "ditch square").
 * English (mockup rule). Council direction B: the LARGE photo cards move square -> aspect-[3/2]
 * (converging with the already-3/2 feed/card variants); small thumbnails (list 104px, suggest 70px)
 * STAY square (they're list-row identity, not gallery cards). This shows the two cards that are still
 * square: SalonResultCard "grid" variant + the homepage SalonCard. Photo WIDTH held constant, only
 * the height/ratio changes.
 * Exists-check: `npm run exists card-ratio` = 0. Current squares: SalonResultCard.tsx:590 (grid) +
 * SalonCard.tsx:485 (homepage). Feed/card variants already aspect-[3/2].
 * Grounded-in: the REAL SalonResultCard grid variant + homepage SalonCard (aspect-square today) , same
 * name+rating+meta grammar, only the photo aspect changes. Not-a-salon-card exception: grid/homepage
 * cards have NO service rows by design (that's the feed variant), so this is not the feed card.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { Star, Heart } from "lucide-react";
import { notFound } from "next/navigation";

function Card({ ratio }: { ratio: "square" | "wide" }) {
  return (
    <div className="w-[168px]">
      <div className={`relative w-full overflow-hidden rounded-[22px] bg-s-bg-sunken shadow-elevation-2 ${ratio === "square" ? "aspect-square" : "aspect-[3/2]"}`}>
        <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={15} /></span>
      </div>
      <div className="pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[15px] font-bold text-s-ink">Muse Beauty Studio</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-s-ink"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> 4.9</span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-s-ink-2">Coiffeur, Basel</p>
      </div>
    </div>
  );
}

function Pair({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-s-ink">{title}</p>
      <p className="mb-3 text-[12px] text-s-ink-2">{sub}</p>
      <div className="flex items-start gap-5">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-s-ink-3">Before (square)</p>
          <Card ratio="square" />
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-s-accent">After (3/2)</p>
          <Card ratio="wide" />
        </div>
      </div>
    </div>
  );
}

export default function CardRatioMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-[420px] space-y-8">
        <div>
          <h1 className="font-heading text-[18px] font-bold text-s-ink">Store card photo ratio</h1>
          <p className="mt-1 text-[13px] text-s-ink-2">Ditch square on the LARGE cards. Photo width is held constant; only the height changes. Small list/suggest thumbnails stay square (not shown , they keep 1:1).</p>
        </div>
        <Pair title="1. Search results , grid card" sub="SalonResultCard grid variant (currently aspect-square)" />
        <Pair title="2. Homepage , salon card" sub="SalonCard on the homepage rails (currently aspect-square)" />
        <p className="border-t border-s-border pt-4 text-[12.5px] text-s-ink-2">Recommendation: 3/2 (right). It matches the already-3/2 feed/card variants, shows more of the room, and reads less avatar-ish than the square. Approve and I change SalonResultCard grid + SalonCard to aspect-[3/2].</p>
      </div>
    </main>
  );
}
