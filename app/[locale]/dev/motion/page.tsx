// exists-check: `npm run exists motion` (2026-07-25) , no existing gallery/route at
// `/dev/motion`; `dev/motion-recipe` is a different, pre-existing route (a 3-tier duration picker
// for the ENTER RECIPE, Subtle/Recommended/Strong), untouched, not a duplicate of this
// snap-vs-glide comparison gallery of real components. Real data via `loadSalonDetailWithStatus`
// (the SAME loader `app/[locale]/salon/[slug]/page.tsx` and the reviewed
// `app/[locale]/dev/scroll-motion/page.tsx` both call, fixture slug "cuts-and-culture" per that
// same precedent) for Demo 6's avatar+name, and `getTopSalonIds` + `getSalonCardDataMap` (the
// real batch fetch the homepage rails use) for Demo 4's card list, never a fabricated array.
// Dev-only, `notFound()` in production, matching every other `/dev/*` route.

import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { getTopSalonIds, getSalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import { MotionGallery } from "./_parts/MotionGallery";

const FIXTURE_SLUG = "cuts-and-culture";

export default async function MotionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ salon?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const slug = sp.salon?.trim() || FIXTURE_SLUG;

  const result = await loadSalonDetailWithStatus(slug, locale);
  if (!result) notFound();
  const { salon } = result;

  // Demo 7 (BlurSpeedDemo): real salon services, never a fabricated row.
  const demoServices = salon.services.slice(0, 2).map((s) => ({
    id: s.id,
    name: s.name_en ?? s.name_de,
    price: s.price,
    durationMinutes: s.duration_minutes,
  }));

  const topIds = await getTopSalonIds(6);
  const cardDataMap = await getSalonCardDataMap(topIds);
  const cardSalons = topIds
    .filter((id) => cardDataMap[id])
    .map((id) => ({ id, data: cardDataMap[id] }));

  return (
    <main className="min-h-screen bg-white pb-8">
      <div className="border-b border-s-border">
        <div className="mx-auto max-w-[600px] px-4 py-6">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/motion</p>
          <h1 className="mt-1 font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
            Motion gallery: snap vs glide
          </h1>
          <p className="mt-2 font-body text-[13px] leading-[1.5] text-s-ink-2">
            The owner&apos;s screen recording (an X profile scroll, 60fps, 309 frames frame-diffed)
            measures its sustained motion windows at 83ms and 167ms. This codebase&apos;s
            documented system (MOTION.md) locks 180 to 520ms, 2 to 3x slower. Seven demos below.
            The first six show the SAME interaction twice: &quot;Today&quot; at the
            documented/shipped speed, &quot;Proposed&quot; at the measured speed. Demo 7 is a
            different, three-way comparison (THE ENTER RECIPE vs THE SPEED LAW, MOTION.md);
            DECIDED 2026-07-26, the owner picked 280ms with the blur kept, column A stays pinned
            to the superseded 420ms for the record. Tap any Play button to trigger a
            demo, or &quot;Replay all&quot; above the list to trigger every demo at once. Demoed on
            real data
            for &quot;{salon.name}&quot; and {cardSalons.length} real top-rated salons, loaded live,
            not lorem.
          </p>
        </div>
      </div>

      <MotionGallery
        salonName={salon.name}
        salonPhotoUrl={salon.cover_photo_url}
        salonRating={salon.average_rating}
        salonReviewCount={salon.review_count}
        cardSalons={cardSalons}
        demoServices={demoServices}
      />
    </main>
  );
}
