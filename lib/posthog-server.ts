import { PostHog } from 'posthog-node';
import { getPublicEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

// Singleton instance
let posthogClient: PostHog | null = null;

// Not exported: only used internally by trackServerEvent/identifyServerUser below
// (zero external imports, ring5c dead-export sweep).
function getPostHogClient() {
  const key = getPublicEnv().NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: 'https://eu.i.posthog.com',
      // Send events immediately so they don't get lost in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

// ─────────────────────────────────────────────────────────────────────────────
// GDPR/revDSG consent gate. Every caller of trackServerEvent/identifyServerUser
// passes a Supabase auth user id as distinctId, so that id doubles as
// profiles.id here. localStorage (where CookieConsent.tsx stores the banner
// choice) is unreadable from the server, so this reads the server-side mirror
// (profiles.analytics_consent, written by POST /api/me/consent) instead.
// FAIL CLOSED: NULL/false/missing row/query error all mean "do not track".
// In-memory TTL cache, same style as resolveAiDailyCap in lib/ratelimit.ts:
// only a clean read is cached, so a transient DB error re-checks on the very
// next call instead of trusting the failure for the rest of the window.
// ─────────────────────────────────────────────────────────────────────────────
type ConsentCacheEntry = { consent: boolean; expiresAt: number };
const CONSENT_CACHE_TTL_MS = 60 * 1000;
const consentCache = new Map<string, ConsentCacheEntry>();
// Bound the map: entries are otherwise only ever overwritten per-user, never removed, so a
// long-running process would grow it indefinitely. distinctId is always a trusted auth user id
// (never raw request input), so this is slow memory growth, not a poisoning vector; clearing
// wholesale just forces a re-read.
const CONSENT_CACHE_MAX = 5000;

/**
 * Drop a user's cached consent so a change via POST /api/me/consent takes effect immediately on
 * this instance instead of up to CONSENT_CACHE_TTL_MS later. Without this, revoking consent left
 * a warm instance capturing for that user for the rest of the TTL window (a bounded fail-open on
 * revocation). Other instances still converge within the TTL.
 */
export function invalidateConsentCache(distinctId: string): void {
  consentCache.delete(distinctId);
}

async function hasAnalyticsConsent(distinctId: string): Promise<boolean> {
  const now = Date.now();
  const cached = consentCache.get(distinctId);
  if (cached && cached.expiresAt > now) {
    return cached.consent;
  }
  try {
    const admin = createAdminSupabaseClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("analytics_consent")
      .eq("id", distinctId)
      .maybeSingle();

    // Missing row / query error: fail closed (no consent), do NOT cache the
    // failure, so the next call re-checks the DB instead of trusting a
    // transient blip for the rest of the TTL window.
    if (error) {
      console.error("[posthog-server] consent lookup failed, defaulting to no consent:", error);
      return false;
    }

    // Cast: lib/database.types.ts predates the analytics_consent migration
    // (20260714230441, applied live via MCP), so the column isn't in the generated
    // Row type yet (same gap the stripe webhook handler casts around for VAT columns).
    const consent = (profile as any)?.analytics_consent === true;
    if (consentCache.size >= CONSENT_CACHE_MAX) consentCache.clear();
    consentCache.set(distinctId, { consent, expiresAt: now + CONSENT_CACHE_TTL_MS });
    return consent;
  } catch (err) {
    console.error("[posthog-server] consent lookup threw, defaulting to no consent:", err);
    return false;
  }
}

/**
 * Safely track an event from the server side.
 * Catches any errors to prevent crashing the main API flow.
 * Gated on the user's server-side analytics_consent (fail closed, see above).
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  try {
    const consented = await hasAnalyticsConsent(distinctId);
    if (!consented) return;

    const client = getPostHogClient();
    if (client) {
      client.capture({
        distinctId,
        event,
        properties,
      });
    }
  } catch (error) {
    console.error(`PostHog Server Error [capture ${event}]:`, error);
  }
}

/**
 * Link a user's static ID (Supabase Auth ID) to their events.
 * Gated on the user's server-side analytics_consent (fail closed, see above).
 */
export async function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  try {
    const consented = await hasAnalyticsConsent(distinctId);
    if (!consented) return;

    const client = getPostHogClient();
    if (client) {
      client.identify({
        distinctId,
        properties,
      });
    }
  } catch (error) {
    console.error("PostHog Server Error [identify]:", error);
  }
}

/**
 * Flush any pending events (useful before a lambda exits).
 */
export async function flushPostHog() {
  try {
    const client = getPostHogClient();
    if (client) {
      await client.shutdown();
    }
  } catch (error) {
    // Ignore internal shutdown errors
    console.error("[posthog-server] flush/shutdown failed:", error);
  }
}
