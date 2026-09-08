export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, staffScheduleAutoApplySchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";

// POST /api/staff/schedule/auto-apply — Auto-create staff schedules from salon opening hours
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json();
  const { data: validated, error: validationError } = validateBody(staffScheduleAutoApplySchema, rawBody);
  if (validationError) return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  const { salon_id } = validated;

  const admin = createAdminSupabaseClient();

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (schedule = edit rota / staff working hours)
  // instead of the old owner-only compare.
  const access = await requireSalonAccess(salon_id, "schedule");
  if (access instanceof NextResponse) return access;

  const { data: salon } = await admin.from("salons").select("id, owner_id, opening_hours").eq("id", salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

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
  const dayMap: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

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
          is_working: day !== "sun",
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
