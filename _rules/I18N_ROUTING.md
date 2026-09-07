# Routing & Internationalisation (i18n) Rules (MANDATORY)

> NOTE (2026-07-03): any reference to _tasks/SOLEN_DESIGN.md (rule 36) is superseded by _design-system/SOURCE.md + LOCKFILE.md. All i18n rules stay live.

> **CONTEXT**: On 2026-03-25, an audit revealed that 90% of the UI remained in German when switching to English, internal links reverted to `/de/`, and layouts broke because German words are longer than English words. These rules prevent i18n and routing regressions.

---

## Routing Rules

### Rule 32: ONE DISCOVERY PAGE — NO PARALLEL CATEGORY ROUTES

> **INCIDENT**: `/discover/nails` existed as a separate page with its own layout, fragmenting navigation. **RENAMED (2026-07-03)**: the discovery feed route is now `/[locale]/inspo` ("Inspo"), not `/[locale]/discover`. The backend/internal naming ("discovery") is unchanged; only the URL and product-facing name moved. Do not recreate a `/discover` route.

- The discovery experience MUST live at a single route: `/[locale]/inspo`.
- **NEVER** create `/[locale]/inspo/[category-name]` as an independent page with its own layout.
- Category separation is handled via `?category=VALUE` query params + in-place tab switching (or the progressive drill-down filter where applicable).
- If a category needs special content sections, extend `inspo/page.tsx` WITHIN the same page: do not create a new route.
- Adding a new beauty vertical? Add it to the existing category config used by the Inspo feed, NOT a new route.
- Old category-specific discovery routes MUST redirect using `permanentRedirect()` → `/inspo?category=X`.

```bash
# Verify no NEW parallel category discovery routes exist:
ls "app/[locale]/inspo/"
# Current state (2026-07-07): page.tsx, error.tsx, loading.tsx, [id]/, board/, saved/ are structural sub-routes (item detail, board detail, saved list), NOT category pages.
# nails/ is a pre-existing exception (a category-specific route with its own page.tsx) that predates this rule check; it is not sanctioned by this rule and should not be used as precedent for adding more category routes.
```

### Rule 32a: FILTER STATE LIVES IN THE URL (ia-navigation-04, 2026-07-27)
> **INCIDENT**: `/search`'s `SearchTemplate` reads 15+ filter params (city/service/category/date/period/sort/open_now/instant_bookable/deals/walk_in/min_rating/min_price/max_price/gender/amenities/map/layout) from `searchParams`, proving the team already values shareable filter state. `/inspo`'s progressive drill-down filter (gender/texture/style/cuts) silently regressed on the exact same property: a refresh, a copied link, or the back button lost the selection because it lived in plain `useState` only.
- Any filter/facet/drill-down selection that changes what a browse/discovery page shows MUST be reflected in the URL via `router.replace` (never `router.push` for a filter tap, that would pile up a back-history entry per keystroke) the moment it is applied, on EVERY browse surface, not just `/search`.
- Seed the equivalent `useState` from `searchParams.get(...)` on mount, mirroring the write side, so the round trip is complete in both directions.
- A URL param name reused for a different concept elsewhere in the app is its own defect (see Rule 32b / ia-navigation-10 below); pick a disambiguated name instead of the bare word.
- **Fixed 2026-07-27**: `app/[locale]/inspo/page.tsx` now seeds and writes `hairGender`/`hairTexture`/`hairStyle`/`tags` (deliberately not the bare `gender`/`texture` the API call still uses internally, to avoid colliding with `/search`'s own `gender` param).
- Gate: a Playwright check per browse surface that applies a filter, reads `window.location.search`, reloads the page, and asserts the filter UI still shows the applied state.

### Rule 32b: ONE MEANING PER QUERY PARAM NAME (ia-navigation-10, 2026-07-27)
> **INCIDENT**: `/search` uses `category` to mean a bookable service/taxonomy value (`SearchTemplate.tsx:439`); `/inspo` uses the SAME bare param name `category` to mean one of the fixed `DISCOVERY_CATEGORIES` verticals, a genuinely different taxonomy (project memory already names discovery-categories-vs-salon-categories as a documented split that must never be joined directly). The URL layer never inherited that same discipline.
- A URL query parameter name carries exactly ONE meaning across the entire app.
- Once a name is claimed by one route for one concept, no other route may reuse it for a different concept. A second, genuinely distinct concept that needs a similarly-named param gets a feature-scoped or disambiguated name instead (e.g. `hairGender` on `/inspo` vs `gender` on `/search`, added alongside Rule 32a above).
- Enforcement: checklist item when adding a new `searchParams.get(...)` call; grep the param name across `app/**` first to confirm no other route already claims it for a different meaning.

### Rule 33: ROUTER REFRESH FOR COOKIE PREFERENCES
> **INCIDENT**: The language toggle only pushed the URL but did not trigger server-side re-renders, leaving the user with mixed languages.
- When updating structural user preferences stored in cookies (like language or theme) that affect Server Components, you MUST call `router.refresh()` alongside `router.push(newPath)` to force Next.js to reconstruct the server UI with the new context.

---

## I18N Standards

### Rule 33b: NO HARDCODED STRINGS IN UI
- **NEVER** hardcode user-facing text (e.g., `Startseite`, `Buchen`).
- **ALWAYS** use `next-intl`'s `useTranslations()` or `getTranslations()`.
- Untranslated strings should fail the build or trigger a linter warning.
- Ensure the Cookie Banner, 404 pages, and all Layout components use translation contexts.
- **copy-i18n-08 (2026-07-27): `scripts/audit-i18n.js` is retired.** It scanned 24 hardcoded German keywords by substring, was never wired into `npm run lint` or CI, and could not distinguish route strings, table names, or intentional per-locale metadata from user-facing copy. It also could not catch English hardcodes. Do not restore a keyword gate or claim automatic coverage. `scripts/check-i18n-sentinel.mjs` remains a narrow current check for sentinel/TODO keys and a ratcheted identical-to-en count per locale; review the changed render sites and the four locale strings for the broader rule. A structural JSX-copy check remains separate engineering work and needs its own evidence before it is introduced.

### Rule 34: LOCALE-AWARE ROUTING ONLY
- **NEVER** construct URLs manually with hardcoded locales (e.g., `<a href="/de/partner">`).
- **ALWAYS** use the `<Link>` component from the `next-intl/navigation` routing configuration.
- **NEVER** use standard `next/link` or generic `<a>` tags for internal navigation.

### Rule 35: FLUID LAYOUTS FOR TEXT CONTAINERS
- **NEVER** use fixed-width text containers (e.g., `w-48`, `w-64`) that assume English or German word lengths.
- **ALWAYS** use padding (`p-4`, `px-6`) and allow containers to size fluidly, up to a `max-w-*`.
- **Reasoning**: German AND French copy typically run 15-35% longer than English depending on string length (W3C internationalization text-expansion guidance; no single fixed percentage). This rule is not German-specific: `messages/fr.json` alone has 5669+ leaf strings running through the same fixed-height buttons/pills/chips this rule protects. Fixed widths clip translations in any of the three non-English locales, not only German.
- **Fixed-HEIGHT single-line controls (copy-i18n-09, 2026-07-27):** fluid WIDTH does not fix a fixed-height, single-line control (the locked `h-11` button/pill/icon-button row, CLAUDE.md design contract). Before shipping a new button/CTA copy key, verify the LONGEST of the four locale strings against the button's max width: either the button grows to two lines gracefully by design, or the string is measured and does not wrap/clip. Checklist item, not (yet) an automated gate: screenshot each locale's longest CTA string at `h-11` as part of the mockup-first / verifier-loop pipeline (project CLAUDE.md rule 9) before marking a new button copy key done.
- **Reasoning**: translated copy runs longer than English and German adds compound words. Fixed widths clip translations.
- **CORRECTED 2026-07-29, measured on our own corpus (5,671 real string pairs across `messages/*.json`), replacing the old "German is typically 30% longer" figure, which was wrong for us AND named the wrong language:**

  | locale | median vs EN | p90 vs EN |
  |---|---|---|
  | de | 1.10x | 1.60x |
  | **fr** | **1.17x** | **1.72x** |
  | it | 1.14x | 1.58x |

  **French is our longest language, not German**, and the typical case is +10 to +17%, not +30%.
  **Budget to the p90, roughly 1.7x, and test the FRENCH string when checking whether a control fits.**
  Full writing law, including register: `_design-system/COPY_LAW.md`.

### Rule 36: STYLED LOCALE-AWARE 404 PAGES
- The `not-found.tsx` component MUST follow the current design system (see `_tasks/SOLEN_DESIGN.md`). Note: the previous Zone 1/2/3/4 language is retired.
- **There is exactly ONE 404 experience for the whole app** (`app/[locale]/not-found.tsx`, LOCKFILE §15.3). Every `not-found.tsx` in the route tree, including the ROOT `app/not-found.tsx` (which sits above the `[locale]` segment and has no route params or `NextIntlClientProvider` of its own), MUST render that same design, not a hand-rolled, hardcoded variant.
- **INCIDENT (ia-navigation-02, found 2026-07-26, fixed 2026-07-27)**: `app/not-found.tsx` still shipped the superseded icon-disc layout with hardcoded German copy (an em dash, no `useTranslations`) while `app/[locale]/not-found.tsx` had long since moved to the i18n'd gradient-404. Nothing scanned the app root, so the stale duplicate sat unexamined. Fixed by having the root file derive its locale from the `x-pathname` header (same pattern `app/layout.tsx` uses for `<html lang>`) and render `app/[locale]/not-found.tsx` directly, wrapped in its own `NextIntlClientProvider`, instead of duplicating markup.
- Enforcement: the drift-checker's route inventory must include `app/not-found.tsx` and every `app/**/not-found.tsx`, not only `app/[locale]/**`; a one-line diff check between any two `not-found.tsx` files in the tree catches a re-drift immediately.

### Rule 37: FEATURE PROMPT COPY MUST BE TRANSLATED
- When a feature request includes specific German copy (e.g., "Teile deine Praferenzen"), **NEVER** hardcode it into the component.
- **ALWAYS** treat it as a placeholder for a translation key and add it to the `messages/de.json`, `en.json`, `fr.json`, and `it.json` files.
- Feature roadmaps must explicitly include a step to add these translation keys.

### Rule 38: FEATURE HIDING VIA FEATURE FLAGS
- When a feature (like a category or a popup) needs to be "removed for now" but the backend remains, **ALWAYS** use `lib/feature-flags.ts` (or equivalent boolean toggles) instead of deleting the code.
- This ensures the UI can be safely hidden without destroying the underlying infrastructure.

### Rule 38b: DASHBOARD AND ADMIN I18N
- Everything in `components/dashboard/` MUST be translated. Even if it is an "internal" admin tool or configuration component, we support multi-lingual salon owners and staff.
- Admin metrics, configuration labels, table headers, and placeholders must use `useTranslations("namespace")` and use translation keys rather than hardcoded German text.

### Rule 39: AI-GENERATED CONTENT LOCALIZATION & GROUNDING
- **Localization:** Whenever using Gemini or other LLMs to generate user-facing copy (e.g., AI recommendations, descriptions), you **MUST** pass the current `locale` to the prompt so the output matches the UI language. Do not assume German. Hardcoded copy generated by the AI must map to valid `next-intl` translation keys or be explicitly generated in the user's language.
- **Grounding (No Hallucinations):** For explainable AI features, the LLM must be strictly prompted to *only* use provided user context (e.g., booking history) to generate reasons. Never allow the LLM to invent past interactions.

### Rule 40: NO SENTINEL/TODO KEYS IN messages/*.json (copy-i18n-01, 2026-07-27)
> **INCIDENT**: `refundFlow._todo_translate: true` sat live in `messages/de.json`/`fr.json`/`it.json` for 7+ weeks. It was invisible to typecheck, lint, and the invariants script because a boolean/non-string leaf value in a JSON message tree is not a type or lint error, and 261 of 264 keys in the namespace were byte-identical English placeholders the whole time, shipping a fully English refund/dispute flow to German, French, and Italian users.
- **NEVER** leave a non-string leaf value (a boolean/number sentinel like `_todo_translate: true`) in any `messages/*.json` namespace. A message tree may only contain strings at the leaves.
- A namespace may not ship customer-facing (reachable outside `app/[locale]/dev/**`) until every locale's string differs from the English placeholder, or the identical string is genuinely locale-invariant (a brand name, a code, a number) rather than an unfinished translation.
- **Enforced by `scripts/check-i18n-sentinel.mjs`** (wired into `.github/workflows/quality.yml`'s `i18n` job): hard-zero on any non-string leaf; ratchets the identical-to-en string count per locale against a checked-in baseline so a newly added untranslated namespace fails CI instead of shipping silently.
