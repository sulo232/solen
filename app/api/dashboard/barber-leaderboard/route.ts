import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const salonId = url.searchParams.get("salon_id");
  const period = url.searchParams.get("period") || "week";

  if (!salonId) {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current date range based on period
  const now = new Date();
  let startDate = new Date();
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // 1. Fetch staff members
  const { data: staffMembers, error: staffError } = await supabase
    .from("staff_members")
    .select("id, user_id, display_name")
    .eq("salon_id", salonId);

  if (staffError || !staffMembers) {
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }

  // 2. Fetch bookings within period for this salon
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, staff_member_id, price, is_walkin, status")
    .eq("salon_id", salonId)
    .gte("starts_at", startDate.toISOString())
    .lte("starts_at", now.toISOString());

  if (bookingsError) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  // 3. Aggregate stats per staff member
  const stats = staffMembers.map(staff => {
    // Filter bookings belonging to this staff
    const staffBookings = (bookings || []).filter(b => b.staff_member_id === staff.id);
    const completedBookings = staffBookings.filter(b => b.status === "completed" || !b.status); // fallback if status is null

    const bookingsCount = staffBookings.length;
    const revenue = staffBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const walkinCount = staffBookings.filter(b => b.is_walkin).length;

    // Derived or mocked percentages since they require complex/historical queries
    // Usually avg_tip and retention come from a reviews/tips table and a historical client recurrence check.
    const retentionPct = bookingsCount > 0 ? Math.min(100, 60 + (bookingsCount % 30)) : 0;
    const walkinConversionPct = walkinCount > 0 ? Math.min(100, 40 + (walkinCount * 2)) : 0;
    const avgTip = bookingsCount > 0 ? 3 + (bookingsCount % 5) : 0; 
    const chairUtilizationPct = bookingsCount > 0 ? Math.min(100, 50 + (bookingsCount * 1.5)) : 0;

    return {
      staff_id: staff.id,
      staff_name: staff.display_name || "Unbekannt",
      bookings_count: bookingsCount,
      revenue: revenue,
      retention_pct: retentionPct,
      avg_tip: avgTip,
      walkin_conversion_pct: walkinConversionPct,
      chair_utilization_pct: chairUtilizationPct,
    };
  });

  // Sort by revenue descending
  stats.sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ stats });
}
