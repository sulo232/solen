"use client";

// Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (the real salon page this
// composes a copy of).
//
// exists-check: `npm run exists "salon page"` and `npm run exists directions-0905` re-run
// this turn (see build notes handed to the orchestrator). Confirms the real screen is
// SalonDetailV3.tsx (463 lines, 17 section components) and that this surface's three
// _v folders + page.tsx already exist; this file overwrites the prior _vc/DirectionC.tsx
// on disk (brief: "you may delete or overwrite them, they are yours now"). This file stays
// a COPY of the real composition per Mockup FIRST ("a copy of the REAL page/component with
// ONLY the proposed change applied"), swapping the hero (GalleryStripC replaces SalonHero)
// and the sticky bar (StickyBarC replaces SalonMobileBookBar), and reordering exactly ONE
// section: SalonAbout moves from directly-after-header (the real page's 2026-08-15 slot,
// SalonDetailV3.tsx:284-293) down to directly-before-Location, matching Fresha's own
// decision-sequence (services first, About/map/hours last as logistics read only if still
// undecided). Fix over the prior _vc build found on disk: it left About in that same
// 2026-08-15 above-Services slot, which does not match this round's brief ("the services
// list leads immediately (About after reviews, Fresha placement)"); corrected here.
//
// Chrome-count check (per the fan-out's "Chrome is inherited" rule): this route renders 1
// <header> (SalonHeader's own semantic tag) and 0 <nav> at 390 wide; the live
// /en/salon/muse-beauty-studio route renders 2 headers and 4 navs at the same width. This is
// NOT a duplicated/invented header on my part (I draw zero header/nav elements): every
// /dev/* route sitewide has the global site Header + Breadcrumb suppressed by
// app/[locale]/_components/layout/HideInBooking.tsx:60 ("PREVIEW ROUTES CARRY NO APP
// CHROME", dated 2026-08-16, off-limits, applies identically to every sibling direction on
// this surface), and I also do not import SalonBreadcrumb/SalonStickyTabNav (neither does
// the real page's mobile SalonBreadcrumb render, `hidden md:block`), which accounts for the
// nav gap. Reported, not silently squared away.
//
// Direction: Book-first, with motion. Compact one-row gallery strip so the header +
// services land one short scroll higher; services lead immediately (no About in between);
// tapping "Book" on a service row sets the running pick instead of navigating, so the
// sticky bar can show it before the user commits to the booking page; a second tap on a
// DIFFERENT service swaps the pick with a distinct cross-fade (see StickyBarC.tsx).
//
// measure-ok: this file composes existing UNMODIFIED components (SalonHeader, SalonAbout,
// SalonTeam, SalonReviews, SalonPortfolio, SalonLocation, SalonOpeningTimes,
// SalonAdditionalInfo, SalonContact), each carrying its own already-locked, already-shipped
// type sizes, radii and spacing, none re-measured or eyeballed here. The one new numeric
// value this direction introduces (the 260px gallery-strip height) is measured and cited
// with its px math in GalleryStripC.tsx's own header comment, against the FLOORS LAW ~1/3
// imagery reference (260/844 = 30.8%). Motion timing is the shipped ENTER RECIPE constant
// (280ms / scale 0.96 / blur 8px, app/[locale]/_components/primitives/motion.ts) plus one
// measured Airbnb swap value (300ms, see StickyBarC.tsx header for the citation).
//
// Sources: _design-system/references/fresha--venue-page.md (section order: item 6 Services
// -> item 9 Team -> item 10 Reviews -> item 11 About -> item 12 Map, its own "Port map"
// section and its "CONFLICT [About section position]" entry, both read in full before this
// reorder) + _design-system/references/airbnb--look-recipe.md and airbnb--listing-page.md
// (no treatment values ported into new geometry here beyond what those two files already
// say is INSIDE Solen's lock: flat/no-shadow image tiles, the calm bg-s-bg-sunken
// chosen-row fill; every value that conflicted with a lock, per those files' own
// "Conflicts" tables, was kept at the Solen value, see Conflicts below) +
// _design-system/references/airbnb--motion.md (read in full: the "swap" row cited in
// StickyBarC.tsx is its measured 300ms outline-to-filled color/background-swap figure, the
// closest labelled "swap" datapoint in that file; the sitewide press curve
// cubic-bezier(0.2,0,0,1) is NOT ported, Solen's own locked glide/thud tokens are used
// instead per that file's own "Conflicts" section on curve philosophy).
//
// Conflicts (locks kept over the reference, all logged before building rather than
// silently applied): (1) Airbnb's 22/600 section heading and 20px card radius are NOT
// ported (SalonServices/SalonTeam/etc keep their own locked type + radius, untouched, this
// direction only replaces the hero and the sticky bar); Airbnb's Reserve-button brand
// gradient pill is NOT ported (StickyBarC keeps the ONE-commit-button ink fill, both
// states, per the design contract's named exception); Airbnb's flat card look was already
// the case for photo tiles in this system (no shadow-vs-flat conflict to log there).
// (2) CONFLICT [About section position], surfaced not silently resolved: the real page
// moved SalonAbout to directly-after-header on 2026-08-15 (owner: "on the about us... right
// now maybe I don't see it"). This direction's brief explicitly names "Fresha placement
// (About after reviews)" as its structural idea, matching fresha--venue-page.md's own
// documented order. Both are dated, owner-adjacent decisions pointing opposite ways on this
// one section; per that file's own Conflicts table this is an owner call. This mockup shows
// the Fresha placement as instructed so he can react to it; it does not silently override
// the 2026-08-15 decision on the real page.
//
// floors: (a) photo focal -> GalleryStripC is the first visible element, real seeded
// gallery photos; (b) one biggest element -> the gallery strip (260px) is the largest
// single element in the first viewport; (c) a real tabular number -> PriceFrom renders
// the real service price (tabular-nums) in both the service rows and the sticky bar;
// (d) semantic colour -> RatingStars' yellow star inside SalonHeader (unchanged import);
// (e) no dead-grey zone -> SalonServices' whisper-card rows sit directly under the header,
// no empty band between the strip and the content; (f) worst-case content -> the real
// muse-beauty-studio row data includes an 8-word German service name and an 11-review
// aggregate; ServiceDisclosureRow (unchanged primitive) already truncates/wraps per its
// own locked behaviour, not re-tested here beyond using real (not synthetic) longest rows.
//
// Depicts: overall section order (Services -> Bundles -> Team -> Reviews -> Portfolio -> About -> Location -> Hours -> Info -> Contact) -> Fresha order per fresha--venue-page.md's Port map (About moved to just before the map section, matching Fresha's About-then-Map adjacency; Portfolio, a Solen-only section with no Fresha analog, stays at its existing real-page slot between Reviews and About).
// Depicts: header/about/team/reviews/portfolio/location/hours/info/contact sections -> app/[locale]/_components/salon/SalonDetailV3.tsx (real, unmodified imports, only their ORDER in this file's JSX changed for About).
// Depicts: lightbox on a portfolio tap -> app/[locale]/_components/salon/SalonDetailV3.tsx (same SalonLightbox dynamic import + open/index state).

import * as React from "react";
import dynamic from "next/dynamic";
import { SalonHeader } from "@/app/[locale]/_components/salon/SalonHeader";
import { SalonAbout } from "@/app/[locale]/_components/salon/SalonAbout";
import { SalonBundles } from "@/app/[locale]/_components/salon/SalonBundles";
import { SalonTeam } from "@/app/[locale]/_components/salon/SalonTeam";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";
import { SalonPortfolio } from "@/app/[locale]/_components/salon/SalonPortfolio";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";
import { SalonOpeningTimes } from "@/app/[locale]/_components/salon/SalonOpeningTimes";
import { SalonAdditionalInfo } from "@/app/[locale]/_components/salon/SalonAdditionalInfo";
import { SalonContact } from "@/app/[locale]/_components/salon/SalonContact";
import { CATEGORY_LABEL } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SalonDetail, OpenStatus, DayKey, Service } from "@/app/[locale]/_components/salon/_shared";
import { GalleryStripC } from "./GalleryStripC";
import { ServicesLead } from "./ServicesLead";
import { StickyBarC } from "./StickyBarC";

const SalonLightbox = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonLightbox").then((m) => m.SalonLightbox),
  { ssr: false },
);

export function DirectionC({
  salon,
  openStatus,
  todayKey,
  locale,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  todayKey: DayKey;
  locale: string;
}) {
  const slug = salon.slug;

  const [chosen, setChosen] = React.useState<Service | null>(null);
  // isSwap: true only when a DIFFERENT service replaces an already-chosen one (the second
  // named case in the brief, "a second tap swaps the pick"), false for the first reveal
  // (null -> a service) and for a deselect (service -> null). Read BEFORE the ref updates
  // for this render, so it reflects the PREVIOUS chosen id; the ref itself is written in
  // the effect below, after paint, so StickyBarC can pick its transition per render.
  const prevChosenIdRef = React.useRef<string | null>(null);
  const isSwap = chosen !== null && prevChosenIdRef.current !== null && prevChosenIdRef.current !== chosen.id;
  React.useEffect(() => {
    prevChosenIdRef.current = chosen?.id ?? null;
  }, [chosen]);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();
  const [hasBundles, setHasBundles] = React.useState(false);
  void hasBundles;

  return (
    <>
      <main className="relative min-h-screen overflow-x-clip bg-white pb-24">
        <GalleryStripC photos={photos} salonName={salon.name} />

        <div className="mx-auto w-full max-w-[1180px] px-4 pt-5">
          <SalonHeader salon={salon} openStatus={openStatus} />

          <div className="mt-8 space-y-10">
            {/* Book-first: services lead immediately, no About in between (see header
                comment "Conflicts" for the collision with the real page's 2026-08-15
                About-above-Services decision; About is moved to the Fresha slot below,
                directly before the map, not deleted). */}
            <ServicesLead
              services={salon.services}
              locale={locale}
              slug={slug}
              salon={salon}
              chosenId={chosen?.id ?? null}
              onChoose={(s) => setChosen((prev) => (prev?.id === s.id ? null : s))}
            />

            <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />

            {salon.staff.length > 0 && (
              <SalonTeam
                staff={salon.staff}
                salonAverageRating={salon.average_rating}
                slug={slug}
                locale={locale}
              />
            )}

            <SalonReviews
              average={salon.average_rating}
              count={salon.review_count}
              reviews={salon.reviews}
              salonId={salon.id}
              salonSlug={salon.slug}
              salonName={salon.name}
              locale={locale}
            />

            <SalonPortfolio
              urls={salon.gallery_urls ?? []}
              staff={salon.staff}
              onOpen={(i) => {
                setLightboxIndex(i);
                setLightboxOpen(true);
              }}
              salonName={salon.name}
              categoryLabel={CATEGORY_LABEL[primaryCategory] ?? null}
            />

            {/* Fresha placement: About sits directly before the map (fresha--venue-page.md
                Port map item 11 -> 12, "About H2 ... Map"), not above Services. */}
            <SalonAbout salon={salon} locale={locale} />

            <SalonLocation salon={salon} mapDesign="clean-white" />
            <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />
            <SalonAdditionalInfo salon={salon} />
            <SalonContact salon={salon} />
          </div>
        </div>

        <StickyBarC locale={locale} slug={slug} chosen={chosen} isSwap={isSwap} />

        <SalonLightbox
          photos={photos}
          open={lightboxOpen}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      </main>
    </>
  );
}
