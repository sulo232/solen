export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, createSlotSchema } from "@/lib/validations";

// GET /api/slots?salon_id=&date=&service_id=&staff_member_id=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salon_id = searchParams.get("salon_id");
  const date = searchParams.get("date"); // YYYY-MM-DD (single day)
  const week = searchParams.get("week"); // YYYY-MM-DD anchor -> 7-day window (dashboard calendar, G3/V3-D421)
  const service_id = searchParams.get("service_id");
  const staff_member_id = searchParams.get("staff_member_id");

  if (!salon_id || (!date && !week)) {
    return NextResponse.json(
      { message: "salon_id and (date or week) are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Build time range: single day (`date`) or a 7-day window (`week` anchor).
  // Date.UTC handles month/year rollover TZ-stably; comparison strings stay
  // naive (matches the stored starts_at format / prior single-day behavior).
  const anchor = (week ?? date) as string;
  const span = week ? 7 : 1;
  const [ay, am, ad] = anchor.split("-").map(Number);
  const endDate = new Date(Date.UTC(ay, am - 1, ad + span));
  const startOfRange = `${anchor}T00:00:00`;
  const endOfRange = `${endDate.toISOString().slice(0, 10)}T00:00:00`;

  let query = supabase
    .from("availability_slots")
    .select("*, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)")
    .eq("salon_id", salon_id)
    .gte("starts_at", startOfRange)
    .lt("starts_at", endOfRange)
    .order("starts_at", { ascending: true });

  if (service_id) query = query.eq("service_id", service_id);
  if (staff_member_id) query = query.eq("staff_member_id", staff_member_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Apply off-peak discounts to matching slots
  const slots = data ?? [];
  if (date && slots.length > 0) {
    const slotDate = new Date(date + "T00:00:00");
    const dayOfWeek = slotDate.getDay();

    const { data: offPeakRules } = await supabase
      .from("off_peak_slots")
      .select("start_time, end_time, discount_percent")
      .eq("salon_id", salon_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (offPeakRules && offPeakRules.length > 0) {
      for (const slot of slots) {
        const slotTime = (slot.starts_at as string).slice(11, 16);
        const match = offPeakRules.find(
          (r) => slotTime >= r.start_time.slice(0, 5) && slotTime < r.end_time.slice(0, 5)
        );
        if (match && slot.services?.price) {
          (slot as any).discounted_price = Math.round(
            slot.services.price * (1 - match.discount_percent / 100)
          );
          (slot as any).off_peak_discount = match.discount_percent;
        }
      }
    }
  }

  // `slots` alias: the dashboard calendar reads `data.slots`; `items` kept for back-compat.
  return NextResponse.json({ items: slots, slots, total: slots.length });
}

// POST /api/slots — create ONE availability slot (dashboard SlotCreateModal).
// Body: { date: "YYYY-MM-DD", start_time: "HH:MM", service_id, staff_member_id?: uuid|null }.
// No salon_id by design: it's derived from the service, then ownership is verified. ends_at is
// computed from the service's duration_minutes. New slots are always status='available'.
// The modal ignores the body and re-fetches via loadSlots(); we still return { slot } (the
// G1 GET contract) so callers/tests can read the created row.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error("[slots] POST invalid JSON body:", err);
    return NextResponse.json({ message: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { data: validated, error: valError } = validateBody(createSlotSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { date, start_time, service_id, staff_member_id } = validated;

  // 1. Resolve the service -> its salon + duration. service_id is NOT NULL on the slot table,
  //    so a valid, existing service is mandatory. salon_id is taken from the service (the modal
  //    never sends it) which also means a slot can only ever attach to the service's own salon.
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, salon_id, duration_minutes")
    .eq("id", service_id)
    .single();
  if (serviceError || !service) {
    return NextResponse.json({ message: "Service not found", code: "SERVICE_NOT_FOUND" }, { status: 404 });
  }

  // 2. Ownership: the caller MUST own the service's salon. Never create a slot for a salon you
  //    don't own. RLS (slots_manage_owner) is the DB-level backstop; this returns a clean 403.
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", service.salon_id)
    .single();
  if (salonError || !salon) {
    return NextResponse.json({ message: "Salon not found", code: "SALON_NOT_FOUND" }, { status: 404 });
  }
  if (salon.owner_id !== user.id) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // 3. Compute starts_at / ends_at. Mirror the PATCH route (/api/slots/[id]): a NAIVE local
  //    "YYYY-MM-DDTHH:MM:00" string (no Z) so it lands on the wall-clock time the owner picked,
  //    consistent with how existing slots are stored / read by the calendar.
  const duration = service.duration_minutes ?? 60;
  const startsAt = `${date}T${start_time}:00`;
  const endDate = new Date(startsAt);
  if (Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ message: "Invalid date/time", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  endDate.setMinutes(endDate.getMinutes() + duration);
  // Local "YYYY-MM-DDTHH:MM:SS" (strip the toISOString Z + ms) to keep the same naive shape.
  const pad = (n: number) => String(n).padStart(2, "0");
  const endsAt = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;

  // 4. Insert one available slot via the RLS client (slots_manage_owner gates it again).
  const { data: slot, error: insertError } = await supabase
    .from("availability_slots")
    .insert({
      salon_id: service.salon_id,
      service_id,
      staff_member_id: staff_member_id ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "available",
    })
    .select("*, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)")
    .single();

  if (insertError) {
    // PostgREST PGRST204 = a column in the payload doesn't exist on the live table (schema
    // drift). Surface it clearly instead of a 500 so the caller knows it's a missing column.
    if (insertError.code === "PGRST204") {
      console.error("[slots] POST schema drift — column missing on availability_slots:", insertError);
      return NextResponse.json(
        { message: `availability_slots is missing a required column: ${insertError.message}`, code: "SCHEMA_DRIFT" },
        { status: 500 },
      );
    }
    console.error("[slots] POST insert failed:", insertError);
    return NextResponse.json({ message: insertError.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ slot }, { status: 201 });
}
