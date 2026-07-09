import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

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

type RateLimitIdentifier = { ip: string } | { userId: string };

export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: RateLimitIdentifier
): Promise<NextResponse | null> {
  // Skip rate limiting if Upstash Redis is not configured
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const key = "ip" in identifier ? identifier.ip : identifier.userId;
    const { success, limit, reset, remaining } = await limiter.limit(key);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      );
    }
  } catch (err) {
    // Redis connection failed — allow request through rather than blocking
    console.error("[ratelimit] Redis error, skipping rate limit:", err);
  }
  return null;
}

/**
 * Boolean rate-limit check for contexts that can't return a NextResponse (server components, background work).
 * Returns true (allowed) when Redis is unconfigured or errors — fail-open, like applyRateLimit.
 */
export async function checkRateLimit(limiter: Ratelimit, key: string): Promise<boolean> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return true;
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
