export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/earnings/staff?salon_id=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const access = await requireSalonAccess(salonId, "finance");
  if (access instanceof NextResponse) return access;
  const admin = createAdminSupabaseClient();

  // Get staff members with commission_rate
  const { data: staffMembers } = await admin
    .from("staff_members")
    .select("id, name, avatar_url, commission_rate")
    .eq("salon_id", salonId)
    .eq("is_active", true);

  if (!staffMembers || staffMembers.length === 0) {
    return NextResponse.json({ staff: [] });
  }

  // Get completed bookings with service prices in the date range
  let query = admin
    .from("bookings")
    .select("staff_member_id, services(price)")
    .eq("salon_id", salonId)
    .eq("status", "completed");

  if (from) query = query.gte("starts_at", `${from}T00:00:00`);
  if (to) query = query.lte("starts_at", `${to}T23:59:59`);

  const { data: bookings } = await query;

  // Aggregate earnings per staff member
  const earningsMap = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (!b.staff_member_id) continue;
    const price = (b.services as any)?.price ?? 0;
    earningsMap.set(b.staff_member_id, (earningsMap.get(b.staff_member_id) ?? 0) + Number(price));
  }

  const staff = staffMembers.map((m) => {
    const gross = earningsMap.get(m.id) ?? 0;
    const rate = m.commission_rate ?? 0;
    const staffShare = Math.round(gross * rate) / 100;
    const houseShare = gross - staffShare;
    return {
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      commission_rate: rate,
      gross,
      staff_share: staffShare,
      house_share: houseShare,
    };
  });

  // Sort by gross descending
  staff.sort((a, b) => b.gross - a.gross);

  return NextResponse.json({ staff });
}
