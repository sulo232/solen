// /profile/settings, the settings HUB (restructure 2026-07-20, owner-approved mockup
// public/_mockups/sweep-settings-insta/index.html): an Instagram-style nav-row list replacing the old
// form-wall single page. Each row links to its own sub-page under
// app/[locale]/profile/settings/<slice>/page.tsx, which renders a slice of <SettingsForm>
// (via its `section` prop) or <BeautyProfileForm> standalone. Server component: auth guard
// + fetch the editable profile (still needed here to read the current language for the
// "Sprache" row's right-value).
//
// mockup-ok: every visual value in this file (white bg, no cards, row padding/gap, icon size,
// label/sub-line/right-value/chevron sizes and colors, section-label styling, hairline dividers,
// red text-only footer actions) is copied 1:1 from the owner-approved sweep-settings-insta mockup's
// injected `row()` / `sectionLabel()` / `textRow()` markup (public/_mockups/sweep-settings-insta/index.html).

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { User, Lock, Globe, Scissors, Bell, ChevronRight, type LucideIcon } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
// LOCALES/SettingsLocale come from ./locales.ts, not ./SettingsForm (2026-07-20 crash fix): this
// page is a Server Component, and SettingsForm.tsx is "use client", so importing a plain VALUE
// export (LOCALES) from it here crossed the RSC client boundary and returned a proxy instead of
// the real array, breaking `.find`. See locales.ts's header comment for the full root cause.
import { LOCALES, type SettingsLocale } from "./locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  return { title: t("settingsTitle"), robots: { index: false, follow: false } };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Settings] profile fetch error:", error.message);

  const allowed: SettingsLocale[] = ["de", "en", "fr", "it"];
  const profileLocale = (allowed as string[]).includes(profile?.locale ?? "")
    ? (profile!.locale as SettingsLocale)
    : ((allowed as string[]).includes(locale) ? (locale as SettingsLocale) : "de");
  const languageLabel = LOCALES.find((l) => l.value === profileLocale)?.label ?? "";

  const p = (path: string) => `/${locale}/profile/settings${path}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[560px] mx-auto pb-20">
        {/* Title now lives beside the global back tile (Header deepPageTitle). */}
        <SectionLabel>{t("hubSectionAccount")}</SectionLabel>
        <Row href={p("/personal")} icon={User} label={t("hubPersonal")} sub={t("hubPersonalSub")} />
        <Row href={p("/password")} icon={Lock} label={t("hubPassword")} />
        <Row href={p("/language")} icon={Globe} label={t("hubLanguage")} value={languageLabel} />

        <Hairline />

        <SectionLabel>{t("hubSectionForYou")}</SectionLabel>
        <Row href={p("/beauty")} icon={Scissors} label={t("secBeauty")} sub={t("hubBeautySub")} />
        <Row href={p("/notifications")} icon={Bell} label={t("tileNotifications")} />

        <Hairline />

        {/* Sign out, quiet text row (form POST so it works without client JS; same
            pattern as /profile's footer sign-out). */}
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="block w-full border-0 bg-white px-4 py-[14px] text-left font-body text-[15px] font-medium text-s-error">
            {t("signOut")}
          </button>
        </form>
        <Link href={p("/delete")} className="block w-full bg-white px-4 py-[14px] text-[15px] font-medium text-s-error">
          {t("hubDeleteAccount")}
        </Link>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-1.5 pt-[18px] text-[12.5px] font-semibold text-s-ink-3">{children}</div>;
}

function Hairline() {
  return <div className="mx-4 my-2.5 h-px bg-s-border" aria-hidden />;
}

function Row({ href, icon: Icon, label, sub, value }: { href: string; icon: LucideIcon; label: string; sub?: string; value?: string }) {
  return (
    <Link href={href} className="flex items-center gap-[14px] bg-white px-4 py-[13px]">
      <Icon size={22} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-s-ink">{label}</span>
        {sub ? <span className="mt-px block text-[12.5px] text-s-ink-3">{sub}</span> : null}
      </span>
      {value ? <span className="mr-0.5 text-[13.5px] text-s-ink-3">{value}</span> : null}
      <ChevronRight size={16} className="shrink-0 text-s-ink-3" aria-hidden />
    </Link>
  );
}
