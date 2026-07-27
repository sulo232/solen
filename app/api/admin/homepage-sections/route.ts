export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, adminHomepageSectionsSchema } from "@/lib/validations";

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

// GET /api/admin/homepage-sections — get homepage section visibility (admin only)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: setting } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "homepage_sections")
    .single();

  const storedSections =
    setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value)
      ? setting.value
      : {};

  return NextResponse.json({
    sections: { ...DEFAULT_SECTIONS, ...storedSections },
  });
}

// PUT /api/admin/homepage-sections — update homepage section visibility
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json();
  const { data: validated, error: validationError } = validateBody(adminHomepageSectionsSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }
  const { sections } = validated;

  const { error } = await admin
    .from("platform_settings")
    .upsert({
      key: "homepage_sections",
      value: sections,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, sections });
}
