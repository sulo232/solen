// exists-check: net-new vs lib/ratelimit.ts, lib/validations.ts, lib/audit.ts, lib/supabase.ts
// because those are libs this route calls into (getAiDailyLimiter's DB-backed cap,
// adminAiLimitSchema, logAuditEvent, createAdminSupabaseClient), not a route to extend.
// No existing /api/admin/ai-limits or equivalent AI-cap admin endpoint (npm run exists
// ai_daily_cap / ai-limits / ai_limits, 0 matches). Structurally mirrors
// app/api/admin/commission/route.ts (same platform_settings key/value/jsonb pattern),
// per the task's explicit instruction to copy that route's security stack.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, DEFAULT_AI_DAILY_CAP, DEFAULT_AI_GLOBAL_DAILY_CAP } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminAiLimitSchema } from "@/lib/validations";

// GET /api/admin/ai-limits: fetch the current AI daily generation cap
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: setting, error: readErr } = await admin
    .from("platform_settings")
    .select("value, updated_at")
    .eq("key", "ai_daily_cap")
    .single();
  // .single() returns PGRST116 ("no rows") when the cap has never been saved , that is expected
  // (fall back to the default). Log any OTHER read error rather than swallowing it.
  if (readErr && readErr.code !== "PGRST116") {
    console.error("[admin/ai-limits] failed to read ai_daily_cap:", readErr.message);
  }

  const settingValue = setting?.value;
  const rawCap =
    settingValue && typeof settingValue === "object" && !Array.isArray(settingValue)
      ? (settingValue as { cap?: unknown }).cap
      : undefined;
  // Validate exactly like the enforcement path (resolveAiDailyCap in lib/ratelimit.ts) so the
  // admin UI never shows a value that differs from what is actually enforced.
  const cap =
    typeof rawCap === "number" && Number.isInteger(rawCap) && rawCap > 0
      ? rawCap
      : DEFAULT_AI_DAILY_CAP;

  // Same read, for the GLOBAL (house-wide) daily budget, see lib/ratelimit.ts
  // getAiGlobalDailyLimiter(). No UI consumes this yet (see globalCap comment on
  // adminAiLimitSchema); exposed here so the value is readable/editable without a direct DB
  // edit, same jsonb pattern as ai_daily_cap above.
  const { data: globalSetting, error: globalReadErr } = await admin
    .from("platform_settings")
    .select("value, updated_at")
    .eq("key", "ai_global_daily_cap")
    .single();
  if (globalReadErr && globalReadErr.code !== "PGRST116") {
    console.error("[admin/ai-limits] failed to read ai_global_daily_cap:", globalReadErr.message);
  }
  const globalSettingValue = globalSetting?.value;
  const rawGlobalCap =
    globalSettingValue && typeof globalSettingValue === "object" && !Array.isArray(globalSettingValue)
      ? (globalSettingValue as { cap?: unknown }).cap
      : undefined;
  const globalCap =
    typeof rawGlobalCap === "number" && Number.isInteger(rawGlobalCap) && rawGlobalCap > 0
      ? rawGlobalCap
      : DEFAULT_AI_GLOBAL_DAILY_CAP;

  return NextResponse.json({
    cap,
    // daily_cap is an alias for the same value: app/[locale]/dashboard/ai-limits-admin/page.tsx
    // (already built, reads data.daily_cap) is the live consumer of this route.
    daily_cap: cap,
    updated_at: setting?.updated_at ?? null,
    global_cap: globalCap,
    global_daily_cap: globalCap,
    global_updated_at: globalSetting?.updated_at ?? null,
  });
}

// PUT /api/admin/ai-limits: update the AI daily generation cap
export async function PUT(req: NextRequest) {
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminAiLimitSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const cap = validated.cap;

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert({
      key: "ai_daily_cap",
      value: { cap },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(
    req,
    user.id,
    "feature_flag.toggle", // using closest available action type
    "platform_settings",
    "ai_daily_cap",
    { cap }
  );

  // globalCap is OPTIONAL (see adminAiLimitSchema): only write ai_global_daily_cap when the
  // caller actually sent one, so an existing caller that only sends `cap` never touches the
  // global budget by accident.
  let globalCap: number | undefined;
  if (validated.globalCap !== undefined) {
    globalCap = validated.globalCap;
    const { error: globalError } = await admin
      .from("platform_settings")
      .upsert({
        key: "ai_global_daily_cap",
        value: { cap: globalCap },
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      });

    if (globalError) return NextResponse.json({ error: globalError.message }, { status: 500 });

    await logAuditEvent(
      req,
      user.id,
      "feature_flag.toggle", // using closest available action type
      "platform_settings",
      "ai_global_daily_cap",
      { cap: globalCap }
    );
  }

  // daily_cap is an alias for the same value: app/[locale]/dashboard/ai-limits-admin/page.tsx
  // (already built, reads data.daily_cap) is the live consumer of this route.
  return NextResponse.json({
    success: true,
    cap,
    daily_cap: cap,
    ...(globalCap !== undefined ? { global_cap: globalCap, global_daily_cap: globalCap } : {}),
  });
}
