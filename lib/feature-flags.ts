import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor" | "nail_features" | "barber_features" | "spa_features" | "discovery" | "dispute_reporting" | "upcharge_requests" | "vouchers";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side feature flags (build-time toggles)
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_FEATURE_FLAGS = {
  isMassageSpaEnabled: false, // Phase 1: Hide Massage & Spa category
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// In-memory TTL cache for feature_flags reads (Ring 2a, 2026-07-11).
// Per-process Map; a cold serverless instance always reads fresh. 30s TTL:
// short enough that an owner toggle (incl. maintenance_mode) reaches every
// warm instance within 30s, long enough to remove the 2 DB round-trips most
// gated routes were paying on every request (used by most mutation routes).
// Only a clean read (no query error) is cached; on a query error we still
// compute + return the exact pre-caching fail-open default below, but we do
// NOT cache it, so the next call re-checks the DB instead of trusting a
// transient failure for the rest of the TTL window.
// ─────────────────────────────────────────────────────────────────────────────
type FlagCacheEntry = { enabled: boolean; expiresAt: number };
const FLAG_TTL_MS = 30 * 1000;
const flagCache = new Map<string, FlagCacheEntry>();

// Test-only hooks (scripts/ring2a-kill-test.ts): count actual DB round-trips
// and reset cache state without waiting out real TTLs. Never read by prod code.
let __flagDbQueryCount = 0;
export function __getFlagDbQueryCountForTest(): number {
  return __flagDbQueryCount;
}
export function __resetFeatureFlagCacheForTest(): void {
  flagCache.clear();
  __flagDbQueryCount = 0;
}

export async function checkFeatureEnabled(featureKey: FeatureKey): Promise<NextResponse | null> {
  try {
    const now = Date.now();
    const cachedMaintenance = flagCache.get("maintenance_mode");
    const cachedFlag = flagCache.get(featureKey);
    let maintenanceEnabled: boolean | undefined =
      cachedMaintenance && cachedMaintenance.expiresAt > now ? cachedMaintenance.enabled : undefined;
    let flagEnabled: boolean | undefined =
      cachedFlag && cachedFlag.expiresAt > now ? cachedFlag.enabled : undefined;

    if (maintenanceEnabled === undefined || flagEnabled === undefined) {
      const admin = createAdminSupabaseClient();
      const keys = Array.from(
        new Set(
          [
            maintenanceEnabled === undefined ? "maintenance_mode" : null,
            flagEnabled === undefined ? featureKey : null,
          ].filter((k): k is string => k !== null)
        )
      );

      __flagDbQueryCount++;
      // Single combined read replaces the old 2 sequential .single() calls
      // (maintenance_mode, then the requested key) with 1 .in() round-trip.
      const { data: rows, error } = await admin
        .from("feature_flags")
        .select("key, enabled")
        .in("key", keys);

      const byKey = new Map(
        (rows ?? []).map((r: { key: string; enabled: boolean }) => [r.key, r.enabled])
      );

      if (maintenanceEnabled === undefined) {
        // Missing row / query error: old code's `maintenance?.enabled` on a
        // null `data` was falsy, i.e. fails OPEN (not maintenance).
        maintenanceEnabled = byKey.get("maintenance_mode") ?? false;
        if (!error) {
          flagCache.set("maintenance_mode", { enabled: maintenanceEnabled, expiresAt: now + FLAG_TTL_MS });
        }
      }
      if (flagEnabled === undefined) {
        // Old code: `if (flag && !flag.enabled)` only blocked when the row
        // EXISTS and enabled === false; a missing row / query error fails OPEN.
        flagEnabled = byKey.has(featureKey) ? !!byKey.get(featureKey) : true;
        if (!error) {
          flagCache.set(featureKey, { enabled: flagEnabled, expiresAt: now + FLAG_TTL_MS });
        }
      }
    }

    if (maintenanceEnabled) {
      return NextResponse.json(
        { error: "solen.ch is currently under maintenance. Please try again shortly.", code: "MAINTENANCE_MODE" },
        { status: 503 }
      );
    }
    if (!flagEnabled) {
      return NextResponse.json(
        { error: "This feature is temporarily disabled.", code: "FEATURE_DISABLED" },
        { status: 503 }
      );
    }

    return null; // feature is enabled, proceed
  } catch {
    // Fail open. If the admin client can't be created (e.g. missing service role key), allow the feature.
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory TTL cache for ban checks, keyed by userId.
// SECURITY: capped at 10s (not the 30s flag TTL) so a freshly banned user
// stops slipping through on a warm instance within ~10s, never longer. Only
// a clean DB read (no error) is cached; a query error still fails CLOSED
// per-call (503 below) and is never cached, so the very next call re-checks
// the DB instead of trusting the failure for the rest of the window.
// ─────────────────────────────────────────────────────────────────────────────
type BanCacheEntry = { banned: boolean; reason?: string; expiresAt: number };
const BAN_TTL_MS = 10 * 1000;
// Unbounded growth guard: one entry per distinct userId ever checked on this
// warm instance, entries only expire (never get deleted) on the 10s read
// path. A busy instance could otherwise accumulate entries for as many users
// as it serves over its lifetime. LRU eviction is overkill for a 10s TTL
// cache, a full clear at a size cap is simpler and safe: worst case is one
// extra DB read per active user right after the clear, no correctness risk
// (bans still fail closed on the DB read path above).
const BAN_CACHE_MAX_SIZE = 5000;
const banCache = new Map<string, BanCacheEntry>();

let __banDbQueryCount = 0;
export function __getBanDbQueryCountForTest(): number {
  return __banDbQueryCount;
}
export function __resetBanCacheForTest(): void {
  banCache.clear();
  __banDbQueryCount = 0;
}

function banResponse(banned: boolean, reason?: string): NextResponse | null {
  if (banned) {
    return NextResponse.json(
      { error: "Your account has been suspended.", code: "USER_BANNED", reason: reason ?? undefined },
      { status: 403 }
    );
  }
  return null; // not banned, proceed
}

export async function checkUserBanned(userId: string): Promise<NextResponse | null> {
  const now = Date.now();
  const cached = banCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return banResponse(cached.banned, cached.reason);
  }

  __banDbQueryCount++;
  const admin = createAdminSupabaseClient();
  const { data: profile, error } = await admin
    .from("profiles").select("banned_at, ban_reason").eq("id", userId).single();

  // Fail CLOSED on DB error: a banned user must not slip through a transient
  // DB blip / RLS error. Pre-2026-05-16 this fell back to "not banned" on
  // any error which would let banned users continue during an outage.
  // PGRST116 = no rows (legitimate, user has no profile yet, not banned).
  // Not cached, so the next call re-checks the DB rather than trusting a
  // transient failure for the rest of the TTL window.
  if (error && error.code !== "PGRST116") {
    console.error("[checkUserBanned] DB error checking ban status:", error, { userId });
    return NextResponse.json(
      { error: "Unable to verify account status. Please try again.", code: "BAN_CHECK_FAILED" },
      { status: 503 }
    );
  }

  const banned = !!profile?.banned_at;
  const reason = profile?.ban_reason ?? undefined;
  if (banCache.size > BAN_CACHE_MAX_SIZE) {
    banCache.clear();
  }
  banCache.set(userId, { banned, reason, expiresAt: now + BAN_TTL_MS });

  return banResponse(banned, reason);
}
