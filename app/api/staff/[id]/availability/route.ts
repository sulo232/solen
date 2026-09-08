import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAuth, requireSalonAccess } from "@/lib/auth/require";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id: staffId } = await params;
    if (!staffId) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // P9-2: gate with "schedule" (edit rota / staff working hours), unless
    // the caller IS this staff member viewing their own row, which stays
    // open the same way GET /api/staff/my-schedule's own-view is unrestricted.
    const { data: targetStaff } = await supabase
      .from("staff_members")
      .select("salon_id, user_id, is_active")
      .eq("id", staffId)
      .maybeSingle();
    if (!targetStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    if (targetStaff.user_id !== user.id || targetStaff.is_active !== true) {
      const access = await requireSalonAccess(targetStaff.salon_id, "schedule");
      if (access instanceof NextResponse) return access;
    }

    // Fetch the raw schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from("staff_schedules")
      .select("*")
      .eq("staff_member_id", staffId)
      .eq("is_active", true);

    // Schema drift / RLS / transient PostgREST failures must not 500 the
    // booking flow — degrade to an empty schedule set like the sibling
    // staff/profile route does for missing data.
    if (scheduleError) {
      console.error("[api/staff/availability] failed to fetch schedules:", scheduleError);
      return NextResponse.json({
        success: true,
        data: { schedules: [] },
      });
    }

    // Format output (very basic 7-day lookahead based on day_of_week)
    // In production this would account for alternate weeks, breaks, and existing bookings.
    // For now, we return the schedule maps.
    
    return NextResponse.json({
      success: true,
      data: {
        schedules: schedules || [],
      }
    });

  } catch (error: any) {
    console.error("[api/staff/availability] unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
