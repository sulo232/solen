// /profile/settings/delete, the "Konto löschen" sub-page of the settings HUB (restructure
// 2026-07-20). Renders the delete slice of <SettingsForm> (owner-killed type-to-confirm,
// replaced with warning copy + a plain Modal confirm dialog; the existing
// /api/profile/request-deletion call is unchanged). No body h1 (the global Header
// deepPageTitle carries the title).
// exists-check: `npm run exists "settings delete"` ran this turn, 0 matches; net-new route,
// reuses SettingsForm.tsx (section="delete"), not a duplicate.
// mockup-ok: white-first per the owner-approved sweep-settings-insta mockup
// (public/_mockups/sweep-settings-insta/index.html); every settings sub-page is white bg.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import SettingsForm, { type SettingsLocale } from "../SettingsForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  return { title: t("hubDeleteAccount"), robots: { index: false, follow: false } };
}

export default async function DeleteSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings/delete`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, phone_number, locale, notification_email, notification_sms")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Settings/delete] profile fetch error:", error.message);

  // Marketing consent (defect-2 fix): lives on notification_preferences, not profiles.
  // Fetched + resent here too (not rendered on this slice) so this save never resets it.
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("deals_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (prefsError) console.error("[Settings/delete] notification_preferences fetch error:", prefsError.message);

  const allowed: SettingsLocale[] = ["de", "en", "fr", "it"];
  const profileLocale = (allowed as string[]).includes(profile?.locale ?? "")
    ? (profile!.locale as SettingsLocale)
    : ((allowed as string[]).includes(locale) ? (locale as SettingsLocale) : "de");

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[560px] mx-auto px-5 pt-6 pb-20">
        <SettingsForm
          section="delete"
          locale={locale}
          email={user.email ?? ""}
          initial={{ // mockup-ok: SettingsForm's plain data prop (initial field values), not framer-motion
            display_name: profile?.display_name ?? "",
            avatar_url: profile?.avatar_url ?? "",
            bio: profile?.bio ?? "",
            phone_number: profile?.phone_number ?? "",
            locale: profileLocale,
            notification_email: profile?.notification_email ?? true,
            notification_sms: profile?.notification_sms ?? true,
            deals_enabled: prefs?.deals_enabled ?? false,
          }}
        />
      </div>
    </main>
  );
}
