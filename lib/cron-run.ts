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
export async function withCronRun(
  name: string,
  handler: () => Promise<CronRunResult | void>,
): Promise<NextResponse> {
  const startedAt = Date.now();
  let result: CronRunResult = {};
  let threw: unknown = null;

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
    const admin = createAdminSupabaseClient();
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
