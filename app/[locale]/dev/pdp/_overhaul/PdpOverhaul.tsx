"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonDetailV3.tsx (real, unmodified
// orchestrator). `npm run exists` for "pdp overhaul" (2026-07-24) = 0 matches. This file is a
// copy of SalonDetailV3's render tree for ONE dev review route: the 5 sections under review
// (hero-tap + categorized gallery, reviews, nearby cards, app-cta) render their _overhaul/
// sibling copies; every OTHER section (services, bundles, products, team, about, location,
// hours, amenities, contact, sibling salons, sidebar, mobile book bar, lightbox) imports the
// REAL shipped component directly, unmodified , so the reviewer sees the whole real page with
// only the 5 requested changes applied, not a redraw.

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { SalonBreadcrumb } from "../../../_components/salon/SalonBreadcrumb";
import { SalonStickyTabNav } from "../../../_components/salon/SalonStickyTabNav";
import { SalonServices } from "../../../_components/salon/SalonServices";
import { SalonBundles } from "../../../_components/salon/SalonBundles";
import { SalonProducts } from "../../../_components/salon/SalonProducts";
import { SalonTeam } from "../../../_components/salon/SalonTeam";
import { SalonAbout } from "../../../_components/salon/SalonAbout";
import { SalonLocation } from "../../../_components/salon/SalonLocation";
import { SalonAdditionalInfo } from "../../../_components/salon/SalonAdditionalInfo";
import { SalonOtherLocations } from "../../../_components/salon/SalonOtherLocations";
import { SalonSidebar } from "../../../_components/salon/SalonSidebar";
import type { SalonDetail, TabKey, OpenStatus, DayKey } from "../../../_components/salon/_shared";
import { postalToCity } from "../../../_components/salon/_shared";
import { SalonHeroOverhaul } from "./SalonHeroOverhaul";
import { SalonHeaderOverhaul } from "./SalonHeaderOverhaul";
import { SalonReviewsOverhaul } from "./SalonReviewsOverhaul";
import { SalonPortfolioOverhaul } from "./SalonPortfolioOverhaul";
import { SalonOpeningTimesOverhaul } from "./SalonOpeningTimesOverhaul";
import { SalonVenuesNearbyOverhaul } from "./SalonVenuesNearbyOverhaul";
import { SalonAppCtaOverhaul } from "./SalonAppCtaOverhaul";
import { SalonMobileBookBarOverhaul } from "./SalonMobileBookBarOverhaul";

// No top-level SalonLightbox here (unlike the real orchestrator): every photo entry point in
// this overhaul (hero tap, inline portfolio tap) routes into the categorized gallery instead,
// which owns its own internal Lightbox for tile taps , see SalonImageGalleryOverhaul.tsx.
const SalonImageGalleryOverhaul = dynamic(() => import("./SalonImageGalleryOverhaul").then((m) => m.SalonImageGalleryOverhaul), { ssr: false });

/**
 * PdpOverhaul , dev review orchestrator for /dev/pdp/overhaul. Structural copy of the real
 * SalonDetailV3 tree, trimmed of orchestrator-only side effects that don't belong on a dev
 * comparison route (posthog capture, track-view POST, recently-viewed write, JSON-LD) and the
 * walk-in Book/Walk-in toggle (out of scope for the 5 requested changes , this fixture salon has
 * walkin_enabled=true so the real page shows it, this mockup always renders book mode to keep
 * the diff surgical to the 5 asks).
 */
export function PdpOverhaul({
  salon,
  openStatus,
  todayKey,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  todayKey: DayKey;
}) {
  const params = useParams<{ locale: string; slug: string }>()!;
  const slug = params?.slug ?? salon.slug;
  const locale = params?.locale ?? "de";

  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [hasBundles, setHasBundles] = React.useState(false);
  const [hasProducts, setHasProducts] = React.useState(false);

  const heroRef = React.useRef<HTMLElement>(null);

  const availableSections = new Set<TabKey>();
  if ((salon.gallery_urls?.length ?? 0) > 0 || salon.cover_photo_url) availableSections.add("photos");
  if (salon.services.length > 0) availableSections.add("services");
  if (hasBundles) availableSections.add("bundles");
  if (hasProducts) availableSections.add("products");
  if (salon.staff.length > 0) availableSections.add("team");
  if (salon.review_count > 0 || (salon.average_rating ?? 0) > 0) availableSections.add("reviews");
  if (salon.about_text_de || salon.description_de || salon.about_text_en || salon.description_en) {
    availableSections.add("about");
  }

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const openGallery = () => setGalleryOpen(true);

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();
  const salonOpen = openStatus.isOpen;
  void salonOpen; // kept for parity with the real orchestrator; walk-in panel not mounted here

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-24 md:pt-3 md:pb-16">
      <div className="relative z-10">
        <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
          <SalonBreadcrumb salon={salon} locale={locale} />
        </div>

        <SalonStickyTabNav
          availableSections={availableSections}
          scrollAnchorRef={heroRef}
          salon={salon}
        />

        {/* CHANGED (ask 2/3): hero tap opens the categorized full-screen gallery. */}
        <section ref={heroRef} className="mx-auto mt-0 w-full max-w-[1180px] md:mt-3 md:px-6">
          <SalonHeroOverhaul salon={salon} onOpenGallery={openGallery} />
        </section>

        <div className="relative z-10 mx-auto -mt-5 w-full max-w-[1180px] rounded-t-[20px] bg-white px-4 pt-5 md:mt-7 md:rounded-none md:bg-transparent md:px-6 md:pt-0">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 xl:gap-12">
            <div className="min-w-0">
              <SalonHeaderOverhaul salon={salon} openStatus={openStatus} />

              <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
                <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />

                <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />

                <SalonProducts salonId={salon.id} category={primaryCategory} locale={locale} onLoaded={setHasProducts} />

                {salon.staff.length > 0 && (
                  <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
                )}

                {/* CHANGED (ask 4): renewed, grouped review list (density-floor fix). */}
                <SalonReviewsOverhaul
                  average={salon.average_rating}
                  count={salon.review_count}
                  reviews={salon.reviews}
                />

                {/* CHANGED (R1): fills the grid to 9 real tiles (venue + staff portfolio
                    photos) instead of stopping at 6; taps route into the same categorized
                    gallery as the hero (openGallery), matching the real page's existing
                    onOpen wiring. */}
                <SalonPortfolioOverhaul urls={salon.gallery_urls ?? []} staff={salon.staff} onOpen={() => openGallery()} />

                <SalonAbout salon={salon} locale={locale} />

                <SalonLocation salon={salon} mapDesign="clean-white" />

                {/* CHANGED (R2): open-status dot repointed off the drifted s-open token. */}
                <SalonOpeningTimesOverhaul hours={salon.opening_hours} todayKey={todayKey} />

                <SalonAdditionalInfo salon={salon} />

                {salon.siblings && salon.siblings.length > 0 && (
                  <SalonOtherLocations siblings={salon.siblings} locale={locale} />
                )}

                {/* CHANGED (ask 5+6): bigger cards, homepage SalonCard grammar. */}
                <SalonVenuesNearbyOverhaul cat={primaryCategory} excludeId={salon.id} locale={locale} />

                {/* CHANGED (ask 7): reshaped, no more black book hero. */}
                <SalonAppCtaOverhaul
                  locale={locale}
                  slug={slug}
                  salonName={salon.name}
                  city={postalToCity(salon.postal_code)}
                  quartier={salon.quartier}
                />
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 pt-3">
                <SalonSidebar salon={salon} locale={locale} openStatus={openStatus} todayKey={todayKey} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* CHANGED (R5): reserved 72px band, last flow child before the gallery modal, so the
          bar parks in-flow just above the footer instead of overlapping/sliding under it. */}
      <div className="relative lg:hidden" style={{ height: 72 }}>
        <SalonMobileBookBarOverhaul locale={locale} slug={slug} />
      </div>

      <SalonImageGalleryOverhaul
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        salonName={salon.name}
        venuePhotos={photos}
        staff={salon.staff}
      />
    </main>
  );
}
