/**
 * /profile/favorites — Q58 grouped-list "Favoriten" target.
 *
 * Server component. Lists the user's favorited salons. Uses Q60 EmptyStateFTU
 * when the list is empty.
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import SignatureLockup from "@/components/ui/SignatureLockup";
import EmptyStateFTU from "@/components/ui/EmptyStateFTU";
import SalonCard from "@/components/SalonCard";

const HeartIllustration = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    fill="none"
    stroke="#E8624A"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M50 80 L20 50 a14 14 0 0 1 22 -18 l8 8 8 -8 a14 14 0 0 1 22 18 z" />
  </svg>
);

interface FavoriteRow {
  salon_id: string;
  salons: {
    id: string;
    slug: string;
    name: string;
    cover_url: string | null;
    rating: number | null;
    rating_count: number | null;
    neighborhood: string | null;
    categories: string[] | null;
    price_band: string | null;
  } | null;
}

export default async function ProfileFavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/sign-in?redirect=/${locale}/profile/favorites`);
  }

  const { data } = await supabase
    .from("favorites")
    .select("salon_id, salons(id, slug, name, cover_url, rating, rating_count, neighborhood, categories, price_band)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const favorites = (data ?? []) as unknown as FavoriteRow[];
  const validFavorites = favorites.filter((f) => f.salons !== null);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <SignatureLockup
        eyebrow={`Mein Profil · ${validFavorites.length} Salons`}
        headline="Favoriten"
        size="md"
      />

      {validFavorites.length === 0 ? (
        <div className="mt-8">
          <EmptyStateFTU
            eyebrow="Noch keine Favoriten"
            headline="Speicher Salons, die du liebst"
            subCopy="Tippe auf das Herz auf jedem Salon, um ihn hier zu finden."
            ctaLabel="Salon entdecken →"
            ctaHref={`/${locale}/entdecken`}
            illustration={<HeartIllustration />}
          />
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {validFavorites.map((f) =>
            f.salons ? (
              <SalonCard
                key={f.salons.id}
                salon={{
                  id: f.salons.id,
                  slug: f.salons.slug,
                  name: f.salons.name,
                  cover_url: f.salons.cover_url ?? "",
                  rating: f.salons.rating ?? 0,
                  rating_count: f.salons.rating_count ?? 0,
                  neighborhood: f.salons.neighborhood ?? "",
                  categories: f.salons.categories ?? [],
                  price_band: f.salons.price_band ?? "",
                } as any}
              />
            ) : null
          )}
        </section>
      )}
    </main>
  );
}
