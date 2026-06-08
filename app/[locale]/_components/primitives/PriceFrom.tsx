import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PriceFrom — "{label} {amount} CHF" (CONTRADICTIONS.md §4).
 * Layer 3 only in the sense of the amount being a price; renders in inherited
 * ink so it adopts the caller's meta-text colour.
 *
 * Replaces 3 different "ab X CHF" spellings inside SalonResultCard alone +
 * SalonServices. Swiss format is "{amount} CHF" (number first) — matches the
 * shipped SalonResultCard render. The label (i18n "ab") is passed by the caller.
 */
export interface PriceFromProps {
  /** Amount in CHF. */
  amount: number;
  /** Localised prefix (e.g. t("from") → "ab"). Omit for a bare price. */
  label?: string;
  className?: string;
}

export function PriceFrom({ amount, label, className }: PriceFromProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular-nums", className)}>
      {label && <span className="text-s-ink-2">{label}</span>}
      <span>{amount} CHF</span>
    </span>
  );
}
