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
];

export default eslintConfig;
