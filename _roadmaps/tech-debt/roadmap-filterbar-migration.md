# Roadmap: SearchFilterBar → Grouped FilterBar Migration

> **Goal:** Replace the infinite-scroll `SearchFilterBar.tsx` (296 lines, 15+ pills in one row) with the new grouped `ui/FilterBar.tsx` that has MAX_VISIBLE=5, mobile bottom sheet, and desktop overflow drawer.

## BEHAVIOR RULES
- Read `CLAUDE.md` (Section 3.3, Rules 42-44) and `_rules/UI_RULES.md` before starting.
- Zone 3 for filter bars on category/list pages — NO glassmorphism, NO entry animations.
- All button/pill labels MUST use `useTranslations('filters')`.
- `npm run build` after EVERY phase. Do not proceed if build fails.
- One `git commit` per phase.

---

## R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — new utility file | — |
| Phase 2 | 🟡 MEDIUM | Filter URL params on last-minute page | Test params still update URL correctly |
| Phase 3 | 🟡 MEDIUM | Filter URL params on behandlungen pages | Same — verify URL state |
| Phase 4 | 🟡 MEDIUM | Broken imports if SearchFilterBar still referenced | Grep before deleting |
| Phase 5 | 🟢 SAFE | Nothing — docs only | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Create Search Filter Pill Configuration

**[NEW] `lib/search-filter-pills.ts`**

Create a function that returns grouped `FilterPill[]` for the search/category pages:

```typescript
import type { FilterPill } from '@/lib/types';

export function getSearchFilterPills(t: (key: string) => string): FilterPill[] {
  return [
    {
      id: 'location',
      label: t('location'),
      subFilters: [
        { id: 'grossbasel', label: 'Grossbasel' },
        { id: 'kleinbasel', label: 'Kleinbasel' },
        { id: 'gundeli', label: 'Gundeli' },
        { id: 'st_johann', label: 'St. Johann' },
        { id: 'iselin', label: 'Iselin' },
        { id: 'bruderholz', label: 'Bruderholz' },
        { id: 'breite', label: 'Breite' },
      ],
    },
    {
      id: 'availability',
      label: t('availability'),
      subFilters: [
        { id: 'today', label: t('today') },
        { id: 'tomorrow', label: t('tomorrow') },
        { id: 'custom_date', label: t('pickDate') },
      ],
    },
    {
      id: 'rating',
      label: t('rating'),
      subFilters: [
        { id: '4', label: '4+ ★' },
        { id: '4.5', label: '4.5+ ★' },
      ],
    },
    { id: 'online_payment', label: t('onlinePayment') },
    { id: 'off_peak', label: t('offPeak') },
    {
      id: 'sort',
      label: t('sortBy'),
      subFilters: [
        { id: 'rating', label: t('sortByRating') },
        { id: 'price', label: t('sortByPrice') },
        { id: 'nearest', label: t('sortByNearest') },
        { id: 'newest', label: t('sortByNewest') },
        { id: 'next_slot', label: t('sortByNextSlot') },
      ],
    },
  ];
}
```

✅ DO: Group related filters (all quartiers under "Standort", all dates under "Verfügbarkeit"
❌ DON'T: Put all 15 filters as flat top-level pills — that's why the old one scrolled forever

**Add missing i18n keys to `messages/de.json`, `en.json`, `fr.json`, `it.json`:**
```json
{
  "filters": {
    "location": "Standort",       // EN: "Location",       FR: "Lieu",          IT: "Posizione"
    "availability": "Verfügbar",  // EN: "Availability",   FR: "Disponibilité", IT: "Disponibilità"
    "rating": "Bewertung",        // EN: "Rating",         FR: "Évaluation",    IT: "Valutazione"
    "pickDate": "Datum wählen",   // EN: "Pick a date",    FR: "Choisir une date", IT: "Scegli una data"
    "sortBy": "Sortieren",        // EN: "Sort by",        FR: "Trier par",     IT: "Ordina per"
  }
}
```

**Verification:** `npm run build`
**Commit:** `git commit -m "phase1: create grouped search filter pill config"`

> ⚠️ **BE CAREFUL**: The `FilterPill` and `ActiveFilter` types MUST match what `ui/FilterBar.tsx` expects. Check `lib/types.ts` for the interface definition before writing this.

---

### Phase 2: Replace on Last-Minute Page

**[MODIFY] `app/[locale]/last-minute/page.tsx`**

1. Remove: `import SearchFilterBar from "@/components/SearchFilterBar"`
2. Add: `import FilterBar from "@/components/ui/FilterBar"`
3. Add: `import { getSearchFilterPills } from "@/lib/search-filter-pills"`
4. Add state management for active filters
5. Add `SearchAutocomplete` as separate component above FilterBar
6. Wire ActiveFilter changes to URL params (quartier, sort, rating, date, etc.)

✅ DO:
```tsx
'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FilterBar from '@/components/ui/FilterBar';
import SearchAutocomplete from '@/components/ui/SearchAutocomplete';
import { getSearchFilterPills } from '@/lib/search-filter-pills';
import type { ActiveFilter } from '@/lib/types';

// Inside component:
const t = useTranslations('filters');
const pills = getSearchFilterPills(t);
const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

const handleFilterChange = useCallback((filters: ActiveFilter[]) => {
  setActiveFilters(filters);
  // Sync to URL params...
}, []);

// JSX:
<SearchAutocomplete category={category} />
<FilterBar
  pills={pills}
  activeFilters={activeFilters}
  onFilterChange={handleFilterChange}
  zone={3}
/>
```

❌ DON'T:
```tsx
// Don't use zone={1} — category listing pages are Zone 3 (functional, no glass)
<FilterBar zone={1} />  // ← WRONG
```

**Verification:** Go to `/de/last-minute`, verify pills appear grouped, mobile shows bottom sheet
**Commit:** `git commit -m "phase2: migrate last-minute to grouped FilterBar"`

> ⚠️ **BE CAREFUL**:
> - The page may be a Server Component that renders a Client Component. You may need to extract the filter logic into a Client child component.
> - URL params (quartier, sort, rating, date, accepts_payment, off_peak, min_price, max_price) must continue to work — existing pages filter salon lists based on these params.

---

### Phase 3: Replace on Behandlungen Pages

**[MODIFY] `app/[locale]/behandlungen/[...slug]/page.tsx`**
**[MODIFY] `app/[locale]/behandlungen/[...slug]/TreatmentsClient.tsx`**

Same migration as Phase 2. Replace `SearchFilterBar` with `FilterBar` + `SearchAutocomplete`.

**Verification:** Go to `/de/behandlungen/coiffeur`, verify grouped pills work
**Commit:** `git commit -m "phase3: migrate behandlungen to grouped FilterBar"`

> ⚠️ **BE CAREFUL**: Both `page.tsx` AND `TreatmentsClient.tsx` import SearchFilterBar. You need to update BOTH files. Check which one actually renders the filter — it may be only one.

---

### Phase 4: Delete SearchFilterBar

**[DELETE] `components/SearchFilterBar.tsx`**

Before deleting, verify NO remaining imports:
```bash
grep -rn "SearchFilterBar" app/ components/ --include="*.tsx" --include="*.ts"
```
Expected: 0 results.

If any remain → update them first.

Also remove from `components/index.ts` if exported there.

**Verification:** `npm run build` must pass
**Commit:** `git commit -m "phase4: delete legacy SearchFilterBar.tsx"`

> ⚠️ **BE CAREFUL**: Run the grep BEFORE deleting. If you delete first and something still imports it, the build will fail and you'll need to fix the import blindly.

---

### Phase 5: Update Documentation

**[MODIFY] `CLAUDE.md`** Section 3.3 — Update Filter System entry:
```
- **Filter System**: `<FilterBar>` from `components/ui/FilterBar.tsx` — universal zone-aware grouped filter pill row. Category/list pages use `getSearchFilterPills()` from `lib/search-filter-pills.ts`. Discovery page passes custom pills. MAX_VISIBLE=5 desktop, mobile uses bottom sheet.
```

Remove any mention of `SearchFilterBar` from CLAUDE.md.

**Commit:** `git commit -m "phase5: update docs — SearchFilterBar removed"`

---

## R6: Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Create pill config | Nothing |
| Phase 2 | 🤖 | Migrate last-minute | Phase 1 |
| Phase 3 | 🤖 | Migrate behandlungen | Phase 1 |
| Phase 4 | 🤖 | Delete old FilterBar | Phase 2 + 3 |
| Phase 5 | 🤖 | Update docs | Phase 4 |
