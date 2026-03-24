export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, nailPreferencesSchema } from "@/lib/validations";

// GET /api/clients/[id]/nail-preferences — Fetch preferences for client at salon
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { data: salon } = await supabase
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("nail_client_preferences")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? null });
}

// PUT /api/clients/[id]/nail-preferences — Upsert preferences + allergy auto-tag
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(nailPreferencesSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  const { data: salon } = await supabase
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  const { data: prefs, error } = await admin
    .from("nail_client_preferences")
    .upsert(
      {
        salon_id: salon.id,
        customer_id: customerId,
        preferred_shape: validated.preferred_shape ?? null,
        preferred_length: validated.preferred_length ?? null,
        preferred_material: validated.preferred_material ?? null,
        preferred_brand: validated.preferred_brand ?? null,
        allergies: validated.allergies ?? [],
        allergy_severity: validated.allergy_severity ?? "mild",
        allergy_notes: validated.allergy_notes ?? null,
        skin_sensitivity: validated.skin_sensitivity ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "salon_id,customer_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-tag severe allergies as red client tags
  const allergies = validated.allergies ?? [];
  const severity = validated.allergy_severity;
  if (allergies.length > 0 && severity === "severe") {
    for (const allergy of allergies) {
      await admin
        .from("client_tags")
        .upsert(
          {
            salon_id: salon.id,
            customer_id: customerId,
            tag: `⚠️ ${allergy}`,
            color: "red",
          },
          { onConflict: "salon_id,customer_id,tag", ignoreDuplicates: true }
        );
    }
  }

  return NextResponse.json({ data: prefs });
}
