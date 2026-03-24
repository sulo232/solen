export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

const DEFAULT_SECTIONS: Record<string, boolean> = {
  quartier: false,
  trending: false,
  nearby: false,
  new_salons: false,
  rebook: false,
  reviews: false,
  last_minute: true,
  featured: true,
  social_proof: false,
  partner_cta: true,
};

// GET /api/homepage-sections — public endpoint for homepage section visibility
export async function GET() {
  const admin = createAdminSupabaseClient();

  const { data: setting } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage_sections")
    .single();

  return NextResponse.json({
    sections: { ...DEFAULT_SECTIONS, ...(setting?.value ?? {}) },
  });
}
