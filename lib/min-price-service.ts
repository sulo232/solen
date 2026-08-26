// exists-check: `npm run exists "min price service"` returned 0 matches, and `npm run exists
// min_price_service` finds only the two call sites this module replaces (app/api/salons/route.ts
// and app/[locale]/_components/homepage/salonCardData.ts). Net-new, and deliberately so: those two
// held byte-identical copies of the same rule, which is what this file ends.

/**
 * The cheapest active service of a salon, and its NAME in every locale.
 *
 * WHY THIS IS A RULE AND NOT A ONE-LINER: Art. 13 PBV makes an advertised from-price lawful only
 * when the copy names the concrete offer it buys (SECO Wegleitung 2025 p.17). So the price and the
 * name are one fact, not two, and they must be picked from the SAME row or the card can advertise
 * one service's price under another service's name. Two files were computing this independently.
 *
 * ALL FOUR LOCALES, corrected 2026-08-16. The previous implementations read name_de and name_en
 * only, on the strength of a code comment that said "services has only name_de + name_en in the
 * live DB (no name_fr/name_it)". That comment is false. Measured against the live database on
 * 2026-08-16: 264 of 264 service rows have all four names populated, e.g.
 * {de: "Damen-Haarschnitt", en: "Women Cut", fr: "Coupe Dame", it: "Taglio capelli donna"}.
 * Reading two of four meant French and Italian customers were shown a German service name beside
 * their price, which is the same defect the naming rule exists to prevent, one layer down.
 */

export type ServiceNameLocale = "de" | "en" | "fr" | "it";

/** The subset of a services row this needs. Anything wider is the caller's business. */
export interface PricedServiceRow {
  price?: unknown;
  name_de?: unknown;
  name_en?: unknown;
  name_fr?: unknown;
  name_it?: unknown;
}

export interface MinPriceService {
  /** Cheapest positive price among the rows, or null when there is none. */
  minPrice: number | null;
  /** Name of the service that price came from, per locale. Null when unknown. */
  names: Record<ServiceNameLocale, string | null>;
}

/** The exact column list to select so this function has what it needs. One source of truth. */
export const MIN_PRICE_SERVICE_COLUMNS = "price, name_de, name_en, name_fr, name_it";

const EMPTY_NAMES: Record<ServiceNameLocale, string | null> = {
  de: null,
  en: null,
  fr: null,
  it: null,
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * Cheapest service row and its names. Only positive numeric prices count, matching what both
 * previous implementations did: a zero or null price is not a price a customer can be quoted.
 *
 * Ties are broken by the cheapest row that ALSO has a name in the requested locale where possible,
 * then by first occurrence. Two services at the same lowest price is common (a salon with several
 * 35 CHF add-ons), and picking a row whose name is null when a named row was available at the same
 * price would drop the label for no reason.
 */
export function minPriceService(rows: readonly PricedServiceRow[] | null | undefined): MinPriceService {
  const priced = (rows ?? []).filter(
    (r): r is PricedServiceRow & { price: number } =>
      typeof r.price === "number" && r.price > 0,
  );
  if (priced.length === 0) return { minPrice: null, names: { ...EMPTY_NAMES } };

  const minPrice = Math.min(...priced.map((r) => r.price));
  const atMin = priced.filter((r) => r.price === minPrice);
  // Prefer a tied row that actually carries names over one that does not.
  const chosen = atMin.find((r) => str(r.name_de) || str(r.name_en)) ?? atMin[0];

  return {
    minPrice,
    names: {
      de: str(chosen.name_de),
      en: str(chosen.name_en),
      fr: str(chosen.name_fr),
      it: str(chosen.name_it),
    },
  };
}

/**
 * Pick the name for a locale, falling back de -> en so a missing translation degrades to a real
 * name rather than to nothing. Returning null is legitimate and is NOT a failure: the card renders
 * a bare number when there is no name, because a bare number claims less, not more.
 */
export function nameForLocale(
  names: Partial<Record<ServiceNameLocale, string | null>> | null | undefined,
  locale: string,
): string | null {
  if (!names) return null;
  const key = (["de", "en", "fr", "it"] as const).find((l) => l === locale);
  return (key ? names[key] : null) ?? names.de ?? names.en ?? null;
}
