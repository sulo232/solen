import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!salonId || !clientId) return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id !== session.user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get latest zone preferences for this client
  const { data, error } = await admin
    .from("waxing_zone_preferences")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { salon_id, client_id, zones_selected, wax_type_preferences } = body;

  if (!salon_id || !client_id || !zones_selected) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salon_id).single();
  if (salon?.owner_id !== session.user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("waxing_zone_preferences")
    .insert({
      salon_id,
      client_id,
      zones_selected,
      wax_type_preferences: wax_type_preferences ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
