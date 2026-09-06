// Grounded-in: app/[locale]/dev/directions-0905-r2/bookings-list/page.tsx (the round-2 switcher
// shell this file's own shape is modelled on: a thin server component that reads a query param
// and renders the matching direction's own folder, no chrome of its own).
//
// Exists-check: `npm run exists "directions-0905-r2 empty-states"` (run this session) -> 0
// matches, no round-2 empty-states/page.tsx existed before this file. Per the task brief: this
// is the SHARED switch for all three round-2 look systems (lift/rule/tray) on this screen. It
// does not exist yet, so it is created here as a thin ?s= switch with only the "rule" branch
// filled in (this build's own key); "lift" and "tray" fall through to the one-line "unknown
// system" message until their own builders add their branch with a minimal edit, per the
// brief's own instruction never to restructure this file wholesale.
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev path, so this file draws nothing beyond the active system's own content.

import { getDirectionCData } from "../../directions-0905/empty-states/_vc/loadDirectionC";
import EmptyStatesRule from "./_rule/EmptyStatesRule";
import EmptyStatesTray from "./_tray/EmptyStatesTray";
// EDIT 2026-09-06 (lift-system builder): added this import + its branch below only, per the
// orchestrator brief's own instruction for a shared file that already exists ("add only your
// key's branch with a minimal edit, never restructure it"). Nothing else in this file was
// touched; the "rule" and "tray" branches and this file's own header comment are untouched.
import { EmptyStatesLift } from "./_lift/EmptyStatesLift";

type SystemKey = "lift" | "rule" | "tray";

function isSystemKey(v: string | undefined): v is SystemKey {
  return v === "lift" || v === "rule" || v === "tray";
}

export default async function EmptyStatesR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { locale } = await params;
  const { s } = await searchParams;
  const system = isSystemKey(s) ? s : null;

  if (system === "rule") {
    // Only the Looks section needs real data (the folded-in photographic rail); Bookings,
    // Favorites and Vouchers render their empty unit with no live query, same as round-1's own
    // Direction B (a scripted demonstration of the empty treatment, not a live per-account
    // read). getDirectionCData is the real, existing round-1 loader (imported, not copied); its
    // other fields (rebookBookings, nearbySalons, referral) are unused here.
    const data = await getDirectionCData(locale);
    return <EmptyStatesRule locale={locale} looks={data.looks} />;
  }

  // EDIT 2026-09-06 (tray-system builder): added this branch + its import only, per the
  // orchestrator brief's own instruction for a shared file that already exists ("add only your
  // key's branch with a minimal edit, never restructure it"). Nothing else in this file was
  // touched.
  if (system === "tray") {
    return <EmptyStatesTray locale={locale} />;
  }

  // EDIT 2026-09-06 (lift-system builder): this screen's own branch, added the same minimal way
  // as the "tray" branch above.
  if (system === "lift") {
    return <EmptyStatesLift locale={locale} />;
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      Unknown system{system ? ` "${system}"` : ""}. Try ?s=lift, ?s=rule, or ?s=tray.
    </div>
  );
}
