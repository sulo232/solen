/**
 * Single source of truth for platform billing constants.
 *
 * If `platform_settings.commission.rate_percent` is missing/null, this is
 * the fallback rate used by every payment-creation path. Pre-2026-05-16
 * the packages/purchase route defaulted to 1% while create-payment-intent
 * and admin/commission both defaulted to 15% → silent revenue drift.
 */
export const DEFAULT_COMMISSION_RATE_PERCENT = 15;
