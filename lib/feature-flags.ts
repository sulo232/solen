import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor" | "nail_features" | "barber_features" | "spa_features" | "discovery" | "dispute_reporting";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side feature flags (build-time toggles)
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_FEATURE_FLAGS = {
  isMassageSpaEnabled: false, // Phase 1: Hide Massage & Spa category
} as const;

export async function checkFeatureEnabled(featureKey: FeatureKey): Promise<NextResponse | null> {
  try {
    const admin = createAdminSupabaseClient();

    // Always check maintenance mode first
    const { data: maintenance } = await admin
      .from("feature_flags").select("enabled").eq("key", "maintenance_mode").single();
    if (maintenance?.enabled) {
      return NextResponse.json(
        { error: "solen.ch is currently under maintenance. Please try again shortly.", code: "MAINTENANCE_MODE" },
        { status: 503 }
      );
    }

    const { data: flag } = await admin
      .from("feature_flags").select("enabled").eq("key", featureKey).single();
    if (flag && !flag.enabled) {
      return NextResponse.json(
        { error: "This feature is temporarily disabled.", code: "FEATURE_DISABLED" },
        { status: 503 }
      );
    }

    return null; // feature is enabled, proceed
  } catch {
    // Fail open — if admin client can't be created (e.g. missing service role key), allow the feature
    return null;
  }
}

export async function checkUserBanned(userId: string): Promise<NextResponse | null> {
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles").select("banned_at, ban_reason").eq("id", userId).single();
  if (profile?.banned_at) {
    return NextResponse.json(
      { error: "Your account has been suspended.", code: "USER_BANNED", reason: profile.ban_reason ?? undefined },
      { status: 403 }
    );
  }
  return null; // not banned, proceed
}
