export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, nailDynamicPricingSchema } from "@/lib/validations";

// GET — list pricing rules for a salon
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: rules, error } = await supabase
    .from("nail_dynamic_pricing_rules")
    .select("id, rule_type, day_of_week, start_time, end_time, price_modifier, label_de, label_en, is_active, created_at")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Map price_modifier → modifier for frontend compat
  const mapped = (rules ?? []).map((r) => ({ ...r, modifier: r.price_modifier }));
  return NextResponse.json({ rules: mapped });
}

// POST — create a new pricing rule
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

  // Map frontend `modifier` → DB `price_modifier`
  const payload = { ...body };
  if (payload.modifier !== undefined) {
    payload.price_modifier = payload.modifier;
    delete payload.modifier;
  }
  delete payload.salon_id;

  const { data: validated, error: valErr } = validateBody(nailDynamicPricingSchema, payload);
  if (valErr) return NextResponse.json({ message: valErr.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { data: rule, error } = await supabase
    .from("nail_dynamic_pricing_rules")
    .insert({ salon_id: salonId, ...validated })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: { ...rule, modifier: rule.price_modifier } }, { status: 201 });
}
