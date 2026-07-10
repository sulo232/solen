export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { getActiveSalon } from "@/lib/active-salon";

// GET /api/clients/[id]/repeat-last — Most recent nail design for "Repeat last" button
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { id: customerId } = await params;
  const admin = createAdminSupabaseClient();

  // Customer can see own or salon owner can see for their clients
  const isSelf = user.id === customerId;
  let salonId: string | null = null;
  if (!isSelf) {
    const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id");
    if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    salonId = salon.id;
  }

  const query = admin
    .from("nail_design_history")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (salonId) query.eq("salon_id", salonId);

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map DB field names to what NailBookingSteps expects
  const design = data ? {
    ...data,
    style: data.style_category,
    image_url: data.photo_url,
  } : null;

  return NextResponse.json({ design });
}
