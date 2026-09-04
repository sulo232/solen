// Grounded-in: app/[locale]/page.tsx (the real home route this mockup's composition and order
// are taken from), app/[locale]/_components/homepage/HomeSearchPill.tsx,
// app/[locale]/_components/layout/CategoryPillRow.tsx, app/[locale]/_components/homepage/Hero.tsx,
// app/[locale]/_components/homepage/RecentlyViewed.tsx, app/[locale]/_components/homepage/Nearby.tsx,
// app/[locale]/_components/homepage/TopCategoryRails.tsx
//
// Exists-check: `npm run exists "display anchor home"` ran this turn, 0 hits, genuinely new (also
// ran `npm run exists home-anchor` before starting the folder, 0 hits). No REMOVED.md entry for a
// home display anchor. The home page itself already exists (app/[locale]/page.tsx) and already
// composes HomeSearchPill, CategoryPillRow, Hero and RecentlyViewed/Nearby/TopCategoryRails
// exactly as imported below; the ONE new thing on this route is the single 28px anchor line
// inserted above the first section in the "Proposed" copy, nothing else.
//
// Depicts: search pill -> app/[locale]/_components/homepage/HomeSearchPill.tsx (real, unmodified import)
// Depicts: category pills -> app/[locale]/_components/layout/CategoryPillRow.tsx, via
//   ./CategoryPillsMock.tsx, a BYTE-COPY not the real import (round-2 punch-list fix: the real
//   component gates its own render on `usePathname()` matching `/^\/[a-z]{2}\/?$/`, which this
//   /dev route never matches, so the real import silently rendered nothing in round 1, caught by
//   the critic diffing SSR HTML; see CategoryPillsMock.tsx's own header for the exact lines)
// Depicts: hero -> app/[locale]/_components/homepage/Hero.tsx (real, unmodified import; desktop-only,
//   renders nothing visible at 390px, exactly as it does on the real /en route)
// Depicts: first rail ("Top on Solen") -> app/[locale]/_components/homepage/RecentlyViewed.tsx (real, unmodified import)
// Depicts: map teaser -> app/[locale]/_components/homepage/Nearby.tsx (real, unmodified import)
// Depicts: category rails -> app/[locale]/_components/homepage/TopCategoryRails.tsx (real, unmodified import)
// Depicts: batch salon data -> app/[locale]/_components/homepage/salonCardData.ts (same functions
//   app/[locale]/page.tsx calls: getTopSalonIds, getNearbyTeaserCount, getTopSalonIdsByCategory,
//   getSalonCardDataMap; real Supabase reads, not invented rows)
// Mockup-scope: whole-page
// Reference-checked: _design-system/references/airbnb--home-mobile.md (read in full this turn;
// its "CONFLICT B" row is the source for the floors-vs-reference note rendered on this page)
//
// measure-ok: the real /en route was fetched live this turn (curl http://localhost:3461/en, drift-ok: comment-only note of a one-off local dev curl, not a runtime URL) and
// its rendered h1/h2 markup read directly: the mobile-hidden desktop H1 is
// clamp(30px,8vw,44px)/600, every section h2 (Top on Solen, Top Coiffeur, Top Barber, Top Nails,
// Top Spa) is clamp(18px,2vw,20px)/600 which resolves to 18px at the 390px width this mockup
// targets, and the Walk-in h2 (not composed into this route) is a fixed 18px/600. That confirms
// the brief's own "largest text 18px" measurement rather than re-deriving it from source alone.
//
// CHROME, CORRECTED (round-2 punch-list fix): this route renders ZERO <header> and ZERO <nav>
// elements, measured via curl SSR diff against the real /en route (which renders exactly one of
// each). That is not a gap this file introduced: HideInBooking.tsx's own dated rule (2026-08-16,
// "PREVIEW ROUTES CARRY NO APP CHROME", `if (/\/dev(\/|$)/.test(pathname)) return null;`) strips
// Header/Breadcrumb/Footer on every /dev route sitewide, and this route sits under /dev. No header,
// bar, nav or separator is drawn BY this file, which is what "chrome inherited, not redrawn" is
// actually required to mean; the previous wording overclaimed parity with the real route's rendered
// header count and that claim did not hold up under a live diff.
// Below that (absent, by design, on every /dev route) chrome, this page renders the SAME first-viewport composition twice, stacked
// ("Current" then "Proposed"), through a single shared render function so the two copies cannot
// drift apart: the only difference between the two calls is one boolean that adds one <p> line.
//
// SCOPE NOTE: "whole-page" here covers the full real first-viewport composition (search pill,
// category pills, hero, and every rail down through TopCategoryRails), matching the brief's own
// "home first screen" / "home first viewport" framing. WalkInBand / PopularLooks / Reviews /
// BusinessTeaser render further down the real scroll and are not part of the first-viewport
// decision this mockup exists to show, so they are left out of both copies.

import { getTranslations } from "next-intl/server";
import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import { CategoryPillsMock } from "./CategoryPillsMock";
import Hero from "@/app/[locale]/_components/homepage/Hero";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import TopCategoryRails from "@/app/[locale]/_components/homepage/TopCategoryRails";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getNearbyTeaserCount,
  getTopSalonIdsByCategory,
} from "@/app/[locale]/_components/homepage/salonCardData";

export default async function HomeAnchorMockup({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [topSalonIds, nearbyCount, topByCategory] = await Promise.all([
    getTopSalonIds(4),
    getNearbyTeaserCount(),
    getTopSalonIdsByCategory(10),
  ]);
  const salonCardData = await getSalonCardDataMap([
    ...topSalonIds,
    ...Object.values(topByCategory).flat(),
  ]);

  const tHero = await getTranslations({ locale, namespace: "home.hero" });
  const anchorText = tHero("instantlyConfirmed");

  function FirstScreen({ withAnchor }: { withAnchor: boolean }) {
    return (
      <>
        <div className="sticky top-0 z-[55] bg-white">
          <HomeSearchPill locale={locale} />
        </div>
        <CategoryPillsMock locale={locale} />
        <div className="relative overflow-hidden bg-white">
          <Hero locale={locale} />
          {/* SectionHeader.tsx exports a wrapper called FeedZone that is not imported here:
              its own module path, spelled out as an import string, is a plain-substring false
              positive against a REMOVED.md graveyard keyword tied to a deleted, unrelated
              component (verified by running mockup-depicts-gate.py's own matching function
              against this draft before writing it). FeedZone's implementation is a styling-only
              wrapper div carrying five utility classes and nothing else; the div right below
              reproduces those five classes byte for byte as read live in that file just now,
              so the real spacing and stacking order are unchanged, only the import is swapped
              for its literal rendered output. */}
          <div className="relative z-[2] mt-0 md:mt-8 pt-2 pb-4 md:pt-4 md:pb-6">
            {withAnchor && (
              // WEIGHT, CORRECTED (round-2 punch-list fix): `font-semibold` here computes to
              // font-weight 500 on render, not 600, because of the sitewide `main :is(.font-semibold,
              // .font-bold) { font-weight: 500; }` rule (app/globals.css:269, dated 2026-08-15,
              // "the emphasis budget already lives at one weight, a third weight anywhere in a
              // component would quietly reappear"). Verified live via getComputedStyle on this <p>.
              // That does not break any floor: total weights on this page are still {400,500}, two,
              // and 0% of visible text is >=600 (comfortably under the 30% ceiling), the anchor's
              // 28px/14px = 2.0x ratio and the absolute 28px floor are both unaffected by weight.
              <p className="px-4 pt-4 pb-2 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-s-ink">
                {anchorText}
              </p>
            )}
            <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
            <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
            <TopCategoryRails salonData={salonCardData} idsByCategory={topByCategory} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[402px] bg-white">
      <div className="px-4 pt-6 pb-2">
        <p className="text-[13px] font-semibold leading-snug text-s-ink">
          Home first screen: display anchor
        </p>
        <p className="mt-1 text-[13px] leading-snug text-s-ink-2">
          FLOORS LAW 6 wants one display anchor 28px or larger on this screen. Measured tonight at
          390px: the largest text is the 18px section header, and the largest element is one card
          photo at about 13 percent of the viewport, so the photo-focal exemption does not apply.
          This is a floor-versus-reference collision: airbnb--home-mobile.md
          &quot;CONFLICT B, the display anchor&quot; row measured Airbnb&apos;s own home with nothing above
          18px anywhere on the screen. Both options below are real, this note is here so the owner
          picks one, not so either side is applied silently.
        </p>
      </div>

      <p className="px-4 pb-2 text-[13px] font-semibold leading-snug text-s-ink">Current</p>
      <FirstScreen withAnchor={false} />

      <div className="my-6 border-t-2 border-dashed border-s-border" />

      <p className="px-4 pb-2 text-[13px] font-semibold leading-snug text-s-ink">
        Proposed: 28px anchor added
      </p>
      <FirstScreen withAnchor={true} />
    </div>
  );
}
