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
 * Ring 2b (2026-07-11): the parent fetch narrows from the prior .limit(50)
 * (bfa385699, 2026-06-30) to .range(0, 19), 20 reviews + 3 joins instead
 * of 50. SalonReviews now pages further reviews client-side via the
 * existing /api/reviews/salon/[salon_id] endpoint ("Mehr laden").
 */
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import SalonReviews from "@/components-legacy/salon/SalonReviews";
import { loadSalonDetailWithAccess } from "@/lib/salon-detail";
import { publicReply } from "@/app/[locale]/_components/salon/_shared";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  // Use the same request-aware access owner as the page body. A raw salons-name query
  // can see active-but-unlisted or test rows under RLS when middleware defers on a lookup
  // error, leaking the hidden Store name through metadata while the body correctly 404s.
  const result = await loadSalonDetailWithAccess(slug);
  const salon = result?.salon ?? null;
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
  // Admin (service-role) client for the PUBLIC reviews read: the anon client + `profiles`
  // RLS made the reviewer-name join return null, so the page rendered every review as
  // "Anonym"/empty (same bug the featured-reviews endpoint had). The explicit projection
  // is narrowed again below: private reply drafts visible to this server-only client are
  // removed before client props are built. User-scoped data (session + the viewer's
  // bookings) stays on the anon client.
  const admin = createAdminSupabaseClient();

  // Reuse the PDP access owner so inactive, unlisted, and test Stores follow the
  // same public/owner/admin decision on this child route.
  const result = await loadSalonDetailWithAccess(slug);

  if (!result) {
    notFound();
  }

  const { salon, canModerate: isOwner } = result;

  // Fetch reviews + the viewer's completed bookings in parallel.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const [reviewsRes, completedRes] = await Promise.all([
    // Ring 2b: narrowed from the prior .limit(50) (bfa385699, 2026-06-30) to the
    // first page (20, matching /api/reviews/salon/[salon_id]'s page size), still
    // regardless of salon.review_count; further pages are loaded client-side via
    // that existing paginated endpoint (SalonReviews "Mehr laden").
    admin
      .from("reviews")
      .select(`
        id, rating, comment, created_at,
        profiles(display_name, avatar_url),
        review_photos(id, photo_url),
        review_replies(id, reply_text, is_public, created_at),
        bookings(guest_name)
      `)
      .eq("salon_id", salon.id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .range(0, 19),
    userId
      ? supabase
          .from("bookings")
          .select("id, staff_member_id")
          .eq("user_id", userId)
          .eq("salon_id", salon.id)
          .eq("status", "completed")
          .order("starts_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; staff_member_id: string | null }[] }),
  ]);

  // Mirror GET /api/reviews/my-booking: of this user's completed bookings at this salon, find the
  // first with no review yet. Since owner decision 4 (2026-08-09) this no longer gates the
  // "Write review" button , canWriteReview below does. It only supplies the booking and stylist the
  // rating links to when the rater happens to have an appointment here.
  // (Two-step exclusion, not a PostgREST subquery filter.)
  let unreviewedBookingId: string | null = null;
  let unreviewedBookingStaffMemberId: string | null = null;
  const completedBookings = (completedRes.data ?? []) as { id: string; staff_member_id: string | null }[];
  if (completedBookings.length > 0) {
    const { data: reviewedRows } = await supabase
      .from("reviews")
      .select("booking_id")
      .in("booking_id", completedBookings.map((b) => b.id));
    const reviewedIds = new Set((reviewedRows ?? []).map((r) => r.booking_id));
    const unreviewedBooking = completedBookings.find((b) => !reviewedIds.has(b.id)) ?? null;
    unreviewedBookingId = unreviewedBooking?.id ?? null;
    unreviewedBookingStaffMemberId = unreviewedBooking?.staff_member_id ?? null;
  }

  // Owner decision 4, 2026-08-09 ("4B like google maps"): anyone SIGNED IN can rate any salon, so
  // the button is gated on being signed in, not on having been here. The one bound mirrors what
  // POST /api/reviews enforces, so the button never opens a form that would 409: with an unreviewed
  // booking the rater can always post; without one they can post unless they already left an
  // appointment-free rating for this salon.
  let canWriteReview = false;
  // he has used up the one rating this salon allows without an appointment
  let alreadyReviewed = false;
  if (userId) {
    if (unreviewedBookingId) {
      canWriteReview = true;
    } else {
      const { data: existingOpenReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", userId)
        .eq("salon_id", salon.id)
        .is("booking_id", null)
        .is("walkin_queue_id", null)
        .limit(1)
        .maybeSingle();
      canWriteReview = !existingOpenReview;
      alreadyReviewed = !!existingOpenReview;
    }
  }

  // If the unreviewed booking has a staff member, fetch their name + avatar for the
  // stylist-led review form ("How was {name}?").
  let unreviewedBookingStaffName: string | undefined;
  let unreviewedBookingStaffPhotoUrl: string | undefined;
  if (unreviewedBookingStaffMemberId) {
    const { data: staffRow } = await supabase
      .from("staff_members")
      .select("name, avatar_url")
      .eq("id", unreviewedBookingStaffMemberId)
      .single();
    if (staffRow) {
      // Use the first word of the name (first name) for the heading.
      unreviewedBookingStaffName = staffRow.name?.split(" ")[0] ?? staffRow.name ?? undefined;
      unreviewedBookingStaffPhotoUrl = staffRow.avatar_url ?? undefined;
    }
  }

  // Pass rows through in the shape SalonReviews reads (profiles / review_photos /
  // review_replies stay as embedded objects). user_id + booking_id are NOT forwarded:
  // SalonReviews never reads them (the write-review gate uses unreviewedBookingId), so
  // shipping every reviewer's auth UUID + booking UUID into the client HTML was a
  // needless exposure. The write-review dedup uses its own server-side query above.
  // guestName is the ONE field pulled OUT of the bookings embed (guest_name only,
  // never the booking id or anything else on that row): a guest who books and leaves a
  // review has no profiles row, so SalonReviews.tsx's fallback chain reads this before
  // falling back to the translated anonymous label. The nested `bookings` object itself
  // is never forwarded, same discipline as the stripped user_id/booking_id above.
  const enrichedReviews = (reviewsRes.data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    profiles: r.profiles ?? null,
    review_photos: r.review_photos ?? [],
    // The admin read bypasses review_replies RLS. Remove private drafts before
    // passing reviews to the client; filtering only during render still leaks
    // their text in the serialized RSC payload.
    review_replies: publicReply(r.review_replies),
    guestName: r.bookings?.guest_name ?? null,
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
          salonName={salon.name}
          canWriteReview={canWriteReview}
          alreadyReviewed={alreadyReviewed}
          unreviewedBookingId={unreviewedBookingId}
          unreviewedBookingStaffName={unreviewedBookingStaffName}
          unreviewedBookingStaffMemberId={unreviewedBookingStaffMemberId ?? undefined}
          unreviewedBookingStaffPhotoUrl={unreviewedBookingStaffPhotoUrl}
          locale={locale}
          isOwner={isOwner}
        />
      </div>
    </main>
  );
}
