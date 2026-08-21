/**
 * /profile/looks — Q58 grouped-list "Looks" target.
 *
 * Server component. Saved looks (inspiration photos) — feature stub.
 * Uses Q60 EmptyStateFTU when the list is empty.
 *
 * Looks data model is TBD per BACKEND_NEEDS_UI; this page renders the empty
 * state until the looks table + ingestion flow lands. Once data exists, swap
 * the EmptyStateFTU for the LooksGrid component (already exists).
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import EmptyStateDiscovery from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

export default async function ProfileLooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/profile/looks`);
  }

  // TODO (BACKEND_NEEDS_UI): query `looks` table once it exists, render LooksGrid.
  // For now: always empty FTU.

  // Mockup-19 Option B: real top-rated salons for the empty-state rail + banner.
    const { data: topSalons } = await supabase
      .from("salons")
      .select("slug, name, cover_photo_url, average_rating, review_count, quartier")
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(6);

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8">
      <span aria-hidden className="hidden" /> {/* title lives in the global header */}
      <div className="mt-2">
        <EmptyStateDiscovery
          locale={locale}
          title="Noch keine Looks."
          lead="Sammeln Sie Inspiration aus Salon-Profilen und Inspo, hier finden Sie sie wieder."
          bannerImg={topSalons?.[0]?.cover_photo_url ?? null}
          bannerTitle="Inspo öffnen"
          bannerSub="Frische Looks aus Basler Salons"
          bannerHref={`/${locale}/inspo`}
          hintIcon="bookmark"
          hintText="Speichere Looks direkt aus dem Discovery-Feed und aus Salon-Portfolios."
          railTitle="Top bewertet"
          railHref={`/${locale}/coiffeur`}
          salons={topSalons ?? []}
        />
      </div>
    </main>
  );
}
