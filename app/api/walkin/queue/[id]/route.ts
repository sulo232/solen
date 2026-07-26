export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinUpdateSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";
import { calculateNoShowFee } from "@/lib/cancellation-policy";
import { notifyNoShowFee } from "@/lib/bookings/notify-no-show-fee";
import type { Database } from "@/lib/database.types";

// PATCH /api/walkin/queue/[id] — Salon owner/staff: update queue entry status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkinUpdateSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { id } = await params;
  const admin = createAdminSupabaseClient();

  // Get the queue entry
  const { data: entry } = await admin
    .from("barber_walkin_queue").select("*").eq("id", id).single();
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify salon ownership or staff
  const { data: salon } = await admin
    .from("salons").select("owner_id").eq("id", entry.salon_id).single();
  const { data: staffMember } = await admin
    .from("staff_members").select("id").eq("salon_id", entry.salon_id)
    .eq("user_id", user.id).maybeSingle();
  if (salon?.owner_id !== user.id && !staffMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // A caller-supplied assigned_barber_id must belong to THIS salon, otherwise a poisoned id
  // could reassign the entry to (and later mutate) another salon's staff row.
  if (validated.assigned_barber_id) {
    const { data: targetStaff } = await admin
      .from("staff_members")
      .select("id")
      .eq("id", validated.assigned_barber_id)
      .eq("salon_id", entry.salon_id)
      .maybeSingle();
    if (!targetStaff) {
      return NextResponse.json({ error: "assigned_barber_id does not belong to this salon" }, { status: 400 });
    }
  }

  // Build update object
  const update: Database["public"]["Tables"]["barber_walkin_queue"]["Update"] = { status: validated.status };
  if (validated.assigned_barber_id) update.assigned_barber_id = validated.assigned_barber_id;

  if (validated.status === "in_chair") {
    update.called_at = new Date().toISOString();
    update.started_at = new Date().toISOString();
  } else if (validated.status === "completed" || validated.status === "no_show" || validated.status === "cancelled") {
    update.completed_at = new Date().toISOString();
  }

  // CAS: claim the status transition FIRST, BEFORE any Stripe money action. Audit fix: money
  // used to move (capture / fee capture / refund) before this claim, so a lost race left Stripe
  // charged/refunded with no CAS signal to the caller. Re-asserting the status read at the top
  // of the handler means two concurrent staff actions (e.g. 'complete' vs 'no_show') can no
  // longer both pass and last-write-wins; only the winner proceeds to touch Stripe.
  // .maybeSingle() (not .single()) so a lost race (0 rows) comes back as data=null instead of a
  // PGRST116 error.
  const { data: updated, error } = await admin
    .from("barber_walkin_queue")
    .update(update)
    .eq("id", id)
    .eq("status", entry.status) // CAS
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) {
    return NextResponse.json({ error: "Queue entry status changed concurrently, please retry" }, { status: 409 });
  }

  // Capture the held card payment when the visit completes: the manual-capture hold
  // becomes an actual charge. Idempotent: a double "done" tap won't double-charge.
  let paymentCaptured: boolean | null = null;
  if (validated.status === "completed" && entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "requires_capture") {
        const captured = await stripe.paymentIntents.capture(entry.payment_intent_id);
        paymentCaptured = captured.status === "succeeded";
      } else {
        paymentCaptured = pi.status === "succeeded"; // already captured on an earlier call
      }
    } catch (e) {
      console.error("[walkin/queue PATCH] payment capture failed:", e);
      paymentCaptured = false; // surface to the dashboard so staff can retry/charge manually
    }
  }

  // No-show → charge the salon's no-show policy fee out of the held card (PARTIAL CAPTURE of
  // the existing manual-capture hold — NOT an off-session create like the booking path). A CASH
  // entry (no payment_intent_id) has nothing to charge → just mark no_show. Idempotent: guarded
  // on requires_capture so a double-tap can't double-capture.
  let noShowFeeCaptured: number | null = null;
  if (validated.status === "no_show" && entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "requires_capture") {
        // Policy: salons.no_show_fee_type ('free'|'flat'|'percentage') + no_show_fee_value
        // (CHF for 'flat', percent 0-100 for 'percentage'). The held PI amount is the full
        // service price in Rappen — the fee base. calculateNoShowFee converts CHF→Rappen and
        // caps at the base (shared chokepoint, lib/cancellation-policy.ts).
        const { data: policy } = await admin
          .from("salons").select("no_show_fee_type, no_show_fee_value").eq("id", entry.salon_id).single();
        const heldAmount = pi.amount; // Rappen
        const { feeCents } = calculateNoShowFee(policy?.no_show_fee_type, policy?.no_show_fee_value, heldAmount);
        if (feeCents <= 0) {
          // Lenient / unset policy → release the hold, charge nothing.
          await stripe.paymentIntents.cancel(entry.payment_intent_id);
          noShowFeeCaptured = 0;
        } else if (feeCents >= heldAmount) {
          // Fee >= held → capture in full.
          await stripe.paymentIntents.capture(entry.payment_intent_id);
          noShowFeeCaptured = heldAmount;
        } else {
          // 0 < fee < held → partial capture; Stripe auto-releases the remainder.
          await stripe.paymentIntents.capture(entry.payment_intent_id, { amount_to_capture: feeCents });
          noShowFeeCaptured = feeCents;
        }
      } else if (pi.status === "succeeded") {
        noShowFeeCaptured = pi.amount_received; // already captured on an earlier call (idempotent)
      }
    } catch (e) {
      console.error("[walkin/queue PATCH] no-show fee capture failed:", e);
    }
  }

  // Salon-side cancel → release the held funds, or REFUND + reverse the Connect transfer if the
  // hold was already captured (a destination charge moved money to the salon; reverse_transfer
  // pulls it back + refund_application_fee returns the platform commission — without this the
  // refund leaks: salon keeps the funds, platform eats the loss).
  if (validated.status === "cancelled" && entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "succeeded") await stripe.refunds.create({ payment_intent: entry.payment_intent_id, reverse_transfer: true, refund_application_fee: true });
      else if (pi.status !== "canceled") await stripe.paymentIntents.cancel(entry.payment_intent_id);
    } catch (e) {
      console.error("[walkin/queue PATCH] hold release on cancel failed:", e);
    }
  }

  // Re-sequence the remaining waiting entries in ONE atomic statement (no N-update loop /
  // race) once someone leaves the active queue.
  if (["completed", "no_show", "cancelled"].includes(validated.status)) {
    const { error: reseqErr } = await admin.rpc("resequence_walkin_queue", { p_salon_id: entry.salon_id });
    if (reseqErr) console.error("[walkin/queue PATCH] resequence failed:", reseqErr);
  }

  // N4: notify the customer a no-show fee was actually CAPTURED out of their held card
  // (silent debit = chargeback magnet). ONLY when a fee was really taken (> 0); a
  // released hold (0) or cash entry (null) notifies nothing. A registered walk-in
  // (customer_id) gets in-app + email; a phone-only guest has no email column on the
  // queue, so nothing is sent (SMS is a logged future epic). Never blocks the capture.
  if (validated.status === "no_show" && noShowFeeCaptured && noShowFeeCaptured > 0) {
    const { data: salonRow } = await admin
      .from("salons").select("name").eq("id", entry.salon_id).maybeSingle();
    let serviceName = "Service";
    if (entry.service_id) {
      const { data: svc } = await admin
        .from("services").select("name_de, name_en").eq("id", entry.service_id).maybeSingle();
      serviceName = svc?.name_de ?? svc?.name_en ?? "Service";
    }
    await notifyNoShowFee({
      admin,
      userId: (entry.customer_id as string | null) ?? null,
      guestEmail: null, // barber_walkin_queue has no email column (only customer_phone).
      serviceName,
      salonName: salonRow?.name ?? "Salon",
      feeCents: noShowFeeCaptured,
      date: new Date(),
      logPrefix: "walkin/queue",
    }).catch((err) => console.error("[walkin/queue PATCH] no-show fee notification failed:", err));
  }

  return NextResponse.json({ entry: updated, payment_captured: paymentCaptured, no_show_fee_captured: noShowFeeCaptured });
}

// DELETE /api/walkin/queue/[id]?token=... — Public: client cancels own entry by tracking token
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  const { data: entry } = await admin
    .from("barber_walkin_queue").select("id, salon_id, tracking_token, status, payment_intent_id")
    .eq("id", id).single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.tracking_token !== token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (entry.status !== "waiting") return NextResponse.json({ error: "Cannot cancel — already in progress" }, { status: 400 });

  // Atomic compare-and-swap: gate the update on status still being "waiting" so two concurrent
  // DELETEs with the same token can't both flip it and both reach the refund below (double
  // refund / double transfer reversal). Only the request that actually wins the flip proceeds.
  const { data: cancelled, error } = await admin
    .from("barber_walkin_queue")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "waiting")
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!cancelled || cancelled.length === 0) {
    return NextResponse.json({ error: "Cannot cancel, already in progress" }, { status: 400 });
  }

  // Advance the queue: re-sequence the remaining waiting entries so positions + ETAs close
  // up behind the cancelled customer (same atomic RPC the operator PATCH uses). Without this,
  // a customer self-cancel left everyone behind frozen at their old position.
  const { error: reseqErr } = await admin.rpc("resequence_walkin_queue", { p_salon_id: entry.salon_id });
  if (reseqErr) console.error("[walkin/queue DELETE] resequence after self-cancel failed:", reseqErr);

  // Release the card hold immediately (don't make the customer wait ~7 days for the auth
  // to expire). Manual-capture hold → cancel the intent; already-captured → refund.
  let payment: "released" | "refunded" | null = null;
  if (entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "succeeded") {
        // Already captured → refund AND reverse the Connect transfer + return the platform fee,
        // else the salon keeps the destination-charge funds and the platform eats the refund.
        await stripe.refunds.create({ payment_intent: entry.payment_intent_id, reverse_transfer: true, refund_application_fee: true });
        payment = "refunded";
      } else if (pi.status !== "canceled") {
        await stripe.paymentIntents.cancel(entry.payment_intent_id);
        payment = "released";
      }
    } catch (e) {
      console.error("[walkin/queue DELETE] hold release/refund failed:", e);
    }
  }

  return NextResponse.json({ success: true, payment });
}
