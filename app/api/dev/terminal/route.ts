export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, terminalActionSchema, terminalPhoneBookingSchema } from "@/lib/validations";
import { TERMINAL_SALON_ID } from "@/app/[locale]/dev/terminal/loadTerminalData";

// -----------------------------------------------------------------
// DEV-ONLY merchant-terminal action endpoint (_plans/MERCHANT_TERMINAL_2026-08-15.md
// round 12, R12-1). Makes the terminal's Start / Done / No-show / Cancel / Accept /
// Decline actions REAL database writes instead of React state that vanishes on
// reload. HARD-GATED to NODE_ENV !== "production" (404 on the Netlify production
// build), exactly like app/api/dev/login/route.ts.
//
// exists-check: `npm run exists terminal` returns only the mockup route + component
// files (Screen/StaffChip/Terminal/loadTerminalData) and a graveyard hit for two
// abandoned terminal DIRECTIONS (unrelated to an API endpoint). No existing write
// endpoint to extend; this is genuinely new.
//
// Status values below are VERIFIED against the live CHECK constraints, not assumed:
// - barber_walkin_queue.status: supabase/migrations/073_barber_foundation.sql:17
//   CHECK (status IN ('waiting','in_chair','completed','no_show','cancelled'))
// - bookings.status: supabase/migrations/075_booking_confirmation_mode.sql:34
//   (supersedes 014_new_schema.sql:234) CHECK (status IN ('pending','pending_approval',
//   'confirmed','cancelled','completed','no_show')), no later migration touches this
//   constraint. Confirmed against the live rows too (distinct status query, both tables).
// Every value the brief asked for ("in_chair", "completed", "no_show", "cancelled",
// "confirmed") is legal on both tables, nothing here needed correcting.
// -----------------------------------------------------------------

type QueueAction = "start" | "done" | "no_show" | "cancel";
type BookingAction = "accept" | "decline";

const QUEUE_STATUS_FOR_ACTION: Record<QueueAction, string> = {
  start: "in_chair",
  done: "completed",
  no_show: "no_show",
  cancel: "cancelled",
};

const BOOKING_STATUS_FOR_ACTION: Record<BookingAction, string> = {
  accept: "confirmed",
  decline: "cancelled",
};

function isQueueAction(action: string): action is QueueAction {
  return action in QUEUE_STATUS_FOR_ACTION;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch (err) {
    console.error("[terminal-api] invalid JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // A BOOKING TAKEN ON THE PHONE. Until this existed a salon could not record one anywhere in the
  // product, so the terminal showed only what came through the marketplace and understated the day:
  // a chair reads free while somebody is on their way to it. Two attempts at this shipped on
  // branches nobody merged (8bab79b80, ad0888a92), and the RLS policy `bookings_insert_auth` is
  // `auth.uid() = user_id`, so an owner cannot insert a booking for a customer at all. This route
  // writes through the admin client, which is the same seam the guest-booking path already uses.
  if ((rawBody as { action?: string } | null)?.action === "phone_booking") {
    const { data: phone, error: phoneError } = validateBody(terminalPhoneBookingSchema, rawBody);
    if (phoneError) {
      return NextResponse.json({ error: phoneError.message }, { status: 400 });
    }
    const admin = createAdminSupabaseClient();
    // The ABSOLUTE instant the shop picked, taken directly (2026-08-18 fix): the old
    // startsInMinutes duration was reconstructed against this route's own Date.now(), a second
    // clock reading later by the network round trip, so the stored time could drift by up to a
    // minute from what was chosen. There is only one clock reading here now: the client's.
    const startsAt = new Date(phone.startsAt);
    const endsAt = new Date(startsAt.getTime() + phone.minutes * 60_000);
    try {
      // Price is read server-side, never trusted from the client (same rule the customer booking
      // route and app/api/bookings/salon/route.ts both follow). This also confirms the service
      // actually belongs to this salon before a slot is ever held for it.
      const { data: service, error: serviceErr } = await admin
        .from("services")
        .select("id, price")
        .eq("id", phone.serviceId)
        .eq("salon_id", TERMINAL_SALON_ID)
        .single();
      if (serviceErr || !service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      // The slot must exist first: bookings.slot_id is NOT NULL with ON DELETE RESTRICT.
      const { data: slot, error: slotErr } = await admin
        .from("availability_slots")
        .insert({
          salon_id: TERMINAL_SALON_ID,
          service_id: phone.serviceId,
          staff_member_id: phone.staffId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "booked",
        })
        .select("id")
        .single();
      if (slotErr || !slot) {
        // 23P01 is the double-booking exclusion: that stylist is already busy across this range.
        const clash = (slotErr as { code?: string } | null)?.code === "23P01";
        console.error("[terminal-api] phone_booking: slot insert failed:", slotErr);
        return NextResponse.json(
          { error: clash ? "That stylist is already booked then" : "Could not hold the time" },
          { status: clash ? 409 : 500 },
        );
      }

      const { data: booking, error: bookingErr } = await admin
        .from("bookings")
        .insert({
          salon_id: TERMINAL_SALON_ID,
          service_id: phone.serviceId,
          slot_id: slot.id,
          staff_member_id: phone.staffId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "confirmed",
          guest_name: phone.name,
          guest_phone: phone.phone,
          price_paid: service.price ?? 0,
          // The board (loadTerminalData.ts) renders estimated_price per row and sums it into
          // "Booked today"; it never reads price_paid. This was hardcoded to 0 and never touched
          // estimated_price at all, so every phone booking taken here showed CHF 0.00 on its own
          // board regardless of the real service price.
          estimated_price: service.price ?? 0,
          payment_status: "none",
          // The salon's existing "Quellen" chart already reads this column, so a phone booking shows
          // up there for free instead of needing a new report.
          acquisition_source: "phone",
        })
        .select("id, starts_at, guest_name")
        .single();
      if (bookingErr || !booking) {
        console.error("[terminal-api] phone_booking: booking insert failed:", bookingErr);
        // Leave nothing holding the time if the booking itself did not land.
        await admin.from("availability_slots").delete().eq("id", slot.id);
        return NextResponse.json({ error: "Could not save the booking" }, { status: 500 });
      }

      await admin.from("availability_slots").update({ booking_id: booking.id }).eq("id", slot.id);
      return NextResponse.json({ ok: true, id: booking.id, startsAt: booking.starts_at });
    } catch (err) {
      console.error("[terminal-api] phone_booking: unexpected error:", err);
      return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
  }

  const { data: validated, error: validationError } = validateBody(terminalActionSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }
  const { action, id, staffId } = validated;

  const admin = createAdminSupabaseClient();

  try {
    if (action === "start") {
      if (!staffId) {
        return NextResponse.json({ error: "Missing staffId for start" }, { status: 400 });
      }

      // Reject if this staff member already has someone in the chair for this salon.
      const { data: existing, error: existingErr } = await admin
        .from("barber_walkin_queue")
        .select("id")
        .eq("salon_id", TERMINAL_SALON_ID)
        .eq("assigned_barber_id", staffId)
        .eq("status", "in_chair")
        .maybeSingle();

      if (existingErr) {
        console.error("[terminal-api] start: in-chair conflict check failed:", existingErr);
        return NextResponse.json({ error: "Failed to check staff availability" }, { status: 500 });
      }
      if (existing) {
        return NextResponse.json(
          { error: "This staff member already has someone in the chair" },
          { status: 409 }
        );
      }

      const { data, error } = await admin
        .from("barber_walkin_queue")
        .update({
          status: "in_chair",
          assigned_barber_id: staffId,
          started_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("salon_id", TERMINAL_SALON_ID)
        .select("id, status")
        .maybeSingle();

      if (error) {
        console.error("[terminal-api] start: update failed:", error);
        return NextResponse.json({ error: "Failed to start" }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Queue entry not found for this salon" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, id: data.id, status: data.status });
    }

    if (isQueueAction(action)) {
      const status = QUEUE_STATUS_FOR_ACTION[action];

      const { data, error } = await admin
        .from("barber_walkin_queue")
        .update(
          action === "done" ? { status, completed_at: new Date().toISOString() } : { status }
        )
        .eq("id", id)
        .eq("salon_id", TERMINAL_SALON_ID)
        .select("id, status")
        .maybeSingle();

      if (error) {
        console.error(`[terminal-api] ${action}: barber_walkin_queue update failed:`, error);
        return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Queue entry not found for this salon" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, id: data.id, status: data.status });
    }

    // arrived / unarrive -> bookings.arrived_at, a TIMESTAMP and deliberately not a status.
    //
    // The status column already 409s once a booking is cancelled, completed or no_show, and arrival
    // has to land BEFORE completion, so a "checked_in" status would collide with that guard while a
    // timestamp cannot. The column shipped on 2026-06-23 shaped exactly this way and never got a
    // writer: 1 row of 984 carries a value, and a repo-wide grep finds it only in the generated
    // types. This is that writer.
    if (action === "arrived" || action === "unarrive") {
      const { data, error } = await admin
        .from("bookings")
        .update({ arrived_at: action === "arrived" ? new Date().toISOString() : null })
        .eq("id", id)
        .eq("salon_id", TERMINAL_SALON_ID)
        .select("id, arrived_at")
        .maybeSingle();

      if (error) {
        console.error(`[terminal-api] ${action}: bookings arrived_at update failed:`, error);
        return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Booking not found for this salon" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, id: data.id, arrivedAt: data.arrived_at });
    }

    // accept / decline -> bookings
    const status = BOOKING_STATUS_FOR_ACTION[action as BookingAction];
    const { data, error } = await admin
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .eq("salon_id", TERMINAL_SALON_ID)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error(`[terminal-api] ${action}: bookings update failed:`, error);
      return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Booking not found for this salon" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: data.id, status: data.status });
  } catch (err) {
    console.error("[terminal-api] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
