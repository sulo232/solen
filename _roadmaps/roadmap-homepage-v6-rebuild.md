> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

# Solen.ch — Homepage V6 & Search Redesign Roadmap

> **Status**: In progress
> **Priority**: P0 — live production homepage
> **Zone**: Discovery / Homepage (Zone 1) - Requires premium glassmorphic, high-conversion visual design.

---

## 🚨 R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Search & Routing | 🔴 HIGH | Users unable to find salons if fallback routing fails. | Ensure strict null-checks on `city_id` and test the `/de/ch/category` fallback routes. |
| Phase 2: Dynamic Ranking | 🟡 MEDIUM | Hydration mismatch if `localStorage` differs from SSR order. | Use a mounted state (`isLoaded`) to defer rendering or reordering the components until after hydration. |
| Phase 3: Salon Cards | 🟡 MEDIUM | Build failure due to missing Typescript properties (e.g., badges). | Ensure `SalonCardProps` is cleanly updated with optional new badge/ranking fields. |

---

## 💅 Finalized Airbnb UI Decisions & Enhancements

1. **In-Card Image Swipe:** Image carousel with `snap-x snap-mandatory` and exact `aspect-[20/19]` (mobile) or `aspect-square` ratio to match Airbnb exactly. Includes bottom-center pagination dots that update on scroll.
2. **"Open All" Placement:** Textual "See all >" link next to category header AND a final circular card at the end of the carousel scroll. Both route to the nationwide feature page.
3. **Pricing logic (`$ / $$ / $$$`):** ($ = Under 40 CHF avg, $$ = 40-80 CHF avg, $$$ = Over 80 CHF avg). See `docs/superpowers/specs/2026-03-30-airbnb-card-rules.md`.
4. **Badge Verification Rules:** Priority badges overlapping top-left (Guest Favorite > Neu > Top Rated).
5. **Sticky Filter Bar:** The Was/Wo/Wann bar shrinks into a sticky pill header on scroll using Framer Motion.
6. **Micro-interactions (Idea):** Add an `active:scale-[0.97]` click-state and a pristine, exact-dimension shimmer skeleton loader to mirror Airbnb's loading feel perfectly.

---

## 🤖 CLAUDE CODE PHASES

### Phase 1 — Search Flow & Nationwide Fallbacks
**Type:** 🤖 Code
**Files Affected:** 
- `[MODIFY] app/[locale]/page.tsx`
- `[MODIFY] components/ui/GuidedSearch.tsx`

**What:** 
- **Search Requirements:** In the main search bar, the user **must pick a category** ("Was"). 
- **City Fallback:** If the user selects a city ("Wo"), redirect them to that city's version of the category page. If city is left empty ("any"), jump directly to the **nationwide category page**.
- **Filtering:** Once on the nationwide or city category page, users can further refine their results using the main Was/Wo/Wann search bar.

> ⚠️ **BE CAREFUL**:
> Do not let the user submit the search if `category` is empty. Ensure `router.push` uses the correct locale prefix. 

✅ **DO:** Disable the search button or show a toast if category is unselected.
❌ **DON'T:** Send the user to a generic `/search` page without a category.

### Phase 2 — Category Ordering & Skeleton Loading
**Type:** 🤖 Code
**Files Affected:** 
- `[MODIFY] app/[locale]/page.tsx`
- `[MODIFY] components/home/CategorySection.tsx`
- `[NEW] components/ui/CategorySkeleton.tsx`

**What:** 
- Ensure the specific homepage section order is strictly: Entdecken, Coiffeur, Nagel, Barbershop, Makeup, Waxing. Each with Syne heading typography.
- **Skeleton Loading:** Implement a custom skeleton loading state matching the exact dimensions of the Airbnb cards.

> ⚠️ **BE CAREFUL**:
> The skeletons must exactly match the height and width of the fully loaded `CategorySection` to prevent CLS (Cumulative Layout Shift).

✅ **DO:** Use `animate-pulse` and `bg-s-ink/5` for a premium subtle shimmer.
❌ **DON'T:** Use a generic spinning loader or text-only loading state.

### Phase 3 — Dynamic Ranking (Recently Visited Bubble-Up)
**Type:** 🤖 Code
**Files Affected:** 
- `[NEW] hooks/useRecentVisits.ts`
- `[MODIFY] app/[locale]/page.tsx`

**What:** 
- **Category Level:** If a user visits a category (e.g., "Nagel"), that category's carousel auto-moves to the top (after "Entdecken").
- **Salon Level:** The specific salon card the user last visited appears as the **first card** in that carousel.
- Use `localStorage` to track this affinity.

> ⚠️ **BE CAREFUL**:
> Next.js Server Components cannot read `localStorage`. You must use a `useEffect` hook to apply the sort order *after* the initial client paint, avoiding hydration mismatch errors.

✅ **DO:** `const [isMounted, setIsMounted] = useState(false);` then render default ordered items if `!isMounted`.
❌ **DON'T:** Try to read `localStorage` in the top level of the component scope.

### Phase 4 — Airbnb-Style Salon Cards (Rich Details)
**Type:** 🤖 Code
**Files Affected:** 
- `[MODIFY] components/salon/SalonCard.tsx`

**What:** 
- **Badge:** Prominent top-left badge (e.g., Guest Favorite).
- **Carousel:** Implement horizontal `snap-mandatory` scroll container on the image with pagination dots.
- **Metadata:** Show the postal code next to the city/neighborhood (e.g., "8001 Zürich"), inline rating, and `$` / `$$` / `$$$` price tier.

> ⚠️ **BE CAREFUL**:
> Nested scroll areas (carousel inside a vertical page) can trap mobile scrolling if not handled. Use `touch-pan-y` wisely.

✅ **DO:** Use CSS `overflow-x-auto snap-x scrollbar-hide` for hardware-accelerated smooth swiping.
❌ **DON'T:** Import an external heavy library like `react-slick` or `swiper` just for a 5-image card carousel.

### Phase 5 — Permanent Mobile Search Bar in Header
**Type:** 🤖 Code
**Files Affected:** 
- `[MODIFY] components/layout/Header.tsx`

**What:** 
- Make the compact search pill always visible in the mobile header (not scroll-gated), sitting next to the Bookmark icon.
- Remove redundant search bars below the header.

> ⚠️ **BE CAREFUL**:
> Ensure the sticky header doesn't overlap important upper-page content on small screens. Ensure z-indexes are carefully balanced.

✅ **DO:** Use a fixed z-index ceiling, `z-40` or `z-50`.
❌ **DON'T:** Rely on absolute positioning that breaks upon scrolling.

---

## 🧑 MANUAL PHASES

None required for this frontend design update.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Search Flow & Nationwide Fallbacks | Nothing |
| Phase 2 | 🤖 | Category Ordering & Skeletons | Nothing |
| Phase 3 | 🤖 | Dynamic Ranking (Bubble-up) | Phase 2 |
| Phase 4 | 🤖 | Airbnb-Style Salon Cards | Nothing |
| Phase 5 | 🤖 | Permanent Mobile Search Bar | Nothing |

---

## R7: VERIFICATION STEPS

For each phase, verify:
- `git commit -m "feat(home): Implement Airbnb-style [feature name]"`
- Validate layout on Mobile viewport (320px width) in Chrome DevTools to ensure image card aspect ratio is intact.
- Turn off network to test Skeleton loaders.
- Select category but NO city, submit search -> should hit `/:locale/:category`.

---

## R8: FINAL PHASE UPDATES CLAUDE.md

- Will add `hooks/useRecentVisits.ts` to the `CLAUDE.md` directory tree structure.
- Will document the Rule for Pricing Cards (`$` logic) in UI best practices in `CLAUDE.md` to persist knowledge.
