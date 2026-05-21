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

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
