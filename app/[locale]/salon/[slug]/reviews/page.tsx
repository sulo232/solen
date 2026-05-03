/**
 * /salon/[slug]/reviews — Q54 (locked 2026-05-02) full reviews sub-page.
 *
 * Routed from the SalonReviewsSummary "Alle Bewertungen anzeigen →" link
 * on the salon detail page. Renders the existing SalonReviews component
 * (389L) which already handles:
 *   - Filter chips (rating filter, with-photo filter)
 *   - Reply threads expanded
 *   - Photo upload + new-review form
 *   - Dispute reporting
 *
 * Future v2 (Phase 7): infinite-scroll pagination if review count > 50.
 * Today: SalonReviews loads all reviews from the parent salon fetch,
 * which is fine for the typical 0-200 review range.
 */
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import SalonReviews from "@/components/salon/SalonReviews";
import SignatureLockup from "@/components/ui/SignatureLockup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("name")
    .eq("slug", slug)
    .single();
  return {
    title: salon ? `Bewertungen · ${salon.name}` : "Bewertungen",
    description: "Alle Bewertungen für diesen Salon",
  };
}

export default async function SalonReviewsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch salon + reviews in parallel
  const [salonRes, reviewsRes] = await Promise.all([
    supabase
      .from("salons")
      .select("id, slug, name, average_rating, review_count")
      .eq("slug", slug)
      .single(),
    supabase
      .from("reviews")
      .select(`
        id, rating, comment, created_at, photos, user_id,
        profiles(display_name, avatar_url),
        review_replies(reply_text, reply_at)
      `)
      .eq("salon_slug", slug)
      .order("created_at", { ascending: false }),
  ]);

  if (!salonRes.data) {
    notFound();
  }

  // Hint TS that salon is non-null after the notFound() throw above
  const salon = salonRes.data!;
  const enrichedReviews = (reviewsRes.data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    photos: r.photos ?? [],
    user_id: r.user_id,
    user_name: r.profiles?.display_name ?? "Anonym",
    user_avatar: r.profiles?.avatar_url ?? null,
    reply: r.review_replies?.[0]
      ? {
          reply_text: r.review_replies[0].reply_text,
          reply_at: r.review_replies[0].reply_at,
        }
      : null,
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/salon/${slug}`}
        className="inline-flex items-center gap-1.5 font-body text-[13px] text-s-ink/60 hover:text-s-coral transition-colors duration-150 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 rounded-md"
      >
        <ChevronLeft size={16} aria-hidden />
        {salon.name}
      </Link>

      <SignatureLockup
        eyebrow={`Salon · ${salon.name}`}
        headline={`Bewertungen · ${salon.review_count?.toLocaleString("de-CH") ?? 0}`}
        size="md"
      />

      <div className="mt-8">
        <SalonReviews
          reviews={enrichedReviews as any}
          averageRating={salon.average_rating ?? 0}
          reviewCount={salon.review_count ?? 0}
          salonId={salon.id}
          salonSlug={slug}
          unreviewedBookingId={null}
          locale={locale}
        />
      </div>
    </main>
  );
}
