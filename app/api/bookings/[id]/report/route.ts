export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, reportDisputeSchema, salonDisputeResponseSchema } from "@/lib/validations";

// GET — customer views their dispute for a booking
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dispute } = await supabase
    .from("booking_disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("reporter_id", user.id)
    .single();

  return NextResponse.json({ dispute: dispute ?? null });
}

// POST — customer files a complaint
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const disabled = await checkFeatureEnabled("dispute_reporting");
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
  const { data: validated, error: validationError } = validateBody(reportDisputeSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  // Verify booking belongs to user and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, status, salons(owner_id)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only report a problem on completed bookings" }, { status: 400 });
  }

  const salonOwnerId = (booking.salons as unknown as { owner_id: string })?.owner_id;

  const { data: dispute, error } = await supabase
    .from("booking_disputes")
    .insert({
      booking_id: bookingId,
      reporter_id: user.id,
      reported_id: salonOwnerId,
      issue_type: validated.issue_type,
      description: validated.description,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A dispute has already been filed for this booking" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Phase 7: Email notification to salon owner
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[booking-disputes] RESEND_API_KEY not set — skipping email notification");
  }
  if (salonOwnerId && resendApiKey) {
    const { data: owner } = await supabase.from("profiles").select("email").eq("id", salonOwnerId).single();
    if (owner?.email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'support@solen.ch',
            to: owner.email,
            subject: 'Ein Kunde hat ein Problem mit einer Buchung gemeldet',
            html: `<p>Ein Kunde hat ein Problem mit Buchung #${bookingId} gemeldet.</p>
                   <p><strong>Typ:</strong> ${validated.issue_type}</p>
                   <p>Bitte loggen Sie sich in Ihr Dashboard ein, um zu antworten.</p>`,
          }),
        });
      } catch (e) {
        console.error("Failed to send dispute email to salon owner", e);
      }
    }
  }

  return NextResponse.json({ dispute }, { status: 201 });
}

// PATCH — salon owner adds their response
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(salonDisputeResponseSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  // Verify user is salon owner for this booking
  const { data: dispute } = await supabase
    .from("booking_disputes")
    .select("id, status, bookings(salon_id, salons(owner_id))")
    .eq("booking_id", bookingId)
    .single();

  if (!dispute) return NextResponse.json({ error: "No dispute found for this booking" }, { status: 404 });

  const booking = (dispute as any).bookings;
  const salonOwnerId = booking?.salons?.owner_id;
  if (salonOwnerId !== user.id) {
    return NextResponse.json({ error: "Only the salon owner can respond to this dispute" }, { status: 403 });
  }

  if (dispute.status !== "open") {
    return NextResponse.json({ error: "Can only respond to open disputes" }, { status: 400 });
  }

  const { error } = await supabase
    .from("booking_disputes")
    .update({
      salon_response: validated.salon_response,
      salon_responded_at: new Date().toISOString(),
      status: "in_review",
    })
    .eq("id", dispute.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Response submitted. Admin will review both sides." });
}
