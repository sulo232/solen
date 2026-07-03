// A5 FIX-2 (2026-07-03): the single source of truth for service-bundle pricing.
//
// exists-check: `npm run exists bundle` / `pricing` found NO lib/pricing module and
// NO shared bundle-pricing helper , the math was inlined in three routes (bookings,
// booking-pay-intent, salon/bundles GET). This file is the dedup target, not a rebuild.
//
// Before this file the bundle price math lived duplicated in THREE places:
//   - app/api/bookings/route.ts          (the booking write's price_paid)
//   - app/api/stripe/booking-pay-intent  (the online-pay charge base , FIX-1)
//   - app/api/salon/bundles/route.ts     (the PDP display price)
// Three copies drift: FIX-1 exposed that pay-intent never recomputed the bundle
// price at all and would have charged the UNDISCOUNTED sum. Extracting the math +
// the guarded load here makes all three produce the SAME number by construction.
//
// UNITS: services.price and service_bundles.custom_price are CHF DECIMAL
// (numeric(8,2)); everything here stays in CHF (2dp). The Stripe boundary
// (lib/stripe.ts toRappen) converts *100 , never in this file.

import type { SupabaseClient } from "@supabase/supabase-js";

export type BundlePricingMode = "sum" | "custom" | "percent";

/**
 * The pricing_mode math , the ONLY place sum|custom|percent becomes a CHF price.
 *
 *   sum     : the plain summed service price.
 *   percent : sum minus percent_off%.
 *   custom  : the owner-set custom_price (independent of the sum).
 *
 * Any unknown/missing mode falls back to the plain sum , never a 0 CHF surprise.
 * Result is rounded to 2dp CHF, matching the bookings route's price rounding.
 */
export function computeBundlePriceChf(
  mode: BundlePricingMode | string | null | undefined,
  sumChf: number,
  opts: { customPrice?: number | null; percentOff?: number | null },
): number {
  let price: number;
  if (mode === "custom") {
    price = Number(opts.customPrice) || 0;
  } else if (mode === "percent") {
    const pct = Number(opts.percentOff) || 0;
    price = (sumChf * (100 - pct)) / 100;
  } else {
    // "sum" (and any unknown mode) => the plain sum.
    price = sumChf;
  }
  return Math.round(price * 100) / 100;
}

// Machine error codes for the guarded load (mirrors the /api/bookings 400 codes so
// the caller can pass them straight through to the client, which translates them).
export type BundleLoadErrorCode = "BUNDLE_UNAVAILABLE" | "BUNDLE_MISMATCH";

export interface PricedBundle {
  id: string;
  salonId: string;
  pricingMode: BundlePricingMode;
  /** The bundle's item service ids (deduped). */
  serviceIds: string[];
  /** The live service rows for those ids (price + duration + buffer). */
  services: { id: string; price: number; duration_minutes: number; buffer_minutes: number }[];
  /** Plain summed service price (CHF, unrounded , the struck "before" price). */
  sumChf: number;
  /** The final bundle price (CHF, 2dp) per pricing_mode. */
  priceChf: number;
  /** Summed duration incl. per-service buffer (minutes) , the reserved window. */
  totalMinutes: number;
}

export type BundleLoadResult =
  | { ok: true; bundle: PricedBundle }
  | { ok: false; code: BundleLoadErrorCode };

/**
 * Load ONE bundle with the full guard set and return it priced, or a typed error
 * code. Used by /api/bookings (the write) and /api/stripe/booking-pay-intent (the
 * charge). Guards (ALL of these => BUNDLE_UNAVAILABLE unless noted):
 *   - the bundle exists, is_active = true, and belongs to `salonId`.
 *   - it has >= 2 item services (never a 0/1-item, never a 0 CHF bundle).
 *   - every item service resolves, is active, and is in this salon.
 *   - when `selectedServiceIds` is given, they must equal the bundle's item set
 *     EXACTLY (no missing item, no smuggled extra) else BUNDLE_MISMATCH.
 *
 * Pass the ADMIN client: RLS hides is_active=false bundles, and the bundle must be
 * re-checkable regardless of the caller's read scope (a stale/inactive bundle must
 * 400, never silently fall back to a full-sum charge).
 */
export async function loadPricedBundle(
  admin: SupabaseClient,
  args: { bundleId: string; salonId: string; selectedServiceIds?: string[] },
): Promise<BundleLoadResult> {
  const { bundleId, salonId, selectedServiceIds } = args;

  const { data: bundle } = await admin
    .from("service_bundles")
    .select("id, salon_id, pricing_mode, custom_price, percent_off, is_active")
    .eq("id", bundleId)
    .single();

  // Guard 1: exists, active, and this salon's.
  if (!bundle || bundle.is_active !== true || bundle.salon_id !== salonId) {
    return { ok: false, code: "BUNDLE_UNAVAILABLE" };
  }

  const { data: bundleItems } = await admin
    .from("service_bundle_items")
    .select("service_id")
    .eq("bundle_id", bundle.id);

  const serviceIds = [...new Set((bundleItems ?? []).map((i) => i.service_id as string))];

  // Guard 2: >= 2 items.
  if (serviceIds.length < 2) {
    return { ok: false, code: "BUNDLE_UNAVAILABLE" };
  }

  // Guard 3 (optional): selected services must equal the bundle set exactly.
  if (selectedServiceIds) {
    const selectedSet = new Set(selectedServiceIds);
    const bundleSet = new Set(serviceIds);
    const exactMatch =
      selectedSet.size === bundleSet.size && [...bundleSet].every((id) => selectedSet.has(id));
    if (!exactMatch) {
      return { ok: false, code: "BUNDLE_MISMATCH" };
    }
  }

  const { data: svcRows } = await admin
    .from("services")
    .select("id, price, duration_minutes, buffer_minutes, is_active, salon_id")
    .in("id", serviceIds)
    .eq("salon_id", salonId);

  // Guard 4: every item resolves, is active, and is in this salon (else the bundle is stale).
  if (
    !svcRows ||
    svcRows.length !== serviceIds.length ||
    svcRows.some((s) => s.is_active === false)
  ) {
    return { ok: false, code: "BUNDLE_UNAVAILABLE" };
  }

  const services = svcRows.map((s) => ({
    id: s.id as string,
    price: Number(s.price) || 0,
    duration_minutes: Number(s.duration_minutes) || 0,
    buffer_minutes: Number(s.buffer_minutes) || 0,
  }));

  const sumChf = services.reduce((acc, s) => acc + s.price, 0);
  const priceChf = computeBundlePriceChf(bundle.pricing_mode, sumChf, {
    customPrice: bundle.custom_price,
    percentOff: bundle.percent_off,
  });
  const totalMinutes = services.reduce((m, s) => m + s.duration_minutes + s.buffer_minutes, 0);

  return {
    ok: true,
    bundle: {
      id: bundle.id as string,
      salonId: bundle.salon_id as string,
      pricingMode: bundle.pricing_mode as BundlePricingMode,
      serviceIds,
      services,
      sumChf,
      priceChf,
      totalMinutes,
    },
  };
}
