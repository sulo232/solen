export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/barber/[slug]/portfolio — Public barber portfolio, filterable
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { slug } = await params;
  const admin = createAdminSupabaseClient();

  // Find barber by slug
  const { data: barber } = await admin
    .from("staff_members")
    .select("id, salon_id, salons(categories)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!barber) return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  const salon = barber.salons as any;
  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 404 });
  }

  // Build query with optional filters
  let query = admin
    .from("staff_portfolio_images")
    .select("*")
    .eq("staff_member_id", barber.id)
    .order("sort_order", { ascending: true });

  const barberStyle = req.nextUrl.searchParams.get("barber_style");
  const fadeType = req.nextUrl.searchParams.get("fade_type");
  if (barberStyle) query = query.eq("barber_style", barberStyle);
  if (fadeType) query = query.eq("fade_type", fadeType);

  const { data: images, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ images: images ?? [] });
}
