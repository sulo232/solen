export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, scheduleSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// Answers "may this staff member edit their own schedule?" against every shape
// staff_members.permissions can actually hold. app/[locale]/dashboard/staff/page.tsx
// (around line 112) is the only writer today and it saves an OBJECT
// { can_edit_schedule, can_view_own_bookings, can_manage_portfolio }, which
// lib/validations.ts (staffUpdateSchema) validates as z.record(z.string(), z.unknown()),
// so the object shape is the only one the API will ever accept going forward. The
// string-array shape (["edit_own_schedule", "manage_all"]) is kept honoured so nothing
// regresses if a row ever holds the legacy vocabulary this line was originally written for.
function canEditOwnSchedule(permissions: unknown): boolean {
  if (Array.isArray(permissions)) {
    return permissions.includes("edit_own_schedule") || permissions.includes("manage_all");
  }
  if (permissions && typeof permissions === "object") {
    const flag = (permissions as Record<string, unknown>).can_edit_schedule;
    // Absent key defaults to ALLOWED, deliberately. The dashboard's own toggle loads
    // with `p.can_edit_schedule ?? true` (app/[locale]/dashboard/staff/page.tsx:77),
    // so the owner's screen already shows this permission as ON when it has never
    // been set. Refusing here would silently take away what the owner's own screen
    // says the staff member has. Only an explicit `false` refuses.
    return flag !== false;
  }
  // null or any other unexpected shape: same default as the missing-key case above.
  return true;
}

// GET /api/staff/my-schedule — Staff views their own schedule
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the staff member linked to this user
  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, salon_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!staff) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  // Get schedule entries
  const { data: schedules, error } = await supabase
    .from("staff_schedules")
    .select("*")
    .eq("staff_member_id", staff.id)
    .order("day_of_week", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get upcoming time off
  const { data: timeOff } = await supabase
    .from("staff_time_off")
    .select("*")
    .eq("staff_member_id", staff.id)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  // Get upcoming breaks
  const { data: breaks } = await supabase
    .from("staff_breaks")
    .select("*")
    .eq("staff_member_id", staff.id);

  return NextResponse.json({
    staff_member_id: staff.id,
    salon_id: staff.salon_id,
    schedules: schedules ?? [],
    time_off: timeOff ?? [],
    breaks: breaks ?? [],
  });
}

// PUT /api/staff/my-schedule — Staff updates their schedule
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, permissions")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!staff) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  // Check if staff has schedule edit permission
  if (!canEditOwnSchedule(staff.permissions)) {
    return NextResponse.json({ error: "No permission to edit schedule" }, { status: 403 });
  }

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(scheduleSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Ensure the schedule entry is for this staff member
  if (validated.staff_member_id !== staff.id) {
    return NextResponse.json({ error: "Can only edit own schedule" }, { status: 403 });
  }

  // Upsert schedule entry
  const { data: schedule, error } = await supabase
    .from("staff_schedules")
    .upsert(
      {
        staff_member_id: staff.id,
        // salon_id is NOT NULL on staff_schedules; null-check the .single() result before use
        // (staff_members.salon_id is itself never null, so "" only hits if the staff row
        // vanished between the two lookups, same DB-error-via-FK-violation outcome as before).
        salon_id: (await supabase.from("staff_members").select("salon_id").eq("id", staff.id).single()).data?.salon_id ?? "",
        day_of_week: validated.day_of_week,
        start_time: validated.start_time,
        end_time: validated.end_time,
        is_alternate_week: validated.is_alternate_week ?? false,
        alternate_week_parity: validated.alternate_week_parity ?? null,
      },
      { onConflict: "staff_member_id,day_of_week" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: schedule });
}
