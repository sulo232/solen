export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation, bookingReschedule, type EmailLocale } from "@/lib/email";
import { zurichWallClockToUtc } from "@/lib/time/zurich";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { resolveSwissLocale } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import { validateBody, slotPatchSchema } from "@/lib/validations";
import { localizedField } from "@/lib/i18n/localized-field";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: slot } = await supabase.from("availability_slots").select("*, salons(owner_id, name), bookings(id, user_id, starts_at), services(name_de, name_en, name_fr, name_it)").eq("id", id).single();
  if (!slot) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
  if (slot.salons?.owner_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });

  // A slot carrying a booking can never be DELETEd: bookings.slot_id is NOT NULL with
  // ON DELETE RESTRICT, so even after the booking is cancelled the FK still points at this
  // row and the delete below would throw 23503 -> 500 (booking cancelled, slot stuck
  // "booked"). Cancel the booking and free the slot in place instead of deleting it.
  if (slot.status === "booked" && slot.booking_id) {
    await supabase.from("bookings").update({ status: "cancelled", cancellation_reason: "Slot removed by salon", cancelled_at: new Date().toISOString() }).eq("id", slot.booking_id);
    const admin = createAdminSupabaseClient();
    const { data: authUser } = await admin.auth.admin.getUserById(slot.booked_by ?? "");
    if (authUser?.user?.email) {
      // locale added 2026-07-26 (de-CH literal sweep): was hardcoded "de" for both the
      // email language and the embedded date, regardless of the customer's own locale.
      const { data: bookedProfile } = await admin.from("profiles").select("locale").eq("id", slot.booked_by ?? "").maybeSingle();
      const custLocale = (bookedProfile?.locale ?? "de") as EmailLocale;
      try { await sendEmail(bookingCancellation(authUser.user.email, { service: localizedField(slot.services, "name", custLocale) || "Service", salon: slot.salons?.name ?? "Salon", date: new Date(slot.starts_at).toLocaleDateString(resolveSwissLocale(custLocale)) }, custLocale)); } catch (err) { console.error("[slots/[id]] DELETE cancellation email failed:", err); }
    }
    const { error: freeError } = await supabase.from("availability_slots").update({ status: "available", booking_id: null, booked_by: null }).eq("id", id);
    if (freeError) return NextResponse.json({ message: freeError.message, code: "DB_ERROR" }, { status: 500 });
    return NextResponse.json({ success: true, freed: true });
  }

  const { error } = await supabase.from("availability_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawBody = await request.json();
  const { data: body, error: validationError } = validateBody(slotPatchSchema, rawBody);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: slot } = await supabase.from("availability_slots").select("*, salons(owner_id, name), services(duration_minutes, name_de, name_en, name_fr, name_it)").eq("id", id).single();
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
    // body.date/start_time are the Zurich wall-clock the owner picked; convert to the true
    // UTC instant (same helper the cron uses) instead of storing the naive wall-clock as if
    // it were already UTC.
    const [startH, startM] = (body.start_time as string).split(":").map(Number);
    const d = zurichWallClockToUtc(body.date as string, startH, startM);
    startsAt = d.toISOString();
    d.setMinutes(d.getMinutes() + duration);
    endsAt = d.toISOString();
  }

  const updatePayload: Database["public"]["Tables"]["availability_slots"]["Update"] = { starts_at: startsAt, ends_at: endsAt };
  if (body.staff_member_id !== undefined) {
    // staff_member_id (when non-null) must belong to this slot's own salon, otherwise
    // the owner could cross-reference another salon's staff member onto this slot.
    if (body.staff_member_id) {
      const { data: staffMember } = await supabase
        .from("staff_members")
        .select("id")
        .eq("id", body.staff_member_id)
        .eq("salon_id", slot.salon_id)
        .single();
      if (!staffMember) {
        return NextResponse.json({ message: "staff_member_id does not belong to this salon", code: "STAFF_SALON_MISMATCH" }, { status: 400 });
      }
    }
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
      // locale added 2026-07-26 (de-CH literal sweep): was hardcoded "de"; bookingReschedule
      // already formats oldDate/newDate per its locale param internally, so this alone fixes it.
      const { data: bookedProfile } = await admin.from("profiles").select("locale").eq("id", slot.booked_by ?? "").maybeSingle();
      const custLocale = (bookedProfile?.locale ?? "de") as EmailLocale;
      try { await sendEmail(bookingReschedule(authUser.user.email, { service: localizedField(slot.services, "name", custLocale) || "Service", salon: slot.salons?.name ?? "Salon", oldDate: slot.starts_at, newDate: startsAt }, custLocale)); } catch (err) { console.error("[slots/[id]] PATCH reschedule email failed:", err); }
    }
  }

  return NextResponse.json({ success: true, slot: { ...slot, ...updatePayload } });
}
