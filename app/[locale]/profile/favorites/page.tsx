/**
 * /profile/favorites — Q58 grouped-list "Favoriten" target.
 *
 * Server component. Schema (verified 2026-05-02):
 *   - favorites table: { user_id, salon_id, created_at }
 *   - salons table: full Salon row (cover_photo_url, average_rating, etc.)
 *   - SalonCard expects the canonical SalonCard type — we mirror the
 *     /api/profile/favorites pattern (select * + compute avg_price).
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import FavoritesList from "@/app/[locale]/_components/profile/FavoritesList";
import EmptyStateDiscovery from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

export default async function ProfileFavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileFavorites" });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/profile/favorites`);
  }

  // Step 1 — list of favorited salon ids
  const { data: favs } = await supabase
    .from("favorites")
    .select("salon_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (favs ?? []).map((f) => f.salon_id);

  // Step 2 — fetch full salon records (matches /api/profile/favorites pattern)
  let salons: any[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("salons")
      .select("*, services(price)")
      .in("id", ids)
      .eq("is_active", true);

    salons = (data ?? []).map((s: any) => {
      const prices = ((s.services ?? []) as { price: number }[])
        .map((x) => x.price)
        .filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null;
      const { services: _s, ...rest } = s;
      return { ...rest, avg_price };
    });

    // `.in("id", ids)` does NOT preserve the ids order, so the list came back in
    // arbitrary order , losing the "most-recently-favorited first" intent (favs is
    // ordered created_at desc). Re-sort to the favorites order.
    const orderIndex = new Map(ids.map((id, i) => [id, i]));
    salons.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }

  // Mockup-19 Option B (owner-picked 2026-06-11): real top-rated salons for the
  // empty-state rail + banner photo. Light query, only runs when the list is empty.
  const { data: topSalons } = await supabase
    .from("salons")
    .select("slug, name, cover_photo_url, average_rating, review_count, quartier")
    .eq("is_active", true)
    .order("average_rating", { ascending: false })
    .limit(6);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8">
      {/* Title lives in the global header beside the back tile (owner, 2026-06-11).
          Count + grid + remove-favorite (tap heart → optimistic drop + Undo toast)
          are owned by the FavoritesList client wrapper. */}
      {salons.length === 0 ? (
        <div className="mt-2">
          <EmptyStateDiscovery
            locale={locale}
            title={t("title")}
            lead={t("lead")}
            bannerImg={topSalons?.[0]?.cover_photo_url ?? null}
            bannerTitle={t("bannerTitle")}
            bannerSub={t("bannerSub")}
            bannerHref={`/${locale}/inspo`}
            hintIcon="heart"
            hintText={t("hintText")}
            railTitle={t("railTitle")}
            railHref={`/${locale}/coiffeur`}
            salons={topSalons ?? []}
          />
        </div>
      ) : (
        <FavoritesList salons={salons} locale={locale} />
      )}
    </main>
  );
}
