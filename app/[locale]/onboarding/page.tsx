// /onboarding — customer personalization flow (V3-D348).
// Server: auth guard + load existing customer_preferences (so the flow merges
// rather than overwrites), then hand off to the client OnboardingFlow.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { isSafeRelativePath } from "@/lib/url-safety";
import OnboardingFlow from "./OnboardingFlow";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" }).catch(() => null);
  return { title: t ? t("title") : "Onboarding", robots: { index: false, follow: false } };
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/onboarding`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("customer_preferences")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Onboarding] prefs fetch error:", error.message);

  const prefs =
    profile?.customer_preferences && typeof profile.customer_preferences === "object"
      ? (profile.customer_preferences as Record<string, unknown>)
      : {};

  const raw = typeof sp?.redirect === "string" ? sp.redirect : "";
  const redirectTo = isSafeRelativePath(raw) ? raw : `/${locale}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-md px-6 pt-12 pb-16">
        <OnboardingFlow locale={locale} redirect={redirectTo} customerPreferences={prefs} />
      </div>
    </main>
  );
}
