// exists-check: net-new vs lib/verify-salon-client.ts, lib/customer-unsubscribe-token.ts,
// lib/gdpr/purge-stripe-customer.ts, app/api/stripe/booking-pay-intent/route.ts because none
// of those render a customer-facing fee-payment page; `npm run exists fee pay` returned 0
// matches. This route is the FE half of the parallel-built fee-pay-intent/fee-pay-confirm
// backend slice (lib/bookings/fee-pay-link.ts, lib/bookings/settle-fee-payment.ts).

/**
 * Fee pay page: app/[locale]/booking/[id]/fee (owner-approved 2026-09-06).
 *
 * A no-show or late-cancel fee that could not be charged off-session sends the
 * customer an email with a link to THIS page (?token=<capability token>). The token
 * is the only credential; there is no login. The backend contract (built in parallel,
 * not edited here):
 *
 *   POST /api/bookings/[id]/fee-pay-intent  { token }
 *     -> 200 { client_secret, amount_cents, currency, salon_name, service_name,
 *              starts_at, kind: "no_show" | "cancellation" }
 *     -> 403 { error: "TOKEN_INVALID" } | 404 | 409 { error: "FEE_ALREADY_SETTLED" }
 *        | 409 { error: "FEE_NOT_DUE" }
 *   POST /api/bookings/[id]/fee-pay-confirm { token, payment_intent_id }
 *     -> { status: "charged" }
 *
 * This file is a thin server wrapper (metadata + the dynamic `id` param); all the
 * fetching, Stripe and state logic lives in the client half, FeePayClient.tsx.
 */

import { getTranslations } from "next-intl/server";
import FeePayClient from "./FeePayClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feePay" });
  // Private capability link, never indexed.
  return { title: t("headingNoShow"), robots: { index: false, follow: false } };
}

export default async function FeePayPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  return <FeePayClient bookingId={id} />;
}
