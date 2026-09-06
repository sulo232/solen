// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/page.tsx (the round-1 switcher
// shell this file's own shape is modelled on: a thin server component that reads a query param
// and renders the matching direction's own folder, no chrome of its own).
//
// Exists-check: `npm run exists bookings-list` (run this session) returns the round-1 scaffold
// only; no round-2 `directions-0905-r2/bookings-list/page.tsx` existed before this file. Per the
// task brief: this is the SHARED switch for all three round-2 look systems (lift/rule/tray) on
// this screen. It does not exist yet, so it is created here as a thin ?s= switch with only the
// "tray" branch filled in (this build's own key); "lift" and "rule" fall through to the
// one-line "unknown system" message until their own builders add their branch with a minimal
// edit, per the brief's own instruction never to restructure this file wholesale.
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev path, so this file draws nothing beyond the active system's own content.

import { loadBookingsA } from "../../directions-0905/bookings-list/_va/loadBookingsA";
import { BookingsListTray } from "./_tray/BookingsListTray";
import { BookingsListLift } from "./_lift/BookingsListLift";
import BookingsListRule from "./_rule/BookingsListRule";

type SystemKey = "lift" | "rule" | "tray";

function isSystemKey(v: string | undefined): v is SystemKey {
  return v === "lift" || v === "rule" || v === "tray";
}

export default async function BookingsListR2Page({
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
    return <BookingsListLift locale={locale} />;
  }

  if (system === "rule") {
    const { upcoming, past } = await loadBookingsA();
    return <BookingsListRule locale={locale} upcoming={upcoming} past={past} />;
  }

  if (system === "tray") {
    const { upcoming, past } = await loadBookingsA();
    return <BookingsListTray locale={locale} upcoming={upcoming} past={past} />;
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      Unknown system{system ? ` "${system}"` : ""}. Try ?s=lift, ?s=rule, or ?s=tray.
    </div>
  );
}
