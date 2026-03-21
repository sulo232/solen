export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailPreferencesSchema } from "@/lib/validations";

// GET /api/clients/[id]/nail-preferences
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("nail_client_preferences")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data ?? null });
}

// PUT /api/clients/[id]/nail-preferences — Upsert preferences
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: customerId } = await params;
  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailPreferencesSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: prefs, error } = await admin
    .from("nail_client_preferences")
    .upsert({
      salon_id: salon.id,
      customer_id: customerId,
      ...validated,
      updated_at: new Date().toISOString(),
    }, { onConflict: "salon_id,customer_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-tag severe allergies
  if (validated!.allergies && validated!.allergies.length > 0 && validated!.allergy_severity === "severe") {
    for (const allergy of validated!.allergies) {
      await admin.from("client_tags").upsert({
        salon_id: salon.id,
        customer_id: customerId,
        tag: `Allergie: ${allergy}`,
        color: "red",
      }, { onConflict: "salon_id,customer_id,tag" }).select();
    }
  }

  return NextResponse.json({ preferences: prefs });
}
