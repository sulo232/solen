// Exists-check: `npm run exists profile` (run this turn) surfaces the real /profile route
// (AccountHub.tsx), the three round-1 directions (_va/_vb/_vc) and getProfileDataC itself; no
// round-2 `directions-0905-r2/profile` folder existed before this file. `npm run exists kit`
// (run earlier this session) returns no existing round-2 kit outside the shared one already
// built at ../../_kit.
//
// Depicts: identity/next-appointment/favorites/vouchers/stamps data -> app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts (getProfileDataC, IMPORTED not copied)
// Depicts: banned greyscale seed photo swapped for a real alternate of the same salon -> app/[locale]/dev/directions-0905-r2/confirmation/_rule/getAlternateCoverPhoto.ts (same pattern, re-keyed by slug below since this loader's public shape only exposes slug, not id)
//
// The only edit made to getProfileC.ts (a shared round-1 file) this session: its
// ProfileCNextAppointment type gained a `status` field, additive, already selected by that
// file's own NEXT_BOOKING_SELECT ("id, starts_at, ends_at, status, ...") but never previously
// exposed, since no consumer needed a real status before this screen's kit StatusBadge, which
// must colour-code the booking's ACTUAL confirmed/pending state rather than an invented default
// (taste rule 1: never render a status not wired to a live source). Existing consumers of that
// type (round-1's own AccountHubDirectionC.tsx) are unaffected: they never read the new field.
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/confirmation/_lift/ConfirmationLift.tsx (the
// server-wrapper shape this file follows one for one: fetch real data, resolve the one banned
// photo, hand both to a client view).

import { getProfileDataC } from "../../../directions-0905/profile/_vc/getProfileC";
import { ProfileLiftView } from "./ProfileLiftView";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

// Thin slug-keyed variant of getAlternateCoverPhoto.ts's own salonId-keyed lookup: this
// loader's public ProfileCNextAppointment shape only exposes `salonSlug`, not the salon's raw
// id, so the swap re-derives the row by slug instead of widening that shared type a second time
// for a cosmetic-only lookup. Reads the exact same `gallery_urls` column via the same admin
// client; not a fork of that file's decision, just its own lookup key.
async function getAlternateCoverPhotoBySlug(slug: string, fallback: string | null): Promise<string | null> {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase.from("salons").select("gallery_urls").eq("slug", slug).maybeSingle();
  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  const alternate = gallery.find((url) => !url.includes(BANNED_GREYSCALE_PHOTO_ID));
  return alternate ?? fallback;
}

export async function ProfileLift({ locale }: { locale: string }) {
  const data = await getProfileDataC(locale);

  let coverUrl = data.nextAppointment?.salonCoverUrl ?? null;
  if (data.nextAppointment?.salonSlug && coverUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)) {
    coverUrl = await getAlternateCoverPhotoBySlug(data.nextAppointment.salonSlug, coverUrl);
  }

  return <ProfileLiftView locale={locale} data={data} coverUrl={coverUrl} />;
}
