// Card-network display names, a presentation lookup shared between the account-hub
// summary (server, AccountHub's "Wallet" row) and the full /profile/settings/payment
// list (client, PaymentMethods.tsx). Not per-user data, these are the same fixed set of
// networks Stripe itself returns in `brand` (visa/mastercard/amex/...), same shape as the
// locale-label maps used elsewhere in the app. Extracted 2026-08-02 so the two Wallet
// surfaces never drift on how a brand key renders (rule 12, don't duplicate).
// exists-check: `npm run exists "card brand"`, `npm run exists lib` and
// `npm run exists "payment-brand"` ran this turn, 0 hits for a card-brand lookup, net-new.
export const CARD_BRAND_NAME: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};

export function cardBrandName(brand: string | null | undefined): string {
  const key = brand?.toLowerCase() ?? "";
  return CARD_BRAND_NAME[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : "Karte");
}
