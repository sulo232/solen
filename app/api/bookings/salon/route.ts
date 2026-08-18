export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// exists-check: `npm run exists salon` and `npm run exists "bookings/salon route"` return no hit
// on this route or a duplicate of it; `npm run exists "salon booking"` returns only
// lib/validations.ts (the salonBookingSchema this file consumes, added in the same turn) and an
// unrelated REMOVED.md hit (a hero CTA card, not an endpoint). Net-new vs app/api/bookings/route.ts
// (the customer endpoint, guarded for a different actor, see the comment below) and
// app/api/bookings/walk-in/route.ts (cash walk-ins into the live queue, a different write target:
// barber_walkin_queue, not bookings). This route is genuinely new.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, salonBookingSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";

// POST /api/bookings/salon: a SALON recording an appointment it took itself, by phone or at the
// counter. Two attempts at this shipped on branches nobody merged, and neither was safe to
// cherry-pick: 8bab79b80 (claude/nice-hugle-c0b706) writes a booked slot linked to a salon_clients
// row and NO bookings row, so the appointment is invisible to analytics, reminders, no-show and
// the terminal board; ad0888a92 (claude/crazy-bose-57e405) added a `book_as_guest` flag to the
// CUSTOMER endpoint (POST /api/bookings), predating bundles, promo/referral reserve, guest access
// tokens, effectivePaymentMode, policy_snapshot, the TOCTOU slot-claim guard and
// pending_approval, all of which that endpoint now carries.
//
// This is a SEPARATE route rather than a flag on the customer endpoint on purpose: the customer
// endpoint applies a 5-per-hour rate limit, a 403 when online_booking_enabled is false, a 400 on
// deposit/prepay salons, and a duplicate check keyed on user_id. A salon taking its sixth call of
// the hour would be throttled by its own booking tool, and a walk-in-only shop (the one salon
// LEAST able to record a phone booking through the customer flow) would be blocked outright.
// Putting the operator path inside the customer endpoint means inheriting every guard written for
// a customer and then growing an exception per guard; a dedicated route with its own, smaller
// guard set (auth + ban + ownership) is simpler to reason about and cannot regress the customer
// flow's guards by accident.
//
// Auth/ownership shape mirrors app/api/bookings/walk-in/route.ts, the live production pattern for
// a staff-authored write: session required, checkUserBanned, getActiveSalon resolves the caller's
// salon (never a hardcoded id, so this is multi-tenant from the first call).
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[salon-booking] invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: validated, error: valError } = validateBody(salonBookingSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Salon-ownership check: the staff/owner recording the appointment must own the salon. Multi-
  // tenant by construction, this is the ONLY thing that authorises the write below.
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Service must belong to THIS salon; its duration is what turns starts_at into ends_at.
  const { data: service } = await supabase
    .from("services")
    .select("id, price, duration_minutes")
    .eq("id", validated.service_id)
    .eq("salon_id", salon.id)
    .single();
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Optional stylist must also belong to this salon.
  let staffMemberId: string | null = null;
  if (validated.staff_member_id) {
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", validated.staff_member_id)
      .eq("salon_id", salon.id)
      .single();
    if (!staffMember) return NextResponse.json({ error: "Staff member not found" }, { status: 400 });
    staffMemberId = staffMember.id;
  }

  const startsAt = new Date(validated.starts_at);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);

  // Admin client for both writes: bookings_insert_auth is `auth.uid() = user_id`, and this row
  // deliberately has user_id NULL (a phone/counter booking has no customer account). The
  // ownership check above is what authorises it, the same seam the guest-booking path uses.
  const admin = createAdminSupabaseClient();

  // The slot must exist first: bookings.slot_id is NOT NULL with ON DELETE RESTRICT, so a
  // booking cannot exist without one. `prevent_double_booking` (GIST exclusion over
  // staff_member_id + tstzrange) raises 23P01 here when that stylist already has something in
  // this range.
  const { data: slot, error: slotErr } = await admin
    .from("availability_slots")
    .insert({
      salon_id: salon.id,
      service_id: validated.service_id,
      staff_member_id: staffMemberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "booked",
    })
    .select("id")
    .single();
  if (slotErr || !slot) {
    const clash = (slotErr as { code?: string } | null)?.code === "23P01";
    console.error("[salon-booking] slot insert failed:", slotErr);
    return NextResponse.json(
      { error: clash ? "That stylist is already booked then." : "Could not hold the time." },
      { status: clash ? 409 : 500 },
    );
  }

  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .insert({
      salon_id: salon.id,
      service_id: validated.service_id,
      slot_id: slot.id,
      staff_member_id: staffMemberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      guest_name: validated.guest_name,
      // bookings_owner_or_guest_chk (live constraint, 20260601_sp1_bookings_guest_rls.sql) requires
      // guest_phone IS NOT NULL whenever user_id is null, which every row here is. An empty string
      // satisfies that CHECK without being a fabricated, dialable-looking number (the brief's own
      // "worse than null" bar); lib/gdpr/anonymize-guest.ts sets the same precedent with the
      // "[redacted]" sentinel for the identical constraint when no real value exists.
      guest_phone: validated.guest_phone ?? "",
      guest_email: validated.guest_email ?? null,
      price_paid: service.price ?? 0,
      // The merchant terminal board (loadTerminalData.ts) reads estimated_price, not price_paid,
      // for the number it renders per row and sums into "Booked today". price_paid alone left this
      // column null, so a phone booking landed with the right price everywhere EXCEPT the one
      // screen the salon is looking at when it takes the call. Same value as price_paid: nothing
      // here has actually been paid (payment_status stays "none"), this is the quoted price.
      estimated_price: service.price ?? 0,
      payment_status: "none",
      acquisition_source: validated.source,
      customer_note: validated.customer_note?.trim() || null,
    })
    .select("id, starts_at, ends_at, guest_name, acquisition_source")
    .single();
  if (bookingErr || !booking) {
    console.error("[salon-booking] booking insert failed:", bookingErr);
    // Leave nothing holding the time if the booking itself did not land: a slot left behind
    // blocks that time forever and nothing will ever clean it up.
    const { error: cleanupErr } = await admin.from("availability_slots").delete().eq("id", slot.id);
    if (cleanupErr) console.error("[salon-booking] slot cleanup after failed booking insert also failed:", cleanupErr);
    return NextResponse.json({ error: "Could not save the booking." }, { status: 500 });
  }

  const { error: linkErr } = await admin.from("availability_slots").update({ booking_id: booking.id }).eq("id", slot.id);
  if (linkErr) console.error("[salon-booking] slot -> booking_id link failed (non-fatal):", linkErr);

  return NextResponse.json(
    {
      id: booking.id,
      starts_at: booking.starts_at,
      ends_at: booking.ends_at,
      guest_name: booking.guest_name,
      acquisition_source: booking.acquisition_source,
      slot_id: slot.id,
    },
    { status: 201 },
  );
}
