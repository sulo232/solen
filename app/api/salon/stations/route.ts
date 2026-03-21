export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailStationSchema } from "@/lib/validations";

// GET /api/salon/stations — Get station config
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!salon.categories?.includes("nails")) {
    return NextResponse.json({ error: "Not a nail salon" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("nail_stations").select("*").eq("salon_id", salon.id).single();

  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    stations: data ?? { station_count: 4, has_uv_lamps: true, uv_lamp_count: 4, sterilization_buffer_minutes: 10 },
  });
}

// PUT /api/salon/stations — Upsert station config
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailStationSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();
  if (!salon || !salon.categories?.includes("nails")) {
    return NextResponse.json({ error: "Not a nail salon" }, { status: 403 });
  }

  const { data: stations, error } = await admin
    .from("nail_stations")
    .upsert({ salon_id: salon.id, ...validated }, { onConflict: "salon_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stations });
}
