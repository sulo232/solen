/**
 * /rewards — Solen Status (GO-modeled loyalty rank). Spec: _design-system/LOYALTY_STRUCTURE.md.
 *
 * v1: tier computed on-read from completed bookings (no stored table / monthly cron yet).
 * The global Header provides the back tile + "Treueprogramm" title (Header deepPageTitle),
 * so this surface renders content only, no own back/header (single-global-back rule).
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import RewardsView from "./RewardsView";

export default async function RewardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/rewards`)}`);
  }

  const status = await getLoyaltyStatus(supabase, session.user.id);
  return <RewardsView status={status} locale={locale} />;
}
