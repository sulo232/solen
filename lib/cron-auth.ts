/**
 * Constant-time string comparison (secrets-webhooks-10). A plain `!==`/`===`
 * leaks timing information proportional to the number of matching leading
 * bytes (CWE-208, Observable Timing Discrepancy). `lib/bookings/guest-access.ts`
 * already documents the correct pattern for one secret class ("compare with
 * crypto.timingSafeEqual, NEVER !=="); this is the same fix generalized to
 * every shared-secret compare in the codebase (CRON_SECRET, the internal
 * x-internal-secret header, a public walk-in tracking_token).
 *
 * Uses the Web Crypto API (`globalThis.crypto.subtle`) instead of node:crypto's
 * `timingSafeEqual` because several call sites (five of the twenty-two cron
 * routes, plus two admin routes) declare `export const runtime = "edge"`, and
 * node:crypto's synchronous hash/compare functions are not guaranteed available
 * there; Web Crypto is the one hashing API present in both the Node.js and edge
 * runtimes this codebase actually ships to. Both sides are hashed to a
 * fixed-length digest first, then compared with a manual constant-time byte
 * loop (no `Buffer.equals`/`===` on the digest, which would short-circuit on
 * the first mismatching byte).
 */
export async function constantTimeStringEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    globalThis.crypto.subtle.digest("SHA-256", encoder.encode(a)),
    globalThis.crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const bytesA = new Uint8Array(hashA);
  const bytesB = new Uint8Array(hashB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i];
  }
  return diff === 0;
}

/** Verify a cron request's Authorization header against CRON_SECRET. */
export async function verifyCronSecret(authHeader: string | null, cronSecret: string): Promise<boolean> {
  return constantTimeStringEqual(authHeader ?? "", `Bearer ${cronSecret}`);
}
