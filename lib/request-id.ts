// lib/request-id.ts (observability-4, RING 1d)
//
// Solen has 897 console.log/error/warn calls across app/ and lib/ with no
// shared key between them, so the several log lines one failed booking
// produces (bookings/route.ts, email.ts, the Stripe webhook handler) cannot
// be joined without grepping by approximate timestamp and hoping nothing
// else happened in the same second. _backend-system/research/observability.md
// section 1 named this the single highest-priority, lowest-cost fix.
//
// generateRequestId() shapes the id as a valid W3C traceparent
// (00-<32 hex>-<16 hex>-01) even though nothing parses it as a real
// distributed trace yet, so a future tracing backend (OpenTelemetry, a real
// APM) is a drop-in later, not a rewrite. getRequestId(req) reuses an
// inbound traceparent header when one is already present (a future
// edge/CDN/tracing layer setting it), otherwise mints a fresh one.
//
// ROLLOUT: middleware.ts's CORS pass-through branch for /api routes returns
// `NextResponse.next()` WITHOUT `{ request }`, so a header set on `request`
// in middleware does not reliably reach an API route handler (the same gap
// x-pathname's own comment works around by only relying on it for page
// routes, not API routes). Rather than depend on that, route handlers call
// getRequestId(req) directly at the top of the handler; this is the "thin
// withRequestId wrapper at the top of each route handler" alternative this
// finding's own principle names. Rolled out first to the Stripe webhook
// (this file's caller), the org's own priority order (bookings, payments,
// the Stripe webhook next).

const HEX16 = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

/** Generate a fresh W3C traceparent-shaped request id: 00-<32 hex>-<16 hex>-01. */
export function generateRequestId(): string {
  const traceId = crypto.randomUUID().replace(/-/g, "") + HEX16(); // 32 hex chars
  const spanId = HEX16(); // 16 hex chars
  return `00-${traceId}-${spanId}-01`;
}

const TRACEPARENT_RE = /^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/;

/**
 * Resolve the request id for this inbound request: reuse an already-valid
 * inbound `traceparent` header (a future edge/tracing layer setting it), else
 * mint a fresh one. Never throws.
 */
export function getRequestId(req: { headers: { get(name: string): string | null } }): string {
  try {
    const inbound = req.headers.get("traceparent");
    if (inbound && TRACEPARENT_RE.test(inbound)) return inbound;
  } catch {
    // fall through to a fresh id
  }
  return generateRequestId();
}
