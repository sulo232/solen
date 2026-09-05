// Exists-check: `npm run exists directions-0905` -> 1 REMOVED-list hit, the 2026-09-04
// single-treatment comparison batch, a format rejection, not this whole-screen exploration.
// Also hit: DirectionFrame (shared scaffold, reused unchanged, not forked). `npm run exists
// confirmation` -> the real route (app/[locale]/confirmation/page.tsx) + BookingConfirmation.tsx
// (671 lines, the real screen each direction below treats), no prior comparison entry for this
// surface existed before this file.
//
// Depicts: switcher shell -> _shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> ./_va/ConfirmationVariantA.tsx (this file only routes to
//   it; that file's own header + ConfirmationVariantAView.tsx carry the full Depicts
//   manifest, added by a sibling builder in this same pass).
// Depicts: direction b content -> ./_vb/ConfirmationDirectionB.tsx (this file only routes to
//   it; that file's own header + TicketCardB.tsx carry the full Depicts manifest). Its sibling
//   TicketCardB.tsx now exists on disk (it did not yet at the moment this file's previous
//   revision noted the missing-import placeholder), so the import below compiles clean
//   (`npx tsc --noEmit` shows zero errors on either file as of this edit).
// Depicts: direction c content -> ./_vc/ConfirmationDirectionC.tsx (this file only routes to it;
//   see that file's own header for its per-component Depicts manifest).
//
// Shared switcher for the three /dev/directions-0905/confirmation directions (?v=a|b|c). Each
// builder owns ONLY their own confirmation/_v<letter>/ folder; this file just reads ?v= and
// renders the matching branch. Data fetching for each direction lives INSIDE that direction's
// own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import ConfirmationVariantA from "./_va/ConfirmationVariantA";
import ConfirmationDirectionB from "./_vb/ConfirmationDirectionB";
import ConfirmationDirectionC from "./_vc/ConfirmationDirectionC";

const DIRECTIONS = [
  { value: "a", label: "Fresha copy" },
  { value: "b", label: "Ticket" },
  { value: "c", label: "What happens next" },
];

export default async function ConfirmationDirectionsPage({
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
    <DirectionFrame surface="confirmation" directions={DIRECTIONS} active={active}>
      {active === "a" ? (
        <ConfirmationVariantA locale={locale} />
      ) : active === "b" ? (
        <ConfirmationDirectionB locale={locale} />
      ) : active === "c" ? (
        <ConfirmationDirectionC locale={locale} />
      ) : (
        <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
          Direction {String(active).toUpperCase()} not built in this pass.
        </div>
      )}
    </DirectionFrame>
  );
}
