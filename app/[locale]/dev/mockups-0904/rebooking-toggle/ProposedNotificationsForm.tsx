"use client";

// Grounded-in: app/[locale]/profile/settings/SettingsForm.tsx (the notifications branch this
// file byte-copies), app/[locale]/_components/primitives/Switch.tsx, app/api/profile/route.ts.
//
// exists-check: net-new vs components-legacy/ReviewForm.tsx (an unrelated star-rating review
// form), app/[locale]/notifications/NotificationsClient.tsx (the in-app notification feed list,
// not settings), and app/[locale]/dev/design-fixes/page.tsx (the pattern this file follows, a
// different route/pair). app/api/cron/rebooking-nudge/route.ts is the real sender this mockup's
// sub-label cadence number is read from, not duplicated. No component anywhere renders a settings
// switch row for this preference today; this file is that missing row, byte-copied off
// SettingsForm.tsx's own notifications branch per the comment below.
//
// Byte-copy exception, same pattern app/[locale]/dev/design-fixes/page.tsx already uses for its
// Pair B review card: the `section === "notifications"` branch inside SettingsForm.tsx (the row
// group + submit button) is inline JSX in a default-exported function, not its own exported
// component, so it cannot be imported and given one extra row without editing that file, which is
// out of this route's scope. This file is a manual byte-copy of that branch's exact classes and
// save flow (fetch PATCH /api/profile, same body shape, same toast/error handling), with ONE row
// added: same Switch anatomy as the three rows above it (LOCKED component,
// app/[locale]/_components/primitives/Switch.tsx).
//
// Wiring note: notification_preferences.rebooking_enabled already exists live (DB column) and
// PATCH /api/profile already reads + upserts it (lib/validations.ts, app/api/profile/route.ts,
// both pre-existing, unedited by this mockup; updateProfileSchema treats every field optional).
// So the added switch below is real, not decorative: it calls the same save endpoint the three
// existing switches use, sending the new field alongside them. The one missing piece was the UI
// row, which is what this mockup proposes.
//
// Copy note: the sub-label's "about 4 weeks" is not invented, it is the real cutoff read
// straight off app/api/cron/rebooking-nudge/route.ts ("cutoff.setDate(cutoff.getDate() - 28)").
//
// Depicts: three existing switch rows (email, SMS, deals) -> app/[locale]/profile/settings/SettingsForm.tsx (notifications branch, byte-copied here, not editable in place)
// Depicts: Switch primitive anatomy -> app/[locale]/_components/primitives/Switch.tsx (real, unmodified import)
// Depicts: fourth switch row + its PATCH wiring -> app/api/profile/route.ts + lib/validations.ts (rebooking_enabled already accepted server-side; the row is NET-NEW: no settings screen renders it today)
// Depicts: cadence copy "about 4 weeks" -> app/api/cron/rebooking-nudge/route.ts (28-day cutoff, real value, not invented)

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Switch } from "@/app/[locale]/_components/primitives/Switch";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

export function ProposedNotificationsForm({
  locale,
  initialEmail,
  initialSms,
  initialDeals,
  initialRebooking,
}: {
  locale: string;
  initialEmail: boolean;
  initialSms: boolean;
  initialDeals: boolean;
  initialRebooking: boolean;
}) {
  const t = useTranslations("profileHub");
  const tp = useTranslations("Profile");
  const router = useRouter();

  const [notificationEmail, setNotificationEmail] = React.useState(initialEmail);
  const [notificationSms, setNotificationSms] = React.useState(initialSms);
  const [dealsEnabled, setDealsEnabled] = React.useState(initialDeals);
  const [rebookingEnabled, setRebookingEnabled] = React.useState(initialRebooking);
  const [saving, setSaving] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_email: notificationEmail,
          notification_sms: notificationSms,
          deals_enabled: dealsEnabled,
          rebooking_enabled: rebookingEnabled,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[rebooking-toggle mockup] save failed:", err?.message ?? res.status);
        if (res.status === 401) {
          toast.error(t("sessionExpired"));
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        toast.error(t("saveError"));
        return;
      }
      toast.success(t("savedToast"));
      router.refresh();
    } catch (err) {
      console.error("[rebooking-toggle mockup] save exception:", err);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-7">
      <div className="rounded-card border border-s-border bg-white px-[18px]">
        <Switch
          checked={notificationEmail}
          onCheckedChange={setNotificationEmail}
          label={tp("emailNotifications")}
          subLabel={tp("notifBookingsDesc")}
        />
        <Switch checked={notificationSms} onCheckedChange={setNotificationSms} label="SMS" subLabel={tp("notifSmsDesc")} />
        <Switch
          checked={dealsEnabled}
          onCheckedChange={setDealsEnabled}
          label={tp("notifDeals")}
          subLabel={tp("notifDealsDesc")}
        />
        {/* The one new row. Same Switch primitive, same label/subLabel anatomy as the three rows
            above (16px normal label, 13px ink-2 subline, 44x24 track). Hardcoded English copy per
            the standing mockup-copy rule: this key does not exist yet in messages/en.json, since
            the row itself does not exist yet in production. */}
        <Switch
          checked={rebookingEnabled}
          onCheckedChange={setRebookingEnabled}
          label="Book again reminders"
          subLabel="About 4 weeks after your last visit"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {t("saveProfile")}
      </button>
    </form>
  );
}
