/**
 * Route: /[locale]/bookings/[id]/upcharge — the CUSTOMER approve / decline screen for a
 * salon-requested upcharge on a completed booking (REFUND_APPEAL_PLAN §11 Lane A / §12
 * item 10, decisions D8 / D13). Customer half of the mockup
 * public/solen-refund-salon-upcharge.html (views 3/4/5). The salon-side request form is
 * PAUSED and lives elsewhere; this route is requester-only.
 *
 * Thin server wrapper, same shape as the refund-status route. It resolves only ONE fact the
 * client GET can't convey: is the viewer a logged-in customer or a token-guest (drives the
 * guest banner). No session → guest (the booking-bound httpOnly access cookie is how a guest
 * got here). The client component self-fetches the upcharge + booking facts and acts via the
 * PATCH on the same guest-safe surface.
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import UpchargeApproveView from "@/components-legacy/refund/UpchargeApproveView";

export const dynamic = "force-dynamic";

export default async function UpchargeApprovePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // Guest detection: a logged-in session means customer; otherwise the only way the dispute
  // GET/PATCH will authorize is the booking-bound guest cookie → treat as guest.
  let isGuest = true;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isGuest = !user;
  } catch (err) {
    // Cookie read can throw in some runtimes; default to guest (safer chrome, no PII).
    console.error("[upcharge-approve] session probe failed:", err);
    isGuest = true;
  }

  return (
    <UpchargeApproveView
      bookingId={id}
      isGuest={isGuest}
      backHref={isGuest ? `/${locale}` : `/${locale}/profile/bookings`}
      receiptHref={`/${locale}/bookings/${id}`}
      reportHref={`/${locale}/bookings/${id}/report`}
    />
  );
}
