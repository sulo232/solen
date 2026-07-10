// lib/referral/code.ts
//
// CSPRNG referral-code generation + collision-safe insert. Extracted so every mint path
// (the /api/referral GET fallback, and the "next code" mint after a referral completes in
// /api/referral/complete) shares ONE generator and ONE retry-on-unique-violation loop,
// instead of each route deriving a code from a user/referrer UUID (guessable from the id
// alone) or from Math.random (small keyspace, brute-forceable via the public
// /api/referral/validate oracle). The normal path never needs this helper: the
// trg_generate_referral_code trigger on profiles INSERT (migration 049, CSPRNG-backed)
// already stamps a pending referrals row for every user at signup.
import { customAlphabet } from "nanoid";
import { createAdminSupabaseClient } from "@/lib/supabase";

type Admin = ReturnType<typeof createAdminSupabaseClient>;

// Uppercase alphanumeric, matches the "SOLEN-<code>" shape the DB trigger + rest of the
// app expect. nanoid's customAlphabet is crypto-backed (crypto.getRandomValues in
// edge/browser, crypto.randomBytes in Node), NOT Math.random. Same dependency
// lib/bookings/reference.ts uses, isomorphic so it also works from the edge-runtime
// /api/referral/complete route.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LEN = 12;
const PREFIX = "SOLEN-";
const MAX_ATTEMPTS = 5;

const nano = customAlphabet(ALPHABET, CODE_LEN);

/** A fresh CSPRNG referral code, e.g. "SOLEN-7K2QXAB93FGH". Never derived from a user id. */
export function generateReferralCode(): string {
  return `${PREFIX}${nano()}`;
}

/**
 * Insert a new pending referral row for `referrerId` with a freshly generated CSPRNG
 * code, retrying on a unique-index collision (referrals.referral_code is UNIQUE). Used
 * by the defensive fallback in GET /api/referral (no pending row somehow exists) and by
 * POST /api/referral/complete (mint the referrer's next code once their current one is
 * consumed).
 */
export async function insertPendingReferralCode(admin: Admin, referrerId: string): Promise<string> {
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateReferralCode();
    const { error } = await admin
      .from("referrals")
      .insert({ referrer_id: referrerId, referral_code: code, status: "pending" });

    if (!error) return code;

    // Unique violation → another row already holds this code; regenerate + retry.
    if (error.code === "23505") {
      lastErr = error;
      continue;
    }

    console.error("[referral] code insert failed:", error);
    throw new Error("Could not mint referral code");
  }

  console.error("[referral] code insert exhausted:", lastErr);
  throw new Error("Could not mint referral code");
}
