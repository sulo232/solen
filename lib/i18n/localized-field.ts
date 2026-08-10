// lib/i18n/localized-field.ts , read a `<base>_<locale>` DB column for the current locale.
//
// exists-check: `npm run exists localized` returns ONE helper, `getLocalizedLabel` in
// lib/guided-search-data.ts. That one is typed to a literal `{ label_de, label_en, label_fr,
// label_it }` shape with all four REQUIRED and no fallback, because it reads a hardcoded
// in-file constant where every translation is guaranteed. This is the DB case, where a
// translation is frequently NULL, so a fallback chain is the whole point. Same idea, different
// contract; getLocalizedLabel keeps its callers and is not touched.
//
// WHY IT EXISTS. Solen ships de/en/fr/it, but six DB columns held only de+en until 2026-07-27,
// and TWELVE read sites hardcoded `locale === "en" ? x_en : x_de`. A French customer therefore
// got German service names, and so did an Italian one, and the ternary made that invisible ,
// there was no branch to notice was missing. Now that the fr/it columns exist, one helper
// resolves them and one fallback chain governs what happens while a translation is still NULL.
//
// THE FALLBACK CHAIN, and it is deliberate: requested locale -> de -> en -> "". German first
// because it is the source language every row is authored in and therefore the one most likely
// to be populated and correct. Falling back to English first would show a French visitor an
// English name that is itself often just the German one copied over.

export type AppLocale = "de" | "en" | "fr" | "it";

const ORDER: Record<AppLocale, AppLocale[]> = {
  de: ["de", "en"],
  en: ["en", "de"],
  fr: ["fr", "de", "en"],
  it: ["it", "de", "en"],
};

function normalize(locale: string | null | undefined): AppLocale {
  const l = (locale ?? "").slice(0, 2).toLowerCase();
  return l === "en" || l === "fr" || l === "it" ? l : "de";
}

/**
 * Resolve `row[base_<locale>]` with a de -> en fallback.
 *
 * @example
 *   localizedField(service, "name", locale)          // service.name_fr ?? name_de ?? name_en
 *   localizedField(salon, "description", locale)     // salon.description_it ?? ...
 *
 * Returns "" rather than null when nothing is populated, so a caller can render it directly
 * without a second guard. Use `localizedFieldOrNull` when the empty case must be distinguished
 * (e.g. hiding a whole description block rather than rendering an empty paragraph).
 */
export function localizedField(
  row: Record<string, unknown> | null | undefined,
  base: string,
  locale: string | null | undefined,
): string {
  return localizedFieldOrNull(row, base, locale) ?? "";
}

/** Same resolution, but null when no locale has a non-empty value. */
export function localizedFieldOrNull(
  row: Record<string, unknown> | null | undefined,
  base: string,
  locale: string | null | undefined,
): string | null {
  if (!row) return null;
  for (const l of ORDER[normalize(locale)]) {
    const v = row[`${base}_${l}`];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return null;
}

/**
 * Which locales a row is actually translated into. For an admin/dashboard completeness view,
 * and for the sweep script to find what still needs doing.
 */
export function translatedLocales(
  row: Record<string, unknown> | null | undefined,
  base: string,
): AppLocale[] {
  if (!row) return [];
  return (["de", "en", "fr", "it"] as AppLocale[]).filter((l) => {
    const v = row[`${base}_${l}`];
    return typeof v === "string" && v.trim() !== "";
  });
}
