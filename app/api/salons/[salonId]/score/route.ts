import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/[salonId]/score
 * Returns the Solen Score for a salon (public, rate-limited).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { salonId } = await params;

  if (!salonId || salonId.length < 10) {
    return NextResponse.json({ error: "Invalid salon ID" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("salons")
    .select("solen_score, solen_tier, score_details")
    .eq("id", salonId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
