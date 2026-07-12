export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, serviceCreateSchema } from "@/lib/validations";

// GET /api/services?salon_id=xxx — List services for a salon
export async function GET(req: NextRequest) {
  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

// POST /api/services — Create a new service
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(serviceCreateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_id, name_de, name_en, category, duration_minutes, price, description_de, buffer_minutes, processing_minutes, finishing_minutes, suitable_for, suitable_gender, is_active, photos } = validated;

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
      // services.name_en is NOT NULL live. The form sends "" when English is left blank, and
      // "" || null → null → constraint violation. Fall back to the German name (always present)
      // so the EN locale shows the service name instead of the create 500-ing.
      name_en: name_en || name_de,
      // category is NOT NULL with a CHECK constraint on the live services table (no DB
      // default). "" is not a member of the allowed set either, so a missing category still
      // fails the same DB-level constraint (surfaced below as a 500), same as the prior
      // `|| null` did, just type-correct for the required non-null column.
      category: category || "",
      duration_minutes: duration_minutes || 60,
      price: price || 0,
      description_de: description_de || null,
      buffer_minutes: buffer_minutes || 0,
      processing_minutes: processing_minutes || 0,
      finishing_minutes: finishing_minutes || 0,
      suitable_for: suitable_for || [],
      suitable_gender: suitable_gender || [],
      is_active: is_active !== false,
      // DB column is photo_urls (canonical — matches lib/types.ts + /services/[id]/photos
      // endpoint). The validated input field is named `photos`; map it to the real column.
      photo_urls: photos || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service }, { status: 201 });
}
