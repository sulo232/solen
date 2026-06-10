// /profile/settings — account settings (V3-D348, 2026-05-30).
// Server component: auth guard + fetch the editable profile, then hand off to the
// client <SettingsForm>. Backend already exists — this page wires to PATCH /api/profile
// (profile + notifications), Supabase auth.updateUser (email/password), and
// DELETE /api/profile/delete (soft-delete, 30-day window).

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import SettingsForm, { type SettingsLocale } from "./SettingsForm";
import BeautyProfileForm from "./BeautyProfileForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  return { title: t("settingsTitle"), robots: { index: false, follow: false } };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, phone_number, locale, notification_email, notification_sms, gender, hair_type, customer_preferences")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Settings] profile fetch error:", error.message);

  const allowed: SettingsLocale[] = ["de", "en", "fr", "it"];
  const profileLocale = (allowed as string[]).includes(profile?.locale ?? "")
    ? (profile!.locale as SettingsLocale)
    : ((allowed as string[]).includes(locale) ? (locale as SettingsLocale) : "de");

  // Beauty Profile — editable counterpart to /onboarding (shares ./beautyFields).
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
      <div className="max-w-md mx-auto px-5 pt-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-s-ink">{t("settingsTitle")}</h1>
        </div>

        <div className="space-y-7">
          <BeautyProfileForm initial={beautyInitial} customerPreferences={beautyPrefs} />

          <SettingsForm
            locale={locale}
            email={user.email ?? ""}
            initial={{
              display_name: profile?.display_name ?? "",
              avatar_url: profile?.avatar_url ?? "",
              bio: profile?.bio ?? "",
              phone_number: profile?.phone_number ?? "",
              locale: profileLocale,
              notification_email: profile?.notification_email ?? true,
              notification_sms: profile?.notification_sms ?? true,
            }}
          />
        </div>
      </div>
    </main>
  );
}
