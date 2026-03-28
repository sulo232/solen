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

  // Fetch face charts with skin tone data (undertone + fitzpatrick)
  const { data: charts } = await admin
    .from("makeup_face_charts")
    .select("undertone, fitzpatrick_scale")
    .eq("salon_id", salonId)
    .not("undertone", "is", null);

  const undertoneMap = new Map<string, number>();
  const fitzpatrickMap = new Map<string, number>();

  for (const chart of charts ?? []) {
    if (chart.undertone) {
      undertoneMap.set(chart.undertone, (undertoneMap.get(chart.undertone) ?? 0) + 1);
    }
    if (chart.fitzpatrick_scale) {
      fitzpatrickMap.set(chart.fitzpatrick_scale, (fitzpatrickMap.get(chart.fitzpatrick_scale) ?? 0) + 1);
    }
  }

  const undertones = [...undertoneMap.entries()].map(([key, count]) => ({ key, count }));
  const fitzpatrick = ["I", "II", "III", "IV", "V", "VI"].map((scale) => ({
    scale,
    count: fitzpatrickMap.get(scale) ?? 0,
  }));

  const total = charts?.length ?? 0;

  return NextResponse.json({ undertones, fitzpatrick, total });
}
