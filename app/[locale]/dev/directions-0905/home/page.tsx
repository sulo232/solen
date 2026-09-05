// Exists-check: `npm run exists directions-0905` -> 1 REMOVED-list hit, an earlier single-treatment
// comparison batch under a different route, rejected by the owner as a FORMAT (one tweak at a
// time); not re-proposed, this is the newly-requested three-genuinely-different-directions format.
// Also hit: DirectionFrame (shared scaffold, reused unchanged, not forked).
// `npm run exists home` -> the real homepage (app/[locale]/page.tsx) and its ~40 section
// components, all real; no home-surface entry under this comparison route existed before this file.
//
// Depicts: switcher shell -> _shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> ./_va/HomeVariantA.tsx (this file only routes to it; see that
//   file's own header for its per-component Depicts manifest).
// Depicts: direction b content -> ./_vb/HomeDirectionB.tsx (this file only routes to it).
// Depicts: direction c content -> ./_vc/HomeDirectionC.tsx (this file only routes to it; see that
//   file's own header for its per-component Depicts manifest).
//
// Shared switcher for the three /dev/directions-0905/home directions (?v=a|b|c). Each builder
// owns ONLY their own home/_v<letter>/ folder; this file just reads ?v= and renders the matching
// branch. Data fetching for each direction lives INSIDE that direction's own component so no
// builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import HomeVariantA from "./_va/HomeVariantA";
import HomeDirectionB from "./_vb/HomeDirectionB";
import HomeDirectionC from "./_vc/HomeDirectionC";

const DIRECTIONS = [
  { value: "a", label: "Fresha order" },
  { value: "b", label: "Airbnb rails" },
  { value: "c", label: "One column feed" },
];

export default async function HomeDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";

  return (
    <DirectionFrame surface="home" directions={DIRECTIONS} active={active}>
      {active === "a" ? (
        <HomeVariantA locale={locale} />
      ) : active === "b" ? (
        <HomeDirectionB locale={locale} />
      ) : (
        <HomeDirectionC locale={locale} />
      )}
    </DirectionFrame>
  );
}
