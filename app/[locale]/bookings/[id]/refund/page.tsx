/**
 * Route: /[locale]/bookings/[id]/refund — refund/appeal STATUS + TIMELINE (with the
 * escalate-to-Solen affordance folded in for a salon-rejected case). REFUND_APPEAL_PLAN §12.
 *
 * Thin server wrapper. It resolves only ONE fact server-side that the GET can't convey: is
 * the viewer a logged-in customer or a token-guest (drives the guest banner + "resend
 * access link"). No session → guest (the guest httpOnly cookie is how they got here). The
 * client component fetches the case + events + booking facts itself via GET .../report.
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import RefundCaseView from "@/components-legacy/refund/RefundCaseView";

export const dynamic = "force-dynamic";

export default async function RefundStatusPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // Guest detection: a logged-in session means customer; otherwise the only way the case
  // GET will authorize is the booking-bound guest cookie → treat as guest.
  let isGuest = true;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isGuest = !user;
  } catch (err) {
    // Cookie read can throw in some runtimes; default to guest (safer chrome, no PII).
    console.error("[refund-status] session probe failed:", err);
    isGuest = true;
  }

  return (
    <RefundCaseView
      bookingId={id}
      isGuest={isGuest}
      backHref={isGuest ? `/${locale}` : `/${locale}/profile/bookings`}
      receiptHref={`/${locale}/bookings/${id}`}
      reportHref={`/${locale}/bookings/${id}/report`}
      bookAgainHref={`/${locale}`}
    />
  );
}
