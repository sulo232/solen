import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Send an SMS via seven.io.
 * Gracefully skips if SEVEN_IO_API_KEY is not set.
 * Rate-limited to 3 SMS per phone number per day.
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  // --- env guard ---
  if (!env.SEVEN_IO_API_KEY) {
    console.warn("[SMS] SEVEN_IO_API_KEY not set — skipping");
    return false;
  }

  // --- input validation: Swiss phone numbers ---
  if (!to.startsWith("+41")) {
    console.warn(`[SMS] Invalid phone number (must start with +41): ${to}`);
    return false;
  }

  // --- per-phone rate limit: 3/day ---
  if (redis) {
    try {
      const key = `sms:daily:${to}`;
      const count = await redis.incr(key);
      if (count === 1) {
        // First SMS today — set expiry to 24h
        await redis.expire(key, 86400);
      }
      if (count > 3) {
        console.warn(`[SMS] Rate limit exceeded for ${to} (${count}/3 today)`);
        return false;
      }
    } catch (err) {
      // Redis down — allow through rather than blocking
      console.error("[SMS] Redis rate-limit check failed:", err);
    }
  }

  // --- send via seven.io ---
  try {
    const response = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.SEVEN_IO_API_KEY,
      },
      body: JSON.stringify({
        to,
        text: message,
        from: "solen.ch",
      }),
    });

    if (!response.ok) {
      console.error(
        `[SMS] seven.io returned ${response.status}: ${await response.text()}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
    return false;
  }
}
