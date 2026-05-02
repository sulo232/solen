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

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <SignatureLockup
        eyebrow={`Mein Profil · ${salons.length} Salons`}
        headline="Favoriten"
        size="md"
      />

      {salons.length === 0 ? (
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
          {salons.map((s) => (
            <SalonCard key={s.id} salon={s as any} locale={locale} isFavorited />
          ))}
        </section>
      )}
    </main>
  );
}
