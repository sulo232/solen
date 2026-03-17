import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/waitlist — Customer joins waitlist
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { salon_id, service_id, preferred_date, preferred_time_range } = body;

  if (!salon_id || !service_id || !preferred_date) {
    return NextResponse.json({ error: "salon_id, service_id, and preferred_date required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("waitlist").upsert(
    {
      user_id: user.id,
      salon_id,
      service_id,
      preferred_date,
      preferred_time_range: preferred_time_range ?? "any",
    },
    { onConflict: "user_id,salon_id,service_id,preferred_date" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// GET /api/waitlist?salon_id=X — Salon owner views their waitlist
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id")
    .eq("id", salonId)
    .single();

  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: entries } = await admin
    .from("waitlist")
    .select("*, profiles!user_id(display_name), services!service_id(name_de)")
    .eq("salon_id", salonId)
    .is("booked_at", null)
    .order("preferred_date", { ascending: true });

  return NextResponse.json({ entries: entries ?? [] });
}
