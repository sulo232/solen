# Homepage Issues 4A-4H Roadmap

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Visual styling (Spacing, Hovers, Arrows, Icons, Empty State) | Confirm mobile layout limits, test hover states |
| Phase 2 | 🟡 MEDIUM | Search Bar overflow interactions | Verify date/dropdown components are fully visible on mobile |
| Phase 3 | 🔴 HIGH | Supabase migration for `is_top_pick` column | Local schema verification before deploying migration |
| Phase 4 | 🟡 MEDIUM | Live Stats API fetching | Add graceful fallback to show 0/empty instead of crashing |

## 🧑 MANUAL PHASES
None — all fixes are code updates, including SQL migrations via `supabase db push`.

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: UI Polish (Spacing, Cards, Hover & Empty States)

> **Goal:** Fix layout inconsistencies, enforce safe empty state handling, and standardize card hovers across `components/HomePage.tsx`.

#### [MODIFY] `components/HomePage.tsx`
- **4B (Spacing Standard):** Unify padded section containers to `py-16 md:py-24` (or `py-12 md:py-16`) instead of mixed sizes. (UI_RULES §19a 8pt grid).
- **4D (Empty State):** Remove raw emoji combinations in the "Noch keine Salons" message. Use the `<EmptyState>` component with `illustration="coming-soon"` and human message: "Wir wachsen gerade — bald mehr Salons in deiner Nähe".
- **4F (Card Inconsistency):** Uniformly apply `hover:-translate-y-[5px] hover:shadow-card-hover` to all salon cards so they match Amara's interactive lift.
- **4G (Category Hover Color):** Fix the CSS structure for the Category icons so they don't revert to dull gray on hover, but rather keep their respective accent color tint. Keep the Icons! Don't implement gradient tiles. 
- **4H (Alle ansehen):** Standardize all small chevron links ("Alle ansehen →") into consistent `text-s-ink/60 border border-s-ink/10 rounded-btn` (or equivalent) text button patterns.

✅ **DO:**
```tsx
// 4F: Apply UI_RULES §4 standard hover mechanics
<div className="rounded-card hover:-translate-y-[5px] hover:shadow-card-hover transition-all duration-[250ms]">

// 4D: Safe empty state without emojis per CLAUDE.md Rule 15
<EmptyState illustration="coming-soon" message="Wir wachsen gerade — bald mehr Salons in deiner Nähe" />
```

❌ **DON'T:**
```tsx
// 4D: NO text emojis in empty states (Violation of UI_RULES §5)
<div className="text-center">Noch keine Salons 🥲</div>

// 4F: NO scaling on cards (Violation of UI_RULES §4)
<div className="hover:scale-[1.02]">
```

> ⚠️ **BE CAREFUL**: Confirm standard text button classes match any existing `<TextButton>` or standard link utility strings. Verify you aren't stripping `<a>` or `<Link>` functional tags when standardizing 4H arrows.

---

### Phase 2: Search Bar Mobile Clipping (4A)

> **Goal:** Resolve the search bar container getting cut off visually on mobile.

#### [MODIFY] `components/ui/HomeSearchBar.tsx` (or `HomePage.tsx`)
Investigate the search container. Currently `overflow: hidden` clips its content on mobile. Remove `overflow-hidden` or change it to `overflow-x-hidden overflow-y-visible` specifically on mobile so that internal segmented buttons and date dropdowns aren't clipped. Add consistent horizontal padding.

✅ **DO:**
```tsx
// Use relative wrappers with valid overflow scopes
<div className="relative rounded-[18px] sm:overflow-hidden overflow-visible px-4">
```

❌ **DON'T:**
```tsx
// Generic hidden completely cuts off date popups on standard responsive viewports
<div className="rounded-[18px] overflow-hidden">
```

> ⚠️ **BE CAREFUL**: Removing `overflow-hidden` might expose border radius rendering gaps on internal child corners in Safari. Re-apply respective border radii to the specific corner segments if needed instead of using a parent clip. Verify real dimensions in mobile layout.

---

### Phase 3: "Top Pick" Badge Integration (4E)

> **Goal:** Remove hardcoded "Solen Top Pick" logic. Introduce `is_top_pick` to Supabase `salons` schema and provide UI for both Admins & Salon Owners to toggle it.

#### [NEW] `supabase/migrations/xxxxxx_add_top_pick.sql`
Add a boolean column `is_top_pick` to `salons` table, defaulting to `false`.

#### [MODIFY] `components/SalonCard.tsx` (and `HeroVisualCard.tsx`)
Instead of a stationary mocked tag, dynamically check `salon.is_top_pick`.
Keep the color standardized to `bg-s-yellow-subtle text-s-yellow-text` per `UI_RULES.md §2`. Do NOT use teal!

#### [MODIFY] `app/[locale]/dashboard/(admin/salon)/settings/page.tsx`
Add a toggle input for the "Solen Top Pick" designation. Update the API update route to persist changes to the database.

✅ **DO:**
```tsx
{salon.is_top_pick && (
  <span className="bg-s-yellow-subtle text-s-yellow-text px-2.5 py-1 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.08em]">
    Solen Top Pick
  </span>
)}
```

❌ **DON'T:**
```tsx
// Banned legacy color implementation
<span className="bg-teal-500 text-white">Top Pick</span>
```

> ⚠️ **BE CAREFUL**: Ensure the schema migration matches EXACTLY your database deployment process. Don't omit exposing this variable in shared `<SalonCard>` Typescript interfaces `lib/types.ts`. 

---

### Phase 4: Dynamic Stats Component (4C)

> **Goal:** Remove the mock `247 Buchungen` numerical stat hardcode to prevent contradicting live values like `0 + Salons`.

#### [MODIFY] `components/ui/HeroVisualCard.tsx`
If the floating card continues to show "247 Buchungen diese Woche", convert it to fetch from the actual API route containing real platform data (e.g. `api/stats`). 
If a real endpoint does not exist for this metric, gracefully remove the hardcode or clearly mark it functionally as an illustration wrapper (`~`).

#### [MODIFY] `components/ui/SocialProofStrip.tsx`
Ensure "0 + Salons in Basel" properly hooks into Supabase's `{data: salons, count} = await supabase.from('salons')` API lookup.

✅ **DO:**
```tsx
// Use `next-intl` properly formatted dynamic output or real lookup metrics
<div className="font-display text-[44px] leading-none text-s-coral">{liveBookingCount || "~ 250"}</div>
...
<div>{totalSalons > 0 ? totalSalons : "0"} Salons in Basel</div>
```

❌ **DON'T:**
```tsx
// Banned per CLAUDE.md Rule 32 
<div>247 Buchungen diese Woche</div>
```

> ⚠️ **BE CAREFUL**: The API endpoints fetching statistics should utilize proper server caching (`next: { revalidate: 3600 }`) to prevent excessive database hits on the primary homepage render.


---

## Execution Order Summary

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | UI Polish (Spacing, Hovers, Empty State) | Nothing |
| Phase 2 | 🤖 | Search Bar Fix | Nothing |
| Phase 3 | 🤖 | Top Pick DB Toggle | Supabase connection |
| Phase 4 | 🤖 | Live Data / Stats Updates | DB data integrity |

> **IMPORTANT ROADMAP INSTRUCTION:**
> **Before running ANY git commits, verify via `npm run build && npx tsc --noEmit` and check all referenced files.**
