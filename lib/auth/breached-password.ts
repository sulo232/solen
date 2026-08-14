// =============================================================================
// lib/auth/breached-password.ts: HaveIBeenPwned k-anonymity breach check
//
// NIST SP 800-63-4 (July 2025) drops composition rules (uppercase/digit) in
// favor of length plus a check against known-breached passwords. This is
// that check, against HIBP's Pwned Passwords "range" API.
//
// K-ANONYMITY, the whole reason this is acceptable to call from a signup
// request: we SHA-1 the password locally, then send HIBP only the first 5
// hex characters of that hash. HIBP returns every suffix sharing that 5-char
// prefix (hundreds of entries), and we compare the FULL suffix locally. The
// full password, and the full hash, never leave this server.
// =============================================================================

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";

/**
 * How long we wait for HIBP before giving up.
 *
 * This runs INSIDE the synchronous signup POST (app/api/auth/signup/route.ts),
 * so a slow third party must not make a customer wait on account creation.
 * 1500ms: tight enough that a hung HIBP cannot meaningfully delay signup, but
 * comfortably above the sub-second response times HIBP's own docs report for
 * the range endpoint. Compare lib/email.ts's 5000ms RESEND_TIMEOUT_MS, which
 * can afford to be looser because that call fires after the account already
 * exists; this one gates account creation itself, so it gets a tighter budget.
 */
const HIBP_TIMEOUT_MS = 1500;

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Checks a candidate password against HIBP's Pwned Passwords database.
 *
 * FAILS OPEN: if HIBP is slow, unreachable, or errors, this resolves to
 * `false` (treated as not breached) rather than throwing. A third-party
 * outage must never stop Solen from taking a new customer. The failure is
 * still logged (never a silent `.catch(() => {})`) so it stays visible.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

  try {
    const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      // Pads the response to a fixed size so an eavesdropper can't infer
      // breach status from response length alone (HIBP-recommended header).
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[breached-password] HIBP returned ${res.status}, failing open`);
      return false;
    }

    const body = await res.text();
    return body.split("\n").some((line) => line.trim().split(":")[0] === suffix);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[breached-password] HIBP timed out after ${HIBP_TIMEOUT_MS}ms, failing open`);
    } else {
      console.error("[breached-password] HIBP request failed, failing open:", err);
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
}
