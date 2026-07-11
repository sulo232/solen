// Next.js instrumentation hook (stable in 15.3, no `experimental.instrumentationHook`
// flag needed). `register()` runs once per server instance at boot, before any
// request is handled.
//
// Only job right now: crash-loud on a real production boot that is missing a
// required env var (see `assertProdRequiredEnv` in `lib/env.ts` for the exact
// gate and var list). Dev, deploy-preview, and branch-deploy contexts are
// unaffected: the function itself no-ops unless CONTEXT=production AND
// NODE_ENV=production.
export async function register() {
  // Only the nodejs runtime boots a long-lived server process worth asserting
  // env for. The edge runtime instance also calls register(), but it doesn't
  // carry the same server-only env surface and re-running the check there
  // would just duplicate the same throw.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProdRequiredEnv } = await import("@/lib/env");
    assertProdRequiredEnv();
  }
}
