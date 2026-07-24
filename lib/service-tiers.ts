/**
 * Service duration-tier grouping — SINGLE shared source of truth.
 *
 * Owner mockup service-grouping (2026-06-10): the inline service list groups
 * by DURATION tier (Express / Klassisch / Signature). Pure derivation from
 * duration_minutes — no schema change, no invented data.
 *
 * Extracted from SalonServices.tsx (was function-local `TIERS`) so both
 * Termin mode (SalonServices.tsx) and Walk-in mode (SalonWalkInPanel.tsx)
 * render byte-identical tier labels/ranges/match logic (rule 12: share, do
 * not duplicate). Do NOT change these values without updating both callers.
 */
export type ServiceDurationTier = {
  key: string;
  label: string;
  range: string;
  match: (d: number) => boolean;
};

export const SERVICE_DURATION_TIERS: ServiceDurationTier[] = [
  { key: "express", label: "Express", range: "15–30 Min", match: (d) => d > 0 && d <= 30 },
  { key: "klassisch", label: "Klassisch", range: "45–60 Min", match: (d) => d > 30 && d <= 60 },
  { key: "signature", label: "Signature", range: "90+ Min", match: (d) => d > 60 },
];

/**
 * Groups a list of services (anything with a `duration_minutes`-shaped field)
 * into { tiered, untiered } — tiered is per-tier { tier, rows } buckets with
 * empty tiers dropped, untiered is services with no usable duration.
 */
export function groupServicesByDurationTier<T extends { duration_minutes?: number | null }>(
  items: T[]
): { tiered: { tier: ServiceDurationTier; rows: T[] }[]; untiered: T[] } {
  const tiered = SERVICE_DURATION_TIERS
    .map((tier) => ({ tier, rows: items.filter((s) => tier.match(s.duration_minutes ?? 0)) }))
    .filter((g) => g.rows.length > 0);
  const untiered = items.filter((s) => !SERVICE_DURATION_TIERS.some((tier) => tier.match(s.duration_minutes ?? 0)));
  return { tiered, untiered };
}
