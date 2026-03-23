export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, packageSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/ratelimit";

// GET /api/packages — List active packages (public for a salon)
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();
  const salonId = new URL(req.url).searchParams.get("salon_id");

  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("service_packages")
    .select("*, services(name_de, name_en, category)")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/packages — Create a package (salon owner only)
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
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
  const { data: validated, error: valError } = validateBody(packageSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  const { data: pkg, error } = await supabase
    .from("service_packages")
    .insert({
      salon_id: salon.id,
      service_id: validated.service_id,
      name: validated.name,
      total_sessions: validated.total_sessions,
      bonus_sessions: validated.bonus_sessions,
      price: validated.price,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: pkg }, { status: 201 });
}
