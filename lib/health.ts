// lib/health.ts (RING 1c, /api/health dependency probes).
//
// Split out of app/api/health/route.ts so scripts/ring1c-kill-test.ts can
// exercise each probe directly, function-level, without an HTTP round trip
// (the sandboxed shell blocks outbound localhost fetches, see the header note
// in scripts/ring1b-kill-test.ts for the same constraint on cron).
//
// Kept dependency-light on purpose: no new packages, @upstash/redis is already
// a dependency (lib/ratelimit.ts).

import { getServerEnv, PROD_REQUIRED_VARS } from "@/lib/env";

const PROBE_TIMEOUT_MS = 2000;

export type ProbeStatus = "ok" | "fail" | "unconfigured";

export interface ProbeResult {
  status: ProbeStatus;
  detail?: string;
}

/**
 * Minimal shape probeDb needs, matches createAdminSupabaseClient()'s return.
 * `PromiseLike` (not `Promise`) because PostgREST's query builder is thenable
 * but not a real Promise instance, awaiting/racing it still works fine.
 */
export interface ProbeDbClient {
  from(table: string): { select(columns: string, opts?: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }> };
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * DB probe: a HEAD count against `cities` (a tiny, always-present table) via
 * the service-role admin client. `select("*", { count: "exact", head: true })`
 * never fetches rows or names a specific column, so it can't silently no-op on
 * a renamed/missing column, the project's #1 silent-failure mode (CLAUDE.md
 * "Silent no-ops"). 2s timeout via Promise.race.
 */
export async function probeDb(admin: ProbeDbClient): Promise<ProbeResult> {
  try {
    const { error } = await withTimeout(
      admin.from("cities").select("*", { count: "exact", head: true }),
      PROBE_TIMEOUT_MS,
      "db probe",
    );
    if (error) return { status: "fail", detail: error.message };
    return { status: "ok" };
  } catch (err) {
    return { status: "fail", detail: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Redis probe: one PING via @upstash/redis. Reports 'unconfigured' (not a
 * failure) when UPSTASH_REDIS_REST_URL/TOKEN are unset, matching lib/ratelimit.ts's
 * existing "missing Upstash env means rate limiting is off" contract, never a
 * hard-down state. 2s timeout via Promise.race.
 */
export async function probeRedis(): Promise<ProbeResult> {
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return { status: "unconfigured" };
  }
  try {
    const { createBoundedRedis } = await import("@/lib/redis");
    const redis = createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
    await withTimeout(redis.ping(), PROBE_TIMEOUT_MS, "redis probe");
    return { status: "ok" };
  } catch (err) {
    return { status: "fail", detail: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Env probe: lists which PROD_REQUIRED_VARS are missing. Non-throwing, and
 * always 'ok' outside a REAL production boot (CONTEXT=production AND
 * NODE_ENV=production), dev/preview/branch-deploy contexts are allowed to
 * miss them. Mirrors assertProdRequiredEnv's own gate in lib/env.ts.
 */
export function probeEnv(): ProbeResult {
  const isRealProdBoot = process.env.CONTEXT === "production" && process.env.NODE_ENV === "production";
  if (!isRealProdBoot) return { status: "ok" };

  const missing = PROD_REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { status: "fail", detail: `missing: ${missing.join(", ")}` };
  }
  return { status: "ok" };
}

export interface HealthReport {
  ok: boolean;
  deps: {
    db: ProbeResult;
    redis: ProbeResult;
    env: ProbeResult;
  };
  time: number;
}

/**
 * Run all three probes and shape the combined report. `ok` is true when every
 * probe is 'ok' or 'unconfigured' ('unconfigured' is not a failure, see
 * probeRedis), false when any probe hard-fails.
 */
export async function runHealthProbes(admin: ProbeDbClient): Promise<HealthReport> {
  const [db, redis] = await Promise.all([probeDb(admin), probeRedis()]);
  const env = probeEnv();
  const ok = [db, redis, env].every((p) => p.status === "ok" || p.status === "unconfigured");
  return { ok, deps: { db, redis, env }, time: Date.now() };
}
