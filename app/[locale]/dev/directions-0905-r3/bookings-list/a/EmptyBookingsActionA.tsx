"use client";

// Repair pass (bookings-list, candidate A, fix round 1). Exists-check: `npm run exists
// directions-0905-r3` (run this session) returned 7 REMOVED hits, none of them an empty-bookings
// action button. `npm run exists search` (run this session) shows the real discovery route this
// button targets, app/[locale]/search/page.tsx.
//
// Depicts: the zero-bookings filling action -> app/[locale]/search/page.tsx (the real discovery
// route this button navigates to, not a fabricated destination).
//
// Grounded-in (by hand, not copied): candidate B's own equivalent file
// (bookings-list/b/EmptyBookingsAction.tsx, read in full, never imported: B's folder is
// off-limits to this candidate). Same fix, same destination, same filled-ink recipe; candidate A
// gets its own copy in its own folder rather than reaching into B's.
//
// Why this file exists: both of candidate A's <EmptyState> calls (next-appointment and
// other-bookings) shipped with no `action` prop, so neither rendered a CTA at all, the exact gap
// orchestrator decision (2) and the CLAUDE.md states-row lock ("filled ink CTA to the filling
// action") close. This closes it for candidate A specifically.
//
// system: none. The one commit button's ink recipe carries no per-candidate delta; PrimaryButton
// keeps its shipped ink fill unchanged under every system.

import { useRouter } from "next/navigation";
import { PrimaryButton } from "../../_kit";

export function EmptyBookingsActionA({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();
  return <PrimaryButton onClick={() => router.push(`/${locale}/search`)}>{label}</PrimaryButton>;
}
