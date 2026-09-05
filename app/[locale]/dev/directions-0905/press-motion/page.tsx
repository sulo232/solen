// Exists-check: `npm run exists directions-0905` -> 1 REMOVED-list hit (the earlier single-
// treatment comparison batch, rejected by the owner as a FORMAT); not re-proposed, this is the
// newly-requested three-genuinely-different-directions format. Also hit: DirectionFrame (shared
// scaffold, reused unchanged, not forked). `npm run exists press-motion` -> 0, net-new surface.
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> ./_va/PressMotionVariantA.tsx (a sibling builder's own build).
// Depicts: direction b content -> ./_vb/PressMotionDirectionB.tsx (this builder's own build, see
//   that file's own Depicts manifest for its five real controls).
// Depicts: direction c content -> ./_vc/PressMotionDirectionC.tsx (a sibling builder's own build).
//
// Shared switcher for the three /dev/directions-0905/press-motion directions (?v=a|b|c). Each
// builder owns ONLY their own press-motion/_v<letter>/ folder; this file just reads ?v= and
// renders the matching branch. Grounded-in the same shared-switcher shape as
// ../home/page.tsx (?v=a|b|c gate pattern, DirectionFrame usage).
//
// This file is SHARED across three concurrent builders (per the brief) and was overwritten
// whole-file more than once during this same fan-out pass, each time dropping one or two
// sibling branches. This edit re-merges all three branches (a, b, c) rather than re-adding
// only the one this builder owns, so the next overwrite has a complete file to start from.
// Salon data is fetched once and passed to whichever of b/c needs it; direction a takes only
// `locale`, per its own component's signature.
import { DirectionFrame } from "../_shared/DirectionFrame";
import { getSeedSalon } from "../../_shared/seedSalon";
import PressMotionVariantA from "./_va/PressMotionVariantA";
import PressMotionDirectionB from "./_vb/PressMotionDirectionB";
import { PressMotionDirectionC } from "./_vc/PressMotionDirectionC";

const DIRECTIONS = [
  { value: "a", label: "Snap" },
  { value: "b", label: "Spring" },
  { value: "c", label: "Depth" },
];

export default async function PressMotionDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";

  const salon = active === "b" || active === "c" ? await getSeedSalon(locale) : null;

  return (
    <DirectionFrame
      surface="press-motion"
      directions={DIRECTIONS}
      active={active}
      note={active === "b" ? "spring physics on every press, pill and sheet" : undefined}
    >
      {active === "a" ? (
        <PressMotionVariantA locale={locale} />
      ) : active === "b" ? (
        <PressMotionDirectionB salon={salon} />
      ) : salon ? (
        <PressMotionDirectionC salon={salon} />
      ) : (
        <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
          No live salon with a photo and a service was found.
        </div>
      )}
    </DirectionFrame>
  );
}
