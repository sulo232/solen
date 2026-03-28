export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await admin
    .from("bookings")
    .select("service_id, price_paid, status")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("starts_at", ninetyDaysAgo);

  // Get service names
  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id).filter(Boolean))];
  let serviceNames: { id: string; name_de: string }[] = [];
  if (serviceIds.length > 0) {
    const { data } = await admin.from("services").select("id, name_de").in("id", serviceIds);
    serviceNames = data ?? [];
  }

  // Group by service (zone)
  const zoneMap = new Map<string, { revenue: number; count: number }>();
  for (const b of bookings ?? []) {
    if (!b.service_id) continue;
    const name = serviceNames.find((s) => s.id === b.service_id)?.name_de ?? b.service_id;
    const existing = zoneMap.get(name) ?? { revenue: 0, count: 0 };
    zoneMap.set(name, { revenue: existing.revenue + (b.price_paid ?? 0), count: existing.count + 1 });
  }

  const zones = [...zoneMap.entries()]
    .map(([zone, data]) => ({ zone, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({ zones });
}
