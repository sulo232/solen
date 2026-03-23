export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, scheduleSchema } from "@/lib/validations";

// GET /api/staff/my-schedule — Staff views their own schedule
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, permissions")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!staff) return NextResponse.json({ error: "Not a staff member" }, { status: 403 });

  // Check if staff has schedule edit permission
  const perms = (staff.permissions as string[]) ?? [];
  if (!perms.includes("edit_own_schedule") && !perms.includes("manage_all")) {
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
        salon_id: (await supabase.from("staff_members").select("salon_id").eq("id", staff.id).single()).data?.salon_id,
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
