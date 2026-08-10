<!-- exists-check: net-new. Read _rules/CODE_SAFETY.md (Rule 14's "Lighthouse: performance > 70,
     accessibility > 90" post-deploy checklist item), _rules/STRUCTURAL_RULES.md,
     _design-system/LOCKFILE.md (the LCP<=2.5s row) and lighthouserc.js (LCP/CLS/TBT CI
     assertions, performance-02). None of them state a BUNDLE-SIZE trigger or track First Load JS
     per route; this file is that missing piece, not a duplicate of any of them. -->

# Performance budget: the bundle-size trigger (fe-09)

> Added 2026-07-27. Context: at pre-launch scale (~28 salons), building a full bundle-budget
> CI gate is premature machinery, the SCALE DISCIPLINE constraint is right to warn against
> spending build/CI time on a problem that isn't biting. But "premature" was an ASSUMPTION,
> never checked against a real number, so nobody would have noticed the day it stopped being
> true. It already is: see "Current measured state" below, checked the day this file was
> written, not assumed.

## The trigger (unchanged from the original proposal)

`next/dynamic` (with `ssr:false` where the content isn't needed for SEO) becomes MANDATORY for
any component not needed at first paint (a map, a chart library, a rich editor, an admin-only
panel) once EITHER:
- any customer route's First Load JS exceeds **200KB gzipped**, OR
- Lighthouse mobile performance drops below the **70** floor `_rules/CODE_SAFETY.md` Rule 14
  already cites.

Until either threshold is crossed on a given route, ad hoc `next/dynamic` use on that route (7
files use it today, opportunistically) does not need to become a blanket policy for that route.

## Current measured state (2026-07-27, real `next build`, not assumed)

`npm run build`'s own output already reports First Load JS per route gzipped (confirmed by
comparing the reported "46.6 kB" shared-chunk figure against `gzip -c
.next/static/chunks/31684-*.js | wc -c` = 46758 bytes, an exact match). No new tooling was
needed to check this, which is itself part of the finding: nothing was watching a number Next.js
was already printing on every build.

| Route | First Load JS (gzipped) | vs 200KB trigger |
|---|---|---|
| `/[locale]` (home) | **862 kB** | 4.3x over |
| `/[locale]/salon/[slug]` (PDP) | **901 kB** | 4.5x over |
| `/[locale]/[city]/[category]`, `/coiffeur`, `/barbershop` | 376 kB | 1.9x over |
| `/[locale]/search` | 376 kB | 1.9x over |
| `/[locale]/inspo` | 359 kB | 1.8x over |
| `/[locale]/booking-action` | 166 kB | under |
| `/[locale]/salon/[slug]/gift-card` | 104 kB | under |

**The trigger has already fired**, on the two highest-traffic customer routes (home, salon PDP)
by more than 4x. This corrects the original finding's "expect, not verified" confidence: the
premise that a budget is still premature at this scale was an assumption, and the assumption was
wrong for these two routes specifically. It is still true for the smaller, less-visited routes
in the table above (booking-action, gift-card), so this is not a blanket "add heavyweight perf
tooling everywhere" conclusion, exactly the class of overcorrection the SCALE DISCIPLINE
constraint warns against; it is two specific routes that need real attention.

## What this means going forward

1. **New code on `/[locale]` or `/salon/[slug]`**: any component added to either route's render
   tree that is not needed for the first paint (a map, a chart, an admin-only panel, a modal
   only opened on click) MUST use `next/dynamic` (`ssr:false` unless the content is
   SEO-relevant). This is no longer optional guidance for these two routes, the trigger fired.
2. **Existing bloat on those two routes is TRACKED, not silently fixed by this pass.** Finding
   the actual contributors requires `ANALYZE=true npm run build`'s treemap
   (`@next/bundle-analyzer`, already wired in `next.config.mjs` per performance-08) and is a
   real decomposition task, not a doc change, logged as its own item in
   `_tasks/INCOMPLETE_FEATURES.md` rather than attempted inline here.
3. **Re-check this table on the next performance pass.** `npm run build`'s own output is the
   source of truth (grep the `First Load JS` column for the routes above); no new tooling
   required.

## Enforcement

Doc-only for the smaller under-200KB routes (per the original trigger design). For the two
routes that have already crossed it (home, salon PDP), the rule above is binding on new work
starting now. A future CI step could grep `next build`'s own output for these named routes
against the 200KB baseline (Next.js already prints the number; no new tooling needed to start
watching it), the same ratchet shape as the lint/select-star/duplication census jobs in
`.github/workflows/quality.yml`.
