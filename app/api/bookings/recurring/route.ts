import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/bookings/recurring
 * Create a recurring booking rule + first booking.
 * Body: { salon_id, service_id, staff_member_id?, frequency,
 *         custom_interval_days?, preferred_day, preferred_time }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const {
    salon_id, service_id, staff_member_id,
    frequency, custom_interval_days,
    preferred_day, preferred_time,
    slot_id,
  } = body;

  if (!salon_id || !service_id || !frequency || !slot_id) {
    return NextResponse.json({ message: "Missing required fields", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Validate slot
  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*, services(*), salons(*)")
    .eq("id", slot_id)
    .eq("status", "available")
    .single();

  if (!slot) {
    return NextResponse.json({ message: "Slot is not available", code: "SLOT_UNAVAILABLE" }, { status: 409 });
  }

  const pricePaid = slot.price_override ?? (slot as { services: { price: number } }).services.price;
  const recurringGroupId = crypto.randomUUID();

  // Create first booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id:            user.id,
      salon_id,
      service_id,
      staff_member_id:    staff_member_id ?? null,
      slot_id,
      starts_at:          slot.starts_at,
      ends_at:            slot.ends_at,
      price_paid:         pricePaid,
      status:             "confirmed",
      is_first_visit:     false,
      is_recurring:       true,
      recurring_group_id: recurringGroupId,
    })
    .select()
    .single();

  if (bookingError) {
    return NextResponse.json({ message: bookingError.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Mark slot as booked
  await supabase
    .from("availability_slots")
    .update({ status: "booked", booked_by: user.id, booking_id: booking.id })
    .eq("id", slot_id);

  // Compute next booking date based on frequency
  const firstDate = new Date(slot.starts_at);
  let nextDate = new Date(firstDate);
  switch (frequency) {
    case "weekly":    nextDate.setDate(nextDate.getDate() + 7);    break;
    case "biweekly":  nextDate.setDate(nextDate.getDate() + 14);   break;
    case "monthly":   nextDate.setMonth(nextDate.getMonth() + 1);  break;
    case "custom":    nextDate.setDate(nextDate.getDate() + (custom_interval_days ?? 7)); break;
  }

  // Create recurring rule
  const { data: rule } = await supabase
    .from("recurring_booking_rules")
    .insert({
      user_id:              user.id,
      salon_id,
      service_id,
      staff_member_id:      staff_member_id ?? null,
      frequency,
      custom_interval_days: custom_interval_days ?? null,
      preferred_day:        preferred_day ?? null,
      preferred_time:       preferred_time ?? null,
      next_booking_date:    nextDate.toISOString().split("T")[0],
      is_active:            true,
    })
    .select()
    .single();

  // Send recurring confirmation email
  await sendEmail("recurring_confirmation", user.email!, {
    frequency,
    service: (slot as { services: { name_de: string } }).services.name_de,
    salon:   (slot as { salons: { name: string } }).salons.name,
  });

  return NextResponse.json({ booking, rule }, { status: 201 });
}
