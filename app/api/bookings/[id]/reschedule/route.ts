import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// POST /api/bookings/[id]/reschedule — Customer requests reschedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { new_slot_id } = body;
  if (!new_slot_id) return NextResponse.json({ error: "new_slot_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Verify booking belongs to user
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, status")
    .eq("id", id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Only confirmed bookings can be rescheduled" }, { status: 400 });
  }

  // Fetch new slot
  const { data: newSlot } = await admin
    .from("availability_slots")
    .select("id, starts_at, ends_at, status")
    .eq("id", new_slot_id)
    .eq("status", "available")
    .single();

  if (!newSlot) return NextResponse.json({ error: "Slot not available" }, { status: 400 });

  // Update booking with reschedule request
  const { error } = await admin
    .from("bookings")
    .update({
      reschedule_requested_at: new Date().toISOString(),
      reschedule_to: newSlot.starts_at,
      reschedule_status: "pending",
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify salon owner
  const { data: salon } = await admin
    .from("salons")
    .select("owner_id, name")
    .eq("id", booking.salon_id)
    .single();

  if (salon) {
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", salon.owner_id)
      .single();

    if (ownerProfile) {
      const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);
      if (ownerAuth?.user?.email) {
        const newDate = new Date(newSlot.starts_at).toLocaleDateString("de-CH", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const newTime = new Date(newSlot.starts_at).toLocaleTimeString("de-CH", {
          hour: "2-digit", minute: "2-digit",
        });
        await sendEmail({
          to: ownerAuth.user.email,
          subject: `Umbuchungsanfrage — ${salon.name}`,
          html: `<p>Ein Kunde möchte seinen Termin verschieben auf <strong>${newDate}, ${newTime} Uhr</strong>.</p><p>Bitte bestätige oder lehne die Anfrage in deinem Dashboard ab.</p>`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, reschedule_status: "pending" });
}

// PATCH /api/bookings/[id]/reschedule — Salon owner approves/rejects
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body as { action: "approve" | "reject" };
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Fetch booking with reschedule data
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, slot_id, reschedule_to, reschedule_status")
    .eq("id", id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.reschedule_status !== "pending") {
    return NextResponse.json({ error: "No pending reschedule request" }, { status: 400 });
  }

  // Verify salon ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id, name")
    .eq("id", booking.salon_id)
    .single();

  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    // Find the new slot matching reschedule_to
    const { data: newSlot } = await admin
      .from("availability_slots")
      .select("id, starts_at, ends_at")
      .eq("starts_at", booking.reschedule_to)
      .eq("salon_id", salon.id)
      .eq("status", "available")
      .single();

    if (!newSlot) {
      return NextResponse.json({ error: "New slot no longer available" }, { status: 400 });
    }

    // Release old slot
    if (booking.slot_id) {
      await admin.from("availability_slots").update({ status: "available" }).eq("id", booking.slot_id);
    }

    // Book new slot
    await admin.from("availability_slots").update({ status: "booked" }).eq("id", newSlot.id);

    // Update booking
    await admin.from("bookings").update({
      starts_at: newSlot.starts_at,
      ends_at: newSlot.ends_at,
      slot_id: newSlot.id,
      reschedule_status: "approved",
    }).eq("id", id);
  } else {
    await admin.from("bookings").update({ reschedule_status: "rejected" }).eq("id", id);
  }

  // Notify customer
  const { data: customerAuth } = await admin.auth.admin.getUserById(booking.user_id);
  if (customerAuth?.user?.email) {
    const statusText = action === "approve" ? "bestätigt" : "abgelehnt";
    await sendEmail({
      to: customerAuth.user.email,
      subject: `Umbuchung ${statusText} — ${salon.name}`,
      html: `<p>Deine Umbuchungsanfrage bei <strong>${salon.name}</strong> wurde <strong>${statusText}</strong>.</p>`,
    });
  }

  return NextResponse.json({ ok: true, reschedule_status: action === "approve" ? "approved" : "rejected" });
}
