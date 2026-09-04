// Grounded-in: app/[locale]/_components/primitives/CookieConsent.tsx, app/[locale]/_components/homepage/WalkInBand.tsx, app/[locale]/_components/homepage/Reviews.tsx
//
// Exists-check: `npm run exists cookie consent buttons touch target`, `npm run exists cookie
// banner touch target 44`, and `npm run exists small-visual-fixes` all ran this turn. The first
// two returned 0 matches (no existing touch-target-sizing mockup of the cookie banner anywhere).
// The third returned 3 matches, all this task's own sibling files written earlier this session
// (CookieBannerCopies.tsx, ReviewCardCopies.tsx, WalkInBandProposed.tsx). `npm run exists
// design-fixes` was already run in an earlier session and its page
// (app/[locale]/dev/design-fixes/page.tsx) already compares the walk-in band card and the home
// review card, so those two surfaces are NOT net-new as SURFACES: this page is a second, narrower
// comparison, scoped to exactly what this brief asks and nothing that page already answers.
//   - Cookie banner touch targets: NOT in design-fixes or anywhere else. Net-new.
//   - Walk-in band wait colour: design-fixes/Pair A "Proposed" REPLACES the card with the real
//     homepage SalonCard, a structural swap. This brief is dated 2026-09-04, the SAME day the
//     owner said "keep the current" structure for this card, so that structural swap is not what
//     ships here; this page's Pair 2 is a colour-only byte-copy of WalkInBand.tsx itself.
//   - Review card border/shadow: design-fixes/Pair B already drops the shadow and keeps the
//     border as ONE proposed variant. This brief asks for the split as TWO named sub-variants
//     shown together (hairline-only, shadow-only), which design-fixes does not render, so Pair 3
//     here renders both, plus the untouched Current for reference.
// REMOVED.md: no hit for any of the three surfaces (cookie banner, walk-in wait colour, review
// card edge treatment).
// The one new thing: a comparison page for these three specific, small fixes, none of which any
// existing file already shows.
//
// Depicts: cookie consent banner -> app/[locale]/_components/primitives/CookieConsent.tsx (byte-copy, see CookieBannerCopies.tsx)
// Depicts: walk-in band card -> app/[locale]/_components/homepage/WalkInBand.tsx (real, unmodified import for Current; byte-copy for Proposed, see WalkInBandProposed.tsx)
// Depicts: home review card -> app/[locale]/_components/homepage/Reviews.tsx (real, unmodified import for Current section; byte-copy of its ReviewCard for the three size-matched cards, see ReviewCardCopies.tsx)
//
// Mockup-scope: section (three independent element-level fixes, each shown Current-then-Proposed
// at real size; not a whole-page decision)

import { createAdminSupabaseClient } from "@/lib/supabase";
import { formatReviewDate } from "@/app/[locale]/_components/salon/_shared";
import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import { CookieBannerCurrent, CookieBannerProposed } from "./CookieBannerCopies";
import WalkInBandProposed from "./WalkInBandProposed";
import {
  ReviewCardCurrent,
  ReviewCardHairlineOnly,
  ReviewCardShadowOnly,
  type ReviewCardData,
} from "./ReviewCardCopies";

export default async function SmallVisualFixesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = createAdminSupabaseClient();

  // Same select shape as GET /api/reviews/featured and app/[locale]/dev/design-fixes/page.tsx's
  // Pair B: one real, recent, high-rated review with a comment, on a real listed salon.
  const { data: reviewRows, error: reviewError } = await admin
    .from("reviews")
    .select(
      "id, rating, comment, created_at, profiles!reviews_user_id_fkey(display_name), salons!reviews_salon_id_fkey!inner(name, slug, is_test, is_active, listed_on_marketplace)",
    )
    .gte("rating", 4)
    .not("comment", "is", null)
    .eq("is_flagged", false)
    .eq("is_hidden", false)
    .eq("salons.is_active", true)
    .eq("salons.listed_on_marketplace", true)
    .not("salons.is_test", "is", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (reviewError) console.error("[dev/small-visual-fixes] review fetch failed:", reviewError);

  const reviewRow = (reviewRows ?? [])[0] as
    | {
        rating: number;
        comment: string;
        created_at: string;
        profiles: { display_name: string | null } | null;
        salons: { name: string; slug: string } | null;
      }
    | undefined;

  const reviewerName = reviewRow?.profiles?.display_name ?? "Anonymous"; // real fallback, kept in English per the standing mockup-copy rule (production's own copy of this map falls back to the German "Anonym")
  const reviewInitials = reviewerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const review: ReviewCardData | null = reviewRow
    ? {
        stars: Math.min(5, Math.max(1, Math.round(reviewRow.rating))),
        text: reviewRow.comment,
        initials: reviewInitials || "?",
        name: reviewerName,
        salonName: reviewRow.salons?.name ?? "",
        salonSlug: reviewRow.salons?.slug ?? "",
        dateText: reviewRow.created_at ? formatReviewDate(reviewRow.created_at, locale) : "",
      }
    : null;

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="mx-auto max-w-[402px] px-4 pt-6">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">Three small visual fixes</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          Current then Proposed, real components, real seeded data.
        </p>

        {/* ---------------- 1. Cookie banner touch targets ---------------- */}
        <PairTitle letter="1" title="Cookie banner touch targets" />
        <PairLabel
          variant="Current"
          rule="Settings icon button 36px, action buttons padding-driven (measured below)."
        />
        <CookieBannerCurrent />
        <PairLabel
          variant="Proposed"
          rule="All three controls at the 44px touch floor (h-11 w-11 icon button, h-11 actions)."
        />
        <div className="mt-3">
          <CookieBannerProposed />
        </div>

        {/* ---------------- 2. Walk-in band wait colour ---------------- */}
        <PairTitle letter="2" title="Walk-in band wait colour" />
        <PairLabel
          variant="Current"
          rule="Wait range renders in success green (text-s-success), the loudest text on the card."
        />
        <WalkInBand />
        <PairLabel
          variant="Proposed"
          rule="Wait range in ink (text-s-ink); green stays only on the Live status dot. Structure unchanged (2026-09-04: keep the current card)."
        />
        <WalkInBandProposed />

        {/* ---------------- 3. Review card edge treatment ---------------- */}
        <PairTitle letter="3" title="Review card edge treatment" />
        <PairLabel
          variant="Current"
          rule="Carries border-s-border AND shadow-elevation-2 together."
        />
        <Reviews />
        {review ? (
          <div className="mt-4">
            <ReviewCardCurrent review={review} locale={locale} />
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-s-ink-2">No review matched the live query.</p>
        )}
        <PairLabel
          variant="Proposed A: hairline only"
          rule="border-s-border kept, shadow-elevation-2 removed."
        />
        {review && (
          <div className="mt-3">
            <ReviewCardHairlineOnly review={review} locale={locale} />
          </div>
        )}
        <PairLabel
          variant="Proposed B: shadow only"
          rule="shadow-elevation-2 kept, border-s-border removed."
        />
        {review && (
          <div className="mt-3 mb-2">
            <ReviewCardShadowOnly review={review} locale={locale} />
          </div>
        )}
      </div>
    </main>
  );
}

function PairTitle({ letter, title }: { letter: string; title: string }) {
  return (
    <h2 className="mt-10 border-t border-s-border pt-6 font-body text-[14px] font-semibold text-s-ink">
      {letter}. {title}
    </h2>
  );
}

function PairLabel({ variant, rule }: { variant: string; rule: string }) {
  return (
    <div className="mb-2 mt-4">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}
