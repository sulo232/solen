"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them an empty-bookings action button. `npm run exists search` (run this session) shows
// the real discovery route this button targets, app/[locale]/search/page.tsx.
//
// Depicts: the zero-bookings filling action -> app/[locale]/search/page.tsx (the real discovery
// route this button navigates to; not a fabricated destination)
//
// Grounded-in: app/[locale]/search/page.tsx (the real destination this button navigates to).
// The CLAUDE.md design-contract "states" row lock: empty = EmptyState "with ... a filled ink CTA
// to the filling action", never an outline button. The previous round's view for this screen
// rendered EmptyState with NO action at all, which is the gap this file closes, per this build's
// own orchestrator decision (2): "filled ink on every state ... the outline default that shipped
// is a defect."
//
// system: none. The one commit button's ink recipe carries no per-candidate delta; every
// candidate keeps PrimaryButton's shipped ink fill unchanged.

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
