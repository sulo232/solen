export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { clientBelongsToSalon } from "@/lib/verify-salon-client";
import { requireSalonAccess } from "@/lib/auth/require";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = req.nextUrl.searchParams.get("salon_id");
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!salonId || !clientId) {
    return NextResponse.json({ error: "salon_id and client_id required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (clients) instead of the old owner-only query
  // filter. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "clients");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(fadeBlueprintSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (clients) instead of the old owner-only query
  // filter. The owner path is unchanged.
  const accessResult = await requireSalonAccess(validated.salon_id, "clients");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  const belongs = await clientBelongsToSalon(admin, validated.salon_id, validated.client_id);
  if (!belongs) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  const { data, error } = await admin
    .from("fade_blueprints")
    .insert(validated)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
