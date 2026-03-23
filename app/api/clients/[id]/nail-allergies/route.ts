export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/clients/[id]/nail-allergies — Lightweight allergy endpoint for booking flow
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  // Customer can see own allergies, salon owner can see for their clients
  const isSelf = user.id === customerId;
  let salonId: string | null = null;
  if (!isSelf) {
    const { data: salon } = await admin
      .from("salons").select("id").eq("owner_id", user.id).single();
    if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    salonId = salon.id;
  }

  const query = admin
    .from("nail_client_preferences")
    .select("allergies, allergy_severity, allergy_notes")
    .eq("customer_id", customerId);

  if (salonId) query.eq("salon_id", salonId);

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    allergies: data?.allergies ?? [],
    severity: data?.allergy_severity ?? "mild",
    hasAllergy: (data?.allergies ?? []).length > 0,
    notes: data?.allergy_notes ?? null,
  });
}
