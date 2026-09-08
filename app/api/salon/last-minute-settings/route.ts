export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, lastMinuteSettingsSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";
import type { Database } from "@/lib/database.types";

/**
 * GET /api/salon/last-minute-settings?salon_id=...
 * Fetch last-minute deals settings for a salon
 */
export async function GET(req: NextRequest) {
  try {
    const salonId = req.nextUrl.searchParams.get("salon_id");
    if (!salonId) {
      return NextResponse.json(
        { error: "Missing salon_id parameter" },
        { status: 400 }
      );
    }

    // P9-2: requireSalonAccess composes the owner check with the staff
    // area-permission check (settings = business settings) instead of the
    // old owner-or-admin compare. The owner path is unchanged: same
    // owner_id === user.id comparison, just made inside the shared gate.
    // This also picks up the admin-role bypass the old inline check already
    // had (requireSalonAccess falls back to isPlatformAdmin), so nothing is
    // lost by converting this handler too.
    const accessResult = await requireSalonAccess(salonId, "settings");
    if (accessResult instanceof NextResponse) return accessResult;

    // P9-2 RLS fix: the two "Users can read/insert their salon last-minute
    // settings" policies are owner-only, so a granted staff caller reading
    // through the session client got a silently-swallowed error mapped to
    // the "not configured" default. The admin client bypasses that RLS gap
    // (scoped to the gated salonId below); maybeSingle distinguishes a real
    // query error (logged, 500) from a genuine no-row result (the default).
    const admin = createAdminSupabaseClient();
    const { data: settings, error: settingsError } = await admin
      .from("salon_last_minute_settings")
      .select("*")
      .eq("salon_id", salonId)
      .maybeSingle();

    if (settingsError) {
      console.error("[last-minute-settings] GET query failed:", settingsError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if (!settings) {
      return NextResponse.json({
        enabled: false,
        global_discount_percent: 10,
        service_overrides: {},
      });
    }

    return NextResponse.json({
      enabled: settings.enabled,
      global_discount_percent: settings.global_discount_percent,
      service_overrides: settings.service_overrides || {},
    });
  } catch (error) {
    console.error("[LastMinuteSettings] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/salon/last-minute-settings
 * Save last-minute deals settings for a salon
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const { data: validated, error: validationError } = validateBody(lastMinuteSettingsSchema, rawBody);
    if (validationError) {
      return NextResponse.json(
        { error: "Missing salon_id" },
        { status: 400 }
      );
    }
    const { salon_id, enabled, global_discount_percent, service_overrides } = validated;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    // P9-2: requireSalonAccess composes the owner check with the staff
    // area-permission check (settings = business settings) instead of the
    // old owner-only compare. The owner path is unchanged: same owner_id
    // === user.id comparison, just made inside the shared gate. GET above
    // is now converted too (same admin-client fix), so both handlers read
    // and write this table the same way.
    const accessResult = await requireSalonAccess(salon_id, "settings");
    if (accessResult instanceof NextResponse) return accessResult;

    // RLS fix: "Users can update/insert their salon last-minute settings" is
    // owner-only, so a granted staff caller upserting through the session
    // client got a silent write failure. Admin client, scoped to salon_id.
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("salon_last_minute_settings")
      .upsert({
        salon_id,
        enabled: enabled ?? false,
        global_discount_percent: global_discount_percent ?? 10,
        service_overrides: (service_overrides ?? {}) as Database["public"]["Tables"]["salon_last_minute_settings"]["Insert"]["service_overrides"],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "salon_id"
      });

    if (error) {
      console.error("[LastMinuteSettings] upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LastMinuteSettings] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
