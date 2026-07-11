// lib/error-report.ts (RING 1c, central error reporting).
//
// There is no external error tracker in this app (Sentry was removed: the
// sentry.edge.config.ts / sentry.server.config.ts / instrumentation-client.ts
// placeholders it left behind are deleted alongside this file, see
// _plans/BACKEND_IMPROVEMENT.md). reportError is the one call a top-level
// catch should make on an unexpected exception: it ALWAYS console.error's (so
// nothing goes silent) and ALSO fires a throttled lib/alert-admin.ts email so a
// real production failure surfaces to a human, without flooding the inbox on a
// hot-looping bug.
//
// CONTRACT: never throws, mirrors alert-admin.ts's own best-effort discipline.
// A failing report must not turn a recoverable error into a crash.
//
// THROTTLE LIMITATION: `lastAlertAt` is an in-memory Map, so the "at most once
// per 15 minutes" throttle is scoped to ONE process/function instance only. A
// Netlify deploy that spins up more than one function instance under load will
// have each instance keep its own 15-minute window, so the admin could see more
// than one email per scope per 15 minutes across instances. Acceptable for the
// current single-instance-typical traffic; a real cross-instance throttle would
// need a shared store (Redis), not attempted here.

import { alertAdmin } from "@/lib/alert-admin";

const THROTTLE_MS = 15 * 60 * 1000; // 15 minutes

// scope -> timestamp (ms) of the last alert fired for that scope, this process only.
const lastAlertAt = new Map<string, number>();

/**
 * Report an unexpected error. Always console.error's with a `[scope]` prefix.
 * Also fires `alertAdmin`, throttled to at most once per `scope` per 15 minutes
 * (per process instance, see THROTTLE LIMITATION above). Never throws.
 *
 * @param scope short label identifying the failing call site, e.g. "stripe-webhook"
 *   or "cron:auto-complete". Becomes the alert email subject and the throttle key.
 * @param err the caught error (unknown, as caught).
 * @param context optional structured extra (ids, event type, etc.), logged and
 *   included in the alert body.
 * @param alertFn injection seam for tests only, defaults to the real alertAdmin.
 */
export async function reportError(
  scope: string,
  err: unknown,
  context?: Record<string, unknown>,
  alertFn: (subject: string, details: string | Record<string, unknown>) => Promise<void> = alertAdmin,
): Promise<void> {
  console.error(`[${scope}]`, err, context ?? "");

  try {
    const now = Date.now();
    const last = lastAlertAt.get(scope);
    if (last !== undefined && now - last < THROTTLE_MS) {
      return; // throttled, already alerted for this scope within the window
    }
    lastAlertAt.set(scope, now);

    const message = err instanceof Error ? err.message : String(err);
    await alertFn(scope, { message, ...(context ?? {}) });
  } catch (reportErr) {
    // The reporting path itself failed, never let that mask the original
    // error or crash the caller (already console.error'd above).
    console.error(`[error-report] failed to report "${scope}":`, reportErr);
  }
}
