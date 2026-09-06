// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass (see `_design-system/REMOVED.md`), none of them a profile
// route or a data/kit module, plus 8 round-3 routes and 6 components for other screens (bookings
// list, confirmation, payment step, search results), none a profile screen. No round-3 profile
// route existed before this build. `npm run exists profile` (run this session) surfaces the real
// loader re-exported by ./data.ts and the prior round's own profile RULE view this candidate
// refines, ProfileRule.tsx (read in full, not imported: this build is a fresh view for Candidate
// A, never that file edited in place).
//
// Round 3, Candidate A, Profile hub. Thin server component: load the real profile data
// (identity, next appointment, wallet/vouchers/stamps counts, the next appointment's real
// status), hand it to ProfileA. No chrome of its own: the shared /dev layout strips the real
// Header/BottomNav on every /dev path, matching every other round-3 mockup route.
//
// Grounded-in: app/[locale]/dev/directions-0905-r3/profile/a/data.ts (this folder's own
// re-export bridge; see that file's header for the exact real loader path and why the import
// lives in a plain .ts file rather than here).
//
// Depicts: identity, next appointment, wallet/vouchers/stamps counts, next-appointment status -> app/[locale]/dev/directions-0905-r3/profile/a/data.ts (re-export barrel; see that file's header for the real loader path)
// Depicts: the banned greyscale seed photo swapped for a real alternate of the same salon -> lib/supabase.ts createAdminSupabaseClient reading salons.gallery_urls, the identical fix candidate B's own profile/b/page.tsx already applies for this same shared loader's same banned photo id (repair pass, 2026-09-06: the critic measured 0.0% photo area here because this file never resolved the alternate; ProfileA.tsx's own hasRealPhoto check was already correct and needed no change).

import { getRuleProfileData } from "./data";
import ProfileA from "./ProfileA";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

// Thin slug-keyed alternate-cover-photo lookup, copied verbatim from candidate B's own server
// wrapper (profile/b/page.tsx) for this identical shared-loader defect; RuleProfileData only
// exposes salonSlug, not the salon's raw id, so the lookup is by slug.
async function getAlternateCoverPhotoBySlug(slug: string, fallback: string | null): Promise<string | null> {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("salons").select("gallery_urls").eq("slug", slug).maybeSingle();
  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  const alternate = gallery.find((url) => !url.includes(BANNED_GREYSCALE_PHOTO_ID));
  return alternate ?? fallback;
}

export default async function ProfileR3APage({
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

  const resolvedData = data.nextAppointment
    ? { ...data, nextAppointment: { ...data.nextAppointment, salonCoverUrl: coverUrl } }
    : data;

  return <ProfileA locale={locale} data={resolvedData} />;
}
