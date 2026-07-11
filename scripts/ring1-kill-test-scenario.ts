// Runs ONE scenario for scripts/ring1-kill-tests.mjs, in its own process.
//
// A fresh process is required per scenario because lib/ratelimit.ts caches
// `env` and the `redis` client at module load time (top-level `const env =
// getServerEnv()` / `const redis = ...`), so UPSTASH_REDIS_REST_URL/TOKEN and
// CONTEXT must be set BEFORE this file's dynamic import, not toggled mid-process.
//
// Exercises the REAL lib/ratelimit.ts exports (not a reimplementation of the
// classification/fail-mode logic) so a future edit to that file that breaks
// the contract fails this test, not just a copy of the logic.
//
// Usage: tsx scripts/ring1-kill-test-scenario.ts <scenario>
// Scenarios: prod-unset-auth | prod-unset-general | dev-unset-auth | prod-set-passthrough |
//            prod-unset-referral-validate | prod-unset-resend-access

type Outcome = {
  scenario: string;
  pass: boolean;
  details: Record<string, unknown>;
};

function print(outcome: Outcome) {
  console.log(JSON.stringify(outcome));
}

async function applyResultShape(res: Response | null) {
  if (res === null) return { allowed: true as const };
  const body = await res.json();
  return {
    allowed: false as const,
    status: res.status,
    code: body.code,
    hasRateLimitHeader: res.headers.has("X-RateLimit-Limit"),
  };
}

async function main() {
  const scenario = process.argv[2];
  const rl = await import("@/lib/ratelimit");

  if (scenario === "prod-unset-auth") {
    // Abuse-prone limiter (authLimiter), Upstash unset, real prod boot: must FAIL CLOSED.
    const applied = await applyResultShape(await rl.applyRateLimit(rl.authLimiter, { ip: "1.2.3.4" }));
    const checked = await rl.checkRateLimit(rl.authLimiter, "1.2.3.4");
    const pass =
      applied.allowed === false &&
      applied.status === 429 &&
      applied.code === "RATE_LIMITED" &&
      // Fail-closed never called the real limiter, so it can't report a real
      // limit/remaining/reset. It must NOT carry the header a genuine 429 does.
      applied.hasRateLimitHeader === false &&
      checked === false;
    print({ scenario, pass, details: { applied, checked } });
    return;
  }

  if (scenario === "prod-unset-general") {
    // Non-abuse-prone limiter (generalLimiter), Upstash unset, real prod boot: keeps
    // failing OPEN (product must not go down because Redis is misconfigured).
    const applied = await applyResultShape(await rl.applyRateLimit(rl.generalLimiter, { ip: "1.2.3.4" }));
    const checked = await rl.checkRateLimit(rl.generalLimiter, "1.2.3.4");
    const pass = applied.allowed === true && checked === true;
    print({ scenario, pass, details: { applied, checked } });
    return;
  }

  if (scenario === "dev-unset-auth") {
    // Same abuse-prone limiter, same unset Upstash, but NOT a real prod boot
    // (CONTEXT != production): must behave exactly like today, fail OPEN.
    const applied = await applyResultShape(await rl.applyRateLimit(rl.authLimiter, { ip: "1.2.3.4" }));
    const checked = await rl.checkRateLimit(rl.authLimiter, "1.2.3.4");
    const pass = applied.allowed === true && checked === true;
    print({ scenario, pass, details: { applied, checked } });
    return;
  }

  if (scenario === "prod-unset-referral-validate") {
    // GET /api/referral/validate's dedicated limiter: public, unauthenticated enumeration
    // oracle over referral codes. Upstash unset, real prod boot: must FAIL CLOSED.
    const applied = await applyResultShape(await rl.applyRateLimit(rl.referralValidateLimiter, { ip: "1.2.3.4" }));
    const checked = await rl.checkRateLimit(rl.referralValidateLimiter, "1.2.3.4");
    const pass =
      applied.allowed === false &&
      applied.status === 429 &&
      applied.code === "RATE_LIMITED" &&
      applied.hasRateLimitHeader === false &&
      checked === false;
    print({ scenario, pass, details: { applied, checked } });
    return;
  }

  if (scenario === "prod-unset-resend-access") {
    // POST /api/bookings/resend-access's dedicated limiter: the brute-force / enumeration /
    // email-bombing surface, the strictest dedicated limiter. Upstash unset, real prod
    // boot: must FAIL CLOSED.
    const applied = await applyResultShape(await rl.applyRateLimit(rl.resendAccessLimiter, { ip: "1.2.3.4" }));
    const checked = await rl.checkRateLimit(rl.resendAccessLimiter, "1.2.3.4");
    const pass =
      applied.allowed === false &&
      applied.status === 429 &&
      applied.code === "RATE_LIMITED" &&
      applied.hasRateLimitHeader === false &&
      checked === false;
    print({ scenario, pass, details: { applied, checked } });
    return;
  }

  if (scenario === "prod-set-passthrough") {
    // Upstash IS configured: behavior must be byte-identical to today, meaning the
    // real limiter.limit() call is what decides, not the new fail-mode branch. Stub
    // the network-calling `.limit` method on the actual exported instance (an own
    // property set in the Ratelimit constructor, so this has to happen after import)
    // and assert BOTH outcomes take the real path (429 WITH the X-RateLimit-* headers
    // on a limit hit; null on a miss) rather than the fail-closed shortcut (which
    // never carries those headers).
    const original = rl.authLimiter.limit;
    let callCount = 0;

    (rl.authLimiter as unknown as { limit: typeof original }).limit = (async (...args: Parameters<typeof original>) => {
      callCount++;
      return { success: true, limit: 5, remaining: 4, reset: Date.now() + 1000, pending: Promise.resolve() } as unknown as ReturnType<typeof original>;
    }) as typeof original;
    const allowedResult = await applyResultShape(await rl.applyRateLimit(rl.authLimiter, { ip: "1.2.3.4" }));

    (rl.authLimiter as unknown as { limit: typeof original }).limit = (async (...args: Parameters<typeof original>) => {
      callCount++;
      return { success: false, limit: 5, remaining: 0, reset: Date.now() + 1000, pending: Promise.resolve() } as unknown as ReturnType<typeof original>;
    }) as typeof original;
    const blockedResult = await applyResultShape(await rl.applyRateLimit(rl.authLimiter, { ip: "1.2.3.4" }));

    const pass =
      callCount === 2 &&
      allowedResult.allowed === true &&
      blockedResult.allowed === false &&
      blockedResult.status === 429 &&
      blockedResult.hasRateLimitHeader === true;
    print({ scenario, pass, details: { callCount, allowedResult, blockedResult } });
    return;
  }

  print({ scenario: scenario ?? "(missing)", pass: false, details: { error: "unknown scenario" } });
}

main().catch((err) => {
  print({ scenario: process.argv[2] ?? "(missing)", pass: false, details: { error: String(err?.stack ?? err) } });
  process.exitCode = 1;
});
