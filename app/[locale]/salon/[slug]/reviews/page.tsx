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

import { notFound } from "next/navigation";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import SalonReviews from "@/components-legacy/salon/SalonReviews";

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
    title: salon ? `Bewertungen ${salon.name}` : "Bewertungen",
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

  // Resolve the salon first — reviews are keyed by salon_id, not slug, so we
  // need the id before we can fetch the review rows.
  const salonRes = await supabase
    .from("salons")
    .select("id, slug, name, average_rating, review_count")
    .eq("slug", slug)
    .single();

  if (!salonRes.data) {
    notFound();
  }

  // Hint TS that salon is non-null after the notFound() throw above
  const salon = salonRes.data!;

  // Fetch reviews + the viewer's completed bookings in parallel.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  // Use admin client for reviews: profiles RLS blocks anon reads and nulls display_name.
  // We expose only display_name + avatar_url here, matching /api/salons/[slug]/route.ts.
  const adminClient = createAdminSupabaseClient();
  const [reviewsRes, completedRes] = await Promise.all([
    adminClient
      .from("reviews")
      .select(`
        id, rating, comment, created_at, user_id, booking_id,
        profiles(display_name, avatar_url),
        review_photos(id, photo_url),
        review_replies(id, reply_text, is_public)
      `)
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false }),
    userId
      ? supabase
          .from("bookings")
          .select("id")
          .eq("user_id", userId)
          .eq("salon_id", salon.id)
          .eq("status", "completed")
          .order("starts_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  // Mirror GET /api/reviews/my-booking: of this user's completed bookings at this
  // salon, find the first with no review yet → SalonReviews renders the
  // "Write review" button. (Two-step exclusion, not a PostgREST subquery filter.)
  let unreviewedBookingId: string | null = null;
  const completedBookings = (completedRes.data ?? []) as { id: string }[];
  if (completedBookings.length > 0) {
    const { data: reviewedRows } = await supabase
      .from("reviews")
      .select("booking_id")
      .in("booking_id", completedBookings.map((b) => b.id));
    const reviewedIds = new Set((reviewedRows ?? []).map((r) => r.booking_id));
    unreviewedBookingId = completedBookings.find((b) => !reviewedIds.has(b.id))?.id ?? null;
  }
  // Pass rows through in the shape SalonReviews reads (profiles / review_photos /
  // review_replies / booking_id stay as embedded objects).
  const enrichedReviews = (reviewsRes.data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    user_id: r.user_id,
    booking_id: r.booking_id,
    profiles: r.profiles ?? null,
    review_photos: r.review_photos ?? [],
    review_replies: r.review_replies ?? [],
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div>
        <SalonReviews
          reviews={enrichedReviews as any}
          averageRating={salon.average_rating ?? 0}
          reviewCount={salon.review_count ?? 0}
          salonId={salon.id}
          salonSlug={slug}
          unreviewedBookingId={unreviewedBookingId}
          locale={locale}
        />
      </div>
    </main>
  );
}
