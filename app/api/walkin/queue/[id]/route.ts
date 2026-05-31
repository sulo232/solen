export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinUpdateSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";

// PATCH /api/walkin/queue/[id] — Salon owner/staff: update queue entry status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
    .eq("id", user.id).maybeSingle();
  if (salon?.owner_id !== user.id && !staffMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build update object
  const update: Record<string, any> = { status: validated.status };
  if (validated.assigned_barber_id) update.assigned_barber_id = validated.assigned_barber_id;

  if (validated.status === "in_chair") {
    update.called_at = new Date().toISOString();
    update.started_at = new Date().toISOString();
  } else if (validated.status === "completed" || validated.status === "no_show" || validated.status === "cancelled") {
    update.completed_at = new Date().toISOString();
  }

  // Capture the held card payment when the visit completes — the manual-capture hold
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

  // Salon-side cancel → release the held funds. (no_show is intentionally left alone so the
  // salon's cancellation policy can decide whether to charge — that's the dashboard's call.)
  if (validated.status === "cancelled" && entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "succeeded") await stripe.refunds.create({ payment_intent: entry.payment_intent_id });
      else if (pi.status !== "canceled") await stripe.paymentIntents.cancel(entry.payment_intent_id);
    } catch (e) {
      console.error("[walkin/queue PATCH] hold release on cancel failed:", e);
    }
  }

  const { data: updated, error } = await admin
    .from("barber_walkin_queue").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-sequence the remaining waiting entries in ONE atomic statement (no N-update loop /
  // race) once someone leaves the active queue.
  if (["completed", "no_show", "cancelled"].includes(validated.status)) {
    const { error: reseqErr } = await admin.rpc("resequence_walkin_queue", { p_salon_id: entry.salon_id });
    if (reseqErr) console.error("[walkin/queue PATCH] resequence failed:", reseqErr);
  }

  return NextResponse.json({ entry: updated, payment_captured: paymentCaptured });
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
    .from("barber_walkin_queue").select("id, tracking_token, status, payment_intent_id")
    .eq("id", id).single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.tracking_token !== token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (entry.status !== "waiting") return NextResponse.json({ error: "Cannot cancel — already in progress" }, { status: 400 });

  const { error } = await admin
    .from("barber_walkin_queue")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Release the card hold immediately (don't make the customer wait ~7 days for the auth
  // to expire). Manual-capture hold → cancel the intent; already-captured → refund.
  let payment: "released" | "refunded" | null = null;
  if (entry.payment_intent_id) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(entry.payment_intent_id);
      if (pi.status === "succeeded") {
        await stripe.refunds.create({ payment_intent: entry.payment_intent_id });
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
