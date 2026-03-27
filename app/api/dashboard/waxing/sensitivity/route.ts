import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

async function verifySalonAccess(admin: ReturnType<typeof createAdminSupabaseClient>, salonId: string, userId: string) {
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  if (salon?.owner_id === userId) return true;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).single();
  return profile?.role === "admin";
}

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!salonId || !clientId) return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  if (!(await verifySalonAccess(admin, salonId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("waxing_sensitivity_log")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { salon_id, client_id, reaction_level, affected_zones, medications, sun_exposure_recent, aftercare_provided, notes } = body;

  if (!salon_id || !client_id || !reaction_level) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validLevels = ["none", "mild", "moderate", "severe"];
  if (!validLevels.includes(reaction_level)) {
    return NextResponse.json({ error: "Invalid reaction_level" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  if (!(await verifySalonAccess(admin, salon_id, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("waxing_sensitivity_log")
    .insert({
      salon_id,
      client_id,
      reaction_level,
      affected_zones: affected_zones ?? [],
      medications: medications ?? null,
      sun_exposure_recent: sun_exposure_recent ?? false,
      aftercare_provided: aftercare_provided ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
