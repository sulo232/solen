export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, expressRebookConfirmSchema } from "@/lib/validations";

// POST /api/bookings/express-rebook/confirm — Confirm express rebook, create booking
export async function POST(req: NextRequest) {
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
  const { data: validated, error: validationError } = validateBody(expressRebookConfirmSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { slot_id, service_id, staff_id, source_booking_id } = validated;

  const admin = createAdminSupabaseClient();

  // Verify slot is still available
  const { data: slot } = await admin
    .from("availability_slots")
    .select("id, salon_id, starts_at, ends_at, status")
    .eq("id", slot_id)
    .single();

  if (!slot || slot.status !== "available") {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  // Get service price
  const { data: service } = await admin
    .from("services").select("price").eq("id", service_id).single();

  // Fix C: mirror app/api/bookings/route.ts's status logic. This route has no
  // payment_method field from the client (no online-pay UI wired here yet), so the
  // discriminator is the salon's own payment_mode: 'deposit'/'prepay' means the salon
  // requires online payment before a booking is confirmed, same as the main route's
  // "ONLINE_PAYMENT_REQUIRED" guard. Such a booking must stay 'pending' + payment_status
  // 'none' until the Stripe webhook (via a follow-up /api/stripe/booking-pay-intent call,
  // which is booking_id-generic) flips it to 'confirmed'/'paid'. Only an 'at_salon' salon
  // gets instant-confirmed here.
  const { data: salon } = await admin
    .from("salons")
    .select("payment_mode, booking_confirmation_mode")
    .eq("id", slot.salon_id)
    .single();
  const salPayMode = salon?.payment_mode ?? "at_salon";
  const requiresOnlinePayment = salPayMode === "deposit" || salPayMode === "prepay";
  const confirmMode = salon?.booking_confirmation_mode ?? "instant";
  const bookingStatus = requiresOnlinePayment
    ? "pending"
    : confirmMode === "manual_approval" ? "pending_approval" : "confirmed";

  // Create booking
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      salon_id: slot.salon_id,
      service_id,
      slot_id,
      staff_member_id: staff_id ?? null,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      price_paid: service?.price ?? 0,
      status: bookingStatus,
      payment_status: requiresOnlinePayment ? "none" : undefined,
      is_express_rebook: true,
      rebooked_from_id: source_booking_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark slot as booked. TOCTOU guard (audit fix B): the update only claims the slot if
  // it is STILL 'available' (the read above is not atomic with this write), and
  // .select("id") tells us whether this request's write actually matched a row.
  const { data: slotUpdateRows, error: slotUpdateError } = await admin
    .from("availability_slots")
    .update({ status: "booked" })
    .eq("id", slot_id)
    .eq("status", "available")
    .select("id");

  if (slotUpdateError || !slotUpdateRows?.length) {
    if (slotUpdateError) console.error("[express-rebook/confirm] slot booking update failed:", slotUpdateError);
    // 0 rows matched (or a write error): the slot was claimed by another request between
    // the read and this write. Roll back the booking row we just inserted so no
    // orphan/unheld booking remains.
    await admin.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json({ error: "Slot no longer available", code: "SLOT_TAKEN" }, { status: 409 });
  }

  return NextResponse.json({ booking });
}
