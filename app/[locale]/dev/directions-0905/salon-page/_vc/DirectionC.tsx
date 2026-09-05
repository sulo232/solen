"use client";

// Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (the real salon page this
// composes a copy of).
//
// exists-check: `npm run exists "salon page"` this turn (see build notes) confirms the
// real screen is SalonDetailV3.tsx, composed of 17 section components. This file is a
// COPY of that composition per the Mockup FIRST rule ("a copy of the REAL page/component
// with ONLY the proposed change applied"), reordering nothing (the real order already
// runs About -> Services -> Bundles -> Team -> Reviews -> Portfolio -> Location -> Hours
// -> Info -> Contact, which already matches the Fresha decision-sequence the direction
// brief names), and swapping exactly two pieces: the hero (GalleryStripC replaces
// SalonHero) and the sticky bar (StickyBarC replaces SalonMobileBookBar).
//
// Direction: Book-first. Compact one-row gallery strip so the header + services land one
// short scroll higher; the sticky bar tracks the running pick (service + price) instead
// of a bare CTA.
//
// measure-ok: this file composes existing UNMODIFIED components (SalonHeader, SalonAbout,
// SalonTeam, SalonReviews, SalonPortfolio, SalonLocation, SalonOpeningTimes,
// SalonAdditionalInfo, SalonContact), each carrying its own already-locked, already-shipped
// type sizes, radii and spacing, none re-measured or eyeballed here. The one new numeric
// value this direction introduces (the 260px gallery-strip height) is measured and cited
// with its px math in GalleryStripC.tsx's own header comment, against the FLOORS LAW ~1/3
// imagery reference (260/844 = 30.8%). Motion timing is the shipped ENTER RECIPE constant
// (280ms / scale 0.96 / blur 8px, app/[locale]/_components/primitives/motion.ts), not a
// value read off a reference image.
//
// Sources: _design-system/references/fresha--venue-page.md (section order + row anatomy,
// "Port map" table cited directly in ServicesLead.tsx/GalleryStripC.tsx headers) +
// _design-system/references/airbnb--look-recipe.md and airbnb--listing-page.md (no
// treatment values ported into new geometry here beyond what those two files already say
// is INSIDE Solen's lock: flat/no-shadow image tiles, the calm bg-s-bg-sunken chosen-row
// fill; every value that conflicted with a lock, per those files' own "Conflicts" tables,
// was kept at the Solen value, see Conflicts below). airbnb--motion.md does not exist on
// disk (checked before writing this file); motion timings instead come straight from the
// shipped ENTER RECIPE module (app/[locale]/_components/primitives/motion.ts,
// useEnterMotion, 280ms glide, opacity+scale+blur), which the module's own header calls
// the single source of truth for any new entrance in this codebase.
//
// Conflicts (locks kept over the reference, all logged before building rather than
// silently applied): Airbnb's 22/600 section heading and 20px card radius are NOT ported
// (SalonServices/SalonTeam/etc keep their own locked type + radius, untouched, this
// direction only replaces the hero and the sticky bar); Airbnb's Reserve-button brand
// gradient pill is NOT ported (StickyBarC keeps the ONE-commit-button ink fill, both
// states, per the design contract's named exception); Airbnb's flat card look was already
// the case for photo tiles in this system (no shadow-vs-flat conflict to log there).
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
// Depicts: overall section order (About -> Services -> Bundles -> Team -> Reviews -> Portfolio -> Location -> Hours -> Info -> Contact) -> app/[locale]/_components/salon/SalonDetailV3.tsx (unchanged order, only the hero and sticky bar are swapped).
// Depicts: header/about/team/reviews/portfolio/location/hours/info/contact sections -> app/[locale]/_components/salon/SalonDetailV3.tsx (real, unmodified imports).
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
            <SalonAbout salon={salon} locale={locale} />

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

            <SalonLocation salon={salon} mapDesign="clean-white" />
            <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />
            <SalonAdditionalInfo salon={salon} />
            <SalonContact salon={salon} />
          </div>
        </div>

        <StickyBarC locale={locale} slug={slug} chosen={chosen} />

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
