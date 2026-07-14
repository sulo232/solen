import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth/require";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id: staffId } = await params;
    if (!staffId) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

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
