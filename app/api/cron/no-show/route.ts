export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { toRappen } from "@/lib/stripe";
import { calculateNoShowFee } from "@/lib/cancellation-policy";
import { chargeFee, FeeError } from "@/lib/bookings/charge-fee";
import { sendFeePaymentIssueEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";
import { buildFeePayUrl } from "@/lib/bookings/fee-pay-link";
import { withCronRun, ALL_DECLINED_SYMPTOM_FLOOR } from "@/lib/cron-run";
import { localizedField } from "@/lib/i18n/localized-field";

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("no-show", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find confirmed bookings ended over 24h ago. AND fee_charge_status IS NULL so a
  // re-run never re-targets an already-handled booking (idempotency, SP-AC §B3).
  // payment_intent_id is the LIVE column (the old `stripe_payment_intent_id` select
  // was a drift bug — that column does not exist — so the fee step never fired).
  const { data: overdues } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, payment_intent_id, paid_amount, price_paid, stripe_customer_id, stripe_payment_method_id, fee_charge_status, policy_snapshot, status, starts_at, guest_email, salons(name, no_show_fee_type, no_show_fee_value), services(name_de, name_en, name_fr, name_it), profiles(locale)")
    .eq("status", "confirmed")
    .lt("ends_at", twentyFourHoursAgo)
    .gt("ends_at", sevenDaysAgo)
    .is("fee_charge_status", null)
    .limit(50);

  let processed = 0;
  let charged = 0;
  // Customer-side: a genuine Stripe card decline on the no-show fee attempt. Data,
  // not a failure, never pushed to `errors` on its own (see the all-declined
  // symptom check at the end of the loop for the aggregate exception).
  let declined = 0;
  // System-side: the fee-charge machinery itself did not do its job (claim write
  // failure, a concurrent claim race, a non-decline Stripe error, or the FeeError /
  // exception paths below, which the guard on the call site makes anomalous rather
  // than routine, see the report for why they stay here instead of a 3rd bucket).
  let failed = 0;
  const errors: string[] = [];

  for (const booking of overdues ?? []) {
    // 1. Mark as no_show. Re-assert status=confirmed (the state the SELECT above
    // filtered on) so a booking legitimately cancelled/changed between the SELECT
    // and this UPDATE does not get force-flipped to no_show. Confirm the update
    // actually matched a row; if not, the booking moved under us, skip it.
    const { data: updatedRows } = await admin
      .from("bookings")
      .update({ status: "no_show", cancelled_at: now.toISOString() })
      .eq("id", booking.id)
      .eq("status", "confirmed")
      .select("id");

    if (!updatedRows || updatedRows.length === 0) {
      console.error(`[no-show] booking ${booking.id} no longer confirmed (changed between select and update), skipping`);
      continue;
    }

    // 2. No-show fee = OFF-SESSION charge of the saved card per policy (SP-AC §B3),
    //    replacing the old auth-and-hold `requires_capture`/capture model (D11 is
    //    full prepay + saved card, not a held PI). Policy read from policy_snapshot
    //    (frozen at booking — what the customer agreed to) with a fallback to the
    //    salon's current no-show policy for legacy bookings without a snapshot.
    const snapshot = (booking as any).policy_snapshot as
      | { no_show_fee_type?: string; no_show_fee_value?: number }
      | null;
    const salon = (booking as any).salons as
      | { no_show_fee_type?: string | null; no_show_fee_value?: number | null }
      | null;
    const feeType = snapshot?.no_show_fee_type ?? salon?.no_show_fee_type ?? null;
    const feeValueChf = snapshot?.no_show_fee_value ?? salon?.no_show_fee_value ?? 0;
    if (!snapshot) {
      console.error(`[no-show] booking ${booking.id} has no policy_snapshot — falling back to current salon policy`);
    }

    // Fee base in Rappen: paid_amount (Rappen) ?? toRappen(price_paid CHF).
    const baseCents = (booking.paid_amount as number | null) ?? toRappen(Number(booking.price_paid ?? 0));
    const { feeCents } = calculateNoShowFee(feeType, feeValueChf, baseCents);

    if (feeCents > 0 && booking.stripe_customer_id && booking.stripe_payment_method_id) {
      try {
        const result = await chargeFee({
          db: admin,
          source: "booking",
          id: booking.id,
          amountCents: feeCents,
          kind: "no_show",
          actor: "system",
          reason: "salon-marked no-show",
          request: req,
        });
        if (result.status === "charged") {
          charged++;
        } else if (result.status === "failed") {
          if (result.declined) {
            // A genuine card decline (see off-session-charge.ts's isStripeCardDecline):
            // the system worked, the fee attempt just came back no. Counted, never
            // pushed to `errors` on its own.
            declined++;
          } else {
            // A claim-write DB failure, a concurrent claim race, or a non-decline
            // Stripe error: the fee-charge machinery itself did not do its job.
            failed++;
            errors.push(`booking ${booking.id}: no-show fee charge failed${result.error ? `: ${result.error}` : ""}`);
          }
        }
        const salon = (booking as any).salons as { name?: string } | null;
        const services = (booking as any).services as Record<string, string | null> | null;
        const custLocale = (booking as any).profiles?.locale ?? "de";

        // Successful fees are audited and receipted only by the shared settlement
        // winner, including when Stripe delivers the webhook before confirm returns.
        if ((result.status === "failed" && result.declined) || result.status === "requires_action") {
          // 2026-09-06 (owner-approved variant B): the automated off-session attempt
          // came back declined or needs re-auth. NEVER on the charged branch above
          // (that gets the "fee charged" receipt instead) and NEVER on a system-side
          // failure (result.declined === false, e.g. a claim race or a non-decline
          // Stripe error) - that is our own machinery breaking, not a customer-payable
          // problem, so no pay-link email fires for it. Never blocks/rolls back the
          // charge attempt above: fire-and-forget, .catch only.
          console.log(`[no-show] sending payment-issue email for booking ${booking.id} (status=${result.status})`);
          const payUrl = buildFeePayUrl(custLocale, booking.id, "no_show");
          await sendFeePaymentIssueEmail({
            admin,
            userId: (booking.user_id as string | null) ?? null,
            guestEmail: (booking as any).guest_email ?? null,
            serviceName: localizedField(services, "name", custLocale) || "Service",
            salonName: salon?.name ?? "Salon",
            feeCents,
            date: (booking.starts_at as string | null) ?? new Date().toISOString(),
            payUrl,
            kind: "no_show",
            logPrefix: "no-show",
          }).catch((err) => console.error(`[no-show] payment-issue email failed for booking ${booking.id}:`, err));
        }
      } catch (e) {
        // NO_SAVED_CARD / INVALID_AMOUNT etc: log, continue the loop (never crash the cron),
        // but the fee still went uncollected, so it must count as a failure, not vanish.
        failed++;
        if (e instanceof FeeError) {
          console.error(`[no-show] chargeFee skipped for booking ${booking.id} (${e.code}):`, e.message);
          errors.push(`booking ${booking.id}: ${e.code}: ${e.message}`);
        } else {
          console.error(`[no-show] chargeFee threw for booking ${booking.id}:`, e);
          errors.push(`booking ${booking.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    // 3. Increment customer no_show_count. profiles.id is non-null but booking.user_id is
    // string | null (guest bookings); the cast preserves the exact runtime value (including
    // null, which still IS-NULL matches nothing on profiles.id), type-only narrowing cast.
    const { data: profile } = await admin.from("profiles").select("no_show_count").eq("id", booking.user_id as string).single();
    const newCount = (profile?.no_show_count ?? 0) + 1;
    await admin.from("profiles").update({ no_show_count: newCount }).eq("id", booking.user_id as string);

    // 4. Warning if > 3.
    if (newCount >= 3) {
      try {
        await logAuditEvent(req, "system", "customer_excessive_no_shows", "user", booking.user_id ?? undefined, { count: newCount });
      } catch (err) { console.error("[cron/no-show] audit log failed:", err); }
    }

    processed++;
  }

  // Symptom, not per-item: every fee attempt this run declined and NOTHING else
  // went wrong. That is not N unlucky customers, it is a broken Stripe/account
  // config wearing a customer-shaped costume (BACKEND_LAW.md #14). A run with any
  // real charge or any system-side failure already reddens on its own, this only
  // fires for the case that would otherwise stay silently green: a pure decline
  // sweep at or above ALL_DECLINED_SYMPTOM_FLOOR (see lib/cron-run.ts).
  if (charged === 0 && failed === 0 && declined >= ALL_DECLINED_SYMPTOM_FLOOR) {
    errors.push(
      `every one of ${declined} no-show fee attempts this run declined (0 charged, 0 system errors): likely a broken Stripe/account config, not ${declined} unrelated bad cards`,
    );
  }

  return { processed, charged, declined, failed, errors };
  });
}
