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

/**
 * SalonDetailV3 — V2-D53.3 orchestrator (2026-05-11).
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
 * Brand discipline (V2-D49j + V2-D53.3):
 *   • White substrate (commerce surface, not cream)
 *   • Emerald action color (Book buttons, "See all" expand pills)
 *   • Terracotta `s-accent` for Featured pill (heartbeat highlight semantic)
 *   • Peace Sans display + Open Sauce body typography unchanged
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

  // Track recently-viewed
  React.useEffect(() => {
    if (!slug) return;
    try {
      const raw = window.localStorage.getItem("solen.recently-viewed");
      const list: string[] = (raw ? JSON.parse(raw) : []).filter(
        (s: unknown): s is string => typeof s === "string" && s !== slug
      );
      window.localStorage.setItem(
        "solen.recently-viewed",
        JSON.stringify([slug, ...list].slice(0, 5))
      );
    } catch {
      // ignore
    }
  }, [slug]);

  if (loading) return <LoadingSkeleton />;
  if (error || !salon) return <NotFound locale={locale} />;

  // Decide which sections have content → drives sticky tab nav visibility.
  const availableSections = new Set<TabKey>();
  if ((salon.gallery_urls?.length ?? 0) > 0 || salon.cover_photo_url) availableSections.add("photos");
  if (salon.services.length > 0) availableSections.add("services");
  if (salon.staff.length > 0) availableSections.add("team");
  if (salon.review_count > 0 || (salon.average_rating ?? 0) > 0) availableSections.add("reviews");
  if (salon.gallery_urls?.length > 0) availableSections.add("portfolio");
  if (salon.about_text_de || salon.description_de || salon.about_text_en || salon.description_en || salon.address) {
    availableSections.add("about");
  }
  availableSections.add("loyalty"); // always shown

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

  return (
    // V2-D53.3 fix: pt-16 md:pt-20 pushes content below the fixed site header
    // (~64-72px tall). bg-white substrate per §5h.3 (commerce surface). Subtle
    // V3-tinted gradient washes mounted ABSOLUTELY inside as the first child
    // sit between bg-white and content — produces the "light gradients on
    // white" feel the user asked for without the full-intensity homepage
    // atmosphere overpowering the dense commerce content.
    <main className="relative min-h-screen overflow-hidden bg-white pt-16 pb-24 md:pt-20 md:pb-16">
      {/* V2-D53.3 ambient gradient washes — V3 mid-tones distributed so
          BOTH sides get a mix of warm + cool tones at each vertical band.
          Avoids the "all green on left, all beige on right" segregation.
          Opacity 0.16-0.22, blur 100px, saturate 1.2. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Top band — warm peach LEFT, cool emerald RIGHT */}
        <div className="absolute" style={{ top: "2%", left: "-12%", width: "55%", height: "28%", background: "#F2C49B", borderRadius: "50%", opacity: 0.10, filter: "blur(110px) saturate(0.9)" }} />
        <div className="absolute" style={{ top: "5%", right: "-15%", width: "50%", height: "28%", background: "#5BAE85", borderRadius: "50%", opacity: 0.11, filter: "blur(110px) saturate(0.9)" }} />
        {/* Mid-upper band — terracotta LEFT, butter RIGHT */}
        <div className="absolute" style={{ top: "28%", left: "-10%", width: "55%", height: "26%", background: "#D6754F", borderRadius: "50%", opacity: 0.09, filter: "blur(110px) saturate(0.9)" }} />
        <div className="absolute" style={{ top: "32%", right: "-10%", width: "50%", height: "26%", background: "#F0C85A", borderRadius: "50%", opacity: 0.10, filter: "blur(110px) saturate(0.9)" }} />
        {/* Mid-lower band — sage LEFT, rose RIGHT */}
        <div className="absolute" style={{ top: "52%", left: "-12%", width: "55%", height: "28%", background: "#9CC0A4", borderRadius: "50%", opacity: 0.11, filter: "blur(110px) saturate(0.9)" }} />
        <div className="absolute" style={{ top: "56%", right: "-10%", width: "50%", height: "26%", background: "#E89A88", borderRadius: "50%", opacity: 0.10, filter: "blur(110px) saturate(0.9)" }} />
        {/* Bottom band — emerald LEFT, peach RIGHT (mirrors top for closure) */}
        <div className="absolute" style={{ top: "76%", left: "-10%", width: "55%", height: "26%", background: "#5BAE85", borderRadius: "50%", opacity: 0.09, filter: "blur(110px) saturate(0.9)" }} />
        <div className="absolute" style={{ top: "80%", right: "-12%", width: "55%", height: "28%", background: "#F2C49B", borderRadius: "50%", opacity: 0.10, filter: "blur(110px) saturate(0.9)" }} />
      </div>

      {/* Content layer — sits above the gradient washes via z-10 */}
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
              <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} />
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

            <SalonAbout salon={salon} />

            {/* Opening Times + Additional Info side-by-side on desktop */}
            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              <SalonOpeningTimes hours={salon.opening_hours} />
              <SalonAdditionalInfo salon={salon} />
            </div>

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
  return (
    <main className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="mx-auto w-full max-w-[1180px] md:px-6">
        <div className="aspect-[4/3] w-full animate-pulse bg-s-bg-sunken md:aspect-[16/7] md:rounded-3xl" />
      </div>
      <div className="mx-auto mt-5 w-full max-w-[1180px] px-4 md:mt-7 md:px-6">
        <div className="h-9 w-2/3 animate-pulse rounded bg-s-bg-sunken md:h-12" />
        <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-s-bg-sunken" />
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
        <h1 className="font-display mt-2 text-[clamp(24px,3vw,36px)] font-bold tracking-normal text-s-ink">
          Salon <span className="text-s-accent">nicht gefunden</span>.
        </h1>
        <p className="font-body mt-3 text-[15px] leading-relaxed text-s-ink-2">
          Vielleicht wurde dieser Salon entfernt oder umbenannt.
        </p>
        <Link
          href={`/${locale}/search`}
          className="font-body mt-6 inline-flex items-center gap-2 rounded-full bg-s-brand px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-s-brand-mid"
        >
          Alle Salons ansehen
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}
