import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id is required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  
  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id !== session.user.id) {
    const { data: userProfile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = new Date().toISOString();

  // Fetch active bookings 
  // An active booking is one where the current time is between starts_at and ends_at
  const { data: bookings, error } = await admin
    .from("bookings")
    .select(`
      id,
      services!inner (category)
    `)
    .eq("salon_id", salonId)
    .in("status", ["confirmed", "checkout_pending"])
    .lte("starts_at", now)
    .gte("ends_at", now)
    .eq("services.category", "nails");

  if (error) {
    console.error("Error fetching station utilization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ active_bookings: bookings ? bookings.length : 0 });
}
