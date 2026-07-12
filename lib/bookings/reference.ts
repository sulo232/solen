import { customAlphabet } from "nanoid";
import { createAdminSupabaseClient } from "@/lib/supabase";

type Admin = ReturnType<typeof createAdminSupabaseClient>;

/**
 * Human-readable order number ("SOL-7K2QX"). This is the customer-facing
 * confirmation / order number shown on the confirmation screen, booking detail,
 * and dashboard rows. Mirrors the walk-in `ticket_code` pattern in
 * `lib/barber/walkin-ticket.ts`: short code + retry-on-23505 against a DB unique
 * index, idempotent so a webhook/retry can't overwrite an already-issued code.
 *
 * HARD RULE (master plan §10b.7): `reference_code` is for DISPLAY + LOOKUP
 * correlation only. It is NEVER accepted as authorization on its own — auth always
 * requires the hashed guest token (see `lib/bookings/guest-access.ts`) or a session.
 */

// Alphabet excludes ambiguous chars (no 0/O, 1/I/L) so a customer can read it off a
// screen or say it on the phone. 31 chars → 31^5 ≈ 28.6M space at length 5.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LEN = 5;
const PREFIX = "SOL-";
const MAX_ATTEMPTS = 6; // same budget as createWalkinTicket

// nanoid's customAlphabet is crypto-backed (uses crypto.getRandomValues / randomBytes),
// so this is NOT Math.random. Same dependency the walk-in ticket helper uses.
const nano = customAlphabet(ALPHABET, CODE_LEN);

/** Generate a fresh human order number, e.g. "SOL-7K2QX".
 * Not exported: only used internally in this file (zero external imports,
 * ring5c dead-export sweep). */
function generateReferenceCode(): string {
  return `${PREFIX}${nano()}`;
}

/**
 * Normalize user-supplied input for an exact-match lookup. Tolerant of: lowercase,
 * surrounding/internal whitespace, a missing "SOL-" prefix, and a lowercase/spaced
 * prefix. Storage is always canonical UPPERCASE with the prefix, so we normalize the
 * presented value to the same shape before comparing.
 *
 * Examples → "SOL-7K2QX":
 *   "sol-7k2qx", " 7K2QX ", "7k 2q x", "SOL 7K2QX", "sol7k2qx"
 */
export function normalizeReferenceCode(input: string): string {
  // Strip everything except alphanumerics, uppercase. This drops the dash, spaces,
  // and any stray punctuation in one pass.
  const cleaned = (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Tolerate a present-or-absent "SOL" prefix on the cleaned string.
  const body = cleaned.startsWith("SOL") ? cleaned.slice(3) : cleaned;
  return `${PREFIX}${body}`;
}

/**
 * Assign a reference_code to a booking, generating + retrying on the unique index.
 * Owns code generation so there is ONE generator across SP-1's guest insert, the
 * `/api/bookings` session insert, and any backfill — no per-route code generation.
 *
 * Idempotent: the `reference_code IS NULL` guard means re-running on a booking that
 * already has a code is a no-op that returns the existing code (a retry / webhook
 * backstop can't overwrite an issued code). Mirrors createWalkinTicket's 23505 loop.
 *
 * @param admin     service-role client (createAdminSupabaseClient)
 * @param bookingId the booking row to stamp
 * @returns the assigned (or pre-existing) reference_code
 * @throws if code generation can't find a free slot within MAX_ATTEMPTS
 */
export async function assignReferenceCode(admin: Admin, bookingId: string): Promise<string> {
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateReferenceCode();

    // Guarded UPDATE: only stamps a row that has no code yet → idempotent. `.select()`
    // returns the row only when the WHERE matched (i.e. we won the assignment).
    const { data, error } = await admin
      .from("bookings")
      .update({ reference_code: code })
      .eq("id", bookingId)
      .is("reference_code", null)
      .select("reference_code")
      .maybeSingle();

    if (!error && data?.reference_code) {
      return data.reference_code as string;
    }

    // Unique violation → this code is taken by another row; regenerate + retry.
    if (error?.code === "23505") {
      lastErr = error;
      continue;
    }

    if (error) {
      // Non-unique DB error → stop, surface it.
      console.error("[reference] code assignment failed:", error);
      throw new Error("Could not assign reference code");
    }

    // No error + no row returned → the booking already had a reference_code (the
    // NULL guard filtered it out). Re-read and return the existing code (no-op path).
    const { data: existing } = await admin
      .from("bookings")
      .select("reference_code")
      .eq("id", bookingId)
      .maybeSingle();
    if (existing?.reference_code) return existing.reference_code as string;

    // Row exists but still has no code and the update touched nothing — treat as a
    // transient race and retry.
    lastErr = new Error("reference code update matched no row");
  }

  console.error("[reference] code assignment exhausted:", lastErr);
  throw new Error("Could not assign reference code");
}
