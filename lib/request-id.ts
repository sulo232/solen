// lib/request-id.ts
//
// OBS-01 (_backend-system/audit/observability.md, HIGH): zero request-id propagation meant
// a failed booking's console.error lines across booking creation, the email send, and the
// Stripe webhook shared no key, reconstructing it meant grepping Netlify by approximate
// timestamp. This gives every request in the money chokepoints (bookings/route.ts, the
// Stripe webhook, lib/email.ts) ONE id to log alongside every console.error/warn call.
//
// Reuses an inbound x-request-id header when a caller/proxy already supplied one (so a
// future client-generated id survives unchanged); otherwise mints a fresh uuid. Deliberately
// no AsyncLocalStorage or other ambient-context machinery: the id is passed explicitly as an
// argument, mirroring getClientIp (lib/ratelimit.ts:429), which accepts the same two shapes
// for the same reason (usable from a Route Handler's NextRequest AND from a bare Headers /
// ReadonlyHeaders object, e.g. next/headers' `headers()` in a server component).

import type { NextRequest } from "next/server";

type RequestIdHeaders = { get(name: string): string | null };

export function getRequestId(req: NextRequest | RequestIdHeaders): string {
  const hdrs: RequestIdHeaders = "headers" in req ? req.headers : req;
  return hdrs.get("x-request-id")?.trim() || crypto.randomUUID();
}
