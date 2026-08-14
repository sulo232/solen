// tests/lib/ratelimit-fail-closed.test.ts
//
// RL-LIVE-01 (HIGH, live re-audit 2026-07-17). lib/ratelimit.ts deliberately fails abuse-prone
// limiters CLOSED when Upstash is UNCONFIGURED on a real production boot, because a cost/abuse
// cap that silently switches off is not a cap. But the RUNTIME failure path (Upstash configured
// and reachable at boot, then unreachable, timing out, or rate-limiting US) fell into a catch
// that failed OPEN for everything, abuse-prone limiters included.
//
// The two cases are not different: in both, there is no Redis to ask. Worse, the runtime one is
// the case an attacker can plausibly CAUSE, so the cap opened under exactly the conditions it
// exists for.
//
// This test exists because the fix is a claim about BEHAVIOUR UNDER FAILURE. That is invisible in
// normal use and cannot be proved by reading the file: the comment said "fails closed" before the
// fix too. It pins all four quadrants so a refactor cannot quietly re-open the hole.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Upstash CONFIGURED, unlike the unconfigured default that tests/lib/purchases/... mocks. This
// test is about the configured-but-throwing path, so the module-load branch must build a Redis.
// Mocking @/lib/env directly is the house pattern: deterministic, no ambient env needed.
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    UPSTASH_REDIS_REST_URL: "https://fake.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "fake-token",
  }),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
  },
}));

vi.mock("@/lib/alert-admin", () => ({ alertAdmin: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: vi.fn() }));

import { applyRateLimit, checkRateLimit, authLimiter, generalLimiter } from "@/lib/ratelimit";

// Exactly what a configured-but-unreachable Upstash does: .limit() rejects.
function makeUnreachable(limiter: unknown) {
  (limiter as { limit: unknown }).limit = vi.fn(async () => {
    throw new Error("ECONNREFUSED upstash");
  });
}

const realCtx = process.env.CONTEXT;
const realNodeEnv = process.env.NODE_ENV;

function setEnv(context: string, nodeEnv: string) {
  process.env.CONTEXT = context;
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;
}

describe("ratelimit: runtime Redis failure (configured but unreachable)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    makeUnreachable(authLimiter);
    makeUnreachable(generalLimiter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.CONTEXT = realCtx;
    (process.env as Record<string, string>).NODE_ENV = realNodeEnv as string;
  });

  it("PRODUCTION + abuse-prone limiter: fails CLOSED (429). This is the bug the fix exists for", async () => {
    setEnv("production", "production");
    const res = await applyRateLimit(authLimiter, { ip: "1.2.3.4" });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    // Retry-After must still ship: a 429 without it tells the caller nothing (LAW section 7).
    expect(res!.headers.get("Retry-After")).toBeTruthy();
  });

  it("PRODUCTION + abuse-prone limiter: checkRateLimit returns false (denied)", async () => {
    setEnv("production", "production");
    await expect(checkRateLimit(authLimiter, "k")).resolves.toBe(false);
  });

  it("PRODUCTION + non-abuse-prone limiter: still fails OPEN, a blip must not break browsing", async () => {
    setEnv("production", "production");
    await expect(applyRateLimit(generalLimiter, { ip: "1.2.3.4" })).resolves.toBeNull();
    await expect(checkRateLimit(generalLimiter, "k")).resolves.toBe(true);
  });

  it("DEV: fails OPEN even for an abuse-prone limiter, nobody is blocked while building", async () => {
    setEnv("dev", "development");
    await expect(applyRateLimit(authLimiter, { ip: "1.2.3.4" })).resolves.toBeNull();
    await expect(checkRateLimit(authLimiter, "k")).resolves.toBe(true);
  });

  it("DEPLOY PREVIEW: fails OPEN. CONTEXT alone is set on previews too, which is why the NODE_ENV pair exists", async () => {
    setEnv("deploy-preview", "production");
    await expect(applyRateLimit(authLimiter, { ip: "1.2.3.4" })).resolves.toBeNull();
    await expect(checkRateLimit(authLimiter, "k")).resolves.toBe(true);
  });
});
