// exists-check: `npm run exists directions-0905` -> 1 REMOVED-list hit, an earlier
// single-treatment comparison batch under a different route name, rejected by the owner as
// a FORMAT (one treatment tweak at a time); not re-proposed, this is the newly-requested
// three-genuinely-different-directions format. Also hit: DirectionFrame (shared scaffold,
// reused unchanged, not forked). `npm run exists booking` -> the real booking flow
// (components-legacy/booking/*, app/[locale]/salon/[slug]/booking/page.tsx), all real; no
// booking-steps comparison surface existed under this route before this file.
//
// Grounded-in: app/[locale]/salon/[slug]/booking/page.tsx (the real booking route every direction here mocks)
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is)
// Depicts: direction a content -> ./_va/BookingStepsDirectionA.tsx (this file only routes to it; see that file's own Depicts manifest)
// Depicts: direction b content -> ./_vb/BookingDirectionB.tsx (this file only routes to it; see that file's own Depicts manifest)
// Depicts: direction c content -> ./_vc/BookingStepsDirectionC.tsx (this file only routes to it)
//
// Shared switcher for the three /dev/directions-0905/booking-steps directions (?v=a|b|c).
// Each builder owns ONLY their own booking-steps/_v<letter>/ folder; this file just reads
// ?v= and renders the matching branch. Data fetching for each direction lives INSIDE that
// direction's own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import BookingStepsDirectionA from "./_va/BookingStepsDirectionA";
import BookingDirectionB from "./_vb/BookingDirectionB";
import BookingStepsDirectionC from "./_vc/BookingStepsDirectionC";

const DIRECTIONS = [
  { value: "a", label: "Slide stack" },
  { value: "b", label: "Growing summary bar" },
  { value: "c", label: "Sheet layering" },
];

export default async function BookingStepsDirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";

  return (
    <DirectionFrame
      surface="booking-steps"
      directions={DIRECTIONS}
      active={active}
      note={active === "a" ? "leaving step slides left 24% + dims, entering step slides in from the right" : undefined}
    >
      {active === "a" ? (
        <BookingStepsDirectionA />
      ) : active === "b" ? (
        <BookingDirectionB />
      ) : (
        <BookingStepsDirectionC />
      )}
    </DirectionFrame>
  );
}
