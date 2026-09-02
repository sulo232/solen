export const dynamic = "force-dynamic";
// Runs on the Node runtime (not edge): it uses node:crypto (crypto.randomInt for the OTP),
// which the edge bundler cannot resolve (UnhandledSchemeError "node:crypto"). Upstash is REST
// so it works on Node too. Edge gave no benefit here and broke the build.

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { createBoundedRedis } from "@/lib/redis";
import { getServerEnv } from "@/lib/env";
import crypto from "node:crypto";
import { validateBody, verifyPhoneSendSchema } from "@/lib/validations";

const env = getServerEnv();
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  : null;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.json();
    const { data: validated, error: validationError } = validateBody(verifyPhoneSendSchema, rawBody);
    if (validationError) {
      return NextResponse.json({ message: "Ungültige Telefonnummer" }, { status: 400 });
    }
    const { phone } = validated;

    // Also rate limit on the TARGET phone number, not just the caller IP. IP-only limiting
    // lets an attacker bomb one victim's phone with OTP SMS by rotating IPs; a normalized
    // per-phone key caps SMS volume to a given number regardless of source.
    const normalizedPhone = phone.replace(/[^\d+]/g, "");
    const phoneRateLimited = await applyRateLimit(authLimiter, { ip: `phone-otp:${normalizedPhone}` });
    if (phoneRateLimited) return phoneRateLimited;

    if (!redis) {
      return NextResponse.json({ message: "Redis nicht konfiguriert" }, { status: 500 });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store in Redis (valid for 10 mins)
    await redis.set(`phone_otp:${phone}`, otp, { ex: 600 });

    const sevenApiKey = env.SEVEN_API_KEY;
    if (!sevenApiKey) {
      console.warn("SEVEN_API_KEY is missing. OTP generated but not sent (SMS skipped, dev-mode).");
      // In development without key, we return success so frontend can continue 
      // (maybe log it to console or show in UI if debug active).
      return NextResponse.json({ message: "SMS gesendet (Simuliert - Key fehlt)" });
    }

    const text = `Ihr solen.ch Bestätigungscode lautet: ${otp}. Er ist für 10 Minuten gültig.`;
    
    const response = await fetch("https://gateway.seven.io/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": sevenApiKey
      },
      body: JSON.stringify({
        to: phone,
        text: text,
        from: "solen.ch"
      }),
      // api-contracts-06: the caller is waiting synchronously on this SMS
      // gateway call; a hung request must fail fast, not hold the function's
      // whole wall-clock budget hostage.
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("seven.io error:", errorText);
      return NextResponse.json({ message: "Fehler beim Senden der SMS" }, { status: 500 });
    }

    return NextResponse.json({ message: "SMS gesendet" });

  } catch (error) {
    console.error("Phone send error:", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
