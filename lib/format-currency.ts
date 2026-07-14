// App locales are bare ("de" / "en" / "fr" / "it"); bare "de" makes Intl render
// German format ("24.000 CHF") instead of Swiss ("CHF 240.00"), so we pin the
// Swiss region before formatting.
const SWISS_LOCALES: Record<string, string> = {
  de: "de-CH",
  en: "en-CH",
  fr: "fr-CH",
  it: "it-CH",
};

export function formatCurrency(amount: number, locale: string = "de-CH"): string {
  // Whole amounts stay clean ("CHF 85"), but any fractional amount shows BOTH decimals
  // ("CHF 25.50", never "CHF 25.5") , money with one decimal reads as a glitch. Deposit
  // splits routinely land on .50 (half of an odd price), so this is the common case now.
  const hasFraction = !Number.isInteger(amount);
  return new Intl.NumberFormat(SWISS_LOCALES[locale] ?? locale, {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
