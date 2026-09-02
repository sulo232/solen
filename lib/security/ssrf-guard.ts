// lib/security/ssrf-guard.ts
//
// Blocks server-side fetches from reaching internal/private network destinations
// (SSRF guard). Call assertSafeFetchUrl(url) before any fetch() whose URL comes
// from user input (an admin form field, a third-party API response, etc).
//
// Added 2026-07-10, security hardening: lib/ai-vision.ts fetched an
// attacker-supplied image_url with no host/scheme/IP guard, letting a prod
// server reach cloud metadata (169.254.169.254) or scan internal services
// (the ok/fail response was an oracle for internal port-scanning).
//
// Known limitation: this resolves DNS once, up-front. It does not protect
// against DNS rebinding (a TOCTOU where the name resolves to a public IP here
// but a private IP at actual fetch time). That would require a custom fetch
// dispatcher pinned to the checked address, which is out of scope here.

import dns from "node:dns/promises";
import net from "node:net";

export class UnsafeFetchUrlError extends Error {
  constructor(message = "URL not allowed") {
    super(message);
    this.name = "UnsafeFetchUrlError";
  }
}

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return true; // malformed -> block rather than risk a mis-parse.
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local, incl. cloud metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 carrier-grade NAT (extra safety)
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split("%")[0]; // strip zone id (%eth0 etc)

  // IPv4-mapped / IPv4-compatible forms: ::ffff:a.b.c.d or ::a.b.c.d
  const mapped = normalized.match(/^::(ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[2]);

  // The SAME address written in hex instead of dots: ::ffff:a00:1 is 10.0.0.1 and ::ffff:7f00:1 is
  // 127.0.0.1. Node treats both as valid IPv6, the dotted pattern above does not match them, and
  // measured on this exact function they came back ALLOWED while their dotted twins were blocked.
  // Found 2026-08-14 by comparing against a fuller version of this guard that was written in July
  // and never merged.
  const hexMapped = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    const asDotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isBlockedIPv4(asDotted);
  }

  if (normalized === "::1") return true; // loopback
  if (normalized === "::") return true; // unspecified
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true; // fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique local
  return false;
}

function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true; // unparseable -> block.
}

/**
 * Throws UnsafeFetchUrlError if `rawUrl` is not a safe target for a server-side
 * fetch:
 *  - scheme must be http/https
 *  - every DNS-resolved address (v4 + v6) for the host must be public (no
 *    loopback / private / link-local / unique-local / metadata ranges)
 *  - a literal-IP host is checked directly, no DNS round-trip needed
 *
 * Callers should treat a thrown error as an opaque "fetch failed" outcome and
 * must not leak which specific check tripped back to the client.
 */
export async function assertSafeFetchUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeFetchUrlError();
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new UnsafeFetchUrlError();
  }

  const hostname = parsed.hostname;
  if (!hostname) throw new UnsafeFetchUrlError();

  if (hostname.toLowerCase() === "localhost") {
    throw new UnsafeFetchUrlError();
  }

  // Literal IP host (v4, or bracketed v6 which URL.hostname strips to bare form).
  const literalFamily = net.isIP(hostname);
  if (literalFamily) {
    if (isBlockedIp(hostname)) throw new UnsafeFetchUrlError();
    return;
  }

  let addresses: { address: string; family: number }[];
  try {
    // dns.lookup() never accepted an abort/signal option, so bound it the third idiom
    // this repo uses for calls that can't take a signal: Promise.race against a timer
    // (precedent: app/api/salons/route.ts:138-141). 3000ms. The timer is cleared in a
    // finally so a fast lookup does not leave a pending timer holding the process open.
    let timer: ReturnType<typeof setTimeout>;
    try {
      addresses = await Promise.race([
        dns.lookup(hostname, { all: true }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("dns.lookup timed out")), 3000);
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  } catch {
    // Can't resolve (including a timeout above) -> can't prove it's safe, block. Fail
    // CLOSED, which is the correct default for a security guard.
    throw new UnsafeFetchUrlError();
  }

  if (addresses.length === 0) throw new UnsafeFetchUrlError();

  for (const { address } of addresses) {
    if (isBlockedIp(address)) throw new UnsafeFetchUrlError();
  }
}
