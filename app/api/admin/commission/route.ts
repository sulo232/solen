import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

// GET /api/admin/commission — fetch current commission rate
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: setting } = await admin
    .from("platform_settings")
    .select("value, updated_at")
    .eq("key", "commission")
    .single();

  return NextResponse.json({
    rate_percent: setting?.value?.rate_percent ?? 15,
    updated_at: setting?.updated_at ?? null,
  });
}

// PUT /api/admin/commission — update commission rate
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const ratePercent = Number(body.rate_percent);

  if (isNaN(ratePercent) || ratePercent < 0 || ratePercent > 50) {
    return NextResponse.json({ error: "rate_percent must be between 0 and 50" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert({
      key: "commission",
      value: { rate_percent: ratePercent },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(admin, {
    actor_id: user.id,
    action: "update_commission_rate",
    target_type: "platform_settings",
    target_id: "commission",
    metadata: { rate_percent: ratePercent },
  });

  return NextResponse.json({ success: true, rate_percent: ratePercent });
}
