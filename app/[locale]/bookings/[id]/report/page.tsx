/**
 * Route: /[locale]/bookings/[id]/report — the SINGLE "report a problem / request a refund"
 * entry (master plan §10b.2). Thin server wrapper; the client component self-fetches the
 * booking facts + any existing case via the one guest-safe surface (GET .../report) so this
 * route works identically for a logged-in customer and a token-guest. The guest-lookup
 * "opened" screen links straight here.
 */

import ReportRefundEntry from "@/components-legacy/refund/ReportRefundEntry";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return (
    <div className="min-h-[100dvh] bg-white">
      <ReportRefundEntry bookingId={id} caseHref={`/${locale}/bookings/${id}/refund`} />
    </div>
  );
}
