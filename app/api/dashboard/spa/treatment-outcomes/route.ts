export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const clientId = searchParams.get("client_id");
  if (!salonId || !clientId) return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: outcomes } = await admin
    .from("spa_treatment_outcomes")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ outcomes: outcomes ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { salon_id, client_id, booking_id, satisfaction_rating, skin_before, skin_after, products_used, follow_up_notes, next_visit_date } = body;

  if (!salon_id || !client_id) return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: outcome, error } = await admin
    .from("spa_treatment_outcomes")
    .insert({
      salon_id,
      client_id,
      booking_id: booking_id ?? null,
      satisfaction_rating,
      skin_before: skin_before || null,
      skin_after: skin_after || null,
      products_used: products_used ?? [],
      follow_up_notes: follow_up_notes || null,
      next_visit_date: next_visit_date || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ outcome });
}
