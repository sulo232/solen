export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { createBoundedRedis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { validateBody, verifyPhoneCheckSchema } from "@/lib/validations";

const env = getServerEnv();
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  : null;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.json();
    const { data: validated, error: validationError } = validateBody(verifyPhoneCheckSchema, rawBody);
    if (validationError) {
      return NextResponse.json({ message: "Fehlende Parameter" }, { status: 400 });
    }
    const { phone, code } = validated;

    // Also rate limit on the TARGET phone number, not just the caller IP. IP-only limiting
    // lets an attacker brute-force the 6-digit code for one victim number by rotating IPs; a
    // normalized per-phone key caps attempts against a given number regardless of source.
    const normalizedPhone = phone.replace(/[^\d+]/g, "");
    const phoneRateLimited = await applyRateLimit(authLimiter, { ip: `phone-otp:${normalizedPhone}` });
    if (phoneRateLimited) return phoneRateLimited;

    if (!redis) {
      // Allow bypassing in local dev if Redis isn't set up
      return NextResponse.json({ message: "Verifiziert (Simuliert - Redis fehlt)" });
    }

    // Since we support local dev simulation of SMS when key is missing, 
    // we also need to allow any code if we simulated.
    // Wait, the send API actually saved it to Redis anyway.
    const storedOtp = await redis.get(`phone_otp:${phone}`);

    if (!storedOtp) {
      return NextResponse.json({ message: "Code abgelaufen oder ungültig" }, { status: 400 });
    }

    if (storedOtp !== code) {
      return NextResponse.json({ message: "Falscher Code" }, { status: 400 });
    }

    // Success! Delete the OTP from Redis
    await redis.del(`phone_otp:${phone}`);

    // 2026-07-27: this endpoint used to return a bare `verified: true` implying
    // the OTP check result gets recorded somewhere. It does not. The plan was
    // "POST /api/salons writes salons.phone_verified", but that column was never
    // created (checked against the live information_schema, 2026-07-27: public.salons
    // has no phone_verified column at all) and app/api/salons/route.ts has had the
    // write commented out ever since. TODO (named dependency, needs an owner-approved
    // migration, not writable from this workstream): add the column with
    //   ALTER TABLE public.salons ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
    // then wire app/api/salons/route.ts:696 back up and drop `persisted: false` below.
    // Until that lands, the OTP check itself is real (Redis-backed, one-time code),
    // but its result is NOT stored anywhere. `persisted: false` makes that explicit
    // so a caller can't mistake this for "the phone is now on record as verified."
    return NextResponse.json({
      message: "Erfolgreich verifiziert",
      verified: true,
      persisted: false,
      persistedNote: "OTP check passed but is not stored; no phone_verified column exists on salons yet.",
    });

  } catch (error) {
    console.error("Phone check error:", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
