import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

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

  // Fetch all nail bookings for this salon to determine infill due status
  const { data: bookings, error } = await admin
    .from("bookings")
    .select(`
      user_id, 
      starts_at, 
      status,
      profiles!user_id (display_name),
      services!inner (category, reminder_cycle_days)
    `)
    .eq("salon_id", salonId)
    .eq("services.category", "nails")
    .in("status", ["completed", "confirmed"])
    .order("starts_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ due_clients: [] });
  }

  const now = new Date();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Group by user
  const userBookings = new Map<string, any[]>();
  for (const b of bookings) {
    if (!b.user_id) continue;
    if (!userBookings.has(b.user_id)) {
      userBookings.set(b.user_id, []);
    }
    userBookings.get(b.user_id)!.push(b);
  }

  const dueClients = [];

  for (const [userId, userReqs] of userBookings.entries()) {
    // Check if user has any future booking
    const hasFutureBooking = userReqs.some(b => new Date(b.starts_at) > now);
    if (hasFutureBooking) continue;

    // Get the most recent past booking (they are sorted descending by starts_at)
    const latestPastBooking = userReqs.find(b => new Date(b.starts_at) <= now);
    if (!latestPastBooking) continue;

    const reminderDays = latestPastBooking.services?.reminder_cycle_days;
    if (!reminderDays) continue; // No cycle defined for this service

    const bookingDate = new Date(latestPastBooking.starts_at);
    const daysSince = Math.floor((now.getTime() - bookingDate.getTime()) / MS_PER_DAY);

    if (daysSince >= reminderDays) {
      dueClients.push({
        customer_id: userId,
        display_name: latestPastBooking.profiles?.display_name || "Unknown",
        days_overdue: daysSince - reminderDays,
      });
    }
  }

  // Sort by most overdue
  dueClients.sort((a, b) => b.days_overdue - a.days_overdue);

  return NextResponse.json({ due_clients: dueClients });
}
