export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/nail-tech/[id]/portfolio — Public portfolio feed for a nail tech
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { id: staffId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;
  const nailStyle = url.searchParams.get("nail_style");
  const nailShape = url.searchParams.get("nail_shape");
  const nailMaterial = url.searchParams.get("nail_material");

  const admin = createAdminSupabaseClient();

  let query = admin
    .from("staff_portfolio_images")
    .select("*", { count: "exact" })
    .eq("staff_member_id", staffId)
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1);

  if (nailStyle) query = query.eq("nail_style", nailStyle);
  if (nailShape) query = query.eq("nail_shape", nailShape);
  if (nailMaterial) query = query.eq("nail_material", nailMaterial);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get staff info
  const { data: staff } = await admin
    .from("staff_members")
    .select("id, name, avatar_url, specialties, salon_id")
    .eq("id", staffId)
    .single();

  return NextResponse.json({
    portfolio: data ?? [],
    staff: staff ?? null,
    total: count ?? 0,
    page,
    limit,
  });
}
