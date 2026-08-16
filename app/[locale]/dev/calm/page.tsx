// Mockup-scope: whole-page
// Exists-check: `npm run exists calm` found no /dev/calm route. Its two hits were the REMOVED.md
// black-selected-state entry (not re-proposed here; the selected pill below stays the soft black he
// picked himself on 2026-08-15) and an unrelated comment in dev/bundles-products. Nothing is
// duplicated: this page fetches with the SAME query and renders the SAME component as the real
// full-reviews route, app/[locale]/salon/[slug]/reviews/page.tsx.
//
// measured: see CalmClient.tsx's header for the full reference numbers. Short version, all counted
// on the live page at 390x844 on 2026-08-15 against captures already in this repo: 14 of 17 rounded
// elements are full capsules (82%) where Airbnb's dominant radius is 20px across 100 elements;
// 7 distinct type sizes with five of them inside a 5px band; 4 letter-spacing values where every
// Airbnb tier is `normal`; the sort control is a 108x44px box on 13px text.
//
// WHY THIS EXISTS. Owner 2026-08-15: "i dont like ths flat sh and pil everywhere i told ths once
// whats causing this wich files or gates bro ... mainly i want airbnb". He asked for the CAUSE
// first, so the page leads with the count and only then offers the treatments. Full write-up with
// the file and line numbers: _plans/PDP_CLUTTER_CAUSE_2026-08-15.md
//
// English chrome; the real component renders its own locale, which the rule exempts.

import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { CalmClient } from "./CalmClient";

// Cuts & Culture, the salon on the screen he sent.
const SALON_ID = "5784b1ab-7314-437a-a608-01a729f02cdd";
const SALON_SLUG = "cuts-and-culture";
const SALON_NAME = "Cuts & Culture";

// Served from a production build, same reason as /dev/round5's page: `next dev` does not reliably
// hydrate this app, so its buttons arrive dead on his phone. SOLEN_DEV_PAGES is set by hand on the
// local test server and by nothing in the deploy environment, so this stays out of production.
export default async function CalmPage() {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const admin = createAdminSupabaseClient();

  // The SAME select the real full-reviews page uses, so what he judges is what ships.
  const [{ data, error }, { data: salon }] = await Promise.all([
    admin
      .from("reviews")
      .select(
        `
        id, rating, comment, created_at,
        profiles(display_name, avatar_url),
        review_photos(id, photo_url),
        review_replies(id, reply_text, is_public, created_at)
      `,
      )
      .eq("salon_id", SALON_ID)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .range(0, 19),
    admin.from("salons").select("average_rating, review_count").eq("id", SALON_ID).single(),
  ]);

  if (error) console.error("[dev/calm] review fetch failed:", error);

  const reviews = (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    profiles: r.profiles ?? null,
    review_photos: r.review_photos ?? [],
    review_replies: r.review_replies ?? [],
  }));

  return (
    <CalmClient
      reviews={reviews}
      averageRating={salon?.average_rating ?? 0}
      reviewCount={salon?.review_count ?? 0}
      salonId={SALON_ID}
      salonSlug={SALON_SLUG}
      salonName={SALON_NAME}
      canWriteReview={false}
      alreadyReviewed={false}
      unreviewedBookingId={null}
      locale="de"
      isOwner={false}
    />
  );
}
