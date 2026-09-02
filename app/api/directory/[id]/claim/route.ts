export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, directoryClaimCode, type EmailLocale } from "@/lib/email";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { createBoundedRedis } from "@/lib/redis";
import { getServerEnv } from "@/lib/env";
import { validateBody, directoryClaimSchema } from "@/lib/validations";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// Wrong-code attempt counter (brute-force cap on top of the rate limiter below).
// Reuses the same Upstash instance the OTP-send flow uses (lib/ratelimit.ts /
// verify-phone/send); fails open (no cap) when Redis isn't configured, matching
// applyRateLimit's fail-open convention.
const env = getServerEnv();
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN)
  : null;
const MAX_CODE_ATTEMPTS = 5;

// POST /api/directory/:id/claim
// Step 1 — no body (or body without `code`): generate + send 6-digit code
// Step 2 — body { code }: verify code → mark claimed, return entry data for pre-fill
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  // Fetch directory entry
  const { data: entry, error: fetchErr } = await admin
    .from("salon_directory")
    .select("id, name, email, address, phone, website, categories, is_claimed")
    .eq("id", id)
    .single();

  if (fetchErr || !entry) {
    return NextResponse.json({ error: "Salon not found in directory" }, { status: 404 });
  }

  if (entry.is_claimed) {
    return NextResponse.json({ error: "This listing has already been claimed" }, { status: 409 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const { data: body, error: validationError } = validateBody(directoryClaimSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }
  const clientIp = getClientIp(req);

  // -- Step 2: Verify code -------------------------------------------------
  if (body.code) {
    // Rate limit the verify step (brute-force surface), keyed by listing id + IP so one
    // attacker can't hammer a single listing's code, without punishing other listings.
    const rateLimited = await applyRateLimit(authLimiter, { ip: `directory-claim-verify:${id}:${clientIp}` });
    if (rateLimited) return rateLimited;

    const { data: current } = await admin
      .from("salon_directory")
      .select("claim_verification_code, claim_verification_expires_at")
      .eq("id", id)
      .single();

    if (!current?.claim_verification_code || !current.claim_verification_expires_at) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    if (new Date(current.claim_verification_expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    // Attempt cap: a 1,000,000-code space over a 15-min TTL is brute-forceable within the
    // rate limiter's window alone, so also hard-cap wrong guesses per listing. Once exceeded,
    // invalidate the stored code instead of allowing more tries within the remaining TTL.
    const attemptsKey = `directory:claim-attempts:${id}`;
    if (redis) {
      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) {
        await redis.expire(attemptsKey, 15 * 60);
      }
      if (attempts > MAX_CODE_ATTEMPTS) {
        await admin.from("salon_directory").update({
          claim_verification_code: null,
          claim_verification_expires_at: null,
        }).eq("id", id);
        // Real window: attemptsKey carries the 15-min TTL set on the first attempt above.
        // Read it back so Retry-After reports the actual remaining seconds rather than a
        // restated constant; fall back to the full 15 min only if the TTL read is somehow
        // negative (key expired between the incr above and this ttl call).
        const ttlSeconds = await redis.ttl(attemptsKey);
        const retryAfterSeconds = ttlSeconds > 0 ? ttlSeconds : 15 * 60;
        return NextResponse.json(
          { error: "Too many incorrect attempts. Please request a new code." },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
      }
    }

    const inputHashed = hashCode(String(body.code).trim());
    if (inputHashed !== current.claim_verification_code) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
    }

    // Mark claimed
    await admin.from("salon_directory").update({
      is_claimed: true,
      claim_verification_code: null,
      claim_verification_expires_at: null,
    }).eq("id", id);

    if (redis) await redis.del(attemptsKey);

    return NextResponse.json({
      verified: true,
      entry: {
        name: entry.name,
        address: entry.address,
        phone: entry.phone,
        website: entry.website,
        categories: entry.categories,
        email: entry.email,
      },
    });
  }

  // -- Step 1: Generate + send code -----------------------------------------
  // Rate limit the send step too (email bombing / repeated-code-mint surface),
  // keyed by listing id + IP.
  const sendRateLimited = await applyRateLimit(authLimiter, { ip: `directory-claim-send:${id}:${clientIp}` });
  if (sendRateLimited) return sendRateLimited;

  if (!entry.email) {
    return NextResponse.json(
      { error: "No email address on file for this listing. Contact support@solen.ch." },
      { status: 422 }
    );
  }

  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await admin.from("salon_directory").update({
    claim_verification_code: hashCode(code),
    claim_verification_expires_at: expiresAt,
  }).eq("id", id);

  // Fresh code sent: reset the wrong-guess counter so it doesn't count against the new code.
  if (redis) await redis.del(`directory:claim-attempts:${id}`);

  try {
    // A9-email-locale (2026-07-27): the directory entry has no registered profile (unclaimed
    // listing) so there is no locale to resolve from data already in scope; threaded through
    // from the caller (the locale-prefixed claim page) instead, defaulting to "de" if omitted.
    // directoryClaimSchema's locale field is already a validated "de"|"en"|"fr"|"it" enum.
    const claimLocale: EmailLocale = body.locale ?? "de";
    await sendEmail(directoryClaimCode(entry.email, { salonName: entry.name, code }, claimLocale));
  } catch (err) {
    console.error("[directory/claim] verification code email failed:", err, { listingId: id });
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }

  return NextResponse.json({ sent: true, email: entry.email.replace(/(.{2}).*(@.*)/, "$1***$2") });
}
