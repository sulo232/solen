export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, nailRetailProductSchema } from "@/lib/validations";

// GET — list retail products for a salon
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: products, error } = await supabase
    .from("nail_retail_products")
    .select("id, name, description, price, image_url, category, is_active, stock_count, low_stock_threshold, created_at")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: products ?? [] });
}

// POST — create a new retail product
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const salonId = body.salon_id;
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  // Verify salon ownership
  const { data: salon } = await supabase.from("salons").select("id").eq("id", salonId).eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found or not owned" }, { status: 403 });

  const { data: validated, error: valErr } = validateBody(nailRetailProductSchema, {
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
  });
  if (valErr) return NextResponse.json({ message: valErr.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { data: product, error } = await supabase
    .from("nail_retail_products")
    .insert({ salon_id: salonId, ...validated })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product }, { status: 201 });
}

// PATCH — update stock count for a product
export async function PATCH(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { id, is_active, stock_count } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // RLS ensures only salon owner can update their own products
  const update: Record<string, unknown> = {};
  if (typeof is_active === "boolean") update.is_active = is_active;
  if (typeof stock_count === "number" && stock_count >= 0) update.stock_count = stock_count;

  const { data: product, error } = await supabase
    .from("nail_retail_products")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product });
}
