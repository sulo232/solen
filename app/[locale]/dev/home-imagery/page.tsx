// exists-check: net-new /dev preview route (`npm run exists "home-imagery"` = 0 hits for page.tsx
// itself; the 5 hits it does return are this same route's own _parts files, just written). Mockup-only
// per owner ("abt the imagery part dont touch anth if u got idea make mockups", 2026-07-25): does NOT
// touch the real Hero.tsx / page.tsx / any shipped homepage file, ONLY this isolated /dev route + its
// _parts. A prior pass edited the real Hero directly and was reverted , this route replaces that
// approach.
//
// THE PROBLEM (measured, not re-derived): the real /de first viewport at 390x844 is 4.66% photographic
// against the 33% floor (LOCKFILE EMPHASIS BUDGET / CLAUDE.md FLOORS LAW 2). Full-bleed is DENIED BY
// NAME (owner 2026-07-16, REMOVED.md "FB1 home photo hero (straddling search)") , every direction below
// is CONTAINED photography: inset, radius'd, inside the page's own margins, never straddling the search
// bar.
//
// THREE genuinely different compositions (research/TASTE_RANGE.md finding 4, the quality clause: ONE
// large photo reads as the screen's dominant element; a grid of small tiles loses to adjacent text on
// eyetracking and fails the intent even at equal raw area):
//   H1 Contained hero card , one large inset photo CARD carries the headline; the search card sits
//     below it.
//   H2 Split hero , headline + search stay on white at the top (today's position); one large contained
//     photo fills the rest of the first viewport beneath them.
//   H3 Salon-first , the first viewport IS a real SalonCard (the same component the live feed renders)
//     at full width, search collapsed to one compact pill above it.
//
// Real data: getTopSalonIds + getSalonCardDataMap, the exact batch-fetch helper the real homepage uses
// (app/[locale]/page.tsx) , genuine cover_photo_url values, never a placeholder box.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSalonCardDataMap, getTopSalonIds } from "@/app/[locale]/_components/homepage/salonCardData";
import { ImageryFrame } from "./_parts/ImageryFrame";
import { H1ContainedHero } from "./_parts/H1ContainedHero";
import { H2SplitHero } from "./_parts/H2SplitHero";
import { H3SalonFirst } from "./_parts/H3SalonFirst";
import type { DevSalon } from "./_parts/shared";

export const revalidate = 300;

const DIRECTIONS = {
  "1": {
    label: "H1 Hero card",
    title: "H1, Contained hero card",
    description: "One large inset photo card carries the headline; the search card sits below it.",
  },
  "2": {
    label: "H2 Split hero",
    title: "H2, Split hero",
    description: "Headline and search stay on white at the top; one contained photo fills the rest of the viewport.",
  },
  "3": {
    label: "H3 Salon-first",
    title: "H3, Salon-first",
    description: "The first viewport is a real salon card, full width, search collapsed to one pill above it.",
  },
} as const;

type DirectionKey = keyof typeof DIRECTIONS;
const DIRECTION_KEYS = Object.keys(DIRECTIONS) as DirectionKey[];

export default async function HomeImageryDevPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const sp = await searchParams;
  const v: DirectionKey = sp.v === "2" ? "2" : sp.v === "3" ? "3" : "1";

  // Same real, live batch-fetch the homepage itself uses (salonCardData.ts): top-rated active salons
  // with their real cover photo, rating, category, address and price. psych-ok: the review-count floor
  // documents getTopSalonIds' own real, already-shipped query threshold (salonCardData.ts), not a
  // rendered/fabricated UI count.
  const topSalonIds = await getTopSalonIds(10);
  const salonCardMap = await getSalonCardDataMap(topSalonIds);
  const salons: DevSalon[] = topSalonIds
    .map((id): DevSalon | null => {
      const s = salonCardMap[id];
      if (!s || !s.photoUrl || !s.name || !s.slug) return null;
      return {
        slug: s.slug,
        salonId: id,
        name: s.name,
        category: s.category ?? "coiffeur",
        photoUrl: s.photoUrl,
        rating: s.rating,
        reviewCount: s.reviewCount,
        postalCode: s.postalCode,
        city: s.city,
        priceFromCHF: s.priceFromCHF,
      };
    })
    .filter((s): s is DevSalon => s !== null);

  if (salons.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-8 text-center">
        <p className="font-body text-[14px] text-s-ink-3">
          No seeded salon with a real cover photo was found , these mockups need at least one real photo
          to render (never a placeholder box).
        </p>
      </main>
    );
  }

  // Cycle through whatever real photographed salons exist so every direction gets a different real
  // photo where possible, without ever crashing or fabricating a salon when fewer than 4 exist.
  const at = (i: number) => salons[i % salons.length];

  return (
    <main className="min-h-screen bg-s-bg-sunken pb-16">
      <div className="sticky top-0 z-[200] border-b border-s-border bg-white/95 px-4 py-3 backdrop-blur">
        <p className="font-body text-[12px] font-semibold text-s-ink-3">
          Dev route, not live , homepage first-viewport imagery directions
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {DIRECTION_KEYS.map((key) => (
            <Link
              key={key}
              href={`?v=${key}` /* dev-only preview toolbar toggle between directions, not a customer-facing chip/filter */}
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1.5 font-body text-[13px] font-semibold transition-colors",
                // selected-ok: dev-only preview toolbar toggle between mockup directions (matches
                // ../home-fix/page.tsx's own toolbar pattern), not a customer-facing chip/filter/selection.
                v === key ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink hover:bg-s-border",
              )}
            >
              {DIRECTIONS[key].label}
            </Link>
          ))}
        </div>
        <dl className="mt-2 flex flex-col gap-0.5">
          {DIRECTION_KEYS.map((key) => (
            <div key={key} className="flex gap-1.5 font-body text-[12px] leading-[1.4]">
              <dt className={cn("shrink-0 font-semibold", v === key ? "text-s-ink" : "text-s-ink-3")}>
                {DIRECTIONS[key].label}:
              </dt>
              <dd className={v === key ? "text-s-ink" : "text-s-ink-3"}>{DIRECTIONS[key].description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col items-center px-4 pt-8">
        <h1 className="mb-4 font-heading text-[17px] font-bold tracking-[-0.01em] text-s-ink">
          {DIRECTIONS[v].title}
        </h1>
        <ImageryFrame>
          {v === "1" && <H1ContainedHero photo={at(0)} />}
          {v === "2" && <H2SplitHero photo={at(1)} />}
          {v === "3" && <H3SalonFirst salons={[at(2), at(3)]} />}
        </ImageryFrame>
      </div>
    </main>
  );
}
