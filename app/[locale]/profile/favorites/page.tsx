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
import { createServerSupabaseClient } from "@/lib/supabase";
import SalonCard from "@/components-legacy/SalonCard";
import EmptyStateDiscovery from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

export default async function ProfileFavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/profile/favorites`);
  }

  // Step 1 — list of favorited salon ids
  const { data: favs } = await supabase
    .from("favorites")
    .select("salon_id, created_at")
    .eq("user_id", session.user.id)
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
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div>
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">Favoriten</h1>
        {salons.length > 0 && (
          <p className="mt-1 font-body text-[13px] text-s-ink-2">{salons.length} Salons</p>
        )}
      </div>

      {salons.length === 0 ? (
        <div className="mt-6">
          <EmptyStateDiscovery
            locale={locale}
            lead="Noch nichts gespeichert. Tipp auf das Herz auf einem Salon und du findest ihn hier wieder."
            heroImg={topSalons?.[0]?.cover_photo_url ?? null}
            heroEyebrow="Entdecken"
            heroTitle="Finde deinen Lieblingssalon."
            heroHref={`/${locale}/entdecken`}
            hintIcon="heart"
            railTitle="Top bewertet"
            railHref={`/${locale}/coiffeur`}
            salons={topSalons ?? []}
          />
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {salons.map((s) => (
            <SalonCard key={s.id} salon={s as any} locale={locale} isFavorited />
          ))}
        </section>
      )}
    </main>
  );
}
