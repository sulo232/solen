export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { releasePendingApproval } from "@/lib/bookings/release-pending-approval";

// POST /api/bookings/[id]/decline
// Salon owner declines a manual-approval request (status pending_approval). The counterpart
// of /confirm. The cancel route only accepts confirmed bookings, so a pending request had no
// owner-side way out except waiting for the 24h auto-timeout cron; this runs the same release
// (slot freed, customer emailed, held payment voided or refunded) immediately.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { actor, booking, userId } = await resolveBookingActor(request, id);
  if (!booking) return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (actor !== "salon") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: userId ?? "unknown" });
  if (rateLimited) return rateLimited;

  if (booking.status !== "pending_approval") {
    return NextResponse.json({ error: "Only a pending request can be declined", code: "INVALID_STATUS" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: full, error: fetchError } = await admin
    .from("bookings")
    .select("*, salons(*), services(*), profiles(*)")
    .eq("id", id)
    .single();
  if (fetchError || !full) {
    console.error("[Decline] booking re-fetch failed:", fetchError);
    return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const result = await releasePendingApproval(admin, full, {
    reason: "salon_declined",
    actor: "salon",
    logTag: "Decline",
  });

  if (!result.released) {
    return NextResponse.json(
      { error: "Booking changed concurrently, please retry", code: "CONFLICT" },
      { status: 409 },
    );
  }
  if (result.errors.length > 0) {
    // The booking is declined and the slot is free; only the money release failed. Surface it
    // so the owner is not told everything succeeded, and log for admin follow-up.
    console.error("[Decline] payment release failed:", { bookingId: id, errors: result.errors });
    return NextResponse.json({ ok: true, paymentReleaseFailed: true });
  }
  return NextResponse.json({ ok: true });
}
