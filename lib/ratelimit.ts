import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { createBoundedRedis } from "@/lib/redis";

const env = getServerEnv();
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
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
// Default per-user daily ceiling for EXPENSIVE AI generation (Gemini text drafting + fal image
// gen). 100/day sits well above normal use (a heavy user drafts a handful of things a day) while
// stopping a runaway client loop or scripted abuse from running up an unbounded generation bill.
// Editable live by an admin (platform_settings.ai_daily_cap, /dashboard/ai-limits-admin).
// NOTE (owner decision 2026-07-14): the CHEAP embedding/search routes (salons, salons/search,
// search/smart) deliberately do NOT carry this daily cap. Embeddings are near-free per call and
// those routes are used a lot, so they keep the per-minute generalLimiter only.
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

// Retry-After sent when an abuse-prone limiter fails CLOSED with no Redis to ask. We have no
// real reset time to report, so this is a plain "come back in a minute" rather than a
// fabricated window.
const FAIL_CLOSED_RETRY_AFTER_SECONDS = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Configurable AI daily cap (platform_settings.key='ai_daily_cap', value.cap),
// editable via /api/admin/ai-limits. In-memory TTL cache, same style as the
// feature-flag cache in lib/feature-flags.ts: 60s TTL, only a clean read (no
// query error, a real integer cap) is cached, so a transient DB error re-checks
// on the very next call instead of trusting the failure for the rest of the
// window.
// ─────────────────────────────────────────────────────────────────────────────
type AiDailyCapCacheEntry = { cap: number; expiresAt: number };
// 60s cache: a live admin edit to the cap takes effect within a minute, without a DB round-trip
// on every AI request.
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

/**
 * A HOUSE-WIDE daily ceiling on the expensive AI calls, on top of the per-user one above.
 *
 * The per-user cap is a fairness limit: it stops one account running up a bill. It does nothing
 * about a hundred accounts each spending their full allowance on the same day, or about a scripted
 * signup loop, because every fresh account arrives with a fresh allowance. This is the cost limit:
 * one shared counter for the whole product, so the worst case for a day is bounded no matter how
 * many callers there are.
 *
 * Landed 2026-08-14. The July backend re-audit wired two routes to a global limiter and the
 * limiter itself was never written: `getAiGlobalDailyLimiter` is imported on that branch and
 * defined in no branch at all, so those files could not have compiled. Implemented here rather
 * than lifted.
 *
 * 2000/day is deliberately far above real use (the per-user cap is 100 and a busy day is a handful
 * of users drafting a few things each) and far below a runaway. Like its per-user sibling it joins
 * the abuse-prone set, so an unconfigured Upstash in production fails CLOSED: a cost ceiling that
 * disappears when the counter is missing is not a ceiling.
 */
export const AI_GLOBAL_DAILY_CAP = 2000;
export const AI_GLOBAL_BUDGET_KEY = "solen:ai:global";
export const AI_GLOBAL_BUDGET_EXCEEDED_BODY = {
  error: "AI features are paused for today",
  code: "AI_GLOBAL_BUDGET_EXCEEDED",
};

let aiGlobalDailyLimiter: Ratelimit | null = null;

export async function getAiGlobalDailyLimiter(): Promise<Ratelimit> {
  if (!aiGlobalDailyLimiter) {
    aiGlobalDailyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(AI_GLOBAL_DAILY_CAP, "1 d"),
      analytics: true,
      prefix: "rl:ai:global",
    });
    ABUSE_PRONE_LIMITERS.add(aiGlobalDailyLimiter);
  }
  return aiGlobalDailyLimiter;
}

// Set at most once per process. The underlying misconfiguration (Upstash unset in
// prod) doesn't change between requests, so re-alerting on every request would just
// spam the inbox into being ignored.
let alertedMisconfiguredRedis = false;

/**
 * Pages ADMIN_EMAIL once when a non-abuse-prone limiter is about to fail open
 * because Upstash is unconfigured on a real production boot. Fire-and-forget:
 * alertAdmin is itself best-effort and never throws.
 *
 * alertAdmin is loaded with a dynamic import, not a static one, on purpose:
 * lib/alert-admin.ts pulls in lib/email.ts, which pulls in the Node-only
 * "crypto" module. This file is imported by API routes that declare
 * runtime = "edge", and a static import of that chain does not resolve in
 * the edge bundle, so the whole build fails. This function only ever runs
 * during a Node production boot with Upstash unconfigured, so deferring the
 * import to call time keeps the Node-only chain out of edge bundles. Do not
 * change this back to a static import.
 */
function alertMisconfiguredRedisOnce(): void {
  if (alertedMisconfiguredRedis) return;
  alertedMisconfiguredRedis = true;
  import("@/lib/alert-admin")
    .then(({ alertAdmin }) =>
      alertAdmin(
        "Rate limiting is fail-open in production",
        "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset on a production boot " +
          "(CONTEXT=production). Abuse-prone limiters (auth, payment, booking, guest lookup, " +
          "referral validate, resend-access, referral complete, AI daily cost cap) are failing " +
          "closed, but every other rate limiter is disabled and requests to those routes are " +
          "passing through unthrottled."
      )
    )
    .catch((err) => console.error("[ratelimit] admin alert failed:", err));
}

type RateLimitIdentifier = { ip: string } | { userId: string };

/**
 * @param body optional replacement for the generic 429 payload, for a limiter whose refusal means
 *   something specific enough that the caller should be told which one it hit. The one case today
 *   is AI_GLOBAL_BUDGET_EXCEEDED_BODY: "AI features are paused for today" is a house-wide cost
 *   ceiling and reads completely differently from "you are going too fast", which is what the
 *   generic body says. Added 2026-08-14 during the branch merge, and the ordering matters: this
 *   parameter is OPTIONAL and appended, so all 40-odd existing two-argument call sites are
 *   untouched. That constant and its limiter were already on main and exported; only this
 *   parameter was missing, so seven routes that wanted the specific message could not compile.
 */
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: RateLimitIdentifier,
  body: Record<string, unknown> = RATE_LIMITED_BODY
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
        return NextResponse.json(body, { status: 429 });
      }
      alertMisconfiguredRedisOnce();
    }
    return null;
  }
  try {
    const key = "ip" in identifier ? identifier.ip : identifier.userId;
    const { success, limit, reset, remaining } = await limiter.limit(key);
    if (!success) {
      return NextResponse.json(body, {
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
    // RL-LIVE-01 (HIGH, 2026-07-17): a RUNTIME Redis failure (configured but unreachable,
    // timing out, or rate-limiting US). No Redis to ask is no Redis to ask, however we got
    // there, so this mirrors the unconfigured-branch guard above. The fix was stranded on
    // claude/quirky-ellis-ef5559 (c2cc6929c) while its test reached main alone, brought
    // across 2026-08-27.
    if (
      process.env.CONTEXT === "production" &&
      process.env.NODE_ENV === "production" &&
      ABUSE_PRONE_LIMITERS.has(limiter)
    ) {
      console.error("[ratelimit] abuse-prone limiter failing CLOSED, Upstash unreachable at runtime:", err);
      return NextResponse.json(body, { status: 429, headers: { "Retry-After": String(FAIL_CLOSED_RETRY_AFTER_SECONDS) } });
    }
    // Everything else still fails OPEN: a Redis blip must not break browsing.
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
    if (
      process.env.CONTEXT === "production" &&
      process.env.NODE_ENV === "production" &&
      ABUSE_PRONE_LIMITERS.has(limiter)
    ) {
      console.error("[ratelimit] abuse-prone limiter failing CLOSED, Upstash unreachable at runtime:", err);
      return false;
    }
    console.error("[ratelimit] Redis error, allowing through:", err);
    return true;
  }
}

/**
 * Accepts either a request or a bare headers object. It only ever reads headers, and a server
 * component has no request to hand it, only `await headers()`. Typing it as NextRequest meant the
 * one public page that needs an IP (the Inspo detail page, which fires a paid AI call on view)
 * could not call the trusted-header helper at all. Structural, so anything with `.get()` works.
 */
type HeaderSource = { get(name: string): string | null };

export function getClientIp(source: NextRequest | HeaderSource): string {
  const req: HeaderSource = "headers" in source ? source.headers : source;
  return (
    // Platform-trusted headers first: x-forwarded-for's leftmost entry is attacker-supplied
    // (an attacker can prepend any value), so every auth/OTP limiter keyed on it alone is
    // trivially bypassed by rotating the header. Netlify's edge overwrites
    // x-nf-client-connection-ip with the real connecting IP, so it can't be spoofed by the
    // client; x-real-ip is the common trusted-proxy equivalent. Only fall back to the
    // spoofable XFF parse when neither trusted header is present (local/dev).
    req.get("x-nf-client-connection-ip")?.trim() ||
    req.get("x-real-ip")?.trim() ||
    req.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
