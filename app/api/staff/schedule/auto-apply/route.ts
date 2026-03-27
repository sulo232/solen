export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/staff/schedule/auto-apply — Auto-create staff schedules from salon opening hours
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { salon_id } = await req.json();
  if (!salon_id) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("id, owner_id, opening_hours").eq("id", salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all active staff
  const { data: staffMembers } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", salon_id)
    .eq("is_active", true);

  if (!staffMembers || staffMembers.length === 0) {
    // If no staff, create a placeholder schedule entry for the salon itself
    const { error } = await admin.from("staff_schedules").upsert({
      salon_id,
      staff_member_id: null,
      day_of_week: 1,
      start_time: "09:00",
      end_time: "18:00",
      is_working: true,
    }, { onConflict: "salon_id,staff_member_id,day_of_week" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, schedules_created: 1 });
  }

  // Parse opening hours if available
  const hours = salon.opening_hours as Record<string, { open?: string; close?: string } | null> | null;
  const dayMap: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

  const schedules: Array<{
    salon_id: string;
    staff_member_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
  }> = [];

  for (const member of staffMembers) {
    for (const [day, num] of Object.entries(dayMap)) {
      const dayHours = hours?.[day];
      if (dayHours && dayHours.open && dayHours.close) {
        schedules.push({
          salon_id,
          staff_member_id: member.id,
          day_of_week: num,
          start_time: dayHours.open,
          end_time: dayHours.close,
          is_working: true,
        });
      } else {
        schedules.push({
          salon_id,
          staff_member_id: member.id,
          day_of_week: num,
          start_time: "09:00",
          end_time: "18:00",
          is_working: day !== "sunday",
        });
      }
    }
  }

  if (schedules.length > 0) {
    const { error } = await admin.from("staff_schedules").upsert(schedules, {
      onConflict: "salon_id,staff_member_id,day_of_week",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, schedules_created: schedules.length });
}
