export const dynamic = "force-dynamic";
// nodejs (was edge): resolveBookingActor -> lib/bookings/guest-access uses Node `crypto`
// (timingSafeEqual / sha256), matching every other resolveBookingActor consumer
// (dispute/escalate/report are all nodejs). This route does Supabase + Stripe only, so
// nodejs is functionally equivalent — no edge-specific behavior is lost.
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { validateBody, bookingPatchSchema } from "@/lib/validations";
import { resolveBookingActor } from "@/lib/bookings/authorize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  // Centralized authorization (Task B). resolveBookingActor replaces the ad-hoc
  // owner/salon-owner check: it grants customer (booking owner), salon (salon owner),
  // and additionally admin — a strict superset of the prior logic for logged-in users.
  // null booking -> 404; logged-in-but-not-entitled -> 403 (identical to before).
  const { actor, booking: authBooking } = await resolveBookingActor(request, id);
  if (!authBooking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (actor === null) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Entitlement proven; fetch the relational shape the client expects.
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*), services(*), staff_members(*), availability_slots(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(bookingPatchSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { status } = validated;

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, salons(owner_id, stripe_account_id)")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });

  // Centralized authorization (Task B). resolveBookingActor makes the entitlement
  // decision (and is the one place that understands guests/admins). The
  // isSalonOwner/isBookingOwner booleans below (which drive strike attribution downstream)
  // are still derived from the DIRECT row facts (not from the resolved actor) so this binary
  // customer-vs-salon logic is byte-for-byte identical to before, even for the edge case of
  // a salon owner who also holds the admin role (the resolver would label them 'admin', but
  // their write here is still attributed as the salon owner).
  const { actor } = await resolveBookingActor(request, id);
  if (actor === null) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }
  const isSalonOwner = booking.salons?.owner_id === user.id;
  const isBookingOwner = booking.user_id === user.id;
  const isAdmin = actor === "admin";

  // A logged-in admin who is neither the customer nor the salon owner has no role in this
  // binary status write (unless the new admin allowance below applies), preserve the prior
  // owner-only gate rather than silently granting it.
  if (!isSalonOwner && !isBookingOwner && !isAdmin) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Only the salon (or a platform admin) may mark a booking completed/no_show, otherwise
  // a customer could self-complete their own booking to farm loyalty-tier / member-discount
  // perks without ever being served (audit finding).
  if ((status === "completed" || status === "no_show") && !isSalonOwner && !isAdmin) {
    return NextResponse.json({ message: "Only the salon can set this status", code: "FORBIDDEN" }, { status: 403 });
  }

  // Transition guard: once a booking is in a terminal state, no further status writes are
  // valid, re-cancelling an already-cancelled booking clobbers payment_status
  // (refunded to none) and re-runs strike logic (audit finding).
  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return NextResponse.json(
      { message: `Booking is already ${booking.status}, no further status changes allowed`, code: "INVALID_TRANSITION" },
      { status: 409 }
    );
  }

  // Audit finding #15 (MEDIUM, 2026-07-09): this PATCH used to also handle status='cancelled'
  // with its own ToS-fallback refund math, diverging from the CANONICAL customer-cancel path
  // (app/api/bookings/[id]/cancel/route.ts). Confirmed no live caller sends status='cancelled'
  // here (the dashboard's own updateStatus() is typed "completed" | "no_show" only, and its
  // cancel button posts to /cancel); retired so there is exactly one customer/salon-cancel
  // path. This handler now only ever sets completed/no_show.
  const updates: any = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error: updateErr } = await supabase.from("bookings").update(updates).eq("id", id);
  if (updateErr) return NextResponse.json({ message: updateErr.message, code: "DB_ERROR" }, { status: 500 });

  // Evaluate strikes and warnings
  if (status === "no_show") {
    try {
      const { evaluateBookingPenalties } = await import("@/lib/strikes");
      const cancelledBy = isBookingOwner ? "customer" : "salon";
      await evaluateBookingPenalties(id, status, cancelledBy);
    } catch (err) {
      console.error("Strike evaluation error:", err);
    }
  }

  return NextResponse.json({ data: { success: true } });
}
