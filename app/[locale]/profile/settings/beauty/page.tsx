// /profile/settings/beauty, the "Beauty-Profil" sub-page of the settings HUB (restructure
// 2026-07-20). Renders the existing <BeautyProfileForm> standalone (editable counterpart to
// /onboarding, shares ./beautyFields). No body h1 (the global Header deepPageTitle carries
// the title).
// exists-check: `npm run exists "settings beauty"` ran this turn, hit BeautyProfileForm.tsx
// (app/[locale]/profile/settings/BeautyProfileForm.tsx), reused unchanged below, not rebuilt.
// mockup-ok: white-first per the owner-approved sweep-settings-insta mockup
// (public/_mockups/sweep-settings-insta/index.html); every settings sub-page is white bg.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import BeautyProfileForm from "../BeautyProfileForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  return { title: t("secBeauty"), robots: { index: false, follow: false } };
}

export default async function BeautySettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings/beauty`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("gender, hair_type, customer_preferences")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Settings/beauty] profile fetch error:", error.message);

  const beautyPrefs =
    profile?.customer_preferences && typeof profile.customer_preferences === "object"
      ? (profile.customer_preferences as Record<string, unknown>)
      : {};
  const asStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const beautyInitial = {
    gender: profile?.gender ?? "",
    hair_type: profile?.hair_type ?? "",
    skinType: typeof beautyPrefs.skinType === "string" ? beautyPrefs.skinType : "",
    categories: asStrArr(beautyPrefs.categories),
    interests: asStrArr(beautyPrefs.interests),
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[560px] mx-auto px-5 pt-6 pb-20">
        <BeautyProfileForm
          initial={beautyInitial} // mockup-ok: plain data prop (initial field values), not framer-motion
          customerPreferences={beautyPrefs}
        />
      </div>
    </main>
  );
}
