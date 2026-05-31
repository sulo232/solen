"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SalonBreadcrumb } from "./SalonBreadcrumb";
import { SalonHero } from "./SalonHero";
import { SalonHeader } from "./SalonHeader";
import { SalonStickyTabNav } from "./SalonStickyTabNav";
import { SalonAppCta } from "./SalonAppCta";
import { SalonContact } from "./SalonContact";
import { SalonServices } from "./SalonServices";
import { SalonTeam } from "./SalonTeam";
import { SalonReviews } from "./SalonReviews";
import { SalonPortfolio } from "./SalonPortfolio";
import { SalonBuy } from "./SalonBuy";
import { SalonAbout } from "./SalonAbout";
import { SalonLocation } from "./SalonLocation";
import { SalonOpeningTimes } from "./SalonOpeningTimes";
import { SalonAdditionalInfo } from "./SalonAdditionalInfo";
import { SalonLoyalty } from "./SalonLoyalty";
import { SalonOtherLocations } from "./SalonOtherLocations";
import { SalonVenuesNearby } from "./SalonVenuesNearby";
import { SalonSidebar } from "./SalonSidebar";
import { SalonMobileBookBar } from "./SalonMobileBookBar";
import { SalonLightbox } from "./SalonLightbox";
import type { SalonDetail, TabKey } from "./_shared";
import { postalToCity } from "./_shared";
import { usePostHog } from "posthog-js/react";
import { trackSalonView } from "@/components-legacy/RecentlyViewed";
import { generateSalonSchema } from "@/lib/seo";

/**
 * SalonDetailV3 — V2-D53.3 orchestrator (2026-05-11) · V3-D202 detox (2026-05-26).
 *
 * The monolithic 1145-line file was split into 17 focused section components
 * (each <200 lines, colocated in `salon/`). This file now:
 *   1. Fetches the salon via /api/salons/[slug]
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
export function SalonDetailV3() {
  const params = useParams<{ locale: string; slug: string }>();
  const slug = params?.slug ?? "";
  const locale = params?.locale ?? "de";

  const [salon, setSalon] = React.useState<SalonDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const heroRef = React.useRef<HTMLElement>(null);

  // Fetch salon detail
  React.useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    fetch(`/api/salons/${slug}`, { signal: ac.signal })
      .then((r) => {
        if (r.status === 404) {
          setError(true);
          setLoading(false);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d: SalonDetail | null) => {
        if (d) setSalon(d);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[SalonDetailV3] fetch failed:", err);
          setLoading(false);
          setError(true);
        }
      });
    return () => ac.abort();
  }, [slug]);

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

  if (loading) return <LoadingSkeleton />;
  if (error || !salon) return <NotFound locale={locale} />;

  // Decide which sections have content → drives sticky tab nav visibility.
  // V3-D237 (2026-05-27, golden-route): dropped `portfolio` + `loyalty` tab keys
  // — Fresha PDP uses 5 tabs (Photos · Services · Team · Reviews · About);
  // Portfolio folds into the hero gallery, Loyalty was Solen-only chrome.
  // The Portfolio + Loyalty SECTIONS still render below — just no tab affordance.
  const availableSections = new Set<TabKey>();
  if ((salon.gallery_urls?.length ?? 0) > 0 || salon.cover_photo_url) availableSections.add("photos");
  if (salon.services.length > 0) availableSections.add("services");
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

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();

  // V3-D344 (2026-05-28): JSON-LD structured data — parity with legacy salon
  // render (generateSalonSchema). Required before V3 became the default so salon
  // pages keep their SEO structured data. Hardened vs the legacy version: escape
  // `<` to `<` so a salon name containing "</script>" can't break out of the
  // script tag (XSS-safe; standard Next.js JSON-LD sanitization).
  // SalonDetail is a structural superset of the fields generateSalonSchema reads
  // (the schema only touches name/address/rating/photos). Cast matches legacy
  // behavior — same runtime object the legacy JsonLd component passed.
  const salonJsonLd = JSON.stringify(
    generateSalonSchema(salon as unknown as Parameters<typeof generateSalonSchema>[0], locale)
  ).replace(/</g, "\\u003c");

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
    // instead of staying pinned, hiding Jetzt buchen CTA when reading
    // services. Switched to overflow-x-clip which prevents horizontal
    // bleed without breaking vertical sticky.
    // bg-white substrate per §5h.3 (commerce surface).
    <main className="relative min-h-screen overflow-x-clip bg-white pt-2 pb-24 md:pt-3 md:pb-16">
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
      />

      {/* V2-D53.3 (reverted layout): hero is FULL-WIDTH above the body grid
          (matches Fresha — hero gallery takes the full content width, sidebar
          appears below). The sidebar in the grid still has compact-at-first /
          expand-on-scroll behavior, just triggered at the higher threshold
          where the sidebar's natural document position has scrolled into
          sticky-pinned state. */}
      <section ref={heroRef} className="mx-auto mt-3 w-full max-w-[1180px] md:px-6">
        <SalonHero salon={salon} onOpenLightbox={openLightbox} />
      </section>

      {/* V2-D53.3 polish: title block moved INTO the body grid's left column
          so the sidebar starts at the same y-position as the title — no big
          empty gap on the right side of the title row. Hero stays full-width
          above the grid.
          V2-D53.3 polish #2 (user feedback): bumped grid breakpoint from md
          to lg so the sidebar only shows on TRULY wide screens (1024px+).
          On medium-width windows (768-1023px) the layout stays single-column
          and the mobile floating Book bar handles booking. */}
      <div className="mx-auto mt-5 w-full max-w-[1180px] px-4 md:mt-7 md:px-6">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 xl:gap-12">
          {/* LEFT column — title + content sections */}
          <div className="min-w-0">
            <SalonHeader salon={salon} />

            <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
              <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />

            {salon.staff.length > 0 && (
              <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
            )}

            <SalonReviews
              average={salon.average_rating}
              count={salon.review_count}
              reviews={salon.reviews}
            />

            <SalonPortfolio urls={salon.gallery_urls ?? []} onOpen={openLightbox} />

            {/* Mobile + tablet Buy card — sidebar (which has the same row)
                only renders at lg breakpoint, so show this here below it. */}
            <div className="lg:hidden">
              <SalonBuy locale={locale} slug={slug} salonName={salon.name} />
            </div>

            <SalonAbout salon={salon} locale={locale} />

            {/* V3-D389 (Fresha 1:1 capture): location, opening times + amenities are
                each their OWN full-width section now — no more lumped "Über uns"
                block + no side-by-side hours/amenities grid. */}
            <SalonLocation salon={salon} />

            <SalonOpeningTimes hours={salon.opening_hours} />

            <SalonAdditionalInfo salon={salon} />

            {/* V2-D53.3 mobile-parity fix: contact rows visible on mobile here.
                Desktop has the same info in SalonSidebar. */}
            <SalonContact salon={salon} />

            <SalonLoyalty />

            {salon.siblings && salon.siblings.length > 0 && (
              <SalonOtherLocations siblings={salon.siblings} locale={locale} />
            )}

            <SalonVenuesNearby
              cat={primaryCategory}
              excludeId={salon.id}
              locale={locale}
            />

              <SalonAppCta
                locale={locale}
                slug={slug}
                city={postalToCity(salon.postal_code)}
                quartier={salon.quartier}
              />
            </div>
          </div>

          {/* RIGHT column — sticky sidebar only on truly wide screens
              (lg breakpoint, 1024px+). On smaller-but-still-desktop windows
              the mobile floating Book bar takes over instead. Sticky-pinned
              at top-24; SalonSidebar internally manages collapse/expand. */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 pt-3">
              <SalonSidebar salon={salon} locale={locale} />
            </div>
          </aside>
        </div>
      </div>

      </div>
      {/* /content layer */}

      {/* Mobile sticky bottom CTA */}
      <SalonMobileBookBar locale={locale} slug={slug} />

      {/* Lightbox modal */}
      <SalonLightbox
        photos={photos}
        open={lightboxOpen}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </main>
  );
}

function LoadingSkeleton() {
  // V3-D202 (A24): swap `animate-pulse` for shimmer pattern per LoadingStates.md.
  // Uses the same gradient + animate-shimmer pattern as <Skeleton> primitive.
  const shimmer =
    "bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%] animate-shimmer";
  return (
    <main className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="mx-auto w-full max-w-[1180px] md:px-6">
        <div className={`aspect-[4/3] w-full ${shimmer} md:aspect-[16/7] md:rounded-card-lg`} />
      </div>
      <div className="mx-auto mt-5 w-full max-w-[1180px] px-4 md:mt-7 md:px-6">
        <div className={`h-9 w-2/3 rounded ${shimmer} md:h-12`} />
        <div className={`mt-3 h-5 w-1/2 rounded ${shimmer}`} />
      </div>
    </main>
  );
}

function NotFound({ locale }: { locale: string }) {
  return (
    <main className="min-h-screen bg-white pt-28">
      <div className="mx-auto flex max-w-md flex-col items-center px-6 text-center">
        <div className="font-display text-[80px] font-black leading-none text-s-ink-3/30">
          404
        </div>
        {/* V3-D335 (overnight T3): decorative accent span on error-state heading → ink per §1.5 forbidden table (no hero accent spans). */}
        <h1 className="font-display mt-2 text-[clamp(18px,2vw,20px)] font-semibold tracking-normal text-s-ink">
          Salon <span className="text-s-ink">nicht gefunden</span>.
        </h1>
        <p className="font-body mt-3 text-[15px] leading-relaxed text-s-ink-2">
          Vielleicht wurde dieser Salon entfernt oder umbenannt.
        </p>
        <Link
          href={`/${locale}/search`}
          className="font-body mt-6 inline-flex items-center gap-2 rounded-full bg-s-ink px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-black"
        >
          Alle Salons ansehen
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}
