import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Find the next available slot that starts after now
  const { data, error } = await supabase
    .from("availability_slots")
    .select(`
      id,
      starts_at,
      ends_at,
      staff_member_id,
      staff_members!inner(name),
      services!inner(name)
    `)
    .eq("salon_id", salonId)
    .eq("status", "available")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    // No slots available — return gracefully
    return NextResponse.json({ available: false }, { status: 200 });
  }

  const staffMember = (data as any)?.staff_members;
  const service = (data as any)?.services;

  return NextResponse.json({
    available: true,
    slot: {
      id: data.id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      staff_id: data.staff_member_id,
      staff_name: staffMember?.name || "Staff",
      service_name: service?.name || "Service",
    },
  });
}
