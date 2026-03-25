# Roadmap B — Filter Pills: Per-Page Integration

> **Scope**: Replace all scattered filter pill implementations across Solen pages with `<FilterBar>`, injecting the correct `zone` prop per page.
> **Prerequisite**: Roadmap A (`roadmap-filter-pills-A-infrastructure.md`) must be 100% complete and built successfully. Do not start this roadmap if `FilterBar` does not exist in `components/ui/`.

---

## R1 — Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 — Last-Minute | 🟡 MEDIUM | Booking slots filtering | Keep existing `activeFilters` state shape exactly the same when swapping UI component |
| Phase 2 — Search / Discover | 🟡 MEDIUM | Map/Grid split view layout | Ensure `FilterBar` uses `relative` or `sticky` without breaking the grid flexbox |
| Phase 3 — Category Pages | 🟡 MEDIUM | Category page rendering | Ensure imports are correct and `zone={2}` is explicitly passed |
| Phase 4 — Nail Discover | 🟡 MEDIUM | Feed rendering | Same as Phase 3, but `zone={1}` |
| Phase 5 — Dead Code Removal | 🔴 HIGH | Other undocumented pages | Only delete code if `grep` confirms 0 remaining usages |

---

## R2 — Phase Split

All phases in this roadmap are 🤖 **Claude Code only**. No manual dashboard steps required.

---

## 🤖 Phase 1 — Last-Minute Page [MODIFY `app/[locale]/last-minute/page.tsx`]

**What**: Replace existing chip filters with `<FilterBar zone={1} />`. This is Zone 1 (maximalist), so animations and glass are allowed.

### R5 — File
`[MODIFY] app/[locale]/last-minute/page.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — replace old sub-components with FilterBar
import FilterBar from '@/components/ui/FilterBar';

// Ensure data matches FilterPill type from lib/types.ts
const lastMinutePills: FilterPill[] = [
  { id: 'nails', label: 'Nails', subFilters: [{ id: 'acryl', label: 'Acryl' }] },
  // ... rest of pills
];

<FilterBar
  pills={lastMinutePills}
  activeFilters={activeFilters}
  onFilterChange={setActiveFilters}
  zone={1} // MANDATORY Rule 31 prop
  className="mb-6"
/>
```

```tsx
// ❌ DON'T — forget the zone prop or pass the wrong zone
<FilterBar pills={pills} activeFilters={activeFilters} onFilterChange={fn} zone={3} /> // WRONG: Last-Minute is Zone 1, not 3.
```

> ⚠️ **BE CAREFUL**:
> - The component relies on `activeFilters` being exactly the `ActiveFilter[]` type from `lib/types.ts`. You may need to map the old state (array of strings) to the new state (array of objects with `pillId`, `subId`, `label`).
> - Do not change the data fetching logic for slots — only change the state mapping that filters the existing `slots` array.

### R7 — Verification & Commit
```bash
npm run build 2>&1 | tail -5
# Must compile successfully

git add app/\[locale\]/last-minute/page.tsx
git commit -m "feat(last-minute): integrate universal FilterBar component (zone 1)"
```

---

## 🤖 Phase 2 — Search / Discovery Page [MODIFY `app/[locale]/search/page.tsx`]

**What**: Replace search filters. This page is Zone 1 and heavily depends on a split desktop UI.

### R5 — File
`[MODIFY] app/[locale]/search/page.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — sticky filter row
<div className="sticky top-[72px] z-[40] bg-[--bg]/90 backdrop-blur-[8px] py-3 border-b border-s-ink/5">
  <FilterBar pills={searchPills} activeFilters={filters} onFilterChange={setFilters} zone={1} />
</div>
```

```tsx
// ❌ DON'T — break z-index scale (Rule UI_RULES §14)
<div className="sticky top-[72px] z-[999]"> // BAD: z-toast is 70, z-modal is 60. overlay must be 40.
```

> ⚠️ **BE CAREFUL**:
> - The Search page is complex. Only touch the rendering of the category/filter pills. Do NOT accidentally modify the Map rendering or the `pgvector` search integration.
> - Ensure the `top-[72px]` offset matches the `Header` height so it sits cleanly below the main nav on scroll.

### R7 — Verification & Commit
```bash
npm run build 2>&1 | tail -5
# Must compile successfully

git add app/\[locale\]/search/page.tsx
git commit -m "feat(search): integrate universal FilterBar component (zone 1)"
```

---

## 🤖 Phase 3 — Category Pages [MODIFY `app/[locale]/[category]/page.tsx`]

**What**: Update the 6 main category pages (Coiffeur, Nagelstudio, Kosmetik, Massage, Lashes, Barbershop). These are Zone 2.

### R5 — File
`[MODIFY] app/[locale]/coiffeur/page.tsx`
`[MODIFY] app/[locale]/nagelstudio/page.tsx`
`[MODIFY] app/[locale]/barbershop/page.tsx`
*(plus lashes, massage, kosmetik if they exist)*

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — ensure zone is 2 for all category routes
<FilterBar
  pills={categorySpecificPills}
  activeFilters={activeFilters}
  onFilterChange={setActiveFilters}
  zone={2}
  className="mb-8"
/>
```

```tsx
// ❌ DON'T — apply Zone 1 to category pages
<FilterBar zone={1} /> // WRONG: Category landing pages are Zone 2.
```

> ⚠️ **BE CAREFUL**:
> - Each category needs its own specific `pills` array (e.g., hair has "Balayage", nails has "Shellac"). Do not try to share a single array. Keep the data definitions inside the page files for now.

### R7 — Verification & Commit
```bash
npm run build 2>&1 | tail -5
# Must compile successfully

git add app/\[locale\]/*/page.tsx
git commit -m "feat(categories): integrate universal FilterBar component (zone 2) across all vertical pages"
```

---

## 🤖 Phase 4 — Discover Feeds [MODIFY `app/[locale]/discover/page.tsx`]

**What**: Update the Pinterest-style social feed (main). These are Zone 1.

> ⚠️ **COLLISION FIX (2026-03-25):** `app/[locale]/discover/nails/page.tsx` was converted to a `permanentRedirect()` stub by `roadmap-discover-unified-tabs.md`. Do NOT modify it. Only modify `discover/page.tsx`. Place `<FilterBar>` BELOW the existing `<CategoryTabBar>` — they serve different purposes (category switching vs. sub-filters).

### R5 — File
`[MODIFY] app/[locale]/discover/page.tsx`

### R4 — ✅ DO / ❌ DON'T

```tsx
// ✅ DO — use zone 1 for Pinterest feeds, place BELOW CategoryTabBar
<CategoryTabBar ... />
<FilterBar pills={discoverPills} activeFilters={filters} onFilterChange={setFilters} zone={1} />
```

> ⚠️ **BE CAREFUL**:
> - The discover feed has an infinite scroll masonry layout. Ensure replacing the filter component doesn't break the masonry wrapper by adding unexpected `overflow: hidden` to parent containers.

### R7 — Verification & Commit
```bash
npm run build 2>&1 | tail -5
# Must compile successfully

git add app/\[locale\]/discover/page.tsx
git commit -m "feat(discover): integrate universal FilterBar component (zone 1) on feeds"
```

---

## 🤖 Phase 5 — Dead Code Removal [DELETE old components]

**What**: Remove the old, scattered filter implementations now that the universal component is live everywhere.

### R5 — File
`[DELETE] components/ui/CategoryChip.tsx` (or whatever the old names are)

### R4 — ✅ DO / ❌ DON'T

```bash
// ✅ DO — grep for 0 usages before running rm
grep -rn "CategoryChip" app/ components/ --include="*.tsx"
# Expected: 0 results -> safe to delete target file
```

```bash
// ❌ DON'T — delete without checking
rm components/ui/CategoryChip.tsx
# BAD: What if the dashboard was still using it? Hard crash.
```

> ⚠️ **BE CAREFUL**:
> - Only delete files that are completely unused. If an old chip component is used in the dashboard (Zone 4) and you haven't replaced it yet, **leave it alone**.
> - Trust the `grep` results above all else.

### R7 — Verification & Commit
```bash
npm run build 2>&1 | tail -5
# Must compile successfully

git add -A
git commit -m "refactor(filters): remove deprecated category chip components"
```

---

## R6 — Dependency Ordering Table

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Last-Minute integration | Roadmap A |
| Phase 2 | 🤖 | Search integration | Roadmap A |
| Phase 3 | 🤖 | Category Pages integration | Roadmap A |
| Phase 4 | 🤖 | Discover Feeds integration | Roadmap A |
| Phase 5 | 🤖 | Dead Code cleanup | Phases 1–4 |

---

## R8 — CLAUDE.md Update

No CLAUDE.md update is strictly required for this roadmap, as the components were already documented in Roadmap A, Phase 6. However, it's good practice to verify the components are listed under `components/ui/` in Section 3.2.

---

## Final Smoke Test

```bash
# 1. Build clean:
npm run build 2>&1 | tail -5
# Expected: "✓ Compiled successfully"

# 2. No type errors:
npx tsc --noEmit
# Expected: 0 errors

# 3. Verify no Zone violations in new integrations:
grep -rn "<FilterBar" app/ components/ --include="*.tsx" | grep -v "zone="
# Expected: 0 results (every instance MUST pass a zone prop)

# 4. Live site still works:
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Expected: 200 or 307
```
