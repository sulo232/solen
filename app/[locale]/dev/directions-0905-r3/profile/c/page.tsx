// Exists-check: `npm run exists directions-0905-r3` (this session) returned 7 owner-rejected
// round-2 hits (none a profile route or a data/kit module) plus 12 round-3 routes / 14 components
// for other screens and candidates (bookings-list, confirmation, payment-step, search-results,
// profile/a), none a profile/c screen. No round-3 profile/c route existed before this build.
//
// Round 3, Candidate C (the Airbnb port), Profile hub. Thin server component: load the real
// profile data (identity, next appointment, wallet/vouchers/stamps counts, the next appointment's
// real status), hand it to ProfileC. No chrome of its own: the shared /dev layout
// (HideInBooking.tsx) strips the real Header/BottomNav on every /dev path, matching every other
// round-3 mockup route, so this file draws nothing beyond ProfileC's own content.
//
// Grounded-in: app/[locale]/dev/directions-0905-r3/profile/c/data.ts (this folder's own
// re-export bridge; see that file's header for the exact real loader path and why the import
// lives in a plain .ts file rather than here).
//
// Depicts: identity, next appointment, wallet/vouchers/stamps counts, next-appointment status -> app/[locale]/dev/directions-0905-r3/profile/c/data.ts (re-export barrel; see that file's header for the real loader path)
// Depicts: the banned greyscale seed photo swapped for a real alternate of the same salon (repair
// pass, design-critic 2026-09-06: floor 1(a) measured 0.0% photo area for a salon that has a real
// one) -> lib/supabase.ts createAdminSupabaseClient reading salons.gallery_urls, the identical
// slug-keyed lookup app/[locale]/dev/directions-0905-r3/profile/b/page.tsx already ships for this
// exact seed record, not a new decision.

import { getRuleProfileData } from "./data";
import ProfileC from "./ProfileC";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

// Verbatim pattern from profile/b/page.tsx's own getAlternateCoverPhotoBySlug: this screen
// family's established fix for "the seeded cover is the one banned greyscale photo", not a new
// decision. RuleProfileData extends ProfileCData, which already exposes `salonSlug`.
async function getAlternateCoverPhotoBySlug(slug: string, fallback: string | null): Promise<string | null> {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("salons").select("gallery_urls").eq("slug", slug).maybeSingle();
  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  const alternate = gallery.find((url) => !url.includes(BANNED_GREYSCALE_PHOTO_ID));
  return alternate ?? fallback;
}

export default async function ProfileR3CPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getRuleProfileData(locale);

  let coverUrl = data.nextAppointment?.salonCoverUrl ?? null;
  if (data.nextAppointment?.salonSlug && coverUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)) {
    coverUrl = await getAlternateCoverPhotoBySlug(data.nextAppointment.salonSlug, coverUrl);
  }

  return <ProfileC locale={locale} data={data} coverUrl={coverUrl} />;
}
