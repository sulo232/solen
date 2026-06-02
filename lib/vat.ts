// lib/vat.ts
//
// Swiss VAT / MWST — pure compute helper. PER-SALON, VAT-INCLUSIVE model
// (owner decision 2026-06-02):
//   • The salon is the merchant. A VAT-registered salon charges Swiss
//     standard VAT on its service; a non-registered salon shows NO VAT.
//   • The displayed/charged price ALREADY INCLUDES VAT. We therefore
//     derive net + VAT FROM the gross, never add on top.
//   • Swiss standard rate (Normalsatz) is 8.1% from 2024-01-01.
//
// Integer Rappen throughout (matches bookings.paid_amount and the purchase
// paid_amount columns). VAT is derived by SUBTRACTION (vat = gross − net)
// so net + vat == gross EXACTLY, with no rounding drift on the total the
// customer actually paid.

/** Swiss standard VAT rate (Normalsatz), percent. Valid from 2024-01-01. */
export const SWISS_STANDARD_VAT_PERCENT = 8.1;

export interface VatBreakdown {
  /** Gross amount the customer paid, integer Rappen (unchanged from input). */
  grossRappen: number;
  /** Net amount excluding VAT, integer Rappen. Equals gross when not registered. */
  netRappen: number;
  /** VAT portion, integer Rappen. 0 when not registered. */
  vatRappen: number;
  /** Rate actually applied, percent. 0 when not registered. */
  ratePercent: number;
}

/**
 * Compute the VAT-inclusive breakdown of a gross amount.
 *
 * VAT-INCLUSIVE math (registered):
 *   net = round(gross / (1 + rate/100))
 *   vat = gross − net                       // by subtraction ⇒ net + vat == gross exactly
 *
 * Not registered:
 *   { gross, net: gross, vat: 0, rate: 0 }  // no VAT shown at all.
 *
 * @param grossRappen integer Rappen the customer paid (VAT-inclusive).
 * @param opts.registered whether the salon is VAT-registered.
 * @param opts.ratePercent VAT rate percent (defaults to the 8.1% standard).
 */
export function computeVat(
  grossRappen: number,
  opts: { registered: boolean; ratePercent?: number },
): VatBreakdown {
  const gross = Math.round(grossRappen); // defensive: keep integer Rappen.

  // Non-registered salon — no VAT. Net equals gross, rate is 0.
  if (!opts.registered) {
    return { grossRappen: gross, netRappen: gross, vatRappen: 0, ratePercent: 0 };
  }

  // Registered. Default to the Swiss standard rate. A non-positive or
  // non-finite rate means "no VAT" — treat it like net == gross rather
  // than dividing by a bad factor.
  const ratePercent = opts.ratePercent ?? SWISS_STANDARD_VAT_PERCENT;
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) {
    return { grossRappen: gross, netRappen: gross, vatRappen: 0, ratePercent: 0 };
  }

  const netRappen = Math.round(gross / (1 + ratePercent / 100));
  const vatRappen = gross - netRappen; // derive by subtraction — no drift on the total.
  return { grossRappen: gross, netRappen, vatRappen, ratePercent };
}
