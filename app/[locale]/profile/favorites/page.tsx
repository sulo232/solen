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
import Link from "next/link";
import { Heart } from "lucide-react";

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

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div>
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">Favoriten</h1>
        {salons.length > 0 && (
          <p className="mt-1 font-body text-[13px] text-s-ink-2">{salons.length} Salons</p>
        )}
      </div>

      {salons.length === 0 ? (
        <div className="mt-8 flex flex-col items-center px-6 pb-16 pt-12 text-center">
          {/* Mockup 09 empty state (approved 2026-06-11): 15 voice, heart hero tile +
              the real 3D category icons (owner round-2: "use the real 3D icons"). */}
          <h2 className="font-heading text-[19px] font-semibold tracking-[-0.01em] text-s-ink">
            Noch keine Favoriten.
          </h2>
          <p className="mt-2 max-w-[300px] font-body text-[13.5px] leading-relaxed text-s-ink-2">
            Tipp auf das Herz bei einem Salon und er landet hier, deine Merkliste fürs nächste Mal.
          </p>
          <div className="mt-5 flex gap-2.5">
            <div className="flex h-[104px] w-[84px] flex-col items-center justify-center gap-2 rounded-[14px] bg-s-ink text-white">
              <Heart size={22} strokeWidth={1.7} aria-hidden />
              <span className="text-[9.5px] font-semibold">dein erster</span>
            </div>
            <div className="flex h-[104px] w-[84px] flex-col items-center justify-center gap-2 rounded-[14px] bg-s-bg-sunken text-s-ink-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/categories/scissors.png" alt="" className="h-[34px] w-[34px] object-contain" />
              <span className="text-[9.5px] font-semibold">Coiffeur</span>
            </div>
            <div className="flex h-[104px] w-[84px] flex-col items-center justify-center gap-2 rounded-[14px] bg-s-bg-sunken text-s-ink-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/categories/nails.png" alt="" className="h-[34px] w-[34px] object-contain" />
              <span className="text-[9.5px] font-semibold">Nails</span>
            </div>
          </div>
          <Link
            href={`/${locale}/coiffeur`}
            className="mt-6 inline-flex h-[46px] items-center justify-center rounded-btn border border-s-border bg-white px-7 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink"
          >
            Salons entdecken
          </Link>
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
