"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { SalonBreadcrumb } from "./SalonBreadcrumb";
import { SalonHero } from "./SalonHero";
import { SalonHeader } from "./SalonHeader";
import { SalonStickyTabNav } from "./SalonStickyTabNav";
import { SalonAppCta } from "./SalonAppCta";
import { SalonContact } from "./SalonContact";
import { SalonServices } from "./SalonServices";
import { SalonBundles } from "./SalonBundles";
import { SalonTeam } from "./SalonTeam";
import { SalonReviews } from "./SalonReviews";
import { SalonPortfolio } from "./SalonPortfolio";
import { SalonBuy } from "./SalonBuy";
import { SalonAbout } from "./SalonAbout";
import { SalonLocation } from "./SalonLocation";
import { SalonOpeningTimes } from "./SalonOpeningTimes";
import { SalonAdditionalInfo } from "./SalonAdditionalInfo";
import { SalonOtherLocations } from "./SalonOtherLocations";
import { SalonVenuesNearby } from "./SalonVenuesNearby";
import { SalonRecentlyViewed } from "./SalonRecentlyViewed";
import { SalonSidebar } from "./SalonSidebar";
import { SalonMobileBookBar } from "./SalonMobileBookBar";
import { SectionErrorBoundary } from "../primitives/SectionErrorBoundary";
import SalonModeToggle from "@/components-legacy/salon/SalonModeToggle";
import SalonWalkInPanel from "@/components-legacy/salon/SalonWalkInPanel";
import { WalkInQueueProvider } from "@/components-legacy/salon/WalkInQueueContext";
import type { SalonDetail, TabKey, OpenStatus, DayKey } from "./_shared";
import { postalToCity } from "./_shared";
import { usePostHog } from "posthog-js/react";
import { trackSalonView } from "@/components-legacy/RecentlyViewed";
import { generateSalonSchema, safeJsonLd } from "@/lib/seo";
import { CATEGORY_LABEL } from "../search/SalonResultCard";

// B4 load audit (2026-07-04, finding #2): click-triggered overlays, loaded only
// when opened (same dynamic() pattern as SalonTeam.tsx:12's StaffProfilePage).
const SalonLightbox = dynamic(() => import("./SalonLightbox").then((m) => m.SalonLightbox), { ssr: false });
const SalonImageGallery = dynamic(() => import("./SalonImageGallery").then((m) => m.SalonImageGallery), { ssr: false });

/**
 * SalonDetailV3 — V2-D53.3 orchestrator (2026-05-11) · V3-D202 detox (2026-05-26).
 *
 * The monolithic 1145-line file was split into 17 focused section components
 * (each <200 lines, colocated in `salon/`). This file now:
 *   1. Receives the salon as a PROP (fetched server-side by page.tsx, B4 load
 *      audit 2026-07-04, was: fetched client-side via /api/salons/[slug] in a
 *      useEffect after hydration)
 *   2. Tracks recently-viewed in localStorage (for Recently Viewed feed)
 *   3. Manages Lightbox open/index state
 *   4. Computes which sections have content (for sticky tab nav)
 *   5. Composes the responsive layout:
 *      - Mobile: single column stack with floating book bar
 *      - Desktop: 2-col grid with sticky right sidebar
 *
 * Brand discipline (V3-D193 + V3-D197 three-layer):
 *   • PURE WHITE substrate. No ambient gradient washes (deleted in A23).
 *   • Display = Inter Tight (V3-D190, supersedes Peace Sans). Body = Hanken
 *     Grotesk 300-800 (V3-D191 weight contrast).
 *   • Chrome = s-ink (V3-D192-fix). Brand accent = s-accent royal blue, used
 *     on eyebrows + small highlights only (NOT primary CTAs).
 *   • Semantic UI (StatusPill, etc.) uses universal-color tokens per V3-D197
 *     §1 + §2.5 catalog.
 *   • Stars are yellow (V3-D200 Q1 resolution). Save = pink. Urgency = amber.
 *
 * Section IDs match the sticky tab nav keys (TAB_SECTIONS in _shared.ts):
 *   photos, services, team, reviews, portfolio, about, loyalty
 */
export function SalonDetailV3({
  salon,
  openStatus,
  todayKey,
}: {
  salon: SalonDetail;
  /** Precomputed server-side (salon's own timezone), 2026-07-04 hydration fix.
   * Never recompute via computeOpenStatus()/new Date() in this tree, both the
   * server render and the client hydration must render this exact value. */
  openStatus: OpenStatus;
  todayKey: DayKey;
}) {
  const params = useParams<{ locale: string; slug: string }>()!;
  const slug = params?.slug ?? "";
  const locale = params?.locale ?? "de";
  const searchParams = useSearchParams();

  const [walkinMode, setWalkinMode] = React.useState(false); // barbershop Book/Walk-in switch
  // V3-D421k: walk-in result cards deep-link with ?walkin=1 → open the profile straight
  // in walk-in mode (the toggle still lets the user flip back to Book).
  React.useEffect(() => {
    if (searchParams?.get("walkin") === "1") setWalkinMode(true);
  }, [searchParams]);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  // A5 B-3/A-3: bundles + products load async inside their sections; these flags let the
  // sections register their sticky-nav tab once their data confirms it exists.
  const [hasBundles, setHasBundles] = React.useState(false);
  const [hasProducts, setHasProducts] = React.useState(false);

  const heroRef = React.useRef<HTMLElement>(null);

  // V3-D344 (2026-05-28): analytics + recently-viewed parity with the legacy
  // salon render, enabling V3 to become the default (?v3 gate flipped in page.tsx).
  // Was: an inline localStorage block that wrote plain slug STRINGS — incompatible
  // with the RecentlyViewed reader (isValidEntry requires {slug,name,category}
  // OBJECTS), so the feed silently dropped every V3-written entry. trackSalonView
  // writes the correct rich-object shape, fixing the broken feed AND matching legacy.
  const posthog = usePostHog();
  React.useEffect(() => {
    if (!salon?.id) return;

    // Recently-viewed feed (rich object — fixes the broken slug-string format)
    trackSalonView({
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      cover_photo_url: salon.cover_photo_url,
      average_rating: salon.average_rating ?? undefined,
      categories: salon.categories,
    });

    // Server-side view analytics
    fetch("/api/analytics/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salon.id, source: "direct" }),
    }).catch((err) => console.error("[SalonDetailV3] track-view failed:", err));

    // Product analytics
    posthog?.capture("salon_profile_viewed", { salon_id: salon.id, salon_name: salon.name });
  }, [salon?.id, salon?.slug, salon?.name, salon?.cover_photo_url, salon?.average_rating, salon?.categories, posthog]);

  // Decide which sections have content → drives sticky tab nav visibility.
  // V3-D237 (2026-05-27, golden-route): dropped `portfolio` + `loyalty` tab keys
  // — Fresha PDP uses 5 tabs (Photos · Services · Team · Reviews · About);
  // Portfolio folds into the hero gallery, Loyalty was Solen-only chrome.
  // The Portfolio + Loyalty SECTIONS still render below — just no tab affordance.
  const availableSections = new Set<TabKey>();
  if ((salon.gallery_urls?.length ?? 0) > 0 || salon.cover_photo_url) availableSections.add("photos");
  if (salon.services.length > 0) availableSections.add("services");
  // A5 B-3/A-3: only register the tab once the async section confirms it has data
  // (empty bundles/products render nothing, so no tab).
  if (hasBundles) availableSections.add("bundles");
  // hasProducts stays false now that the products section is off this page (2026-08-15), so
  // the sticky-nav tab cannot appear either. Kept rather than deleted so restoring the
  // section is one uncommented call site, not an archaeology exercise.
  if (hasProducts) availableSections.add("products");
  if (salon.staff.length > 0) availableSections.add("team");
  if (salon.review_count > 0 || (salon.average_rating ?? 0) > 0) availableSections.add("reviews");
  // V3-D389: "Über uns" tab is now description-only (location moved to its own
  // section), so the tab tracks description text — not address.
  if (salon.about_text_de || salon.description_de || salon.about_text_en || salon.description_en) {
    availableSections.add("about");
  }

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  // Full-screen Fresha-style image gallery (Salon photos + per-stylist Team portfolios).
  const openGallery = () => setGalleryOpen(true);

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();
  // Walk-in status must follow real opening hours, same source as the header's
  // "Geschlossen · Öffnet …" so the panel can't say "open" while the salon is closed.
  // 2026-07-04: reads the server-precomputed openStatus prop instead of calling
  // computeOpenStatus() again here (hydration fix, see page.tsx).
  const salonOpen = openStatus.isOpen;

  // V3-D344 (2026-05-28): JSON-LD structured data, parity with legacy salon
  // render (generateSalonSchema). Required before V3 became the default so salon
  // pages keep their SEO structured data.
  // A4-jsonld-escape (2026-07-27, supersedes the ad hoc `<` -> < replace
  // this line used to do inline): now routed through the shared safeJsonLd
  // helper (lib/seo.ts) so every JSON-LD site escapes `<`, `>` AND `&`
  // consistently, not just `<`, so a salon name containing "</script>" can't
  // break out of the script tag (XSS-safe, standard JSON-LD sanitization).
  // SalonDetail is a structural superset of the fields generateSalonSchema reads
  // (the schema only touches name/address/rating/photos). Cast matches legacy
  // behavior, same runtime object the legacy JsonLd component passed.
  const salonJsonLd = safeJsonLd(
    generateSalonSchema(salon as unknown as Parameters<typeof generateSalonSchema>[0], locale)
  );

  return (
    // V2-D53.3 fix: pt was meant to push content below the (then-believed-fixed)
    // site header — but Header is `sticky top:0` so it occupies flow space, not
    // viewport space; pt was just empty padding.
    // V3-D216 (verifier #10): tighten to pt-2 / md:pt-3 (4-6px breathing). Combined
    // with V3-D215 (Header hides on PDP-deep-scroll) this gives the Fresha
    // "photo immediately under header" look without losing the small visual
    // breathing room at initial paint.
    // V3-D229 (2026-05-27, sidebar rebuild): DROPPED `overflow-hidden`. It was
    // breaking `position: sticky` on the desktop SalonSidebar — sidebar
    // wrapper had `sticky top-24` but couldn't pin because an ancestor with
    // overflow-hidden creates a new "containing block" that scoped sticky
    // to the wrong context. Result: sidebar scrolled away with the page
    // instead of staying pinned, hiding Termin buchen CTA when reading
    // services. Switched to overflow-x-clip which prevents horizontal
    // bleed without breaking vertical sticky.
    // bg-white substrate per §5h.3 (commerce surface).
    // mockup-ok: pb-24 -> pb-6 (96px -> 24px), owner 2026-08-15: "on the Discover More store,
    // it's, like, a weird gap, like, a white space."
    // MEASURED before changing it, so this is a number and not a nudge: the last chip of that
    // section ended at y=4157 and the footer began 152px later. That 152 was TWO stacked bottom
    // paddings reserving room for the SAME sticky bar, this element's 96px plus the root layout's
    // own pb-[calc(56px+env(safe-area-inset-bottom))]. This one was the redundant half: the
    // 881px-tall footer renders after this main, so the "Termin buchen" bar (76px) can never
    // cover the last section here, and the root layout's reserve is the one sitting at the true
    // bottom of the document where the bar actually is. 24px keeps normal section rhythm.
    <main className="relative min-h-screen overflow-x-clip bg-white pb-6 md:pt-3 md:pb-8">
      {/* V3-D202 (A23): ambient gradient washes block DELETED. Was 8 absolute
          <div>s in retired warm/sage colors (peach #F2C49B, emerald #5BAE85,
          terracotta #D6754F, butter #F0C85A, sage #9CC0A4, rose #E89A88).
          Substrate is now pure white per V3-D193 atmosphere-revert. The
          per-section components carry visual rhythm without ambient washes. */}

      {/* V3-D344: JSON-LD structured data (escaped, parity with legacy render). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: salonJsonLd }} />

      {/* Content layer */}
      <div className="relative z-10">

      {/* Breadcrumb — desktop only */}
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
        <SalonBreadcrumb salon={salon} locale={locale} />
      </div>

      {/* Sticky tab nav — fixed at top, fades in on scroll */}
      <SalonStickyTabNav
        availableSections={availableSections}
        scrollAnchorRef={heroRef}
        salon={salon}
      />

      {/* V2-D53.3 (reverted layout): hero is FULL-WIDTH above the body grid
          (matches Fresha — hero gallery takes the full content width, sidebar
          appears below). The sidebar in the grid still has compact-at-first /
          expand-on-scroll behavior, just triggered at the higher threshold
          where the sidebar's natural document position has scrolled into
          sticky-pinned state. */}
      <section ref={heroRef} className="mx-auto mt-0 w-full max-w-[1180px] md:mt-3 md:px-6">
        <SalonHero salon={salon} onOpenLightbox={openLightbox} onOpenGallery={openGallery} />
      </section>

      {/* V2-D53.3 polish: title block moved INTO the body grid's left column
          so the sidebar starts at the same y-position as the title — no big
          empty gap on the right side of the title row. Hero stays full-width
          above the grid.
          V2-D53.3 polish #2 (user feedback): bumped grid breakpoint from md
          to lg so the sidebar only shows on TRULY wide screens (1024px+).
          On medium-width windows (768-1023px) the layout stays single-column
          and the mobile floating Book bar handles booking. */}
      {/* Mobile: content card pulls up over the hero with a rounded top (Fresha PDP, IMG_4991).
          Desktop: flat, no overlap (the hero is a gallery there). */}
      <div className="relative z-10 mx-auto -mt-5 w-full max-w-[1180px] rounded-t-[20px] bg-white px-4 pt-5 md:mt-7 md:rounded-none md:bg-transparent md:px-6 md:pt-0">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 xl:gap-12">
          {/* LEFT column — title + content sections */}
          <div className="min-w-0">
            <SalonHeader salon={salon} openStatus={openStatus} />

            {/* Book / Walk-in toggle — walk-in-enabled barbershops. Walk-in mode shows the
                pay-gated queue join + hides bookable-service browsing (services + team). */}
            {salon.categories?.includes("barbershop") && salon.walkin_enabled && (
              <div className="mt-6 flex flex-col gap-5">
                <SalonModeToggle mode={walkinMode ? "walkin" : "book"} onChange={(m) => setWalkinMode(m === "walkin")} locale={locale} />
                {walkinMode && (
                  <WalkInQueueProvider salonId={salon.id}>
                    <SalonWalkInPanel salonId={salon.id} services={salon.services} staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} isOpen={salonOpen} locale={locale} />
                  </WalkInQueueProvider>
                )}
              </div>
            )}

            <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
              {/* "Über uns" moved UP here on 2026-08-15, out of its old slot below Portfolio.
                  Owner: "on the about us, you know, like, on the top right near the street and
                  everything, an open time and everything, like, there should be, like, about us.
                  Right now, maybe I don't see it because, like, it's not really... there is none."
                  It was never missing. It rendered at y=2983 on a 5172px page, which is past the
                  reviews and the portfolio, so from the top of the page it does not exist. His own
                  Fresha reference puts "Über" directly under the address chip and above the
                  services, which is where it now sits. */}
              <SalonAbout salon={salon} locale={locale} />

              {!walkinMode && (
                <SectionErrorBoundary section="SalonServices">
                  <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />
                </SectionErrorBoundary>
              )}

            {/* A5 B-3: bundles between services and products (renders null until active bundles load). */}
            {!walkinMode && (
              <SectionErrorBoundary section="SalonBundles">
                <SalonBundles
                  salonId={salon.id}
                  slug={slug}
                  locale={locale}
                  onLoaded={setHasBundles}
                />
              </SectionErrorBoundary>
            )}

            {/* RETAIL PRODUCTS REMOVED from the salon page, owner 2026-08-15: "remove the product
                section, you know, like, at all, and, also, make it so it doesn't load that because
                it looks so weird."
                Both halves are covered by deleting the call site rather than hiding the section:
                the component is what fetched, so nothing loads and nothing shimmers. It carried
                the same paint-then-vanish shape as the combos section did (a shimmer row set on
                mount, `return null` when the fetch came back empty), which is the "it loads and
                looks weird" he means.
                The component file, its API route and the Stripe purchase path are all LEFT IN
                PLACE, untouched: he asked for the section off the page, not for the feature to be
                deleted, and the dashboard still has its products manager. Graveyard line added the
                same turn. */}

            {/* Termin-only: walk-in has its OWN single selectable stylist section (the deduped
                "Dein Barber" = #section-team, inside SalonWalkInPanel) per owner 2026-07-24, so
                rendering browse-profile SalonTeam here too would be a SECOND stylist section. */}
            {!walkinMode && salon.staff.length > 0 && (
              <SectionErrorBoundary section="SalonTeam">
                <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
              </SectionErrorBoundary>
            )}

            <SectionErrorBoundary section="SalonReviews">
              <SalonReviews
                average={salon.average_rating}
                count={salon.review_count}
                reviews={salon.reviews}
                salonId={salon.id}
                salonSlug={salon.slug}
                salonName={salon.name}
                locale={locale}
              />
            </SectionErrorBoundary>

            <SectionErrorBoundary section="SalonPortfolio">
              <SalonPortfolio urls={salon.gallery_urls ?? []} staff={salon.staff} onOpen={() => openGallery()} salonName={salon.name} categoryLabel={CATEGORY_LABEL[primaryCategory] ?? null} />
            </SectionErrorBoundary>

            {/* Mobile + tablet Buy card (gift card) HIDDEN from customers
                (owner, 2026-06-14) in favour of a Solen-wide loyalty card.
                Restore by un-commenting + flipping SalonSidebar.hasGiftCards. */}
            {/* <div className="lg:hidden">
              <SalonBuy locale={locale} slug={slug} salonName={salon.name} />
            </div> */}

            {/* SalonAbout used to render HERE. Moved to the top of this column on 2026-08-15,
                see the comment at its new site above. */}

            {/* V3-D389 (Fresha 1:1 capture): location, opening times + amenities are
                each their OWN full-width section now — no more lumped "Über uns"
                block + no side-by-side hours/amenities grid. */}
            {/* mapDesign="clean-white" (ROUND 4, 2026-07-24): Direction A promoted to
                production, plus the dotted walking route (owner: "Direction A, but
                with dots") — store PIN salon marker, circle + always-blue-glyph
                transit stop, station name in one pill. See SalonLocation.tsx's
                mapDesign JSDoc for the full owner-reference history. */}
            <SalonLocation salon={salon} mapDesign="clean-white" />

            <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />

            <SalonAdditionalInfo salon={salon} />

            {/* V2-D53.3 mobile-parity fix: contact rows visible on mobile here.
                Desktop has the same info in SalonSidebar. */}
            <SalonContact salon={salon} />

            {/* SalonLoyalty hidden (V3 2026-05-31): it rendered identical static copy on every
                salon (no data behind it). Re-enable when a real per-salon loyalty system exists. */}

            {salon.siblings && salon.siblings.length > 0 && (
              <SalonOtherLocations siblings={salon.siblings} locale={locale} />
            )}

            {/* Two rails, one per half of his 2026-08-15 ask ("specific to their searches and
                something similar"). History first because it is personal and usually shorter, then
                the similar-stores rail, which always has rows and so carries the block on a first
                visit when the history one hides itself. */}
            <SalonRecentlyViewed excludeSlug={slug} />

            <SalonVenuesNearby
              cat={primaryCategory}
              excludeId={salon.id}
              locale={locale}
            />

              {!walkinMode && (
                <SalonAppCta
                  locale={locale}
                  slug={slug}
                  salonName={salon.name}
                  city={postalToCity(salon.postal_code)}
                  salonCategories={salon.categories}
                />
              )}
            </div>
          </div>

          {/* RIGHT column — sticky sidebar only on truly wide screens
              (lg breakpoint, 1024px+). On smaller-but-still-desktop windows
              the mobile floating Book bar takes over instead. Sticky-pinned
              at top-24; SalonSidebar internally manages collapse/expand. */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 pt-3">
              {!walkinMode && (
                <SalonSidebar salon={salon} locale={locale} openStatus={openStatus} todayKey={todayKey} />
              )}
            </div>
          </aside>
        </div>
      </div>

      </div>
      {/* /content layer */}

      {/* Mobile sticky bottom CTA, hidden in walk-in mode (the walk-in cards carry their
          own "Anstehen" action, so the global Book bar would be a confusing 2nd button).
          Also suppressed while the gallery or lightbox overlay is open: both are portaled
          to document.body too, at a lower z-index than this bar's z-[800], so without this
          the bar would float on top of them (regression fix, see SalonMobileBookBar.tsx). */}
      {!walkinMode && (
        <SalonMobileBookBar locale={locale} slug={slug} suppressed={galleryOpen || lightboxOpen} />
      )}

      {/* Lightbox modal */}
      <SalonLightbox
        photos={photos}
        open={lightboxOpen}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Full-screen image gallery (Salon + per-stylist Team portfolios) */}
      <SalonImageGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        salonId={salon.id}
        salonName={salon.name}
        salonCategories={salon.categories}
        venuePhotos={photos}
        staff={salon.staff}
      />
    </main>
  );
}

// LoadingSkeleton + NotFound removed (B4 load audit, 2026-07-04): the salon fetch
// (and its loading/not-found states) moved server-side into page.tsx, which calls
// notFound() for a missing/hidden salon. That renders the global app/[locale]/not-found.tsx
// (LOCKFILE §15.3 typographic 404), the same not-found idiom already used by the
// sibling booking/ and reviews/ salon sub-routes. There is no more client-side
// loading window to skeleton: the salon is present on first paint.
