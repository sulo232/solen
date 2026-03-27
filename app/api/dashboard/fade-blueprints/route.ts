export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";

const fadeBlueprintSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  top_guard: z.string().max(30).optional(),
  sides_guard: z.string().max(30).optional(),
  back_guard: z.string().max(30).optional(),
  neckline_style: z.string().max(30).optional(),
  fade_type: z.string().max(30).optional(),
  lineup: z.boolean().optional(),
  beard_style: z.string().max(30).optional(),
  products_used: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  photo_url: z.string().url().optional(),
});

// GET /api/dashboard/fade-blueprints?salon_id=...&client_id=...
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = req.nextUrl.searchParams.get("salon_id");
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!salonId || !clientId) {
    return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", session.user.id)
    .single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get latest blueprint for this client
  const { data } = await admin
    .from("fade_blueprints")
    .select("*")
    .eq("salon_id", salonId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data });
}

// POST /api/dashboard/fade-blueprints
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(fadeBlueprintSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Verify salon ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("id", validated.salon_id)
    .eq("owner_id", session.user.id)
    .single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("fade_blueprints")
    .insert(validated)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
