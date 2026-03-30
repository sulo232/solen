# Feature Deprioritization (Massage & Spa + Mobile Popup)

## 🔴 BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Discovery & Category Navigation | Ensure the `Massage & Spa` category is cleanly filtered out without breaking array indices or rendering logic. |
| Phase 2 | 🟢 SAFE | Mobile Nav Overlay | Safely disable the `Salon entry popup` using feature flags, leaving components intact for future restoration. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Hide "Massage & Spa" Category
**Goal:** Remove the "Massage & Spa" category from all navigation, discovery tabs, and homepage categories without deleting backend data.

**Files to modify:**
- `[MODIFY]` `lib/feature-flags.ts` (Add flag for the category)
- `[MODIFY]` `components/discovery/CategoryTabBar.tsx` (Filter out the tab if flag is disabled)
- `[MODIFY]` `components/layout/Header.tsx` or wherever desktop/mobile nav links are defined.
- `[MODIFY]` `components/HomePage.tsx` (Remove from the category grid).

**Steps:**
1. Add `isMassageSpaEnabled: false` to `lib/feature-flags.ts`.
2. Wrap or filter the rendering of the `Massage & Spa` category in `CategoryTabBar.tsx` and the homepage categories list using the feature flag.
3. Ensure the backend logic or routing for `/discover?category=massage-spa` gracefully handles the disabled state if accessed directly.

> ⚠️ **BE CAREFUL**:
> - **DO NOT** delete the "Massage & Spa" SVGs, translation keys, or database rows.
> - **DO NOT** break the CSS Grid by mapping over an array with `null` elements. Always use `.filter()` before mapping.
> - **Verify** that the `CategoryTabBar` still animates correctly with one less tab.

**Code Example:**
✅ **DO:**
```tsx
{CATEGORIES.filter(c => c.id !== 'massage-spa' || featureFlags.isMassageSpaEnabled).map(category => (
  <CategoryTab key={category.id} {...category} />
))}
```
❌ **DON'T:**
```tsx
{CATEGORIES.map(category => (
  category.id === 'massage-spa' ? null : <CategoryTab key={category.id} />
))}
```

### Phase 2: ~~Hide Mobile Salon Entry Popup~~ — SKIPPED

> ⚠️ **COLLISION FIX (2026-03-25):** This phase is **SKIPPED**. The mobile salon entry popup and `BottomNav.tsx` are fully removed by `roadmap-nav-mobile-cleanup.md` (Wave 2), which runs before this roadmap. The "Salon eintragen" entry point is now in the footer and hamburger menu.
>
> **Verification only:** Run `grep -rn "SalonEntryPopup\|FloatingCTA\|SalonRegisterCTA\|BottomNav" components/ app/ --include="*.tsx"` — should return 0 results for active renders.

---

## 📦 DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Hide Massage & Spa Category | Nothing |
| Phase 2 | 🤖 | Hide Mobile Salon Popup | Nothing |

---

## 🛂 VERIFICATION STEPS
After execution, verify the following:
1. `npm run build` completes with 0 errors.
2. `npx tsc --noEmit` completes with 0 errors.
3. Visit the Homepage: Ensure the "Massage & Spa" card/icon is absent.
4. Visit `/discover`: Ensure the "Massage & Spa" tab is absent.
5. Open the mobile view (dev tools): Ensure the Salon entry popup never appears on scroll or load.
