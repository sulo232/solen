export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, nailRetailProductSchema } from "@/lib/validations";

// GET /api/salon/retail?salon_id=xxx — Public: list active retail products
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = new URL(req.url).searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("nail_retail_products")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

// POST /api/salon/retail — Create retail product
export async function POST(req: NextRequest) {
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
  const { data: validated, error: valError } = validateBody(nailRetailProductSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: product, error } = await admin
    .from("nail_retail_products")
    .insert({
      salon_id: salon.id,
      ...validated,
      image_url: body.image_url || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product }, { status: 201 });
}

// PUT /api/salon/retail — Update product
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price) updateData.price = body.price;
  if (body.category) updateData.category = body.category;
  if (body.image_url !== undefined) updateData.image_url = body.image_url;

  const { data: product, error } = await admin
    .from("nail_retail_products")
    .update(updateData)
    .eq("id", body.id)
    .eq("salon_id", salon.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product });
}

// DELETE /api/salon/retail?id=xxx — Soft delete (deactivate)
export async function DELETE(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productId = new URL(req.url).searchParams.get("id");
  if (!productId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await admin
    .from("nail_retail_products")
    .update({ is_active: false })
    .eq("id", productId)
    .eq("salon_id", salon.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
