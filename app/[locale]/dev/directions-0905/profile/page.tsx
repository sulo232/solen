// Exists-check: `npm run exists profile` -> the real /profile page, edit/favorites/looks/
// stamps sub-pages, BeautyProfileForm, salon profile page and various profile schemas; no
// prior comparison entry for this surface (profile) existed before this file.
// Grounded-in: app/[locale]/profile/page.tsx (the real profile surface each direction
// below will treat).
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> profile/_va/ProfileDirectionA.tsx +
//   profile/_va/getProfileIdentityA.ts (built this pass, see that file's own header).
// Depicts: direction b content -> profile/_vb/AccountHubAirbnb.tsx +
//   profile/_vb/loadProfileB.ts (built this pass, see that file's own header).
// Depicts: direction c content -> profile/_vc/AccountHubDirectionC.tsx +
//   profile/_vc/getProfileC.ts (built this pass, see that file's own header).
//
// Shared switcher for the three /dev/directions-0905/profile directions (?v=a|b|c). Each
// builder owns ONLY their own profile/_v<letter>/ folder; this file just reads ?v= and
// renders the matching branch. Data fetching for each direction lives INSIDE that
// direction's own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import AccountHubDirectionC from "./_vc/AccountHubDirectionC";
import { getProfileDataC } from "./_vc/getProfileC";
import ProfileDirectionA from "./_va/ProfileDirectionA";
import { getProfileIdentityA } from "./_va/getProfileIdentityA";
import AccountHubAirbnb from "./_vb/AccountHubAirbnb";
import { loadProfileB } from "./_vb/loadProfileB";

const DIRECTIONS = [
  { value: "a", label: "Fresha directory" },
  { value: "b", label: "Airbnb profile, full strength" },
  { value: "c", label: "Next-up hero, with motion" },
];

export default async function ProfileDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";

  const profileB = active === "b" ? await loadProfileB(locale) : null;

  return (
    <DirectionFrame surface="profile" directions={DIRECTIONS} active={active}>
      {active === "c" ? (
        <AccountHubDirectionC locale={locale} data={await getProfileDataC(locale)} />
      ) : active === "a" ? (
        <ProfileDirectionA locale={locale} identity={await getProfileIdentityA()} />
      ) : active === "b" ? (
        profileB ? (
          <AccountHubAirbnb locale={locale} {...profileB} />
        ) : (
          <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
            Seed customer data could not be loaded for direction B.
          </div>
        )
      ) : (
        <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
          Direction {String(active).toUpperCase()} not built in this pass.
        </div>
      )}
    </DirectionFrame>
  );
}
