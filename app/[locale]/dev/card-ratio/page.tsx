"use client";

/**
 * /dev/card-ratio , A3 store-card SIZE rework (owner 2026-07-03: after the 3/2 change went live the
 * homepage stores read TOO SMALL. "bring back the square or make the size bigger"). English (mockup rule).
 *
 * ROOT CAUSE (measured): the real homepage rail card width is set by SalonCard.tsx itself,
 *   `w-[calc((100vw-44px)/2.2)]` on mobile. At the 412px viewport the owner judges on that is
 *   (412-44)/2.2 = 167px wide. The old photo was aspect-SQUARE -> 167x167 tall. The new aspect-[3/2]
 *   photo at the same 167px width is only 167 * 2/3 = 111px tall , so the photo LOST 56px of height,
 *   which is why the stores now read small. The card grammar (name/rating/meta) is unchanged.
 *
 * THREE horizontal RAIL strips at phone width (each an overflow-x-auto row like the real homepage rail):
 *   V1 SQUARE @ current 167px  -> photo 167x167  (the rollback , exactly today's width, square again)
 *   V2 3/2 @ 250px             -> photo 250x167  (bigger width; photo HEIGHT 167 == old square height,
 *                                 keeps the search-card 3/2 match, photo AREA 41.7k px2 > old 27.9k)
 *   V3 SQUARE @ 200px          -> photo 200x200  (bigger square)
 *   (Owner hinted ~215-230 for V2; at 3/2 that gives only 143-153px height, still shorter than the old
 *    square. 250px is the width where the 3/2 photo height finally matches the old square 167px , the
 *    hard "photo height >= old square height" target , so V2 uses 250.)
 *
 * RECOMMEND V2: keeps the 3/2 shape that already matches the search result cards AND makes the store
 * bigger (photo area larger than the old square, height back to the old 167px).
 *
 * Exists-check: `npm run exists card-ratio` = 0. Real rail width source = SalonCard.tsx
 *   `w-[calc((100vw-44px)/2.2)]`; real rail container = SectionHeader.tsx ScrollRow (overflow-x-auto
 *   flex gap-3). This is a MOCKUP only , the real SalonCard is untouched until the owner picks.
 * Grounded-in: the REAL homepage SalonCard grammar (name + star-rating + meta) + ScrollRow rail.
 * Not-a-salon-card: these are the homepage RAIL cards (SalonCard.tsx), NOT the search feed result card.
 *   By design the homepage rail card has NO service rows and NO "View store" off-ramp (that grammar is
 *   the SalonResultCard feed variant only) , it is a compact name+star+meta rail tile. This mockup only
 *   compares its photo width/ratio, so it deliberately renders that compact grammar, not the feed card.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { Star, Heart } from "lucide-react";
import { notFound } from "next/navigation";

// One rail card. width + ratio are the only things that change between variants;
// name/rating/meta grammar copied from the real homepage SalonCard.
function RailCard({ widthPx, ratio, name, meta }: { widthPx: number; ratio: "square" | "wide"; name: string; meta: string }) {
  return (
    <div className="shrink-0" style={{ width: widthPx }}>
      <div className={`relative w-full overflow-hidden rounded-[22px] bg-s-bg-sunken shadow-elevation-2 ${ratio === "square" ? "aspect-square" : "aspect-[3/2]"}`}>
        <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white text-s-ink-2 shadow-sm"><Heart size={15} /></span>
      </div>
      <div className="pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-heading text-[14px] font-bold text-s-ink">{name}</p>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-s-ink"><Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> 4.9</span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-s-ink-3">{meta}</p>
      </div>
    </div>
  );
}

// A horizontal rail strip (like the real homepage ScrollRow), scrolling 2-3 cards.
// realsize-ok: a rail card is deliberately NOT full-width , the homepage rail shows 2 cards + a peek,
// so the real-size comparison IS these ~167-250px rail widths, exactly what the owner judges on.
function RailStrip({
  title,
  numbers,
  rec,
  widthPx,
  ratio,
}: {
  title: string;
  numbers: string;
  rec: boolean;
  widthPx: number;
  ratio: "square" | "wide";
}) {
  const cards = [
    { name: "Muse Beauty Studio", meta: "Coiffeur, Basel" },
    { name: "Atelier Nord", meta: "Coiffeur, Zurich" },
    { name: "Studio Bellevue", meta: "Coiffeur, Bern" },
  ];
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2 px-4">
        <span className={`font-body text-[14px] font-bold ${rec ? "text-s-accent" : "text-s-ink"}`}>
          {title}{rec ? " (recommended)" : ""}
        </span>
      </div>
      <p className="mb-2.5 px-4 font-body text-[12px] text-s-ink-2">{numbers}</p>
      {/* overflow-x rail , mirrors SectionHeader ScrollRow (flex gap-3, px-4 bleed) */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((c) => (
          <RailCard key={c.name} widthPx={widthPx} ratio={ratio} name={c.name} meta={c.meta} />
        ))}
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
    <main className="min-h-screen bg-white py-6">
      <div className="mx-auto w-full max-w-[412px]">
        <div className="px-4">
          <h1 className="font-heading text-[18px] font-bold text-s-ink">Store card size</h1>
          <p className="mt-1 text-[13px] text-s-ink-2">
            After the 3/2 change the store photos dropped from 167px tall (old square) to 111px tall at the same 167px width , so they read small. Three rail options at real phone width. Swipe each rail.
          </p>
        </div>

        <div className="mt-6 space-y-8">
          <RailStrip
            title="V1 , Square at current width"
            numbers="167 x 167 px photo (rollback: today's width, square again). Photo area 27.9k px2."
            rec={false}
            widthPx={167}
            ratio="square"
          />
          <RailStrip
            title="V2 , 3/2 at a bigger width"
            numbers="250 x 167 px photo (bigger width; photo height back to the old 167px, keeps the search-card 3/2 match). Photo area 41.7k px2."
            rec
            widthPx={250}
            ratio="wide"
          />
          <RailStrip
            title="V3 , Square at a bigger width"
            numbers="200 x 200 px photo (bigger square). Photo area 40.0k px2."
            rec={false}
            widthPx={200}
            ratio="square"
          />
        </div>

        <p className="mt-8 border-t border-s-border px-4 pt-4 text-[12.5px] text-s-ink-2">
          Recommendation: <span className="font-semibold text-s-ink">V2</span>. It keeps the 3/2 shape that already matches the search result cards, brings the photo height back to the old 167px (so stores stop reading small), and the photo area (41.7k px2) is larger than the old square (27.9k px2). Approve a variant and I change the real SalonCard width plus ratio (SalonCard.tsx untouched until then).
        </p>
      </div>
    </main>
  );
}
