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
