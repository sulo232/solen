> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Master Spec: Solen Homepage V6 & Search Redesign (V3_ULTRA_DETAILED)

> **Status**: Ready for Execution
> **Priority**: P0 — live production homepage
> **Zone**: Discovery / Homepage (Zone 1) - Requires premium glassmorphic, high-conversion visual design.

This is the ultimate, hyper-detailed instruction manual for Claude Code. It contains literal code snippets, strict file references, and specific component behaviors that must be copied perfectly to achieve the Airbnb-style V6 interface.

---

## 🚨 R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Search Routing | 🔴 HIGH | Global Navigation | Do not touch `GuidedSearch.ts`'s `navigate()` string interpolation logic. Just wrap it in a category check. |
| Phase 2: Category Bubble-Up | 🟡 MEDIUM | React Hydration Crash | You MUST wrap `localStorage` checks inside `useEffect()` and use a `[isMounted]` flag. |
| Phase 3: Skeletons & Layout | 🟡 MEDIUM | Severe CLS (Layout Shift) | Skeletons must physically mirror `SalonCard.tsx` padding, gap, and exactly `aspect-[20/19]`. |

---

## 🤖 CLAUDE CODE PHASES (STRICT EXECUTION RULES)

### Phase 1: Search Flow Validation & Navigation (GuidedSearch)
**Target**: `components/ui/GuidedSearch.tsx`

**Requirement 1**: The user MUST pick a category before the "Search" button works.
✅ **DO**:
```tsx
// Inside GuidedSearch trigger or submit modal:
<button 
  onClick={() => category ? navigate() : open(1)} 
  className="flex items-center..."
>
```

**Requirement 2**: Empty "Wo" (City) fallback routing. 
If the user selects a Category but leaves City blank, `navigate()` must route to the **nationwide category page** (e.g. `/${locale}/${category}`). 
*Check the existing `navigate()` function and ensure this path resolves correctly if `city` is null.*

**Requirement 3**: Vertical Step 1 List. Replace the old icon grid with:
```tsx
<button className="flex items-center gap-3 py-3.5 border-b border-[#F5F5F5]">
  <div className="w-10 h-10 rounded-xl bg-[#F5F0EB]"><Icon className="text-s-coral" /></div>
  <span className="font-heading font-bold text-s-ink">Category Name</span>
</button>
```

---

### Phase 2: Full Airbnb-Style Salon Cards
**Target**: `components/SalonCard.tsx` (And update `lib/types.ts` `SalonCard` if needed)

**Requirement 1**: Aspect Ratios. The image container MUST be:
```tsx
<div className="relative w-full aspect-[20/19] md:aspect-square overflow-hidden rounded-xl">
```

**Requirement 2**: Postal Code Injection. Add `postal_code` to the DOM next to the address.
✅ **DO**:
```tsx
<p className="text-[14px] text-s-ink/60 font-body truncate">
  {salon.postal_code ? `${salon.postal_code} ` : ""}{salon.address}
</p>
```
❌ **DON'T**: Do not use the `quartier` field alone. Pull `postal_code` directly from the database model payload.

**Requirement 3**: `$ / $$ / $$$` Price Logic. 
Render this dynamically based on `salon.min_price` (or `avg_price`):
```tsx
const priceToShow = salon.min_price ?? salon.avg_price;
const priceTier = priceToShow == null ? "$$" : priceToShow < 40 ? "$" : priceToShow <= 80 ? "$$" : "$$$";

// In JSX:
<span className="font-medium text-s-ink">{priceTier}</span>
```

**Requirement 4**: Swiping Carousel & Pagination.
✅ **DO**: Native CSS snap container with `overflow-x-auto snap-x snap-mandatory scrollbar-hide`. 

---

### Phase 3: Category Carousels, Typography & City Jump Routing
**Target**: `components/ui/CityCarouselSection.tsx` & `components/HomePage.tsx`

**Requirement 1**: Rendering the Carousels.
The Homepage MUST render a horizontally scrolling carousel array for each category (Entdecken, Coiffeur, Nagel, etc.). Do not break or remove the existing `CityCarouselSection` mapping. 
✅ **DO**: Map over the `orderedSectionKeys` and render a `CityCarouselSection` containing the `SalonCard` components for that category.

**Requirement 2**: Typography Matching. 
The title of each Category Section (e.g., "Coiffeur") MUST match the "Finde deine Inspiration" font precisely.
✅ **DO**: `font-heading font-extrabold text-[clamp(24px,3.5vw,42px)] tracking-[-0.02em]`

**Requirement 3**: Click Target Routing. 
When the user clicks the Category Title Text OR the "Alle ansehen" (View All) link on the carousel, apply this logic:
```tsx
// If user has a persisted city in cookies/localStorage, route to city-specific:
const href = persistedCity ? `/${locale}/${persistedCity}/${categoryKey}` : `/${locale}/${categoryKey}`;
```

---

### Phase 4: Skeletons & CLS Prevention
**Target**: `components/ui/CategorySkeleton.tsx` (Create this file)

**Requirement**: Strict Dimension Parity.
```tsx
// CategorySkeleton.tsx MUST match SalonCard's shell:
<div className="w-[280px] md:w-[320px] shrink-0">
  {/* The Image Box */}
  <div className="w-full aspect-[20/19] md:aspect-square bg-s-ink/5 animate-pulse rounded-xl mb-3" />
  
  {/* The Text Rows */}
  <div className="h-5 w-3/4 bg-s-ink/5 animate-pulse rounded-md mb-2" />
  <div className="h-4 w-1/2 bg-s-ink/5 animate-pulse rounded-md" />
</div>
```

---

### Phase 5: Dynamic LocalStorage Ranking (Bubble-Up)
**Target**: `hooks/useRecentVisits.ts` & `components/HomePage.tsx`

**Requirement**: 
1. `useRecentVisits` hook must read `solen_last_category` and `solen_last_salon_id` from `localStorage`.
2. In `HomePage.tsx`, slice and shift the `orderedSectionKeys` array so the last visited category comes **immediately after** the 'Entdecken' section.
3. Within that specific category's `catSalons` array, find the salon matching `solen_last_salon_id` and `unshift()` it to index 0 so it appears first.

> ⚠️ **BE CAREFUL**: Because `localStorage` is completely empty on the server (SSR), returning the modified array immediately will throw a React hydration mismatch error. 
✅ **DO**: Wait for `useEffect` to set a `[isMounted, setIsMounted]` flag to `true` before sorting the arrays. If `!isMounted`, render the default order.

---

## R6: DEPENDENCY ORDERING TABLE

| Phase | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Search Validation & Fallbacks | Nothing |
| Phase 2 | 🤖 | Airbnb Card Details (Postal, $$$, Aspect) | Nothing |
| Phase 3 | 🤖 | Typography & Fallback Links | Phase 2 |
| Phase 4 | 🤖 | Strict Skeleton Loaders | Phase 2 |
| Phase 5 | 🤖 | LocalStorage Dynamic Sorting | Nothing |

---

## R7: VERIFICATION STEPS
- [ ] Run `npm run typecheck` to ensure adding `postal_code` to `SalonCardProps` doesn't break.
- [ ] Render the homepage with network throttled to 3G. Verify the `CategorySkeleton` does not shift layout when real cards load.
- [ ] Click "Nails" text -> verify it jumps to `/de/ch/nails` (or city equivalent).
- [ ] Check a salon card price. If `min_price=35`, it should render `$`. If `min_price=120`, `$$$`.
