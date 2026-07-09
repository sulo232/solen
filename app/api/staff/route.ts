import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salon_id");
    if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
    if (salon?.owner_id !== session.user.id) {
      const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from("staff_members")
      .select("id, name, avatar_url, specialties, is_active, commission_rate, permissions")
      .eq("salon_id", salonId)
      .order("name");

    if (error) throw error;

    // Count each staff member's upcoming (non-cancelled) bookings so the
    // dashboard can warn before deleting someone with future appointments.
    const staffMembers = data ?? [];
    let futureCounts: Record<string, number> = {};
    if (staffMembers.length > 0) {
      const { data: upcoming, error: bookingsError } = await supabase
        .from("bookings")
        .select("staff_member_id")
        .eq("salon_id", salonId)
        .gt("starts_at", new Date().toISOString())
        .not("status", "in", "(cancelled,no_show)");
      if (bookingsError) {
        console.error("[GET /api/staff] failed to count future bookings:", bookingsError);
      } else {
        futureCounts = (upcoming ?? []).reduce<Record<string, number>>((acc, b) => {
          if (b.staff_member_id) acc[b.staff_member_id] = (acc[b.staff_member_id] ?? 0) + 1;
          return acc;
        }, {});
      }
    }

    const staff = staffMembers.map((s) => ({ ...s, future_bookings: futureCounts[s.id] ?? 0 }));
    return NextResponse.json({ staff });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json({ error: "Internal Server Error", staff: [] }, { status: 500 });
  }
}
