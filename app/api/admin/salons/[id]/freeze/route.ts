import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.reason || typeof body.reason !== 'string') {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const updateData = {
    frozen_at: new Date().toISOString(),
    frozen_reason: body.reason,
  };

  const { error } = await admin.from("salons").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Batch cancel pending and confirmed bookings
  const { data: activeBookings } = await admin
    .from("bookings")
    .select("id, slot_id, stripe_payment_intent_id")
    .eq("salon_id", id)
    .in("status", ["pending_approval", "confirmed"]);

  for (const b of activeBookings ?? []) {
    await admin.from("bookings").update({
      status: "cancelled",
      cancellation_reason: "admin_salon_suspension",
      cancelled_at: new Date().toISOString()
    }).eq("id", b.id);
    
    // Process refund if held/paid
    if (b.stripe_payment_intent_id) {
       try {
         const Stripe = (await import("stripe")).default;
         const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
         await stripe.refunds.create({
           payment_intent: b.stripe_payment_intent_id,
           reason: "requested_by_customer"
         });
       } catch (e) {
         console.error("Refund failed on freeze for booking", b.id, e);
       }
    }
    
    if (b.slot_id) {
      await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", b.slot_id);
    }
  }

  await admin.from("account_actions").insert({
    salon_id: id,
    action_type: 'suspension',
    reason: body.reason,
    admin_id: user.id,
  });

  await logAuditEvent(req, user.id, "salon.freeze", "salon", id, { salon_name: salon.name });

  return NextResponse.json({ ok: true });
}
