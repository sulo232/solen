export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/dashboard/barber-leaderboard?salon_id=...&period=week|month
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();

  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "week";
  const now = new Date();
  const sinceDate = new Date(now);
  if (period === "week") {
    sinceDate.setDate(sinceDate.getDate() - 7);
  } else {
    sinceDate.setMonth(sinceDate.getMonth() - 1);
  }
  const sinceStr = sinceDate.toISOString();

  // Get staff members
  const { data: staff } = await admin
    .from("staff_members")
    .select("id, name")
    .eq("salon_id", salon.id)
    .eq("is_active", true);

  if (!staff?.length) return NextResponse.json({ stats: [] });

  // Get bookings in period
  const { data: bookings } = await admin
    .from("bookings")
    .select("staff_member_id, price_paid, user_id, status")
    .eq("salon_id", salon.id)
    .gte("starts_at", sinceStr);

  // Get tips in period
  const { data: tips } = await admin
    .from("tips")
    .select("staff_member_id, amount")
    .in("staff_member_id", staff.map((s) => s.id))
    .gte("paid_at", sinceStr);

  // Get walk-ins in period
  const { data: walkins } = await admin
    .from("barber_walkin_queue")
    .select("assigned_barber_id, status")
    .eq("salon_id", salon.id)
    .gte("created_at", sinceStr);

  const stats = staff.map((s) => {
    const staffBookings = (bookings ?? []).filter((b) => b.staff_member_id === s.id);
    const completed = staffBookings.filter((b) => b.status === "completed");
    const staffTips = (tips ?? []).filter((t) => t.staff_member_id === s.id);
    const staffWalkins = (walkins ?? []).filter((w) => w.assigned_barber_id === s.id);
    const completedWalkins = staffWalkins.filter((w) => w.status === "completed");

    const uniqueClients = new Set(completed.map((b) => b.user_id).filter(Boolean));
    const revenue = completed.reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
    const avgTip = staffTips.length > 0
      ? staffTips.reduce((sum, t) => sum + t.amount, 0) / staffTips.length
      : 0;

    return {
      staff_id: s.id,
      staff_name: s.name,
      bookings_count: completed.length,
      revenue,
      retention_pct: uniqueClients.size > 0 ? Math.round((completed.length / uniqueClients.size) * 10) : 0,
      avg_tip: Math.round(avgTip * 10) / 10,
      walkin_conversion_pct: staffWalkins.length > 0
        ? Math.round((completedWalkins.length / staffWalkins.length) * 100)
        : 0,
      chair_utilization_pct: 0, // Would need slot data to calculate
    };
  });

  return NextResponse.json({ stats });
}
