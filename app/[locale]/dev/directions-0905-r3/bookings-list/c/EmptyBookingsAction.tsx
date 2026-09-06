"use client";

// REPAIR (round 1 punch list): candidate C's page.tsx called <EmptyState> with no `action` prop,
// so EmptyState.tsx's own `{action && <div className="mt-5">{action}</div>}` render site never
// fired -- the locked design-contract "states" row requires the empty state to carry "a filled
// ink CTA to the filling action", never nothing. This file closes that gap for candidate C. It is
// a new file inside this candidate's own folder, not an edit to the shared kit or to candidate B's
// identical fix (`../b/EmptyBookingsAction.tsx`, read for the pattern, not imported across the
// candidate boundary the round's brief draws).
//
// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them an empty-bookings action button. `npm run exists search` (run this session) shows
// the real discovery route this button targets, app/[locale]/search/page.tsx.
//
// Depicts: the zero-bookings filling action -> app/[locale]/search/page.tsx (the real discovery
// route this button navigates to; not a fabricated destination).
//
// Grounded-in: app/[locale]/search/page.tsx (the real destination this button navigates to). The
// CLAUDE.md design-contract "states" row lock: empty = EmptyState "with ... a filled ink CTA to
// the filling action", never an outline button or no action at all. Orchestrator decision (2) for
// this round: "filled ink on every state, per the CLAUDE.md states-row lock."
//
// system: none. The one commit button's ink recipe carries no per-candidate delta; candidate C
// keeps PrimaryButton's shipped ink fill unchanged, same as A and B.

import { useRouter } from "next/navigation";
import { PrimaryButton } from "../../_kit";

export function EmptyBookingsAction({ locale }: { locale: string }) {
  const router = useRouter();
  return (
    <PrimaryButton onClick={() => router.push(`/${locale}/search`)}>
      Find a salon
    </PrimaryButton>
  );
}
