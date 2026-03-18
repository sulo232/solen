import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail, recurringConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { salon_id, service_id, staff_member_id, frequency, custom_interval_days, preferred_day, preferred_time } = body;

  if (!salon_id || !service_id || !frequency) {
    return NextResponse.json({ message: "salon_id, service_id, frequency required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Find the first available matching slot
  let slotQuery = supabase
    .from("availability_slots")
    .select("*")
    .eq("salon_id", salon_id)
    .eq("service_id", service_id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);

  if (staff_member_id) slotQuery = slotQuery.eq("staff_member_id", staff_member_id);

  const { data: slots } = await slotQuery;
  const firstSlot = slots?.[0];

  const nextBookingDate = firstSlot
    ? new Date(firstSlot.starts_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Create the recurring rule
  const { data: rule, error: ruleError } = await supabase
    .from("recurring_booking_rules")
    .insert({
      user_id: user.id,
      salon_id,
      service_id,
      staff_member_id: staff_member_id ?? null,
      frequency,
      custom_interval_days: custom_interval_days ?? null,
      preferred_day: preferred_day ?? null,
      preferred_time: preferred_time ?? null,
      next_booking_date: nextBookingDate,
    })
    .select()
    .single();

  if (ruleError) return NextResponse.json({ message: ruleError.message, code: "DB_ERROR" }, { status: 500 });

  // Create first booking if a slot is available
  let firstBooking = null;
  if (firstSlot) {
    const { data: profile } = await supabase.from("profiles").select("is_first_visit_default").eq("id", user.id).single();
    const { data: service } = await supabase.from("services").select("price, name_de").eq("id", service_id).single();

    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        salon_id,
        service_id,
        staff_member_id: staff_member_id ?? firstSlot.staff_member_id,
        slot_id: firstSlot.id,
        starts_at: firstSlot.starts_at,
        ends_at: firstSlot.ends_at,
        price_paid: firstSlot.price_override ?? service?.price ?? 0,
        status: "confirmed",
        is_first_visit: profile?.is_first_visit_default ?? true,
        is_recurring: true,
        recurring_group_id: rule.id,
      })
      .select()
      .single();

    if (booking) {
      firstBooking = booking;
      await supabase
        .from("availability_slots")
        .update({ status: "booked", booked_by: user.id, booking_id: booking.id })
        .eq("id", firstSlot.id);

      const { data: salon } = await supabase.from("salons").select("name").eq("id", salon_id).single();
      try {
        await sendEmail(recurringConfirmation(user.email!, { frequency, service: service?.name_de ?? "Service", salon: salon?.name ?? "Salon" }, "de"));
      } catch { /* non-fatal */ }
    }
  }

  return NextResponse.json({ data: { rule, first_booking: firstBooking } }, { status: 201 });
}
