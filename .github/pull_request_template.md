<!--
  Follow DESIGN_SYSTEM.md. If this PR touches components/ or app/globals.css,
  the Design Review section below is mandatory.
-->

## Summary

<!-- One or two sentences: what changed and why. -->

## Test plan

- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes (zero new type errors)
- [ ] Manual check on the affected page(s)

## Performance (only if this PR touches caching or claims a speed win)

- [ ] **New cache layer** (`unstable_cache`, Redis, a materialized view, an extended CDN TTL): paste the measured number that justifies it below (an `EXPLAIN ANALYZE` time for a DB-bound case, a real p95 for a network-bound case). No number = premature, per `_backend-system/LAW.md` section 13.
- [ ] **Claims a performance improvement** (faster, fewer queries, fewer round trips, smaller bundle): paste the before-number and after-number, with units, below.

<!-- Measured number(s): -->

## Design Review (mandatory for any `components/` or `app/globals.css` change)

- [ ] Reviewed `DESIGN_SYSTEM.md` §0 (USE THIS, DON'T REBUILD) — no duplicate components created
- [ ] Colors use design tokens only (`s-coral`, `s-ink`, etc.) — no arbitrary hex, no Tailwind defaults
- [ ] Durations ≤300ms on UI; easing is `--ease-out` (or `ease-[cubic-bezier(0.16,1,0.3,1)]`); no `transition-all`
- [ ] Every pressable element has `active:scale-[0.97]` (including cards and pills)
- [ ] Modals: 180ms opacity + scale 0.96→1; **no springs on modals**
- [ ] No `img-hover-zoom` alongside card lift (pick one)
- [ ] Image aspect ratios locked per `DESIGN_SYSTEM.md` §9 (salon cards = `aspect-square`)
- [ ] All user-facing text uses `useTranslations()` in all 4 locales (de/en/fr/it)
- [ ] Accessibility: 44×44px touch targets, `aria-label` on icon buttons, focus ring at full opacity

### Screenshots (required if `components/` changed)

- [ ] Mobile (375px)
- [ ] Desktop (≥1280px)
- [ ] Dark mode

<!-- Paste screenshots below. -->

### Forbidden-pattern grep (paste output — expected: 0 hits)

```
grep -rn "text-\[#\|bg-\[#\|text-gray-\|active:scale-\[0\.98\]\|transition-all\|duration-500\|img-hover-zoom\|E8735A" <changed files>
```

<!-- Output: -->
