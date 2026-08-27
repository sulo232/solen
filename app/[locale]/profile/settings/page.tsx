// /profile/settings, the settings HUB (restructure 2026-07-21, owner-approved B2 mockup
// public/_mockups/sweep-settings-pinterest/index.html, "B2 pick" pane): identity block on
// top (avatar + name + "Profil ansehen"/"Profil bearbeiten" pills) + the full taxonomy
// grouped under Einstellungen / Prämien / Anmeldung / Support, with hairline dividers
// between the groups. Each row links to its own sub-page under
// app/[locale]/profile/settings/<slice>/page.tsx, which renders a slice of <SettingsForm>
// (via its `section` prop) or <BeautyProfileForm> standalone, or to an existing top-level
// route (Haarprofil, Formulare, Treue, Stempel, Einladen, help/agb/datenschutz). Server
// component: auth guard + fetch the editable profile (display_name/avatar_url for the
// identity block, locale for the "Sprache" row's right-value).
//
// mockup-ok: every visual value in this file (row padding/gap, icon size, label/sub-line/
// right-value/chevron sizes and colors, section-label styling, hairline dividers, red
// text-only footer actions, identity-block sunken card + avatar + pills) is copied 1:1 from
// the owner-approved sweep-settings-pinterest mockup's B2 `identityBlock()` / `srow2()` /
// `slabel()` / `hairline()` markup (public/_mockups/sweep-settings-pinterest/index.html).

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  User,
  Lock,
  Globe,
  Scissors,
  Bell,
  ClipboardList,
  CreditCard,
  SlidersHorizontal,
  Award,
  Stamp,
  UserPlus,
  ArrowUpRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
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
    .select("locale, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("[Settings] profile fetch error:", error.message);

  const allowed: SettingsLocale[] = ["de", "en", "fr", "it"];
  const profileLocale = (allowed as string[]).includes(profile?.locale ?? "")
    ? (profile!.locale as SettingsLocale)
    : ((allowed as string[]).includes(locale) ? (locale as SettingsLocale) : "de");
  const languageLabel = LOCALES.find((l) => l.value === profileLocale)?.label ?? "";

  // Same fallback convention as /profile's identity header: trimmed display_name, else the
  // email local-part, else the generic "Konto" translation, never a fabricated value.
  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarSrc = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const p = (path: string) => `/${locale}/profile/settings${path}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[560px] mx-auto pb-20">
        {/* Title now lives beside the global back tile (Header deepPageTitle). */}
        <IdentityBlock locale={locale} name={displayName} avatarSrc={avatarSrc} viewLabel={t("viewProfile")} editLabel={t("editProfile")} subtitle={t("identitySubtitle")} />

        <SectionLabel>{t("hubSectionSettings")}</SectionLabel>
        <Row href={`/${locale}/profile/edit`} icon={User} label={t("hubKonto")} />
        <Row href={p("/password")} icon={Lock} label={t("hubPassword")} />
        <Row href={p("/payment")} icon={CreditCard} label={t("hubPayment")} />
        <Row href={p("/beauty")} icon={SlidersHorizontal} label={t("hubRecommendations")} />
        <Row href={`/${locale}/profile/haarprofil`} icon={Scissors} label={t("haarprofil")} />
        <Row href={p("/notifications")} icon={Bell} label={t("notificationPrefs")} />
        <Row href={p("/language")} icon={Globe} label={t("hubLanguage")} value={languageLabel} />
        <Row href={`/${locale}/profile/intake-forms`} icon={ClipboardList} label={t("hubForms")} />

        <Hairline />

        <SectionLabel>{t("hubSectionRewards")}</SectionLabel>
        <Row href={`/${locale}/rewards`} icon={Award} label={t("hubLoyalty")} />
        <Row href={`/${locale}/profile/stamps`} icon={Stamp} label={t("tileStamps")} />
        <Row href={`/${locale}/profile/referral`} icon={UserPlus} label={t("hubInvite")} />

        <Hairline />

        <SectionLabel>{t("hubSectionLogin")}</SectionLabel>
        {/* Sign out, quiet text row (form POST so it works without client JS; same
            pattern as /profile's footer sign-out). */}
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="block w-full border-0 bg-white px-4 py-[14px] text-left font-body text-[15px] font-medium text-s-error transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
            {t("signOut")}
          </button>
        </form>
        <Link href={p("/delete")} className="block w-full bg-white px-4 py-[14px] text-[15px] font-medium text-s-error transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
          {t("hubDeleteAccount")}
        </Link>

        <Hairline />

        <SectionLabel>{t("hubSectionSupport")}</SectionLabel>
        <ExternalRow href={`/${locale}/help`} label={t("hubHelpCenter")} />
        <ExternalRow href={`/${locale}/agb`} label={t("hubTerms")} />
        <ExternalRow href={`/${locale}/datenschutz`} label={t("hubPrivacy")} />
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-1.5 pt-[18px] text-[12.5px] font-semibold text-s-ink-2">{children}</div>;
}

function Hairline() {
  return <div className="mx-4 my-2.5 h-px bg-s-border" aria-hidden />;
}

function Row({ href, icon: Icon, label, sub, value }: { href: string; icon: LucideIcon; label: string; sub?: string; value?: string }) {
  return (
    <Link href={href} className="flex items-center gap-[14px] bg-white px-4 py-[13px] transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
      <Icon size={22} strokeWidth={2.2} className="shrink-0 text-s-ink" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-s-ink">{label}</span>
        {sub ? <span className="mt-px block text-[12.5px] text-s-ink-2">{sub}</span> : null}
      </span>
      {value ? <span className="mr-0.5 text-[13.5px] text-s-ink-2">{value}</span> : null}
      <ChevronRight size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
    </Link>
  );
}

// mockup-ok: ExternalRow + IdentityBlock below are copied 1:1 from the owner-approved B2 pane
// in public/_mockups/sweep-settings-pinterest/index.html (identityBlock() / srow2() with EXT).

// External row (Hilfe-Center / AGB / Datenschutz): same row rhythm as `Row` but no left icon,
// and a trailing up-right arrow instead of a chevron, marking "leaves this list" (B2 mockup's
// `srow2(label, href, '', EXT)` treatment for the Support section).
function ExternalRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-[14px] bg-white px-4 py-[13px] transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
      <span className="min-w-0 flex-1 text-[15px] font-medium text-s-ink">{label}</span>
      <ArrowUpRight size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
    </Link>
  );
}

// Identity block: soft sunken card, avatar (image or initial), name, "Solen Konto" sub-line,
// two pill links (view / edit profile). B2 mockup's `identityBlock()` markup 1:1.
function IdentityBlock({ locale, name, avatarSrc, subtitle, viewLabel, editLabel }: { locale: string; name: string; avatarSrc: string | null; subtitle: string; viewLabel: string; editLabel: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <div className="mx-4 mb-2 mt-4 rounded-[24px] bg-s-bg-sunken p-5">
      <div className="flex items-center gap-[14px]">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-s-border">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied avatar URL; next/image remote config not guaranteed
            <img src={avatarSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[24px] font-semibold text-s-ink-2" aria-hidden>
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[20px] font-bold tracking-[-0.02em] text-s-ink">{name}</div>
          <div className="mt-px text-[13px] text-s-ink-2">{subtitle}</div>
        </div>
      </div>
      <div className="mt-[14px] flex gap-[10px]">
        <Link href={`/${locale}/profile`} className="flex-1 rounded-full border border-s-border bg-white py-[11px] text-center text-[14px] font-semibold text-s-ink transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
          {viewLabel}
        </Link>
        <Link href={`/${locale}/profile/edit`} className="flex-1 rounded-full border border-s-border bg-white py-[11px] text-center text-[14px] font-semibold text-s-ink transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide">
          {editLabel}
        </Link>
      </div>
    </div>
  );
}
