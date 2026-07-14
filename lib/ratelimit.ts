import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { alertAdmin } from "@/lib/alert-admin";
import { createAdminSupabaseClient } from "@/lib/supabase";

const env = getServerEnv();
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null as any;

export const generalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:general",
});

// Per-user DAILY ceiling on Gemini/fal AI-GENERATION routes only (translate, recommend,
// suggest-service, intake-recommendation, ai-info, nail/generate). The per-minute limiters
// below (generalLimiter, adminLimiter) only cap burst rate; a user sitting at the per-minute
// cap all day can still run up an unbounded bill (e.g. ~30/min x generalLimiter sustained for
// hours). Apply THIS IN ADDITION to, never instead of, the existing per-minute limiter on
// every route that actually calls out to Gemini or fal.ai for GENERATION. Cheap embedding/
// search routes (salons, salons/search, search/smart) do NOT carry this cap, embeddings are
// near-free and stay under the per-minute generalLimiter only.
//
// The cap is DB-backed (platform_settings.key='ai_daily_cap', value.cap) and editable via
// /api/admin/ai-limits, same key/value/jsonb pattern as the commission rate
// (app/api/admin/commission/route.ts). Use getAiDailyLimiter() below, never a static
// instance, so a live cap edit takes effect without a redeploy.
export const DEFAULT_AI_DAILY_CAP = 100;

export const bookingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rl:booking",
});

export const messageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:message",
});

export const paymentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "rl:payment",
});

export const adminLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "rl:admin",
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "rl:auth",
});

export const referralLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "30 d"),
  analytics: true,
  prefix: "rl:referral",
});

// GET /api/referral/validate is a public, unauthenticated enumeration oracle (returns
// valid:true/false for any code). generalLimiter (30/min) alone is loose enough to scan
// through a lot of guesses, so this is a dedicated tighter cap on top, same pattern as
// guestLookupLimiter below: a real user needs one attempt, 10/10min stops a scanner cold.
export const referralValidateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  analytics: true,
  prefix: "rl:referral:validate",
});

export const roadmapLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "rl:roadmap",
});

// Discovery limiters
export const discoveryFeedLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), analytics: true, prefix: "rl:disc:feed" });
export const discoveryPostLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 d"), analytics: true, prefix: "rl:disc:post" });
export const discoveryCommentLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "rl:disc:comment" });
export const discoveryLikeLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), analytics: true, prefix: "rl:disc:like" });
export const discoveryAdminLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "rl:disc:admin" });
// On-demand AI vision is triggered by a PUBLIC look-detail page view. Tight per-IP cap so a scraper can't fan out
// across unanalyzed items and run up the Gemini bill (each call is ~a few cents + several seconds).
export const discoveryAiLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(4, "10 m"), analytics: true, prefix: "rl:disc:ai" });

// Guest booking-access surface (SP-2, §10b.12) — dedicated + TIGHT, NOT generalLimiter.
// This is the enumeration / token-brute-force surface. Keyed by IP (guests have no userId).
// A legit guest needs 1-2 attempts; 10/10min stops a reference_code scanner cold while not
// hurting a fat-fingered user. (Token space is 256-bit so brute force is infeasible
// regardless; the limiter defends the reference_code space + DB load.)
export const guestLookupLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), analytics: true, prefix: "rl:guest:lookup" });
// "Resend my access link" — strictest: resends are rare and abuse-prone (email bombing +
// code probing). 3/hour per IP.
export const resendAccessLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), analytics: true, prefix: "rl:guest:resend" });

export const offPeakNotifyLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "6 h"), analytics: true, prefix: "rl:offpeak:notify" });

// Limiters guarding abuse-prone surfaces: credential stuffing (auth, which also covers
// every OTP/verify-phone route, they all key off authLimiter), payment attempts, booking
// spam, the three enumeration/brute-force oracles (guest reference_code lookup, referral
// code validation, resend-access), the authenticated referral money-crediting path
// (userId-keyed, farmable for CHF credit rather than an enumeration target, but still
// abuse-prone), and the daily AI cost ceiling (getAiDailyLimiter() below, which self-
// registers every distinct-cap Ratelimit instance it builds into this Set, see below)
// since a cost cap that fails open on a misconfigured Upstash defeats the whole point of
// having one. If Upstash is unconfigured on a REAL production boot these must fail
// CLOSED, failing open here would silently drop the exact protection they exist for.
// Every other limiter (general browsing, discovery, admin, messaging, etc.) keeps
// today's fail-open behavior since blocking those would break the product, not just
// slow an attacker.
const ABUSE_PRONE_LIMITERS = new Set<Ratelimit>([
  authLimiter,
  paymentLimiter,
  bookingLimiter,
  guestLookupLimiter,
  referralLimiter,
  referralValidateLimiter,
  resendAccessLimiter,
]);

const RATE_LIMITED_BODY = { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Configurable AI daily cap (platform_settings.key='ai_daily_cap', value.cap),
// editable via /api/admin/ai-limits. In-memory TTL cache, same style as the
// feature-flag cache in lib/feature-flags.ts: 60s TTL, only a clean read (no
// query error, a real integer cap) is cached, so a transient DB error re-checks
// on the very next call instead of trusting the failure for the rest of the
// window.
// ─────────────────────────────────────────────────────────────────────────────
type AiDailyCapCacheEntry = { cap: number; expiresAt: number };
const AI_DAILY_CAP_TTL_MS = 60 * 1000;
let aiDailyCapCache: AiDailyCapCacheEntry | null = null;

async function resolveAiDailyCap(): Promise<number> {
  const now = Date.now();
  if (aiDailyCapCache && aiDailyCapCache.expiresAt > now) {
    return aiDailyCapCache.cap;
  }
  try {
    const admin = createAdminSupabaseClient();
    const { data: setting, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "ai_daily_cap")
      .single();

    // Missing row / query error: fall back to the default, do NOT cache the
    // failure, so the next call re-checks the DB instead of trusting a
    // transient blip for the rest of the TTL window.
    if (error) return DEFAULT_AI_DAILY_CAP;

    const value = setting?.value;
    const rawCap =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as { cap?: unknown }).cap
        : undefined;
    const cap =
      typeof rawCap === "number" && Number.isInteger(rawCap) && rawCap > 0
        ? rawCap
        : DEFAULT_AI_DAILY_CAP;

    aiDailyCapCache = { cap, expiresAt: now + AI_DAILY_CAP_TTL_MS };
    return cap;
  } catch (err) {
    console.error("[ratelimit] failed to read ai_daily_cap, falling back to default:", err);
    return DEFAULT_AI_DAILY_CAP;
  }
}

// One Ratelimit instance per distinct cap value, built lazily and reused
// across requests, rather than reconstructing one on every call. The cap
// only changes when an admin edits it (rare), so this map stays effectively
// O(1) in practice.
const aiDailyLimiterInstances = new Map<number, Ratelimit>();

/**
 * Returns the current daily AI-generation Ratelimit instance, built from the
 * DB-backed cap (platform_settings.key='ai_daily_cap', TTL-cached above, falls
 * back to DEFAULT_AI_DAILY_CAP if unset/misconfigured). Every instance this
 * builds is registered into ABUSE_PRONE_LIMITERS so applyRateLimit keeps
 * failing CLOSED on it when Upstash is unconfigured in production, same as
 * the old static aiDailyLimiter did.
 */
export async function getAiDailyLimiter(): Promise<Ratelimit> {
  const cap = await resolveAiDailyCap();
  let limiter = aiDailyLimiterInstances.get(cap);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cap, "1 d"),
      analytics: true,
      prefix: "rl:ai:daily",
    });
    aiDailyLimiterInstances.set(cap, limiter);
    ABUSE_PRONE_LIMITERS.add(limiter);
  }
  return limiter;
}

// Set at most once per process. The underlying misconfiguration (Upstash unset in
// prod) doesn't change between requests, so re-alerting on every request would just
// spam the inbox into being ignored.
let alertedMisconfiguredRedis = false;

/**
 * Pages ADMIN_EMAIL once when a non-abuse-prone limiter is about to fail open
 * because Upstash is unconfigured on a real production boot. Fire-and-forget:
 * alertAdmin is itself best-effort and never throws.
 */
function alertMisconfiguredRedisOnce(): void {
  if (alertedMisconfiguredRedis) return;
  alertedMisconfiguredRedis = true;
  void alertAdmin(
    "Rate limiting is fail-open in production",
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset on a production boot " +
      "(CONTEXT=production). Abuse-prone limiters (auth, payment, booking, guest lookup, " +
      "referral validate, resend-access, referral complete, AI daily cost cap) are failing " +
      "closed, but every other rate limiter is disabled and requests to those routes are " +
      "passing through unthrottled."
  );
}

type RateLimitIdentifier = { ip: string } | { userId: string };

export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: RateLimitIdentifier
): Promise<NextResponse | null> {
  // Skip rate limiting if Upstash Redis is not configured
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Same double-check lib/env.ts's assertProdRequiredEnv uses: CONTEXT alone is
    // Netlify-set on deploy previews/branch deploys too, so pairing it with NODE_ENV
    // is the defense-in-depth line that narrows this to a REAL production boot.
    if (process.env.CONTEXT === "production" && process.env.NODE_ENV === "production") {
      if (ABUSE_PRONE_LIMITERS.has(limiter)) {
        // Fail CLOSED: no Redis to ask, so this is the same 429 a real limit hit
        // returns, minus the X-RateLimit-* headers (we have no real limit/remaining/
        // reset numbers to report without a Redis call, and fabricating them would
        // be worse than omitting them).
        return NextResponse.json(RATE_LIMITED_BODY, { status: 429 });
      }
      alertMisconfiguredRedisOnce();
    }
    return null;
  }
  try {
    const key = "ip" in identifier ? identifier.ip : identifier.userId;
    const { success, limit, reset, remaining } = await limiter.limit(key);
    if (!success) {
      return NextResponse.json(RATE_LIMITED_BODY, {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      });
    }
  } catch (err) {
    // Redis connection failed, allow request through rather than blocking
    console.error("[ratelimit] Redis error, skipping rate limit:", err);
  }
  return null;
}

/**
 * Boolean rate-limit check for contexts that can't return a NextResponse (server components, background work).
 * Returns true (allowed) when Redis is unconfigured outside prod, or on a runtime Redis error, fail-open like
 * applyRateLimit. On a real production boot with Redis unconfigured, abuse-prone limiters fail CLOSED (false).
 */
export async function checkRateLimit(limiter: Ratelimit, key: string): Promise<boolean> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Same CONTEXT + NODE_ENV double-check as applyRateLimit above.
    if (process.env.CONTEXT === "production" && process.env.NODE_ENV === "production") {
      if (ABUSE_PRONE_LIMITERS.has(limiter)) return false;
      alertMisconfiguredRedisOnce();
    }
    return true;
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.error("[ratelimit] Redis error, allowing through:", err);
    return true;
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    // Platform-trusted headers first: x-forwarded-for's leftmost entry is attacker-supplied
    // (an attacker can prepend any value), so every auth/OTP limiter keyed on it alone is
    // trivially bypassed by rotating the header. Netlify's edge overwrites
    // x-nf-client-connection-ip with the real connecting IP, so it can't be spoofed by the
    // client; x-real-ip is the common trusted-proxy equivalent. Only fall back to the
    // spoofable XFF parse when neither trusted header is present (local/dev).
    req.headers.get("x-nf-client-connection-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
