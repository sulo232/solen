// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 34 matches: 7
// REMOVED entries (a grey tray-band look system, three home-feed layout options, a set of
// empty-state visual treatments, a search-results heading line, a per-card review count, a
// components-preview switcher block, and a service-row-button-matching harness), none of them a
// profile surface or a data loader; and profile/a as the only existing round-3 profile route (a
// sibling candidate's own empty in-progress folder, not touched here). `npm run exists profile`
// (this session) surfaces the real /profile route (AccountHub.tsx), round-1's three directions,
// and round-2's own LIFT-refined profile build (the base this file refines by hand, per the task
// brief: "start your view from it by hand, never cp"). Net-new: no round-3 candidate-B profile
// route existed before this file.
//
// Grounded-in: app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts (the shared loader
// this file imports unchanged) and round-2's own LIFT-refined profile server wrapper (the shape
// this file follows one for one: fetch real data via the shared loader, resolve the one banned
// greyscale photo, hand both to a client view). Also matched, for consistency across round-3's
// candidate-B server pages, to this round's own sibling confirmation-B server page's
// `params: Promise<{locale}>` shape.
//
// Depicts: identity, next-appointment, wallet, vouchers and stamps data -> app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts (getProfileDataC, IMPORTED not copied, unchanged since the round-2 builder added the real `status` field the kit StatusBadge needs)
// Depicts: the banned greyscale seed photo swapped for a real alternate of the same salon -> lib/supabase.ts createAdminSupabaseClient reading salons.gallery_urls (the same re-keyed-by-slug pattern round-2's own profile build already carries)
//
// No chrome of its own: HideInBooking.tsx strips the real Header/BottomNav/consent bar on every
// /dev path (`if (/\/dev(\/|$)/.test(pathname)) return null;`), so this file draws nothing beyond
// the active system's own content, same as every sibling round-3 screen. See ./ProfileBView.tsx's
// own header for the resulting header/nav count against the real /profile route.
//
// system: b. <KitProvider system="b"> is set inside ./ProfileBView.tsx, matching the sibling
// round-3 server-wrapper files, which all set KitProvider in the CLIENT view, not the server page.

import { getProfileDataC } from "../../../directions-0905/profile/_vc/getProfileC";
import { ProfileBView } from "./ProfileBView";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

// Thin slug-keyed variant of the alternate-cover-photo lookup, copied verbatim from round-2's
// own profile server wrapper (this exact screen family's own established pattern, not a new
// decision): this loader's public ProfileCNextAppointment shape only exposes `salonSlug`, not
// the salon's raw id.
async function getAlternateCoverPhotoBySlug(slug: string, fallback: string | null): Promise<string | null> {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("salons").select("gallery_urls").eq("slug", slug).maybeSingle();
  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  const alternate = gallery.find((url) => !url.includes(BANNED_GREYSCALE_PHOTO_ID));
  return alternate ?? fallback;
}

export default async function ProfileBPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getProfileDataC(locale);

  let coverUrl = data.nextAppointment?.salonCoverUrl ?? null;
  if (data.nextAppointment?.salonSlug && coverUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)) {
    coverUrl = await getAlternateCoverPhotoBySlug(data.nextAppointment.salonSlug, coverUrl);
  }

  return <ProfileBView locale={locale} data={data} coverUrl={coverUrl} />;
}
