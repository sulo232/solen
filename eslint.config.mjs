import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// accessibility-09 (2026-07-27): `next/core-web-vitals` only wires 6 of
// eslint-plugin-jsx-a11y's ~40 recommended rules (alt-text, aria-props,
// aria-proptypes, aria-unsupported-elements, role-has-required-aria-props,
// role-supports-aria-props), all at "warn". The plugin itself was already
// present transitively (a dep of eslint-config-next, per package-lock.json)
// but nothing in this repo actually turned its full ruleset on -- this
// estate enforces color drift, type-scale budgets, and dead-clicks with
// dedicated blocking checks, but had zero automated accessibility scan.
// `jsxA11y.flatConfigs.recommended` adds the rest (anchor-is-valid,
// click-events-have-key-events, label-has-associated-control, no-autofocus,
// heading-has-content, and more). The existing `.github/workflows/quality.yml`
// `lint` job's RATCHET (fails only when the total error count goes UP, not on
// every pre-existing violation) absorbs whatever this surfaces on day one --
// see that job's updated BASELINE for the new count.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Only the RULES, not the whole flatConfig object: `next/core-web-vitals` already
  // registers the "jsx-a11y" plugin itself (for its own 6-rule subset), and flat
  // config errors on a plugin being registered twice under the same name.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // copy-i18n-05 (2026-07-27): 112 call sites once hardcoded the literal BCP-47 tag
  // "de-CH" straight into toLocaleDateString/toLocaleTimeString/Intl.*Format, so a
  // French/Italian/English visitor silently got German date/time formatting. The
  // sweep fixed the known sites (they now derive the tag from `locale` via a
  // ternary or a lookup table), but nothing stopped the NEXT hardcode from shipping
  // -- `_rules/LESSONS_LEARNED.md` already documented this exact bug once and a
  // later audit re-found it, proof that prose alone doesn't hold. This rule blocks
  // only the actual failure shape: a bare BCP-47 literal passed DIRECTLY as the
  // locale argument to a toLocale*String call or `new Intl.*Format(...)`. A literal
  // that is one branch of a `locale === "de" ? "de-CH" : ...` ternary (the correct,
  // locale-derived pattern used everywhere else in the app) sits one AST level
  // deeper (inside the ConditionalExpression) and is NOT a direct child of the call,
  // so it does not match and is not flagged. lib/format.ts and lib/format-currency.ts
  // are exempt: they are the one shared place allowed to own the literal tag.
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["lib/format.ts", "lib/format-currency.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(toLocaleDateString|toLocaleTimeString|toLocaleString)$/] > Literal[value=/^(de|fr|it|en)-CH$/]",
          message:
            "copy-i18n-05: no literal BCP-47 locale tag (de-CH/fr-CH/it-CH/en-CH) passed directly to toLocale*String. Derive it from the request/UI locale (useLocale()/getLocale()) via a variable, or route through lib/format.ts.",
        },
        {
          selector:
            "NewExpression[callee.object.name='Intl'][callee.property.name=/^(DateTimeFormat|NumberFormat)$/] > Literal[value=/^(de|fr|it|en)-CH$/]",
          message:
            "copy-i18n-05: no literal BCP-47 locale tag passed directly to Intl.DateTimeFormat/NumberFormat. Derive it from the request/UI locale, or route through lib/format.ts.",
        },
      ],
    },
  },
];

export default eslintConfig;
