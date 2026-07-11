export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { toRappen } from "@/lib/stripe";
import { calculateNoShowFee } from "@/lib/cancellation-policy";
import { chargeFee, FeeError } from "@/lib/bookings/charge-fee";
import { notifyNoShowFee } from "@/lib/bookings/notify-no-show-fee";
import { logAuditEvent } from "@/lib/audit";
import { withCronRun } from "@/lib/cron-run";

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
    .select("id, user_id, salon_id, payment_intent_id, paid_amount, price_paid, stripe_customer_id, stripe_payment_method_id, fee_charge_status, policy_snapshot, status, starts_at, guest_email, salons(name, no_show_fee_type, no_show_fee_value), services(name_de, name_en)")
    .eq("status", "confirmed")
    .lt("ends_at", twentyFourHoursAgo)
    .gt("ends_at", sevenDaysAgo)
    .is("fee_charge_status", null)
    .limit(50);

  let processed = 0;
  let charged = 0;

  for (const booking of overdues ?? []) {
    // 1. Mark as no_show.
    await admin
      .from("bookings")
      .update({ status: "no_show", cancelled_at: now.toISOString() })
      .eq("id", booking.id);

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
        });
        if (result.status === "charged") charged++;
        await logAuditEvent(req, "system", "no_show_fee_charged", "booking", booking.id, {
          kind: "no_show",
          fee_cents: feeCents,
          charged_cents: result.chargedCents ?? 0,
          status: result.status,
          payment_intent_id: result.paymentIntentId,
        });

        // N4: notify the customer a no-show fee was actually charged (silent debit =
        // chargeback magnet). Only on a real charge, with the amount actually taken.
        // user_id → in-app + email; guest_email → email only. Never blocks the charge.
        if (result.status === "charged") {
          const salon = (booking as any).salons as { name?: string } | null;
          const services = (booking as any).services as Record<string, string | null> | null;
          await notifyNoShowFee({
            admin,
            userId: (booking.user_id as string | null) ?? null,
            guestEmail: (booking as any).guest_email ?? null,
            serviceName: services?.name_de ?? services?.name_en ?? "Service",
            salonName: salon?.name ?? "Salon",
            feeCents: result.chargedCents ?? feeCents,
            dateStr: booking.starts_at
              ? new Date(booking.starts_at as string).toLocaleDateString("de-CH")
              : "",
            logPrefix: "no-show",
          }).catch((err) => console.error(`[no-show] fee notification failed for booking ${booking.id}:`, err));
        }
      } catch (e) {
        // NO_SAVED_CARD / INVALID_AMOUNT etc. — log, continue the loop (never crash the cron).
        if (e instanceof FeeError) {
          console.error(`[no-show] chargeFee skipped for booking ${booking.id} (${e.code}):`, e.message);
        } else {
          console.error(`[no-show] chargeFee threw for booking ${booking.id}:`, e);
        }
      }
    }

    // 3. Increment customer no_show_count.
    const { data: profile } = await admin.from("profiles").select("no_show_count").eq("id", booking.user_id).single();
    const newCount = (profile?.no_show_count ?? 0) + 1;
    await admin.from("profiles").update({ no_show_count: newCount }).eq("id", booking.user_id);

    // 4. Warning if > 3.
    if (newCount >= 3) {
      try {
        await logAuditEvent(req, "system", "customer_excessive_no_shows", "user", booking.user_id, { count: newCount });
      } catch (err) { console.error("[cron/no-show] audit log failed:", err); }
    }

    processed++;
  }

  return { processed, charged };
  });
}
