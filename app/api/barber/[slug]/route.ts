export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/barber/[slug] — Public barber profile by slug
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { slug } = await params;
  const admin = createAdminSupabaseClient();

  const { data: barber, error } = await admin
    .from("staff_members")
    .select("id, name, avatar_url, cover_photo_url, accent_color, slug, specialties, salon_id, salons(name, slug, categories)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !barber) return NextResponse.json({ error: "Barber not found" }, { status: 404 });

  // Verify salon is a barbershop
  const salon = barber.salons as any;
  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 404 });
  }

  // Get stats
  const { count: cutCount } = await admin
    .from("barber_cut_history")
    .select("id", { count: "exact", head: true })
    .eq("staff_member_id", barber.id);

  return NextResponse.json({
    barber: {
      id: barber.id,
      name: barber.name,
      avatar_url: barber.avatar_url,
      cover_photo_url: barber.cover_photo_url,
      accent_color: barber.accent_color,
      slug: barber.slug,
      specialties: barber.specialties,
      salon: { name: salon.name, slug: salon.slug },
      totalCuts: cutCount ?? 0,
    },
  });
}
