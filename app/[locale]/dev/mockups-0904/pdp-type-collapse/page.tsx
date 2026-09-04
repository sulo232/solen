// Grounded-in: app/[locale]/_components/salon/SalonHero.tsx, app/[locale]/_components/salon/SalonHeader.tsx,
// app/[locale]/_components/salon/SalonAbout.tsx, app/[locale]/_components/salon/StatusInline.tsx,
// app/[locale]/salon/[slug]/page.tsx, lib/salon-detail.ts.
//
// Exists-check: npm run exists "salon pdp type collapse page tsx" ran this turn, 0 hits.
// npm run exists "salon pdp first viewport type collapse route", npm run exists "pdp type
// collapse salon page font sizes" and npm run exists "salon header type sizes" also ran
// earlier this session, 0 hits for any of them. The target surface (the salon PDP's first
// viewport: hero photo, salon name/rating/status/address header, About section) already renders,
// unchanged, at app/[locale]/salon/[slug]/page.tsx via SalonDetailV3.tsx, which composes
// SalonHero.tsx, SalonHeader.tsx and SalonAbout.tsx. No REMOVED.md hit for any of those. A
// DIFFERENT part of the same PDP (the Services section further down) already has its own
// font-size-collapse comparison at app/[locale]/dev/design-fixes/page.tsx (Pair D); that section
// is untouched here, this page is the hero+header+about cluster above it, which design-fixes
// never covered. The one new thing on this page: no new component, no new copy, no new data. It
// is a scoped style rule (see TopOfPageClient.tsx) that collapses ONE outlier font-size
// (StatusInline's hardcoded 15px "md" size) down into the 14px Body role every sibling meta
// string in this cluster already uses, so the cluster goes from 5 distinct sizes to 4.
//
// Depicts: hero photo carousel (mobile) → app/[locale]/_components/salon/SalonHero.tsx (real, unmodified import)
// Depicts: salon name + rating + open-status + address → app/[locale]/_components/salon/SalonHeader.tsx (real, unmodified import)
// Depicts: "About us" section → app/[locale]/_components/salon/SalonAbout.tsx (real, unmodified import)
// Depicts: the salon record itself → lib/salon-detail.ts loadSalonDetailWithStatus() (same loader
//   app/[locale]/salon/[slug]/page.tsx calls), fetching the real seeded salon "muse-beauty-studio"
//   (real photos, real rating/review count, real address, real About text)
//
// Mockup-scope: whole-page (the brief names this a first-viewport decision spanning three sibling
// components, not one isolated section)
//
// measured: SalonHeader.tsx, SalonAbout.tsx and StatusInline.tsx source-read at 390px (no md:
// breakpoint reachable at this width, so every md: class below never fires). H1, the Salon-PDP H1
// role, is text-[clamp(30px,2.8vw,34px)], rendering 30px/600. The meta-row container is
// text-[14px] (rating value, review-count button, address button all inherit this, 14px/400; the
// rating value's <strong> wrapper is 14px/600). StatusInline's default size="md" hardcodes
// text-[15px] regardless of the container's own breakpoint: 15px, head word font-medium/500, tail
// font-normal/400. The About H2 (SectionHeader / Section-H2 role) is
// text-[clamp(18px,2vw,20px)], rendering 18px/600. The About paragraph inherits the same
// container's text-[14px], 14px/400. The inline "Mehr lesen" toggle (shown only when the About
// text clamps, present on muse-beauty-studio's real seeded description) is text-[13px]
// font-medium, 13px/500. Distinct sizes found: 13, 14, 15, 18, 30, which is 5, matching the
// brief's "5 distinct sizes" finding. Live getComputedStyle re-confirmation against this exact
// route was attempted; see the report for whether it completed (a sibling agent's unrelated
// concurrent edit to app/[locale]/page.tsx was breaking the shared dev server's webpack build for
// the whole locale segment during this session, unrelated to this route's own files).
//
// decisions: the Proposed block leaves 30 (H1, LOCKFILE section 2, "Salon-PDP H1"), 18 (LOCKFILE
// section 2, "Section H2"), 14 (LOCKFILE section 2, "Body") and 13 (the existing "Mehr lesen"
// toggle, matching SalonReviews.tsx's identical control per FLOORS LAW 8, "the same thing looks
// the same everywhere") untouched, all four already on the LOCKFILE ladder. The single outlier,
// 15 (StatusInline's hardcoded "md" size), is not a ladder role on its own; it collapses to 14
// (Body), the role every other string in this meta row already renders at. Result: 4 distinct
// sizes, font-size classes only, nothing else changed.
import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { PdpTypeCollapseComparison } from "./TopOfPageClient";

const MUSE_SLUG = "muse-beauty-studio";

export default async function PdpTypeCollapsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const { locale } = await params;
  const result = await loadSalonDetailWithStatus(MUSE_SLUG);

  if (!result) {
    return (
      <main className="min-h-dvh bg-white px-4 py-6">
        <p className="text-[13px] text-s-ink-2">{MUSE_SLUG} did not resolve from the live query.</p>
      </main>
    );
  }

  const { salon, openStatus } = result;

  return (
    <main className="min-h-dvh bg-white pb-10">
      <PdpTypeCollapseComparison salon={salon} openStatus={openStatus} locale={locale} />
    </main>
  );
}
