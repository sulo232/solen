export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/services?salon_id=xxx — List services for a salon
export async function GET(req: NextRequest) {
  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

// POST /api/services — Create a new service
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { salon_id, name_de, name_en, category, duration_minutes, price, description_de, buffer_minutes, processing_minutes, finishing_minutes, suitable_for, suitable_gender, is_active, photos } = body;

  if (!salon_id || !name_de) {
    return NextResponse.json({ error: "salon_id and name_de required" }, { status: 400 });
  }

  // Verify user owns this salon
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id")
    .eq("id", salon_id)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    // Check if admin
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: service, error } = await admin
    .from("services")
    .insert({
      salon_id,
      name_de,
      name_en: name_en || null,
      category: category || null,
      duration_minutes: duration_minutes || 60,
      price: price || 0,
      description_de: description_de || null,
      buffer_minutes: buffer_minutes || 0,
      processing_minutes: processing_minutes || 0,
      finishing_minutes: finishing_minutes || 0,
      suitable_for: suitable_for || [],
      suitable_gender: suitable_gender || [],
      is_active: is_active !== false,
      photos: photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service }, { status: 201 });
}
