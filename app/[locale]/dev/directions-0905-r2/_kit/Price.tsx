"use client";

// exists-check: `npm run exists directions` shows no round-2 typography kit wrapper; `npm run
// exists kit` returns no existing token/kit module. The price-emphasis rule (bold-ink, smaller
// than the name) is a locked design-contract hierarchy row, never previously pinned to a
// component; the real formatter it depends on (lib/format-currency.ts) already exists and is
// imported here rather than re-implemented.

// Depicts: a price value -> lib/format-currency.ts formatCurrency (real Swiss CHF formatting, whole amounts clean, fractional amounts show both decimals; used live in components-legacy/booking/BookingCard.tsx's price_paid row)

// Grounded-in: lib/format-currency.ts (formatCurrency, imported not re-implemented) and the
// CLAUDE.md design contract "hierarchy" row: "price bold-ink but smaller than name". Tabular
// figures per LOCKFILE §13.4 (Inter Tight tabular for codes/numbers).
//
// system: none. Price carries no per-system delta.

import * as React from "react";
import { formatCurrency } from "@/lib/format-currency";
import { COLOR } from "./tokens";

export interface PriceProps {
  /** Amount in CHF. Always a real number from a real loader; never invent a price. */
  amount: number;
  locale?: string;
  /** "row" (default, 14px, matches body) for a per-row price; "total" (also 14px, matches the
   * CTA step, CORRECTED: used to be 15px before tokens.ts's cta step was fixed to close the
   * A5-vs-C7 5-size contradiction, see tokens.ts TYPE_RAMP.cta's own comment) for a
   * summary/total line, which sits heavier by WEIGHT (font-semibold here, same as "row") and by
   * font-heading, never by an extra size step. */
  size?: "row" | "total";
  className?: string;
}

/** Price: bold-ink, smaller than the name it sits beside (never the anchor), tabular figures. */
export function Price({ amount, locale = "de-CH", size = "row", className }: PriceProps) {
  return (
    <span
      className={["font-heading font-semibold tabular-nums", className].filter(Boolean).join(" ")}
      style={{ fontSize: 14, color: COLOR.inkText }}
    >
      {formatCurrency(amount, locale)}
    </span>
  );
}
