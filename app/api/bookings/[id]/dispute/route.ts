import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";

// GET /api/bookings/[id]/dispute — Fetch dispute for approval page
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dispute } = await supabase
    .from("price_disputes")
    .select("*, bookings(user_id, salon_id, salons(name), services(name_de))")
    .eq("booking_id", bookingId)
    .single();

  if (!dispute) return NextResponse.json({ dispute: null });

  const booking = dispute.bookings as any;
  if (booking?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    dispute: {
      ...dispute,
      bookings: undefined,
      salon_name: booking?.salons?.name,
      service_name: booking?.services?.name_de,
    },
  });
}

// POST /api/bookings/[id]/dispute — Salon creates a price adjustment request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { requested_amount, salon_reason } = body;

  if (!requested_amount || typeof requested_amount !== "number" || requested_amount <= 0) {
    return NextResponse.json({ error: "Valid requested_amount required" }, { status: 400 });
  }
  if (!salon_reason || typeof salon_reason !== "string" || salon_reason.length > 500) {
    return NextResponse.json({ error: "Reason required (max 500 chars)" }, { status: 400 });
  }

  // Verify booking exists and user is the salon owner
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, price_paid, salon_id, user_id, status, salons(owner_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const salonOwner = (booking.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can create disputes" }, { status: 403 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only dispute completed bookings" }, { status: 400 });
  }

  // Cap at +50% of original
  const originalAmount = Number(booking.price_paid) || 0;
  if (requested_amount > originalAmount * 1.5) {
    return NextResponse.json({ error: "Upcharge cannot exceed 50% of original price" }, { status: 400 });
  }

  const { data: dispute, error } = await supabase
    .from("price_disputes")
    .insert({
      booking_id: bookingId,
      original_amount: originalAmount,
      requested_amount,
      salon_reason,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A dispute already exists for this booking" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dispute }, { status: 201 });
}

// PATCH /api/bookings/[id]/dispute — Customer responds to dispute
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, customer_response } = body;

  if (!action || !["approve", "dispute"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'dispute'" }, { status: 400 });
  }

  // Get the dispute for this booking where user is the customer
  const { data: dispute } = await supabase
    .from("price_disputes")
    .select("*, bookings(user_id)")
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .single();

  if (!dispute) return NextResponse.json({ error: "No pending dispute found" }, { status: 404 });

  const bookingUserId = (dispute.bookings as unknown as { user_id: string })?.user_id;
  if (bookingUserId !== user.id) {
    return NextResponse.json({ error: "Only the booking customer can respond" }, { status: 403 });
  }

  const newStatus = action === "approve" ? "customer_approved" : "disputed";
  const { error } = await supabase
    .from("price_disputes")
    .update({
      status: newStatus,
      customer_response: customer_response || null,
    })
    .eq("id", dispute.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: `Dispute ${newStatus}` });
}
