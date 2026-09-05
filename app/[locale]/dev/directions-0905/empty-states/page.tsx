// Exists-check: `npm run exists empty` -> the inline empty-query sections on /inspo and
// /inspo/saved and /dev/map-browse, plus the shared EmptyState/EmptyServicesState/
// DiscoveryEmptyState/EmptyStateDiscovery/FlowEmpty components; no prior comparison entry
// for this surface (empty-states) existed before this file.
// Grounded-in: components-legacy/ui/EmptyState.tsx (the shared empty-state component each
// direction below will treat).
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> ./_va/EmptyStatesDirectionA.tsx (its own Depicts manifest).
// Depicts: direction b content -> NET-NEW: not built yet, the builder adds its own
//   empty-states/_vb/ file with its own Depicts manifest.
// Depicts: direction c content -> ./_vc/DirectionC.tsx (its own Depicts manifest).
//
// Shared switcher for the three /dev/directions-0905/empty-states directions (?v=a|b|c).
// Each builder owns ONLY their own empty-states/_v<letter>/ folder; this file just reads
// ?v= and renders the matching branch. Data fetching for each direction lives INSIDE that
// direction's own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import DirectionCServer from "./_vc/DirectionCServer";
import EmptyStatesDirectionA from "./_va/EmptyStatesDirectionA";
import { EmptyStatesDirectionB } from "./_vb/EmptyStatesDirectionB";

const DIRECTIONS = [
  { value: "a", label: "Fresha recipe, one unit" },
  { value: "b", label: "Airbnb per-feature, full strength" },
  { value: "c", label: "Fill the slot, with motion" },
];

export default async function EmptyStatesDirectionsPage({
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
    <DirectionFrame surface="empty-states" directions={DIRECTIONS} active={active}>
      {active === "a" ? (
        <EmptyStatesDirectionA locale={locale} />
      ) : active === "b" ? (
        <EmptyStatesDirectionB />
      ) : (
        <DirectionCServer locale={locale} />
      )}
    </DirectionFrame>
  );
}
