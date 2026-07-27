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
- **copy-i18n-08 (2026-07-27): `scripts/audit-i18n.js` retired, not replaced with a working gate.** It scanned for 24 hardcoded German keywords by substring, was never wired into `npm run lint` or CI (grep confirms zero references), and unconditionally `process.exit(0)`'d even on a hit ("Don't fail the build, just warn"). Live run returned 2211 violations, the overwhelming majority false positives (route strings, Supabase `.from("salons")` table names, and the site's inline per-locale SEO metadata objects like `{ de: "...", en: "...", fr: "...", it: "..." }` in `app/[locale]/[city]/[category]/page.tsx`), too noisy to triage even manually. It also could not catch English hardcodes (only recognized German words), which is exactly the failure mode copy-i18n-04 found live (ternary-hardcoded "Salon"/"Salons" in customer components). A genuine replacement needs a structural (AST-based) check, any JSX text node or string literal in a DOM/React text position that is not the argument of `t(...)`/`useTranslations`/`getTranslations` and is not inside `app/[locale]/dev/**`, which is real engineering work (a TS/Babel AST traversal, tuned against false positives) rather than a keyword regex, and is not done here. Until that exists, rely on the two narrower, precise gates that ARE wired: `~/.claude/hooks/copy-lint-gate.py`'s `NO-HARDCODED-PLURAL-TERNARY` check (copy-i18n-04, catches the count-ternary shape) and `scripts/check-i18n-sentinel.mjs` (copy-i18n-01, catches sentinel/TODO keys and a ratcheted identical-to-en count per locale).

### Rule 34: LOCALE-AWARE ROUTING ONLY
- **NEVER** construct URLs manually with hardcoded locales (e.g., `<a href="/de/partner">`).
- **ALWAYS** use the `<Link>` component from the `next-intl/navigation` routing configuration.
- **NEVER** use standard `next/link` or generic `<a>` tags for internal navigation.

### Rule 35: FLUID LAYOUTS FOR TEXT CONTAINERS
- **NEVER** use fixed-width text containers (e.g., `w-48`, `w-64`) that assume English or German word lengths.
- **ALWAYS** use padding (`p-4`, `px-6`) and allow containers to size fluidly, up to a `max-w-*`.
- **Reasoning**: German copy is typically 30% longer than English and features extensive compound words. Fixed widths clip translations.

### Rule 36: STYLED LOCALE-AWARE 404 PAGES
- The `not-found.tsx` component MUST follow the current design system (see `_tasks/SOLEN_DESIGN.md`). Note: the previous Zone 1/2/3/4 language is retired.

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
