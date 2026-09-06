// Grounded-in: app/[locale]/dev/directions-0905-r2/bookings-list/page.tsx (the round-2 switcher
// shape this file's own shape is modelled on: a thin server component that reads a query param
// and renders the matching direction's own folder, no chrome of its own).
//
// Exists-check: `npm run exists profile` (this session) surfaces the round-1 profile scaffold
// (app/[locale]/dev/directions-0905/profile/page.tsx) only; no round-2
// `directions-0905-r2/profile/page.tsx` existed before this pass. Per the task brief: this is
// the SHARED switch for all three round-2 look systems (lift/rule/tray) on this screen. Three
// builders landed on this same shared file this session, each adding only their own branch
// with a minimal edit, per the brief's own instruction never to restructure this switch
// wholesale: "lift" and "tray" were already here when the "rule" branch below was added.
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev path, so this file draws nothing beyond the active system's own content.

import { ProfileLift } from "./_lift/ProfileLift";
import { ProfileTray } from "./_tray/ProfileTray";
import { getProfileDataC } from "../../directions-0905/profile/_vc/getProfileC";
import ProfileRule from "./_rule/ProfileRule";
import { getRuleProfileData } from "./_rule/getRuleProfileData";

type SystemKey = "lift" | "rule" | "tray";

function isSystemKey(v: string | undefined): v is SystemKey {
  return v === "lift" || v === "rule" || v === "tray";
}

export default async function ProfileR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { locale } = await params;
  const { s } = await searchParams;
  const system = isSystemKey(s) ? s : null;

  if (system === "lift") {
    return <ProfileLift locale={locale} />;
  }

  // Added by the "tray" builder, minimal edit per the brief: never restructure this switch,
  // only add the missing branch. getProfileDataC is IMPORTED, not copied (round-1's own loader,
  // the same one "lift" reads through its own ProfileLift wrapper).
  if (system === "tray") {
    const data = await getProfileDataC(locale);
    return <ProfileTray locale={locale} data={data} />;
  }

  // Added by the "rule" builder, minimal edit per the brief: never restructure this switch,
  // only add the missing branch. getRuleProfileData wraps getProfileDataC (imported, not
  // copied) plus one supplemental status-only query; see that file's own header.
  if (system === "rule") {
    const data = await getRuleProfileData(locale);
    return <ProfileRule locale={locale} data={data} />;
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      Unknown system{system ? ` "${system}"` : ""}. Try ?s=lift, ?s=rule, or ?s=tray.
    </div>
  );
}
