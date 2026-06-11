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
  return new Intl.NumberFormat(SWISS_LOCALES[locale] ?? locale, {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
