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

export default async function ProfileLooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/profile/looks`);
  }

  // TODO (BACKEND_NEEDS_UI): query `looks` table once it exists, render LooksGrid.
  // For now: always empty FTU.

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">Looks</h1>
      <div className="mt-8">
        <div className="flex flex-col items-center px-6 pb-16 pt-10 text-center">
          <h2 className="font-heading text-[19px] font-semibold tracking-[-0.01em] text-s-ink">
            Noch keine Looks.
          </h2>
          <p className="mt-2 max-w-[300px] font-body text-[13.5px] leading-relaxed text-s-ink-2">
            Sammle Inspiration aus Salon-Profilen und Discovery, hier findest du sie wieder.
          </p>
          <Link
            href={`/${locale}/entdecken`}
            className="mt-6 inline-flex h-[46px] items-center justify-center rounded-btn border border-s-border bg-white px-7 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink"
          >
            Discover öffnen
          </Link>
        </div>
      </div>
    </main>
  );
}
