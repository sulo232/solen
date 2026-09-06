// Exists-check: `npm run exists weight-probe` -> 0 matches, net new. `npm run exists bookings
// list` -> BookingsListLift (reused unmodified, twice, below), the round-2 LIFT screen this
// probe borrows to test CONFLICT C4 (the weight clamp) rather than inventing new content.
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/bookings-list/_lift/BookingsListLift.tsx,
// composed twice via WeightProbeClient (this file's own client sibling, which holds the
// scoped-CSS restore and the live measurement; see its own file-top comment for the full
// mechanism and citations). No chrome of its own: HideInBooking.tsx strips the real
// Header/BottomNav/consent bar on every /dev path, and WeightProbeClient's own 125px bottom
// spacer stands in for the real BottomNav, same as BookingsListLift's own.
//
// This is a decision harness for CONFLICT C4 (_plans/R2_LOOK_SYSTEMS.md Part C, "Verdict:
// ASK"), not a customer screen: no floors/system header here, see WeightProbeClient.tsx's own
// comment for why.

import { BookingsListLift } from "../bookings-list/_lift/BookingsListLift";
import { WeightProbeClient } from "./_probe/WeightProbeClient";

export default async function WeightProbePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <WeightProbeClient
      copyDefault={<BookingsListLift locale={locale} />}
      copyLifted={<BookingsListLift locale={locale} />}
    />
  );
}
