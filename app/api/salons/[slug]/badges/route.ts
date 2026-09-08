export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/salons/[slug]/badges — public, returns badges for a salon
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminSupabaseClient();

  // Get salon id from slug
  const { data: salon } = await admin
    .from("salons")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!salon) return NextResponse.json({ badges: [] });

  // Get assigned badges (excluding override removals)
  const { data: assignments } = await admin
    .from("salon_badge_assignments")
    .select("badge_id")
    .eq("salon_id", salon.id)
    .eq("is_override_removal", false);

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ badges: [] });
  }

  const badgeIds = assignments.map((a) => a.badge_id);
  // Explicit columns: excludes auto_rule (internal auto-assignment logic),
  // which no consumer of this public/dashboard endpoint reads.
  const { data: badges } = await admin
    .from("salon_badges")
    .select("id, name_de, name_en, name_fr, name_it, icon, color, bg_color, is_system")
    .in("id", badgeIds);

  return NextResponse.json({ badges: badges ?? [] });
}
