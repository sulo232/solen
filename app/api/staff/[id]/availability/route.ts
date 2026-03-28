import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (scheduleError) {
      console.error("Failed to fetch schedules:", scheduleError);
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
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
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
