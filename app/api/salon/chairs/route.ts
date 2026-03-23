export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, barberChairsSchema } from "@/lib/validations";

// GET /api/salon/chairs — Get chair config for salon owner's barbershop
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();

  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
  }

  const { data: chairs } = await admin
    .from("barber_chairs")
    .select("*")
    .eq("salon_id", salon.id)
    .single();

  return NextResponse.json({
    chairs: chairs ?? { salon_id: salon.id, chair_count: 1, buffer_minutes: 5 },
  });
}

// PUT /api/salon/chairs — Update chair config
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
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
  const { data: validated, error: valError } = validateBody(barberChairsSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("owner_id", user.id).single();

  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
  }

  const { data: chairs, error } = await admin
    .from("barber_chairs")
    .upsert({ salon_id: salon.id, ...validated }, { onConflict: "salon_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chairs });
}
