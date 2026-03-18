import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/salons/[slug]/score
 * Returns the Solen Score for a salon (public, rate-limited).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { slug } = await params;

  if (!slug || slug.length < 10) {
    return NextResponse.json({ error: "Invalid salon ID" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("salons")
    .select("solen_score, solen_tier, score_details")
    .eq("id", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
