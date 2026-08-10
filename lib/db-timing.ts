// lib/db-timing.ts (performance-09)
//
// Zero timing instrumentation existed anywhere in app/api or lib before this
// (confirmed: no Server-Timing/console.time/performance.now hits), so a
// "the PDP feels slow" report could not distinguish a slow query from a slow
// render from a cold start without a fresh, from-scratch investigation every
// single time.
//
// This wrapper splits a route handler's own wall-clock time from the summed
// time its DB calls actually took, so the two are attributable at a glance
// from the standard log line alone. Uses performance.now() (a Web API
// available in both the Node and the Edge runtime, several routes in this
// codebase run `export const runtime = "edge"`), not console.time/timeEnd
// (Node-only, would break edge routes silently).
//
// Usage in a route handler:
//   const timer = createDbTimer("GET /api/salons/[slug]");
//   const result = await timer.track(() => loadSalonDetailWithAccess(slug));
//   timer.finish(); // logs one line: [db-timing] GET /api/salons/[slug]: handler=42ms db=31ms (1 call)
//
// Convention matches the project's existing "[Component] description"
// console.error shape (never .catch(() => {})), just for a summary log
// instead of an error.

export interface DbTimingSummary {
  route: string;
  handlerMs: number;
  dbMs: number;
  dbCalls: number;
}

export interface DbTimer {
  /** Wraps one DB/RPC call (or a group of calls issued together) and adds its
   *  elapsed time to the running db-time total. Nest multiple calls under one
   *  timer to get a summed dbMs across the whole handler. */
  track<T>(fn: () => PromiseLike<T> | T): Promise<T>;
  /** Logs the summary line and returns it (for a caller that also wants to
   *  attach it to a structured log sink later). Call once, at the end of the
   *  handler, right before returning the response. */
  finish(): DbTimingSummary;
}

const round = (ms: number) => Math.round(ms * 10) / 10;

export function createDbTimer(route: string): DbTimer {
  const start = performance.now();
  let dbMs = 0;
  let dbCalls = 0;

  return {
    async track<T>(fn: () => PromiseLike<T> | T): Promise<T> {
      const t0 = performance.now();
      try {
        return await fn();
      } finally {
        dbMs += performance.now() - t0;
        dbCalls += 1;
      }
    },
    finish(): DbTimingSummary {
      const handlerMs = round(performance.now() - start);
      const summary: DbTimingSummary = { route, handlerMs, dbMs: round(dbMs), dbCalls };
      console.log(
        `[db-timing] ${route}: handler=${summary.handlerMs}ms db=${summary.dbMs}ms (${summary.dbCalls} call${summary.dbCalls === 1 ? "" : "s"})`
      );
      return summary;
    },
  };
}
