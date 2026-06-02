import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

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
  const startDate = new Date();
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const admin = createAdminSupabaseClient();

  // 1. Fetch staff members
  const { data: staffMembers, error: staffError } = await supabase
    .from("staff_members")
    .select("id, user_id, display_name")
    .eq("salon_id", salonId);

  if (staffError || !staffMembers) {
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }

  // 2. Scheduled bookings within period (price_paid is in CHF francs; no `price`/`is_walkin`
  //    columns exist on bookings — those were phantom). Revenue is rendered as francs by the
  //    leaderboard, so we sum price_paid as-is.
  const { data: bookings, error: bookingsError } = await admin
    .from("bookings")
    .select("id, staff_member_id, price_paid, status")
    .eq("salon_id", salonId)
    .gte("starts_at", startDate.toISOString())
    .lte("starts_at", now.toISOString());

  if (bookingsError) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  // 3. Walk-ins within period from the live queue — the real source of walk-in volume +
  //    conversion, keyed to the barber who actually took the chair (assigned_barber_id).
  const { data: walkins, error: walkinsError } = await admin
    .from("barber_walkin_queue")
    .select("assigned_barber_id, status")
    .eq("salon_id", salonId)
    .gte("joined_at", startDate.toISOString())
    .lte("joined_at", now.toISOString());

  if (walkinsError) {
    return NextResponse.json({ error: "Failed to fetch walk-in data" }, { status: 500 });
  }

  // 4. Aggregate stats per staff member — real values only.
  const stats = staffMembers.map(staff => {
    const staffBookings = (bookings || []).filter(b => b.staff_member_id === staff.id);
    const bookingsCount = staffBookings.length;
    const revenue = staffBookings.reduce((sum, b) => sum + (Number(b.price_paid) || 0), 0);

    // Real walk-in conversion: of the walk-ins this barber was assigned, how many completed.
    const staffWalkins = (walkins || []).filter(w => w.assigned_barber_id === staff.id);
    const walkinCount = staffWalkins.length;
    const walkinCompleted = staffWalkins.filter(w => w.status === "completed").length;
    const walkinConversionPct = walkinCount > 0 ? Math.round((walkinCompleted / walkinCount) * 100) : 0;

    // No data source for these in the current schema:
    //   • retention   — needs a client-recurrence calc across bookings history (not modelled here)
    //   • avg_tip      — there is no tip/gratuity column on bookings
    //   • chair util   — needs a per-chair schedule / open-hours occupancy model
    // Returned as 0 rather than fabricated (was previously `60 + count % 30` etc.).
    const retentionPct = 0;
    const avgTip = 0;
    const chairUtilizationPct = 0;

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
