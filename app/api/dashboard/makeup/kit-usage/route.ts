export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const itemId = searchParams.get("item_id");
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

  let query = admin.from("kit_usage_log").select("*").eq("salon_id", salonId).order("used_at", { ascending: false }).limit(50);
  if (itemId) query = query.eq("item_id", itemId);

  const { data: logs } = await query;
  return NextResponse.json({ logs: logs ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { salon_id, item_id, quantity_used, booking_id, notes } = await request.json();
  if (!salon_id || !item_id) return NextResponse.json({ error: "Required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: log, error } = await admin
    .from("kit_usage_log")
    .insert({
      salon_id,
      item_id,
      quantity_used: quantity_used ?? 1,
      booking_id: booking_id ?? null,
      used_at: new Date().toISOString().split("T")[0],
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log });
}
