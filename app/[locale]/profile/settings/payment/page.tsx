// /profile/settings/payment, the "Zahlungsmethoden" sub-page of the settings HUB (2026-07-21,
// owner-approved public/_mockups/sweep-payment-methods/index.html). Server component: auth guard
// only (no profile fields needed, the backend keys off the session directly), then renders the
// client <PaymentMethods> component. No body h1 (the global Header deepPageTitle carries the
// title, same pattern as the sibling settings sub-pages).
// mockup-ok: white background per the owner-approved sweep-payment-methods mockup
// (public/_mockups/sweep-payment-methods/index.html, `body{background:#fff}`), same white-first
// convention as every other settings sub-page (password/page.tsx, delete/page.tsx).
//
// exists-check: `npm run exists payment` ran this turn. The one hit relevant to a route
// (/api/stripe/payment-methods, GET lists saved cards, POST creates a SetupIntent) already
// exists (app/api/stripe/payment-methods/route.ts) and is reused as-is, not touched. The other
// hits are unrelated (dashboard payment-mode settings, walk-in-pay page sections, DB columns,
// the killed packages/walk-in-status graveyard entries). There is no account-level UI route
// surfacing the payment-methods API yet, so this route is net-new.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import PaymentMethods from "@/app/[locale]/_components/profile/PaymentMethods";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  return { title: t("payTitle"), robots: { index: false, follow: false } };
}

export default async function PaymentSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings/payment`)}`);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[560px] mx-auto px-5 pt-6 pb-20">
        <PaymentMethods />
      </div>
    </main>
  );
}
