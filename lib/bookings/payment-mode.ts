/**
 * effectivePaymentMode: the single source of truth for "which payment mode actually
 * applies to this salon right now."
 *
 * Owner model (2026-07-20): a salon picks its OWN payment_mode (at_salon / deposit /
 * prepay). Admin can OVERRIDE that choice per-salon via payment_mode_admin +
 * payment_mode_enforced. When payment_mode_enforced is true, the admin's choice wins
 * (payment_mode_admin, falling back to the salon's own payment_mode if the admin
 * enforced the lock without picking a value); when false (the default), the salon's
 * own payment_mode always applies, regardless of whatever payment_mode_admin holds
 * (a stale/previous admin pick that isn't enforced must never leak through).
 *
 * This is the ONE place that resolves the three-column tuple into the mode every
 * caller (booking pay step, salon settings lock UI, admin panel) should read.
 */
export type PaymentMode = "at_salon" | "deposit" | "prepay";

export interface SalonPaymentModeFields {
  payment_mode: string | null;
  payment_mode_admin: string | null;
  payment_mode_enforced: boolean | null;
}

const VALID_MODES: readonly PaymentMode[] = ["at_salon", "deposit", "prepay"];

function asPaymentMode(value: string | null | undefined): PaymentMode | null {
  return value && (VALID_MODES as readonly string[]).includes(value) ? (value as PaymentMode) : null;
}

export function effectivePaymentMode(salon: SalonPaymentModeFields): PaymentMode {
  const ownMode = asPaymentMode(salon.payment_mode) ?? "at_salon";
  if (!salon.payment_mode_enforced) return ownMode;
  return asPaymentMode(salon.payment_mode_admin) ?? ownMode;
}
