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
import { createServerSupabaseClient } from "@/lib/supabase";
import SignatureLockup from "@/components/ui/SignatureLockup";
import EmptyStateFTU from "@/components/ui/EmptyStateFTU";

const SparkleIllustration = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    fill="none"
    stroke="#1B4D1B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* Stylized polaroid + spark */}
    <rect x="22" y="22" width="48" height="56" rx="3" />
    <rect x="22" y="22" width="48" height="40" />
    <path d="M76 32l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" />
  </svg>
);

export default async function ProfileLooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/sign-in?redirect=/${locale}/profile/looks`);
  }

  // TODO (BACKEND_NEEDS_UI): query `looks` table once it exists, render LooksGrid.
  // For now: always empty FTU.

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <SignatureLockup
        eyebrow="Mein Profil · 0 Looks"
        headline="Looks"
        size="md"
      />
      <div className="mt-8">
        <EmptyStateFTU
          eyebrow="Noch keine Looks"
          headline="Speicher Looks für später"
          subCopy="Inspiration aus Salon-Profilen und Discovery sammeln, hier wieder finden."
          ctaLabel="Discover öffnen →"
          ctaHref={`/${locale}/entdecken`}
          illustration={<SparkleIllustration />}
        />
      </div>
    </main>
  );
}
