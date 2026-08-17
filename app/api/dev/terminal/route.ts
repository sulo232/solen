export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, terminalActionSchema } from "@/lib/validations";
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
