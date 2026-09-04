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
  // Ownership: a session existing is not the same as OWNING this booking , a logged-in
  // customer viewing someone else's guest booking link is not its owner, so the receipt
  // link (which resolves via RLS for the owner only) must not be offered to them either.
  let isOwner = false;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isGuest = !user;
    if (user) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      isOwner = booking?.user_id === user.id;
    }
  } catch (err) {
    // Cookie read can throw in some runtimes; default to guest (safer chrome, no PII).
    console.error("[refund-status] session probe failed:", err);
    isGuest = true;
  }

  // "View receipt" needs a route that actually renders. There is no page.tsx at
  // /[locale]/bookings/[id] (only report/refund/upcharge subfolders exist), so that
  // href always 404'd. /confirmation?booking_id= shows the real payment lines
  // (Netto/MWST/Gesamt) and resolves via RLS for a logged-in customer. A guest has no
  // session, so /confirmation would 404 for them too, and there is no guest-accessible
  // receipt route to fall back to (the report form shows the same case facts but is a
  // report form, not a receipt, so it does not get a "receipt" label). The 2026-06-14
  // audit made the same call on app/[locale]/booking/lookup/page.tsx: when there's no
  // real page behind a label, drop the link instead of pointing it somewhere wrong.
  // RefundCaseView renders no "View receipt" link at all when this is undefined.
  const receiptHref = isGuest || !isOwner ? undefined : `/${locale}/confirmation?booking_id=${id}`;

  return (
    <RefundCaseView
      bookingId={id}
      isGuest={isGuest}
      backHref={isGuest ? `/${locale}` : `/${locale}/profile/bookings`}
      receiptHref={receiptHref}
      reportHref={`/${locale}/bookings/${id}/report`}
      bookAgainHref={`/${locale}`}
    />
  );
}
