export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, bulkCreateSlotsSchema, blockDaySchema } from "@/lib/validations";
import { zurichWallClockToUtc } from "@/lib/time/zurich";

// POST /api/slots/bulk — TWO shapes hit this one endpoint (matching the dashboard calendar):
//
//   A. BulkCreateModal "Wochenplan": { salon_id, service_id, staff_member_id?, weeks, template }
//      where template = { mon|tue|…|sun: { start:"HH:MM", end:"HH:MM" } | null }. Generates one
//      available slot per service-duration step inside each enabled weekday window, repeated for
//      `weeks` weeks starting from the CURRENT week's Monday. Past times are skipped.
//
//   B. blockDay() Lock button: { salon_id, block_date:"YYYY-MM-DD" }. service_id is NOT NULL on
//      availability_slots, so we can't insert placeholder "blocked" rows; instead we flip the
//      salon's existing `available` slots on that date to `blocked` (mirrors the generate-slots
//      cron, which also blocks by UPDATE, never INSERT).
//
// Both require the caller to OWN the target salon. RLS (slots_manage_owner) is the DB backstop;
// the explicit check returns a clean 403 instead of an opaque RLS error.

const DAY_OFFSET: Record<string, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const pad = (n: number) => String(n).padStart(2, "0");

// Current week's Monday at 00:00 local (same rule as the calendar's startOfWeek()).
function startOfWeekMonday(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[slots] bulk POST invalid JSON body:", err);
    return NextResponse.json({ message: "Invalid JSON body", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // ── Branch B: block a whole day (discriminated by `block_date`). ──
  if ("block_date" in body && body.block_date != null) {
    return blockDay(supabase, user.id, body);
  }

  // ── Branch A: weekly bulk create. ──
  const { data: validated, error: valError } = validateBody(bulkCreateSlotsSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { salon_id, service_id, staff_member_id, weeks, template } = validated;

  // 1. Ownership.
  const ownErr = await assertOwnsSalon(supabase, user.id, salon_id);
  if (ownErr) return ownErr;

  // 2. The service drives the slot length AND must belong to this salon (service_id is NOT NULL
  //    and a slot must not reference another salon's service).
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, salon_id, duration_minutes")
    .eq("id", service_id)
    .single();
  if (serviceError || !service) {
    return NextResponse.json({ message: "Service not found", code: "SERVICE_NOT_FOUND" }, { status: 404 });
  }
  if (service.salon_id !== salon_id) {
    return NextResponse.json({ message: "Service does not belong to this salon", code: "SERVICE_SALON_MISMATCH" }, { status: 400 });
  }

  const duration = service.duration_minutes ?? 60;
  if (duration <= 0) {
    return NextResponse.json({ message: "Service has an invalid duration", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // 2b. staff_member_id (when supplied) must belong to this salon too, same reasoning as
  //     the service check above: a slot referencing another salon's staff pollutes that
  //     salon's own analytics (bookings/reviews there are filtered by staff_member_id only).
  if (staff_member_id) {
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", staff_member_id)
      .eq("salon_id", salon_id)
      .single();
    if (!staffMember) {
      return NextResponse.json({ message: "staff_member_id does not belong to this salon", code: "STAFF_SALON_MISMATCH" }, { status: 400 });
    }
  }

  // 3. Walk the weeks × enabled-weekdays × duration-steps and build the rows.
  const now = new Date();
  const monday = startOfWeekMonday(now);
  type Row = { salon_id: string; service_id: string; staff_member_id: string | null; starts_at: string; ends_at: string; status: "available" };
  const rows: Row[] = [];

  for (let w = 0; w < weeks; w++) {
    for (const [key, offset] of Object.entries(DAY_OFFSET)) {
      const window = template[key as keyof typeof template];
      if (!window) continue; // closed weekday

      const [startH, startM] = window.start.split(":").map(Number);
      const [endH, endM] = window.end.split(":").map(Number);

      const dayDate = new Date(monday);
      dayDate.setDate(dayDate.getDate() + w * 7 + offset);
      const dateStr = `${dayDate.getFullYear()}-${pad(dayDate.getMonth() + 1)}-${pad(dayDate.getDate())}`;

      // window.start/end are the Zurich wall-clock the owner picked; convert to the true
      // UTC instant (same helper the cron uses) instead of storing the naive wall-clock
      // as if it were already UTC (was landing 1-2h off, matching the CH DST offset).
      let cursor = zurichWallClockToUtc(dateStr, startH, startM);
      const dayEnd = zurichWallClockToUtc(dateStr, endH, endM);

      while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + duration * 60000);
        // Skip past slots so a mid-week 2/4-week plan doesn't backfill yesterday.
        if (cursor.getTime() >= now.getTime()) {
          rows.push({
            salon_id,
            service_id,
            staff_member_id: staff_member_id ?? null,
            starts_at: cursor.toISOString(),
            ends_at: slotEnd.toISOString(),
            status: "available",
          });
        }
        cursor = new Date(slotEnd.getTime());
      }
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, slots: [], message: "No slots to create (all selected times are in the past or the window is shorter than the service duration)." });
  }

  // 4. Dedup against existing slots in the generated window (mirrors the cron's existence check)
  //    so re-running a plan doesn't pile up identical slots. Key = staff_member_id|starts_at,
  //    scoped to this salon + service over [min, max] of the generated range.
  const startsList = rows.map((r) => r.starts_at).sort();
  const minStart = startsList[0];
  const maxStart = startsList[startsList.length - 1];
  const { data: existing, error: existingError } = await supabase
    .from("availability_slots")
    .select("starts_at, staff_member_id")
    .eq("salon_id", salon_id)
    .eq("service_id", service_id)
    .gte("starts_at", minStart)
    .lte("starts_at", maxStart);
  if (existingError) {
    console.error("[slots] bulk POST existing-slot lookup failed:", existingError);
    return NextResponse.json({ message: existingError.message, code: "DB_ERROR" }, { status: 500 });
  }
  const existingKeys = new Set((existing ?? []).map((e) => `${e.staff_member_id ?? "null"}|${e.starts_at}`));
  const toInsert = rows.filter((r) => !existingKeys.has(`${r.staff_member_id ?? "null"}|${r.starts_at}`));

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0, slots: [], message: "All matching slots already exist." });
  }

  // 5. Insert via the RLS client (slots_manage_owner gates it again).
  const { data: created, error: insertError } = await supabase
    .from("availability_slots")
    .insert(toInsert)
    .select("*, services(id, name_de, name_en, duration_minutes, price), staff_members(id, name, avatar_url)");

  if (insertError) {
    if (insertError.code === "PGRST204") {
      console.error("[slots] bulk POST schema drift — column missing on availability_slots:", insertError);
      return NextResponse.json(
        { message: `availability_slots is missing a required column: ${insertError.message}`, code: "SCHEMA_DRIFT" },
        { status: 500 },
      );
    }
    console.error("[slots] bulk POST insert failed:", insertError);
    return NextResponse.json({ message: insertError.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ created: created?.length ?? 0, slots: created ?? [] }, { status: 201 });
}

// ── Branch B handler: flip the salon's available slots on `block_date` to `blocked`. ──
async function blockDay(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  body: Record<string, unknown>,
) {
  const { data: validated, error: valError } = validateBody(blockDaySchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { salon_id, block_date } = validated;

  const ownErr = await assertOwnsSalon(supabase, userId, salon_id);
  if (ownErr) return ownErr;

  // The day is [block_date T00:00, next-day T00:00). Compare as naive strings, the same shape the
  // slots are stored in (GET /api/slots uses the identical bound construction).
  const [y, m, d] = block_date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const dayStart = `${block_date}T00:00:00`;
  const dayEnd = `${next.toISOString().slice(0, 10)}T00:00:00`;

  // Only flip `available` slots — never touch a booked appointment via the block button.
  const { data: blocked, error: updateError } = await supabase
    .from("availability_slots")
    .update({ status: "blocked" })
    .eq("salon_id", salon_id)
    .eq("status", "available")
    .gte("starts_at", dayStart)
    .lt("starts_at", dayEnd)
    .select("id");

  if (updateError) {
    console.error("[slots] bulk POST blockDay update failed:", updateError);
    return NextResponse.json({ message: updateError.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ blocked: blocked?.length ?? 0 });
}

// Shared ownership guard: returns a NextResponse on failure, or null when the caller owns the salon.
async function assertOwnsSalon(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  salonId: string,
): Promise<NextResponse | null> {
  const { data: salon, error } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", salonId)
    .single();
  if (error || !salon) {
    return NextResponse.json({ message: "Salon not found", code: "SALON_NOT_FOUND" }, { status: 404 });
  }
  if (salon.owner_id !== userId) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }
  return null;
}
