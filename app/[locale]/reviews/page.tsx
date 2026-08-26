/**
 * /reviews — marketplace-wide aggregate reviews page.
 *
 * Target of the homepage Reviews section "Alle Bewertungen →" link
 * (app/[locale]/_components/homepage/Reviews.tsx) which previously 404'd.
 *
 * Clean aggregate: header + list of the newest public reviews across ALL
 * salons. Each card reuses the per-salon review-card visual language from
 * /salon/[slug]/reviews (see MarketplaceReviewsList) and links back to that
 * salon's reviews page.
 *
 * Data: reviews table, newest first, only public (is_hidden = false) with a
 * non-empty comment. The live DB lacks the `moderation_status` column
 * (migration 060 unapplied — schema drift), so `is_hidden = false` is the
 * public gate, exactly as /api/reviews/salon/[salon_id] already uses.
 */
export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { MessageSquare } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { buildAlternates } from "@/lib/seo";
import MarketplaceReviewsList, {
  type MarketplaceReview,
} from "./_components/MarketplaceReviewsList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviewsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("reviews", locale),
  };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviewsPage" });
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `id, rating, comment, created_at,
       profiles!reviews_user_id_fkey(display_name, avatar_url),
       salons!reviews_salon_id_fkey(slug, name)`
    )
    .eq("is_hidden", false)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[ReviewsPage] failed to load reviews:", error);
  }

  const reviews: MarketplaceReview[] = (data ?? [])
    .map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: (r.comment ?? "").trim(),
      created_at: r.created_at,
      reviewer_name: r.profiles?.display_name ?? "Anonym",
      reviewer_avatar: r.profiles?.avatar_url ?? null,
      salon_slug: r.salons?.slug ?? "",
      salon_name: r.salons?.name ?? "",
    }))
    // Guard: drop rows whose salon join didn't resolve (orphaned review) or
    // whose comment is whitespace-only — both would render a dead card.
    .filter((r) => r.comment.length > 0 && r.salon_slug);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <header>
        {/* 2026-06-11: was a BLUE tracked-uppercase eyebrow — double violation
            (blue on non-interactive text + banned eyebrow). Normal-case grey kicker. */}
        {/* mockup-ok: owner decision 5A (2026-08-09) , eyebrow at card-meta size. Was 13px. */}
        <span className="block font-body text-[12px] font-semibold text-s-ink-2">
          {t("eyebrow")}
        </span>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,38px)] font-semibold leading-[1.1] tracking-[-0.02em] text-s-ink">
          {t("heading")}
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink-2">
          {t("subtitle")}
        </p>
      </header>

      <div className="mt-8">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-s-border bg-s-bg-sunken px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
              <MessageSquare size={22} strokeWidth={2.2} aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-[18px] font-semibold text-s-ink">
              {t("emptyTitle")}
            </h2>
            <p className="mt-1.5 max-w-sm font-body text-[14px] text-s-ink-2">
              {t("emptyMessage")}
            </p>
          </div>
        ) : (
          <MarketplaceReviewsList reviews={reviews} locale={locale} />
        )}
      </div>
    </main>
  );
}
