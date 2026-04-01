export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

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

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the salon to check ownership
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, user_id")
      .eq("id", salonId)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Check if user owns the salon (or is admin)
    const isAdmin = await supabase
      .from("salon_admins")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("salon_id", salonId)
      .single();

    if (salon.user_id !== session.user.id && !isAdmin.data) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch last-minute settings
    const { data: settings } = await supabase
      .from("salon_last_minute_settings")
      .select("*")
      .eq("salon_id", salonId)
      .single();

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
    const body = await req.json();
    const { salon_id, enabled, global_discount_percent, service_overrides } = body;

    if (!salon_id) {
      return NextResponse.json(
        { error: "Missing salon_id" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: salon } = await supabase
      .from("salons")
      .select("user_id")
      .eq("id", salon_id)
      .single();

    if (salon?.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert settings
    const { error } = await supabase
      .from("salon_last_minute_settings")
      .upsert({
        salon_id,
        enabled: enabled ?? false,
        global_discount_percent: global_discount_percent ?? 10,
        service_overrides: service_overrides ?? {},
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
