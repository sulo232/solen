export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, recurringConfirmation } from "@/lib/email";
import { validateBody, recurringBookingSchema } from "@/lib/validations";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { claimSlot } from "@/lib/bookings/claim-slot";
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

  // Resolve the service through the session before using privileged slot access.
  const { data: service, error: serviceError } = await supabase.from("services")
    .select("price, name_de").eq("id", service_id).eq("salon_id", salon_id).single();
  if (serviceError || !service) {
    console.error("[bookings/recurring] service lookup failed:", serviceError);
    return NextResponse.json({ message: "Service unavailable", code: "DB_ERROR" }, { status: 500 });
  }
  if (staff_member_id) {
    const { data: staff, error: staffError } = await supabase.from("staff_members")
      .select("id").eq("id", staff_member_id).eq("salon_id", salon_id).single();
    if (staffError || !staff) {
      console.error("[bookings/recurring] staff lookup failed:", staffError);
      return NextResponse.json({ message: "Staff unavailable", code: "DB_ERROR" }, { status: 500 });
    }
  }
  const admin = createAdminSupabaseClient();

  // Find the first available matching slot. Ring 2d: `*` shipped every slot column; the
  // handler below reads only id/starts_at/ends_at/staff_member_id/price_override off `firstSlot`
  // (grepped every `firstSlot.` reference in this file).
  let slotQuery = admin
    .from("availability_slots")
    .select("id, starts_at, ends_at, staff_member_id, price_override")
    .eq("salon_id", salon_id)
    .eq("service_id", service_id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);

  if (staff_member_id) slotQuery = slotQuery.eq("staff_member_id", staff_member_id);

  const { data: slots, error: slotError } = await slotQuery;
  if (slotError) {
    console.error("[bookings/recurring] slot lookup failed:", slotError);
    return NextResponse.json({ message: "Slot lookup failed", code: "DB_ERROR" }, { status: 500 });
  }
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

  if (ruleError || !rule) {
    console.error("[bookings/recurring] rule insert failed:", ruleError);
    return NextResponse.json({ message: "Could not create recurring rule", code: "DB_ERROR" }, { status: 500 });
  }

  const ruleId = rule.id;

  // Compensate only rows created by this request, and detect silent zero-row writes.
  async function rollback(bookingId?: string): Promise<boolean> {
    let restored = true;
    if (bookingId) {
      try {
        const { data: deleted, error } = await admin.from("bookings").delete()
          .eq("id", bookingId).eq("user_id", user!.id).eq("recurring_group_id", ruleId).select("id");
        if (error || !deleted?.some((row) => row.id === bookingId)) {
          restored = false;
          console.error("[bookings/recurring] booking rollback failed:", { bookingId, error });
        }
      } catch (error) {
        restored = false;
        console.error("[bookings/recurring] booking rollback threw:", { bookingId, error });
      }
    }
    try {
      const { data: deactivated, error } = await admin.from("recurring_booking_rules")
        .update({ is_active: false }).eq("id", ruleId).eq("user_id", user!.id).select("id");
      if (error || !deactivated?.some((row) => row.id === ruleId)) {
        restored = false;
        console.error("[bookings/recurring] rule rollback failed:", { ruleId: ruleId, error });
      }
    } catch (error) {
      restored = false;
      console.error("[bookings/recurring] rule rollback threw:", { ruleId: ruleId, error });
    }
    return restored;
  }

  // Create first booking if a slot is available
  let firstBooking = null;
  if (firstSlot) {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("is_first_visit_default, locale").eq("id", user.id).single();
    if (profileError) {
      console.error("[bookings/recurring] profile lookup failed:", profileError);
      const restored = await rollback();
      return NextResponse.json({ message: "Could not create first booking", code: restored ? "DB_ERROR" : "ROLLBACK_FAILED" }, { status: 500 });
    }

    const { data: booking, error: bookingError } = await supabase
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

    const bookingId = booking?.id;
    if (bookingError || !booking) {
      console.error("[bookings/recurring] booking insert failed:", bookingError);
      const restored = await rollback(bookingId);
      const conflict = bookingError?.code === "23P01" || bookingError?.code === "23505";
      return NextResponse.json({
        message: restored ? "Could not create first booking" : "Booking recovery failed",
        code: restored ? (conflict ? "SLOT_TAKEN" : "DB_ERROR") : "ROLLBACK_FAILED",
      }, { status: restored && conflict ? 409 : 500 });
    }

    const { claimed, error: claimError } = await claimSlot(admin, firstSlot.id, {
      booked_by: user.id, booking_id: booking.id,
    });
    if (claimError || !claimed) {
      if (claimError) console.error("[bookings/recurring] slot claim failed:", claimError);
      const restored = await rollback(booking.id);
      const conflict = !claimError || claimError.code === "23P01" || claimError.code === "23505";
      return NextResponse.json({
        message: restored ? (conflict ? "Slot not available" : "Slot claim failed") : "Booking recovery failed",
        code: restored ? (conflict ? "SLOT_TAKEN" : "DB_ERROR") : "ROLLBACK_FAILED",
      }, { status: restored && conflict ? 409 : 500 });
    }
    firstBooking = booking;
    const { data: salon } = await supabase.from("salons").select("name").eq("id", salon_id).single();
    try {
      // A9-email-locale (2026-07-27): the logged-in booker's own profile.locale, was hardcoded "de".
      const recurringLocale = (profile?.locale as "de" | "en" | "fr" | "it") ?? "de";
      await sendEmail(recurringConfirmation(user.email!, { frequency, service: service?.name_de ?? "Service", salon: salon?.name ?? "Salon" }, recurringLocale));
    } catch (err) { console.error("[bookings/recurring] confirmation email failed:", err); }
  }

  return NextResponse.json({ data: { rule, first_booking: firstBooking } }, { status: 201 });
}
