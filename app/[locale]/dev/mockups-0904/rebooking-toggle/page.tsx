// Grounded-in: app/[locale]/profile/settings/notifications/page.tsx (the real notifications
// settings route this mockup copies auth + data-loading from), app/[locale]/profile/settings/
// SettingsForm.tsx (the real form, rendered unmodified as "Current"), app/[locale]/_components/
// primitives/Switch.tsx.
//
// exists-check: `npm run exists rebooking-toggle` ran this turn, 0 matches (net-new mockup
// route). `npm run exists rebooking_enabled` ran this turn, 1 hit: DB column
// notification_preferences.rebooking_enabled ALREADY EXISTS live, and app/api/profile/route.ts
// (PATCH) already reads + upserts it (unedited by this mockup). No REMOVED.md hit for a settings
// switch row of this kind (the closest graveyard entry is an unrelated dead SMS/email
// edge-function source dir from the 2026-07-10 sweep, a different layer: a cron sender, not a
// settings UI row, and this mockup does not touch or resurrect that code). The one new thing:
// the missing settings-form ROW that turns the already-wired preference on/off, which today has
// no UI anywhere in the app.
//
// Depicts: real notifications settings form (email/SMS/deals rows) -> app/[locale]/profile/settings/SettingsForm.tsx (real, unmodified import, section="notifications")
// Depicts: real auth + data load -> app/[locale]/profile/settings/notifications/page.tsx (same getUser + profiles + notification_preferences query, copied here since this route is a sibling comparison page, not that page itself)
// Depicts: fourth switch row -> ./ProposedNotificationsForm.tsx (byte-copy of the real form branch, NET-NEW row: the backing DB column + PATCH handler already exist, only the row is new)
//
// Mockup-scope: section

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import SettingsForm, { type SettingsLocale } from "@/app/[locale]/profile/settings/SettingsForm";
import { ProposedNotificationsForm } from "./ProposedNotificationsForm";

export default async function RebookingToggleMockup({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Same auth + data load as app/[locale]/profile/settings/notifications/page.tsx, so both the
  // "Current" (real component) and "Proposed" (byte-copy) halves render one real user's real
  // saved values, not placeholder data.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/dev/mockups-0904/rebooking-toggle`)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, phone_number, locale, notification_email, notification_sms")
    .eq("id", user!.id)
    .maybeSingle();
  if (error) console.error("[dev/rebooking-toggle] profile fetch error:", error.message);

  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("deals_enabled, rebooking_enabled")
    .eq("user_id", user!.id)
    .maybeSingle();
  if (prefsError) console.error("[dev/rebooking-toggle] notification_preferences fetch error:", prefsError.message);

  const allowed: SettingsLocale[] = ["de", "en", "fr", "it"];
  const profileLocale = (allowed as string[]).includes(profile?.locale ?? "")
    ? (profile!.locale as SettingsLocale)
    : (allowed as string[]).includes(locale)
      ? (locale as SettingsLocale)
      : "de";

  const initial = {
    display_name: profile?.display_name ?? "",
    avatar_url: profile?.avatar_url ?? "",
    bio: profile?.bio ?? "",
    phone_number: profile?.phone_number ?? "",
    locale: profileLocale,
    notification_email: profile?.notification_email ?? true,
    notification_sms: profile?.notification_sms ?? true,
    deals_enabled: prefs?.deals_enabled ?? false,
  };
  // rebooking_enabled has no column in the real page's SELECT today (that page never fetches it,
  // since it renders no row for it); read here as a real value with the same default direction
  // as the API's own comment ("only an explicit false is ever written", i.e. default true).
  const initialRebooking = prefs?.rebooking_enabled ?? true;

  return (
    <div className="mx-auto max-w-[402px] px-4 pt-6 pb-16">
      <p className="text-[13px] font-semibold text-s-ink">Current</p>
      <p className="mb-3 text-[12px] text-s-ink-2">
        The real notifications settings form, unmodified: email, SMS, deals.
      </p>
      <SettingsForm section="notifications" locale={locale} email={user!.email ?? ""} initial={initial} />

      <p className="mt-10 text-[13px] font-semibold text-s-ink">Proposed</p>
      <p className="mb-3 text-[12px] text-s-ink-2">
        Same form, one more row added underneath deals, same Switch anatomy.
      </p>
      <ProposedNotificationsForm
        locale={locale}
        initialEmail={initial.notification_email}
        initialSms={initial.notification_sms}
        initialDeals={initial.deals_enabled}
        initialRebooking={initialRebooking}
      />
    </div>
  );
}
