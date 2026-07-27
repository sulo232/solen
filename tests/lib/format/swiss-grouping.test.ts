// tests/lib/format/swiss-grouping.test.ts
//
// copy-i18n-06: fr-CH space-groups with a comma decimal in this runtime's ICU
// data ((1234567).toLocaleString("fr-CH") gives "1 234 567", not the Swiss
// apostrophe "1'234'567" every other Swiss locale produces). formatPrice/
// formatNumber/formatCount must give apostrophe grouping for all four UI
// locales, never trusting a per-locale Intl tag to agree with the others.

import { describe, it, expect } from "vitest";
import { formatPrice, formatNumber, formatCount } from "@/lib/format";

const LOCALES = ["de", "en", "fr", "it", "de-CH", "en-CH", "fr-CH", "it-CH"];

describe("Swiss apostrophe grouping is locale-invariant", () => {
  it.each(LOCALES)("formatPrice(1234567, %s) contains an apostrophe, never a space", (locale) => {
    const out = formatPrice(1234567, locale);
    expect(out).toContain("'");
    expect(out).not.toMatch(/\d[\s  ]\d/); // no plain/no-break/narrow-no-break space between digit groups
  });

  it.each(LOCALES)("formatNumber(1234567, %s) contains an apostrophe, never a space", (locale) => {
    const out = formatNumber(1234567, locale);
    expect(out).toContain("'");
    expect(out).not.toMatch(/\d[\s  ]\d/);
  });

  it.each(LOCALES)("formatCount(1234567, %s) contains an apostrophe, never a space", (locale) => {
    const out = formatCount(1234567, locale);
    expect(out).toContain("'");
    expect(out).not.toMatch(/\d[\s  ]\d/);
  });

  it("formatPrice keeps the CHF prefix and decimal handling", () => {
    expect(formatPrice(85)).toBe("CHF 85");
    expect(formatPrice(85.5)).toBe("CHF 85.50");
    expect(formatPrice(1250, "fr-CH")).toBe("CHF 1'250");
  });
});
