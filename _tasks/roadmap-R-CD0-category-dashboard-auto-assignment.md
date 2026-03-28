# R-CD0: Category-to-Dashboard Auto-Assignment

> **Priority**: P0 — Must execute BEFORE R-CD1.
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.
> **Depends On**: Nothing (foundation roadmap).

---

## Problem Statement

**Current state**: `DashboardLayout.tsx` (435 lines) has a hardcoded "Spezial" nav group that shows barber/nail items (`nailClients`, `barberClients`, `barberOps`) to ALL salon owners — even a **spa** salon sees barbershop links. The layout receives no salon category data, so it cannot filter.

**Goal**: When a salon owner registers and selects their category (e.g., "barbershop"), they should ONLY see barbershop-specific dashboard features. A spa salon should never see barber tools.

**Flow**: Registration → Category selected (`salons.categories`) → Onboarding → Dashboard → Sidebar shows ONLY that category's tools.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| DashboardLayout category usage | `grep -rn "categories" components/dashboard/DashboardLayout.tsx` | ❌ Zero matches — layout does NOT use categories at all |
| DashboardLayout props | `grep -rn "interface DashboardLayoutProps" components/dashboard/DashboardLayout.tsx` | Only accepts: `children`, `salonName`, `salonAvatar`, `unreadCount` — NO category prop |
| How layout is called | `grep -rn "DashboardLayout" app/ --include="*.tsx"` | Find all pages that render DashboardLayout — check if any pass salon data |
| Dashboard root page | `cat app/[locale]/dashboard/page.tsx` | Check how salon data is fetched |
| Salon creation API | `grep -rn "categories" app/api/salon/ --include="*.ts"` | Verify categories are stored during salon creation |
| Auth profile API | `cat app/api/profile/route.ts` | Check if profile response includes salon categories |
| SalonProfileStep fields | `grep -rn "categories" components/onboarding/` | ❌ `SalonProfileStep.tsx` does NOT have categories selector — categories set during registration |
| Hardcoded Spezial group | Lines 89-96 of DashboardLayout.tsx | `nailClients`, `barberClients`, `barberOps` shown to ALL owners unconditionally |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Fetch salon categories in layout | 🔴 HIGH | DashboardLayout sidebar for ALL users | Read FULL DashboardLayout.tsx (435 lines). Only ADD a data fetch — do NOT modify existing nav structure or auth guard. Test all 3 roles. |
| Phase 2: Filter "Spezial" group by category | 🔴 HIGH | Barbershop/nail owners lose access to their tools if filter is wrong | Keep ALL existing nav items accessible. If categories are empty/undefined, show ALL items (safe fallback). |
| Phase 3: Mobile sidebar filter | 🟡 MEDIUM | Mobile sidebar uses different nav array (`OWNER_NAV` flat list, not groups) | Apply same category filter to mobile sidebar's flat `OWNER_NAV` array. |
| Phase 4: Verification | 🟢 SAFE | Nothing — testing only | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Pass salon categories into DashboardLayout
- Phase 2: Filter "Spezial" nav group by salon categories
- Phase 3: Filter mobile sidebar by salon categories
- Phase 4: Verification + Smoke Test

---

## Phase 1: Pass Salon Categories into DashboardLayout

> **Zone 4 constraints**: No UI changes in this phase — data plumbing only.

#### Files
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — add `salonCategories` prop
- `[MODIFY]` `app/[locale]/dashboard/layout.tsx` OR whichever parent passes props to DashboardLayout — pass `categories` from salon fetch

#### Instructions
1. First: find where `DashboardLayout` is rendered. Run `grep -rn "<DashboardLayout" app/ --include="*.tsx"`.
2. Add a new optional prop `salonCategories?: string[]` to `DashboardLayoutProps`.
3. In the parent page/layout that renders `<DashboardLayout>`, fetch the salon's `categories` field and pass it down.
4. If the parent already fetches salon data (for `salonName`, `salonAvatar`), just add `categories` to the same query.
5. If the parent does NOT fetch salon data, add a fetch to `/api/salons/[id]` or `/api/profile` that includes categories.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// In DashboardLayoutProps:
interface DashboardLayoutProps {
  children: React.ReactNode;
  salonName?: string;
  salonAvatar?: string | null;
  unreadCount?: number;
  salonCategories?: string[];  // NEW — from salon.categories
}

// In the parent that renders <DashboardLayout>:
<DashboardLayout
  salonName={salon.name}
  salonAvatar={salon.cover_photo_url}
  unreadCount={unread}
  salonCategories={salon.categories}  // NEW
>
  {children}
</DashboardLayout>
```

❌ **DON'T**
```tsx
// WRONG — fetching salon data INSIDE DashboardLayout (adds latency to every page load)
useEffect(() => {
  fetch("/api/salons/my-salon").then(r => r.json()).then(s => setCategories(s.categories));
}, []);
// WRONG — making categories mandatory (would break existing pages)
salonCategories: string[];  // Should be optional with fallback
```

> ⚠️ **BE CAREFUL**:
> - DashboardLayout.tsx is 435 lines with auth guards (lines 151-171), role detection, mobile sidebar, and unread count. Read the ENTIRE file before editing.
> - The auth guard in `useEffect` (lines 151-171) must remain ENTIRELY untouched.
> - The prop must be OPTIONAL (`salonCategories?`) — if undefined, the dashboard should show ALL items (safe fallback for existing pages that don't pass it yet).
> - Check if the parent component already has the salon object — don't re-fetch.
> - Files that should NOT be touched: `lib/auth.ts`, `app/api/auth/`, `components/onboarding/`.

#### Verification
```bash
npx tsc --noEmit
npm run build
# Verify new prop is accepted:
grep -rn "salonCategories" components/dashboard/DashboardLayout.tsx
git add components/dashboard/DashboardLayout.tsx && git commit -m "R-CD0-P1: add salonCategories prop to DashboardLayout"
```

---

## Phase 2: Filter "Spezial" Nav Group by Salon Categories

> **Zone 4 constraints**: This is Zone 4. No visual changes — only filtering which nav items appear. All existing Zone 4 styling stays.

#### Files
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx`

#### Instructions

Currently lines 89-96 show a hardcoded "Spezial" group:
```tsx
{
  label: "Spezial",
  items: [
    { key: "nailClients",  href: "/dashboard/nail-clients",   icon: Sparkles },
    { key: "barberClients", href: "/dashboard/barber-clients", icon: Scissors },
    { key: "barberOps",   href: "/dashboard/barber-ops",      icon: BarChart3 },
  ],
},
```

Replace this with a FILTERED version:

1. Define a mapping: which nav items belong to which category:
   - `nailClients` → `nails`
   - `barberClients` → `barbershop`
   - `barberOps` → `barbershop`
2. If `salonCategories` is provided, filter the "Spezial" items to only those matching the salon's categories.
3. If the filtered array is empty, hide the entire "Spezial" group.
4. **FALLBACK**: If `salonCategories` is `undefined` or empty, show ALL items (backwards compatibility).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// Define category→nav mapping OUTSIDE the component:
const CATEGORY_NAV_MAP: Record<string, string> = {
  nailClients: "nails",
  barberClients: "barbershop",
  barberOps: "barbershop",
  // Future: coiffeurCrm: "coiffeur", spaAdmin: "spa", etc.
};

// Inside the component, compute filtered nav groups:
const filteredOwnerNavGroups = useMemo(() => {
  return OWNER_NAV_GROUPS.map(group => {
    if (group.label !== "Spezial") return group;

    // If no categories provided, show all (safe fallback)
    if (!salonCategories || salonCategories.length === 0) return group;

    const filtered = group.items.filter(item => {
      const requiredCategory = CATEGORY_NAV_MAP["key" in item ? item.key : ""];
      // If no mapping exists, always show (generic items)
      if (!requiredCategory) return true;
      return salonCategories.includes(requiredCategory);
    });

    // Hide group entirely if no items match
    if (filtered.length === 0) return null;
    return { ...group, items: filtered };
  }).filter(Boolean);
}, [salonCategories]);

// Then render filteredOwnerNavGroups instead of OWNER_NAV_GROUPS
```

❌ **DON'T**
```tsx
// WRONG — removing the "Spezial" group entirely
const OWNER_NAV_GROUPS = OWNER_NAV_GROUPS.filter(g => g.label !== "Spezial");
// WRONG — checking categories inside JSX (messy, error-prone)
{group.label === "Spezial" && salon.categories.includes("barbershop") && ...}
// WRONG — breaking if salonCategories is undefined
salonCategories.includes("nails") // TypeError if undefined!
```

> ⚠️ **BE CAREFUL**:
> - The `OWNER_NAV_GROUPS` constant is defined at module scope (lines 61-105). Do NOT mutate it. Create a filtered copy inside the component using `useMemo`.
> - The safe fallback (show ALL if categories is empty) is critical — existing pages that don't pass `salonCategories` must still work.
> - Multi-category salons (e.g., `["barbershop", "coiffeur"]`) must see BOTH barber AND coiffeur items.
> - Admin role must NEVER be affected — they see admin nav, not owner nav.
> - Test cases to verify: (1) barbershop-only salon → sees barber items, no nails. (2) nails-only salon → sees nail items, no barber. (3) multi-category → sees both. (4) no categories set → sees all (fallback).

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify filtering logic exists:
grep -rn "CATEGORY_NAV_MAP\|filteredOwnerNavGroups" components/dashboard/DashboardLayout.tsx
git add components/dashboard/DashboardLayout.tsx && git commit -m "R-CD0-P2: filter Spezial nav group by salon categories"
```

---

## Phase 3: Filter Mobile Sidebar by Salon Categories

> **Zone 4 constraints**: No visual changes — only filtering which items appear in the mobile drawer.

#### Files
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx`

#### Instructions

The mobile sidebar (lines 332-357) uses the flat `OWNER_NAV` array (lines 40-59), NOT `OWNER_NAV_GROUPS`. It also contains `nailClients`, `barberClients`, `barberOps`.

1. Apply the same `CATEGORY_NAV_MAP` filter to the mobile sidebar's `OWNER_NAV` rendering.
2. Same fallback: if no categories, show all.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// Compute filtered flat nav for mobile:
const filteredOwnerNav = useMemo(() => {
  if (!salonCategories || salonCategories.length === 0) return OWNER_NAV;
  return OWNER_NAV.filter(item => {
    const requiredCategory = CATEGORY_NAV_MAP["key" in item ? item.key : ""];
    if (!requiredCategory) return true;
    return salonCategories.includes(requiredCategory);
  });
}, [salonCategories]);

// Use filteredOwnerNav in mobile sidebar:
{(isStaff ? STAFF_NAV : filteredOwnerNav).map((item) => { ... })}
```

❌ **DON'T**
```tsx
// WRONG — only filtering desktop, forgetting mobile
// Mobile sidebar at line 332 still uses unfiltered OWNER_NAV → inconsistency
```

> ⚠️ **BE CAREFUL**:
> - Mobile and desktop sidebar must show the SAME filtered items.
> - The mobile sidebar code starts at line 307. Read lines 307-386 in full before modifying.
> - The `OWNER_NAV` flat array (lines 40-59) has hardcoded German labels for some items (e.g., `label: "Treueprogramm"`). These are NOT category-filtered — only `nailClients`, `barberClients`, `barberOps` need filtering.

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify mobile sidebar uses filtered nav:
grep -rn "filteredOwnerNav" components/dashboard/DashboardLayout.tsx
git add components/dashboard/DashboardLayout.tsx && git commit -m "R-CD0-P3: filter mobile sidebar by salon categories"
```

---

## Phase 4: Verification + Smoke Test

> **Zone 4 constraints**: Verification phase.

#### Files
- No file changes.

#### ✅ DO / ❌ DON'T Examples

✅ **DO** — Test matrix:

| Test Case | Salon Categories | Expected Desktop "Spezial" | Expected Mobile |
|---|---|---|---|
| Barbershop only | `["barbershop"]` | barberClients, barberOps | Same |
| Nails only | `["nails"]` | nailClients | Same |
| Multi-category | `["barbershop", "nails"]` | ALL 3 items | Same |
| Spa only | `["spa"]` | "Spezial" group HIDDEN | nailClients/barberClients/barberOps items hidden |
| No categories | `[]` or `undefined` | ALL items (fallback) | Same |
| Admin role | Any | Admin nav only (no change) | Same |
| Staff role | Any | Staff nav only (no change) | Same |

❌ **DON'T**
```bash
# WRONG — only testing one category
# WRONG — not testing the undefined fallback
# WRONG — not testing admin/staff roles
```

> ⚠️ **BE CAREFUL**:
> - The fallback case (undefined/empty categories) is the most critical to test — it ensures existing salons that haven't been updated still work.
> - Admin and staff roles should be completely unaffected by this change.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify DashboardLayout has the new prop:
grep -rn "salonCategories" components/dashboard/DashboardLayout.tsx

# Verify filtering logic:
grep -rn "CATEGORY_NAV_MAP\|filteredOwnerNavGroups\|filteredOwnerNav" components/dashboard/DashboardLayout.tsx

# Verify no Zone 4 violations introduced:
grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|animate-" components/dashboard/DashboardLayout.tsx
# Expected: 0 new results (existing backdrop-blur on line 65 for mobile overlay is fine)

# Verify parent passes categories:
grep -rn "salonCategories" app/ --include="*.tsx"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add salonCategories prop + data plumbing | Nothing |
| Phase 2 | 🤖 | Filter desktop "Spezial" group | Phase 1 |
| Phase 3 | 🤖 | Filter mobile sidebar | Phase 1 |
| Phase 4 | 🤖 | Verification | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 — note that `DashboardLayout` now accepts `salonCategories` prop
- `CLAUDE.md` Section 6 — note `CATEGORY_NAV_MAP` as the mapping between nav keys and salon categories
- `_docs/category-system-map.md` §3.1 — document the category→dashboard auto-assignment flow

---

## Relationship to R-CD1

This roadmap (R-CD0) handles the **existing** "Spezial" group filtering. R-CD1 then EXTENDS this by:
1. Creating `getCategoryNavGroups()` utility (a more dynamic system for adding NEW category groups)
2. Injecting entirely new category-specific nav groups (coiffeur, spa, makeup, waxing)

**Execution order**: R-CD0 → R-CD1 → R-CD2 through R-CD7.
