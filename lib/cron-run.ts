// lib/cron-run.ts (cron observability wrapper, RING 1b).
//
// Every route under app/api/cron/* is invisible today: on failure it only
// console.error's, and the GH Actions ping-cron action soft-fails (warning,
// exit 0), so a dead cron never surfaces anywhere. withCronRun closes that
// gap: it times the handler, catches a thrown error, best-effort logs ONE
// row to the live `cron_runs` table (service-role, RLS has no policies,
// server-only), and shapes the JSON response so the ping-cron action can
// hard-assert on `"ok":true`.
//
// CONTRACT: the logging insert is best-effort, it NEVER throws and never
// blocks or alters the response beyond adding { ok, processed?, errors? }.
// A `cron_runs` write failure only console.error's.
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { reportError } from "@/lib/error-report";

/**
 * Shape a cron handler may return. Any extra fields pass through untouched.
 * `errors` is a string[] of failed items, one string each (e.g.
 * `errors: failures.map(f => f.message)`); a non-empty array is the
 * ok:false signal (see withCronRun below). NEVER a bare count/number: that
 * used to be permitted here (`string[] | number`) and a cron returning the
 * number form was silently coerced to an empty array downstream, so `ok`
 * stayed true on a night every item failed. This shipped 3 separate times.
 * The `| number` branch is removed so a cron trying to hand back a count
 * instead of a list is a TYPE ERROR at build time, not a silent runtime
 * drop (2026-07-16, replacing the since-removed cron-error-contract-gate.py
 * runtime gate, which never actually caught this shape, see git history).
 */
export interface CronRunResult {
  ok?: boolean;
  processed?: number;
  errors?: string[];
  [key: string]: unknown;
}

/**
 * Floor for the "every attempt this run declined" symptom check (pre-charge,
 * no-show, release-payments). A pure customer-side card decline is DATA, not
 * a failure (BACKEND_LAW.md #14: alert on symptoms, never causes), but a run
 * where EVERY attempt declined and NONE succeeded is not N unlucky
 * customers, it is a broken Stripe/account config wearing a customer-shaped
 * costume, and that IS a symptom worth reddening the run for.
 *
 * 5 is picked from the fleet's REAL measured scale (queried live 2026-07-16
 * against the prod DB): cron_runs has never logged a single row in prod yet,
 * the qualifying row count for all three crons is 0 right now, and total
 * bookings created in the last 30 days is 9 (only 1 booking has ever reached
 * card_saved). At this size real batches are usually 0-2 attempts; a floor
 * much above 5 would mean the check almost never fires for a long time, and
 * a floor of 1-2 cannot structurally tell a system outage apart from
 * ordinary bad luck (one or two genuinely bad cards on the same night is
 * unremarkable, see the 1-of-1 example above). 5 is the smallest count where
 * "every single attempt declined" stops being explainable by chance even
 * under a deliberately pessimistic hypothetical, NOT a claimed real decline
 * rate: even assuming a generous 50% chance any given attempt declines
 * purely at random, the odds all 5 decline by chance alone is 1-in-32
 * (about 3%), and that 50% assumption is already far above what a saved,
 * previously-verified off-session card should realistically decline at.
 * A judgment call, not a measured constant, retune live if the fleet's real
 * batch sizes change.
 */
export const ALL_DECLINED_SYMPTOM_FLOOR = 5;

/**
 * Wrap a cron route's business logic. `name` is the cron_runs.name value
 * (use the route's folder name, e.g. "auto-complete"). `handler` is the
 * existing handler body, returning a plain result object (NOT a
 * NextResponse), the CRON_SECRET/auth guard stays OUTSIDE this wrapper,
 * unchanged, at the top of the route.
 *
 * Returns NextResponse.json(mergedResult, { status }): status 200 when the
 * handler completed without throwing and without an `errors` array / an
 * explicit `ok:false`; status 500 otherwise.
 */
// data-money-08: overlap guard. Two overlapping runs of the SAME cron (a manual
// workflow_dispatch colliding with a scheduled tick, a GH Actions client timeout
// that doesn't actually cancel the underlying Netlify function) can interleave
// writes in ways each cron's own per-row idempotency filter doesn't protect
// against. `cron_locks` (supabase/migrations/20260727120000_cron_locks.sql) backs
// an atomic claim: INSERT ... ON CONFLICT DO NOTHING on a unique `name` column is
// a single-statement CAS enforced by Postgres, which survives PostgREST's
// connection-pooled architecture (unlike a session-scoped pg_try_advisory_lock).
// Fail-open by design: if cron_locks doesn't exist yet (migration not applied) or
// the query errors, log loudly and let the handler run anyway, so this can ship
// ahead of the migration being applied without breaking any of the 26 crons.
const LOCK_TTL_MS = 15 * 60 * 1000;

async function tryAcquireCronLock(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  name: string,
): Promise<boolean> {
  // cron_locks is not yet in lib/database.types.ts (the migration that creates it,
  // supabase/migrations/20260727120000_cron_locks.sql, has not been applied live
  // per house rule against running migrations from this session), so the generated
  // Database type has no row for it. Cast to `any` here only; regenerate
  // lib/database.types.ts once the migration is applied and drop this cast.
  const db = admin as any;
  try {
    // Clear a stale lock first (a crashed prior run that never released).
    await db.from("cron_locks").delete().eq("name", name).lt("expires_at", new Date().toISOString());
    const { error } = await db.from("cron_locks").insert({
      name,
      expires_at: new Date(Date.now() + LOCK_TTL_MS).toISOString(),
    });
    if (error) {
      // Unique-violation (23505) means another run currently holds the lock,
      // which is the expected "skip this run" signal, not a failure.
      if ((error as { code?: string }).code === "23505") {
        console.error(`[cron-run] "${name}" already running, skipping this run (overlap guard)`);
        return false;
      }
      // Any other error (table missing, RLS, network) fails OPEN: run anyway.
      console.error(`[cron-run] "${name}" lock acquire errored, running without overlap guard:`, error.message);
    }
    return true;
  } catch (err) {
    console.error(`[cron-run] "${name}" lock acquire threw, running without overlap guard:`, err);
    return true;
  }
}

async function releaseCronLock(admin: ReturnType<typeof createAdminSupabaseClient>, name: string): Promise<void> {
  const db = admin as any; // see cast note in tryAcquireCronLock
  try {
    await db.from("cron_locks").delete().eq("name", name);
  } catch (err) {
    console.error(`[cron-run] "${name}" lock release threw (will self-expire via TTL):`, err);
  }
}

export async function withCronRun(
  name: string,
  handler: () => Promise<CronRunResult | void>,
): Promise<NextResponse> {
  const startedAt = Date.now();
  let result: CronRunResult = {};
  let threw: unknown = null;
  const admin = createAdminSupabaseClient();

  const acquired = await tryAcquireCronLock(admin, name);
  if (!acquired) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already running (overlap guard)" }, { status: 200 });
  }

  try {
    const handlerResult = await handler();
    if (handlerResult && typeof handlerResult === "object") {
      result = handlerResult;
    }
  } catch (err) {
    threw = err;
    console.error(`[cron-run] "${name}" handler threw:`, err);
    // RING 1c: in addition to the cron_runs row below, surface the failure via
    // the central reportError (console.error already above + a throttled admin
    // alert), so a dead cron is visible without someone querying cron_runs.
    await reportError(`cron:${name}`, err);
  } finally {
    await releaseCronLock(admin, name);
  }

  const durationMs = Date.now() - startedAt;

  const resultErrors = Array.isArray(result.errors)
    ? result.errors.map((e) => String(e))
    : [];
  const errors = threw
    ? [...resultErrors, threw instanceof Error ? threw.message : String(threw)]
    : resultErrors;

  const ok = !threw && result.ok !== false && errors.length === 0;
  const processed = typeof result.processed === "number" ? result.processed : undefined;

  // Best-effort log, never throws, never blocks or changes the response.
  try {
    const { error: insertErr } = await admin.from("cron_runs").insert({
      name,
      ok,
      processed: processed ?? null,
      duration_ms: durationMs,
      errors: errors.length ? errors : null,
    });
    if (insertErr) {
      console.error(`[cron-run] cron_runs insert failed for "${name}":`, insertErr.message);
    }
  } catch (logErr) {
    console.error(`[cron-run] cron_runs insert threw for "${name}":`, logErr);
  }

  const body: CronRunResult = {
    ...result,
    ok,
    ...(processed !== undefined ? { processed } : {}),
    ...(errors.length ? { errors } : {}),
  };

  return NextResponse.json(body, { status: ok ? 200 : 500 });
}
