import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { PaginatedResponse, Booking } from "@/lib/types";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/bookings
 * List authenticated user's bookings.
 * Query params: status, page
 *
 * POST /api/bookings
 * Create a new booking.
 * Body: { slot_id, service_id, staff_member_id?, is_first_visit }
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page   = parseInt(searchParams.get("page") ?? "1", 10);
  const limit  = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("bookings")
    .select("*, salons(name, slug, cover_photo_url), services(name_de, name_en, duration_minutes), staff_members(name, avatar_url)", { count: "exact" })
    .eq("user_id", user.id)
    .order("starts_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  const response: PaginatedResponse<Booking> = {
    items: (data as unknown as Booking[]) ?? [],
    total: count ?? 0,
    page,
    limit,
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { slot_id, service_id, staff_member_id, is_first_visit } = body;

  if (!slot_id || !service_id) {
    return NextResponse.json({ message: "slot_id and service_id are required", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Validate slot is available
  const { data: slot, error: slotError } = await supabase
    .from("availability_slots")
    .select("*, services(*), salons(*)")
    .eq("id", slot_id)
    .eq("status", "available")
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ message: "Slot is not available", code: "SLOT_UNAVAILABLE" }, { status: 409 });
  }

  const pricePaid = slot.price_override ?? (slot as { services: { price: number } }).services.price;

  // Create booking + mark slot as booked in a transaction
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id:         user.id,
      salon_id:        slot.salon_id,
      service_id,
      staff_member_id: staff_member_id ?? slot.staff_member_id,
      slot_id,
      starts_at:       slot.starts_at,
      ends_at:         slot.ends_at,
      price_paid:      pricePaid,
      status:          "confirmed",
      is_first_visit:  Boolean(is_first_visit),
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ message: bookingError?.message ?? "Booking failed", code: "DB_ERROR" }, { status: 500 });
  }

  // Update slot status
  await supabase
    .from("availability_slots")
    .update({
      status:     "booked",
      booked_by:  user.id,
      booking_id: booking.id,
    })
    .eq("id", slot_id);

  // Send confirmation email (non-blocking)
  const profile = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  await sendEmail("booking_confirmation", user.email!, {
    name:    profile.data?.display_name ?? "",
    service: (slot as { services: { name_de: string } }).services.name_de,
    salon:   (slot as { salons: { name: string } }).salons.name,
    date:    slot.starts_at,
    time:    slot.starts_at,
  });

  return NextResponse.json(booking, { status: 201 });
}
