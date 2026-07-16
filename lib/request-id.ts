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

// An inbound id is only reused if it looks like an id. Anything else gets a fresh uuid.
//
// Why, measured against the LIVE route with a raw socket rather than reasoned in the abstract:
// the council's security lens argued an attacker could send a value that makes Headers.set()
// throw (it does throw on a NUL byte or a codepoint above 0xFF, verified). That specific attack
// turned out NOT to be reachable: HTTP header values are BYTES, Node decodes them as latin-1, so
// raw UTF-8 emoji bytes arrive as several codepoints each <= 0xFF (mojibake, but ByteString-safe,
// confirmed live: it came back as "aÃ¢ÂÂb", no throw), and a NUL is rejected by the HTTP parser
// before this code ever runs. The lens's own correctness twin hedged exactly right on that.
//
// What IS reachable, and confirmed live, is the boring half:
//   1. LENGTH. A 4KB x-request-id was echoed back in full and would be threaded into every
//      console.error line for that request. Free log flooding.
//   2. COLLISION. The id is a support/incident lookup key. Letting the caller choose it verbatim
//      lets a probe file its own log lines under an id that collides with, or impersonates, a
//      real prior request. The whole value of this id is that it identifies ONE request.
//
// 128 chars fits a uuid (36) and any sane upstream trace id with room to spare. The charset is
// the intersection of what real trace ids use (uuid, ULID, nanoid, W3C traceparent) and what is
// unambiguously safe to put in a header and a log line.
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function getRequestId(req: NextRequest | RequestIdHeaders): string {
  const hdrs: RequestIdHeaders = "headers" in req ? req.headers : req;
  const inbound = hdrs.get("x-request-id")?.trim();
  return inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : crypto.randomUUID();
}
