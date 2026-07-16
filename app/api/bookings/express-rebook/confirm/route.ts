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
  const { data: { user } } = await supabase.auth.getUser();
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

  // Verify slot is still available. Now also selects service_id + price_override: the slot is
  // authoritative on price (round 2 fix). availability_slots.service_id is uuid NOT NULL, so
  // every slot is already bound to exactly one service; round 1's salon-scoping guard alone still
  // let a client pair an expensive slot with a cheap, active, SAME-salon service_id and have that
  // resolve the price instead. The client's service_id can no longer drive price or resolution.
  const { data: slot } = await admin
    .from("availability_slots")
    .select("id, salon_id, service_id, price_override, starts_at, ends_at, status")
    .eq("id", slot_id)
    .single();

  if (!slot || slot.status !== "available") {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  // Requirement 3 decision: reject, don't ignore. The slot's own service_id is authoritative, so
  // a client-supplied service_id is at best a redundant assertion, never a source of truth. A
  // present value that disagrees with the slot is treated as stale/hostile input and rejected
  // loudly, rather than silently overridden, so a client-side bug (or an attacker probing) gets a
  // clear 422 instead of quietly booking a different service than the one it asked for. Absent
  // service_id is fine now: the slot alone fully determines the service.
  if (service_id && service_id !== slot.service_id) {
    return NextResponse.json({ error: "Service does not match this slot" }, { status: 422 });
  }

  // Get the SLOT's own service (never the client's service_id, already checked above), active-only
  // (mirrors the canonical pattern app/api/bookings/route.ts:295, 301-309).
  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("price, is_active")
    .eq("id", slot.service_id)
    .single();

  if (serviceError && serviceError.code !== "PGRST116") {
    // A real DB/network failure, not the ordinary 0-rows case. Must not fall through to the 422
    // below, which would misreport an infra outage as "service not available".
    console.error("[express-rebook/confirm] service lookup failed:", serviceError);
    return NextResponse.json({ error: "Failed to verify service" }, { status: 500 });
  }

  if (!service || service.is_active === false) {
    // 422 (LAW.md §7: well-formed but semantically invalid, not 400/409): the slot's service no
    // longer resolves to an active row. Must be an explicit error, never a silent price_paid: 0
    // free booking.
    return NextResponse.json({ error: "Service not available for this slot" }, { status: 422 });
  }

  // Verify staff_id (if provided) belongs to this slot's salon AND is active (mirrors the service
  // guard above; staff_members.is_active defaults to true, so `=== false` only, never blocking on
  // a missing/null flag). The canonical route proves salon-scoping via the slot query itself
  // (constrained by staff_member_id up front); this handler's slot query has no such constraint,
  // so a foreign or deactivated staff_member_id would otherwise be written straight onto the booking.
  if (staff_id) {
    const { data: staffMember, error: staffError } = await admin
      .from("staff_members")
      .select("id, is_active")
      .eq("id", staff_id)
      .eq("salon_id", slot.salon_id)
      .single();

    if (staffError && staffError.code !== "PGRST116") {
      console.error("[express-rebook/confirm] staff lookup failed:", staffError);
      return NextResponse.json({ error: "Failed to verify staff member" }, { status: 500 });
    }

    if (!staffMember || staffMember.is_active === false) {
      return NextResponse.json({ error: "Staff member not available for this slot's salon" }, { status: 422 });
    }
  }

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

  // Price precedence copied exactly from app/api/bookings/route.ts:295 (slot.price_override ??
  // slot.services?.price ?? 0): the slot's own override wins when set, otherwise its service's
  // price. `service` is guaranteed non-null here (the guard above already 422'd otherwise), so
  // no `?? 0` fallback is needed on that side.
  const price = slot.price_override ?? service.price;

  // Create booking
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      salon_id: slot.salon_id,
      // service_id is the SLOT's own service_id, never the client's: the guard above already
      // rejected a mismatched client value with a 422, so at this point they're either equal or
      // the client omitted it. Writing slot.service_id (not the client's) means an omitted
      // service_id can no longer hit the services NOT NULL/FK write path with an undefined value.
      service_id: slot.service_id,
      slot_id,
      staff_member_id: staff_id ?? null,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      price_paid: price,
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
