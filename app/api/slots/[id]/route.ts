export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation, bookingReschedule } from "@/lib/email";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: slot } = await supabase.from("availability_slots").select("*, salons(owner_id, name), bookings(id, user_id, starts_at), services(name_de)").eq("id", id).single();
  if (!slot) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
  if (slot.salons?.owner_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });

  // Cancel booking if present
  if (slot.status === "booked" && slot.booking_id) {
    await supabase.from("bookings").update({ status: "cancelled", cancellation_reason: "Slot removed by salon", cancelled_at: new Date().toISOString() }).eq("id", slot.booking_id);
    const admin = createAdminSupabaseClient();
    const { data: authUser } = await admin.auth.admin.getUserById(slot.booked_by ?? "");
    if (authUser?.user?.email) {
      try { await sendEmail(bookingCancellation(authUser.user.email, { service: slot.services?.name_de ?? "Service", salon: slot.salons?.name ?? "Salon", date: new Date(slot.starts_at).toLocaleDateString("de-CH") }, "de")); } catch {}
    }
  }

  const { error } = await supabase.from("availability_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: slot } = await supabase.from("availability_slots").select("*, salons(owner_id, name), services(duration_minutes, name_de)").eq("id", id).single();
  if (!slot) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
  if (slot.salons?.owner_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });

  const duration = slot.services?.duration_minutes ?? 60;
  
  // Combine date and start_time into starts_at / ends_at
  let startsAt = slot.starts_at;
  let endsAt = slot.ends_at;

  // The client may send `date` and `start_time` (legacy structure), or raw `starts_at` and `ends_at` (new DnD)
  if (body.starts_at && body.ends_at) {
    startsAt = body.starts_at;
    endsAt = body.ends_at;
  } else if (body.date && body.start_time) {
    startsAt = `${body.date}T${body.start_time}:00`;
    const d = new Date(startsAt);
    d.setMinutes(d.getMinutes() + duration);
    endsAt = d.toISOString().split(".")[0];
  }

  const updatePayload: Record<string, any> = { starts_at: startsAt, ends_at: endsAt };
  if (body.staff_member_id !== undefined) {
    updatePayload.staff_member_id = body.staff_member_id;
  }

  const { error } = await supabase.from("availability_slots").update(updatePayload).eq("id", id).select().single();
  if (error) {
    if (error.code === '23P01') {
       return NextResponse.json({ message: "Mitarbeiter ist in diesem Zeitraum bereits gebucht.", code: "CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Update booking if slot is booked
  if (slot.status === "booked" && slot.booking_id) {
    await supabase.from("bookings").update({ starts_at: startsAt, ends_at: endsAt, staff_member_id: updatePayload.staff_member_id ?? slot.staff_member_id }).eq("id", slot.booking_id);
    const admin = createAdminSupabaseClient();
    const { data: authUser } = await admin.auth.admin.getUserById(slot.booked_by ?? "");
    if (authUser?.user?.email) {
      try { await sendEmail(bookingReschedule(authUser.user.email, { service: slot.services?.name_de ?? "Service", salon: slot.salons?.name ?? "Salon", oldDate: slot.starts_at, newDate: startsAt }, "de")); } catch {}
    }
  }

  return NextResponse.json({ success: true, slot: { ...slot, ...updatePayload } });
}
