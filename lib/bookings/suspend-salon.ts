// lib/bookings/suspend-salon.ts , cancel + refund every live booking at a suspended salon.
//
// exists-check: `npm run exists bookings` lists 15 lib/bookings modules and none is a
// salon-suspension helper; a repo-wide grep for `admin_salon_suspension` returns exactly ONE
// site, the inline block at app/api/admin/salons/[id]/freeze/route.ts:57-100. This file is a
// MOVE of that single block, not a second implementation , freeze now calls it.
//
// WHY IT EXISTS (council security lens, 2026-07-27). The 2026-07-27 freeze fix added
// `is_active: false` to BOTH the dedicated freeze route and the third-strike auto-freeze in
// the warn route, because frozen_at alone gates nothing. But only the freeze route carried
// the cancel-and-refund loop. That left warn in exactly the half-fixed shape the freeze fix
// had just diagnosed: a salon suspended for cause vanishes from every is_active gate while a
// customer's confirmed, PAID booking sits there, never cancelled, never refunded, and no cron
// sweeps is_active=false salons for orphaned bookings. One shared helper, called from both,
// so a for-cause suspension can never leave paid money behind.
//
// The extraction also HARDENS the block it moved. The original cancel write had no
// precondition, so a booking the customer cancelled in the same second would be flipped again
// and then refunded a second time on top of the customer-cancel refund. This version does a
// compare-and-set and only refunds a booking whose status it actually won.

import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";

/** Minimal shape of the admin Supabase client this helper needs. */
type AdminDb = Parameters<typeof issueRefund>[0]["db"];

export interface SuspendSalonResult {
  cancelled: number;
  refunded: number;
  refundFailures: number;
  /** Bookings that were already cancelled by someone else between read and write. */
  raceSkipped: number;
}

const LIVE_STATUSES = ["pending_approval", "confirmed"] as const;

/**
 * Cancel every pending/confirmed booking at `salonId`, refund the full REMAINING balance of
 * each through the single refund chokepoint, and release the held slot.
 *
 * Tolerant by design: a per-booking refund failure is logged and the loop continues, so one
 * bad card can never abort the suspension. The cancellation stands either way.
 *
 * @param reason free text, lands in the refund reason for the audit trail.
 * @param logTag which caller is speaking, for the console prefix ("freeze" | "warn").
 */
export async function cancelAndRefundSalonBookings(
  admin: AdminDb,
  salonId: string,
  reason: string,
  logTag: string,
): Promise<SuspendSalonResult> {
  const out: SuspendSalonResult = { cancelled: 0, refunded: 0, refundFailures: 0, raceSkipped: 0 };

  const { data: activeBookings } = await admin
    .from("bookings")
    .select("id, slot_id, paid_amount, refunded_amount")
    .eq("salon_id", salonId)
    .in("status", LIVE_STATUSES as unknown as string[]);

  for (const b of activeBookings ?? []) {
    // COMPARE-AND-SET. The status precondition is re-asserted at write time and the row is
    // selected back, so a booking the customer cancelled between our read and this write
    // returns null instead of silently succeeding. PostgREST reports error:null on a
    // zero-row update, which is exactly how a double refund would have slipped through.
    const { data: won } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_reason: "admin_salon_suspension",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", b.id)
      .in("status", LIVE_STATUSES as unknown as string[])
      .select("id")
      .maybeSingle();

    if (!won) {
      out.raceSkipped += 1;
      console.warn(`[${logTag}] booking ${b.id} was already cancelled by someone else, not refunding again`);
      continue;
    }
    out.cancelled += 1;

    // Refund the full remaining balance through the single refund chokepoint
    // (REFUND_APPEAL_PLAN section 10b#3) , issueRefund resolves the payment_intent_id, runs
    // its own CAS write on the admin client, and is the only place that calls Stripe refunds.
    // Amounts are integer Rappen.
    const remaining = (b.paid_amount ?? 0) - (b.refunded_amount ?? 0);
    if (remaining > 0) {
      try {
        await issueRefund({
          db: admin,
          source: "booking",
          id: b.id,
          amountCents: remaining,
          actor: "admin",
          reason: `admin suspended salon (${reason})`,
        });
        out.refunded += 1;
      } catch (e) {
        out.refundFailures += 1;
        // NO_PAYMENT (no payment_intent_id), NO_PAID_AMOUNT, STRIPE_FAILED, etc. ,
        // non-fatal; the cancellation above already stands.
        if (e instanceof RefundError) {
          console.error(`[${logTag}] issueRefund skipped for booking ${b.id} (${e.code}):`, e.message);
        } else {
          console.error(`[${logTag}] issueRefund threw for booking`, b.id, e);
        }
      }
    }

    // cas-ok: releasing a slot back to available is idempotent and carries no money. Writing
    // "available" twice is a no-op, and it is scoped to the slot this booking held, which we
    // just won the cancel on. A CAS here would only turn a harmless repeat into a branch.
    if (b.slot_id) {
      await admin.from("availability_slots")
        .update({ status: "available", booked_by: null, booking_id: null })
        .eq("id", b.slot_id);
    }
  }

  return out;
}
