// Cancellation / no-show policy math.
//
// SP-AC ADDS two type-aware fee calculators that work in INTEGER RAPPEN end-to-end
// (REFUND_APPEAL_PLAN §10b#5): the salon stores the fee as a CHF figure
// (cancellation_fee_value / no_show_fee_value), this module converts at the boundary
// via toRappen and returns the charge amount in Rappen, already capped at what the
// customer paid (fairness, §10 "Abuse both ways" + §11).
//
// `calculateRefund` (legacy, percentage-only, paid-unit) was removed 2026-07-10: it
// had zero callers left (its cancellation-window logic was inverted relative to
// calculateCancellationFee below) and every caller already uses the correct
// calculateCancellationFee / calculateNoShowFee pair.

import { toRappen } from "@/lib/stripe";

/** Structured policy fee shape. `'free'` => never charges. CHF figure at the boundary.
 * Not exported: only used internally in this file (zero external imports,
 * ring5c dead-export sweep). */
type PolicyFeeType = "free" | "flat" | "percentage";

/**
 * Convert a structured policy fee (type + CHF value) into an integer-Rappen charge,
 * capped at the amount the customer paid. Shared by the cancellation + no-show paths.
 *
 * @param feeType    'free' | 'flat' | 'percentage' (anything else => 0, fail-safe).
 * @param feeValueChf the salon's stored fee figure (CHF for 'flat', percent 0-100 for 'percentage').
 * @param baseCents  the amount the customer paid, in Rappen, the fairness cap.
 * @returns integer Rappen to charge (0 when free / no base / non-positive).
 *
 * Not exported: only used internally by calculateCancellationFee / calculateNoShowFee
 * below (zero external imports, ring5c dead-export sweep).
 */
function computePolicyFeeCents(
  feeType: string | null | undefined,
  feeValueChf: number | null | undefined,
  baseCents: number
): number {
  if (!feeType || feeType === "free") return 0;
  if (!Number.isFinite(baseCents) || baseCents <= 0) return 0;
  const value = Number(feeValueChf ?? 0);
  if (!Number.isFinite(value) || value <= 0) return 0;

  let feeCents: number;
  if (feeType === "flat") {
    feeCents = toRappen(value); // CHF -> Rappen at the boundary.
  } else if (feeType === "percentage") {
    feeCents = Math.round(baseCents * (value / 100));
  } else {
    return 0; // unknown type — never charge.
  }

  // Fairness cap: never charge more than the customer paid (§10 / §11).
  return Math.min(feeCents, baseCents);
}

/**
 * Cancellation fee in Rappen.
 *
 * - `'free'` type            -> 0.
 * - OUTSIDE the free-cancel window (cancelling early) -> 0 (free cancellation honored).
 * - INSIDE the window: flat (CHF->Rappen) or percentage of `baseCents`, capped at `baseCents`.
 *
 * Reuses the same hours-until-start window test as `calculateRefund`.
 */
export function calculateCancellationFee(
  feeType: string | null | undefined,
  feeValueChf: number | null | undefined,
  freeCancelHours: number,
  baseCents: number,
  appointmentStartsAt: Date,
  evaluatedAt = Date.now()
): { feeCents: number; isWithinWindow: boolean } {
  if (!Number.isFinite(evaluatedAt) || !Number.isFinite(appointmentStartsAt.getTime())) return { feeCents: 0, isWithinWindow: false };
  const hoursUntil =
    (appointmentStartsAt.getTime() - evaluatedAt) / (1000 * 60 * 60);
  const isWithinWindow = hoursUntil < freeCancelHours;

  // Cancelling early (outside the window) is free regardless of the fee policy.
  if (!isWithinWindow) return { feeCents: 0, isWithinWindow: false };

  return { feeCents: computePolicyFeeCents(feeType, feeValueChf, baseCents), isWithinWindow: true };
}

/**
 * No-show fee in Rappen. No window test — a no-show is asserted after the fact, so the
 * full policy fee applies (flat CHF->Rappen or percentage of `baseCents`, capped).
 */
export function calculateNoShowFee(
  feeType: string | null | undefined,
  feeValueChf: number | null | undefined,
  baseCents: number
): { feeCents: number } {
  return { feeCents: computePolicyFeeCents(feeType, feeValueChf, baseCents) };
}
