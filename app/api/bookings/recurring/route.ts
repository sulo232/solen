export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail, recurringConfirmation } from "@/lib/email";
import { validateBody, recurringBookingSchema } from "@/lib/validations";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { zurichYmd } from "@/lib/time/zurich";

export async function POST(request: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const body = await request.json();
  const { data: validated, error: validationError } = validateBody(recurringBookingSchema, body);
  if (validationError) return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  const { salon_id, service_id, staff_member_id, frequency, custom_interval_days, preferred_day, preferred_time } = validated;

  // Find the first available matching slot. Ring 2d: `*` shipped every slot column; the
  // handler below reads only id/starts_at/ends_at/staff_member_id/price_override off `firstSlot`
  // (grepped every `firstSlot.` reference in this file).
  let slotQuery = supabase
    .from("availability_slots")
    .select("id, starts_at, ends_at, staff_member_id, price_override")
    .eq("salon_id", salon_id)
    .eq("service_id", service_id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);

  if (staff_member_id) slotQuery = slotQuery.eq("staff_member_id", staff_member_id);

  const { data: slots } = await slotQuery;
  const firstSlot = slots?.[0];

  // Zurich-local calendar day, not a raw UTC slice: a slot whose Zurich-local start is
  // between 00:00 and 02:00 sits on the previous UTC day, so a startsWith/slice prefix
  // would silently bucket the recurring rule's next_booking_date onto the wrong day.
  const nextBookingDate = firstSlot
    ? zurichYmd(new Date(firstSlot.starts_at))
    : zurichYmd(new Date());

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
    const { data: profile } = await supabase.from("profiles").select("is_first_visit_default, locale").eq("id", user.id).single();
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
        // A9-email-locale (2026-07-27): the logged-in booker's own profile.locale, was hardcoded "de".
        const recurringLocale = (profile?.locale as "de" | "en" | "fr" | "it") ?? "de";
        await sendEmail(recurringConfirmation(user.email!, { frequency, service: service?.name_de ?? "Service", salon: salon?.name ?? "Salon" }, recurringLocale));
      } catch (err) { console.error("[bookings/recurring] confirmation email failed:", err); }
    }
  }

  return NextResponse.json({ data: { rule, first_booking: firstBooking } }, { status: 201 });
}
