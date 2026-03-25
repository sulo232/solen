# Roadmap A — Discovery Unified Category Tabs

> **Goal:** Replace the fragmented `/discover` + `/discover/nails` dual-route setup with a single `/discover` page where category tabs (`Alle / Hair / Nails / Lashes / Brows / Makeup`) switch content in-place.
> **Zone:** 1 — Full Maximalist
> **Prerequisite:** Run this AFTER (or in parallel with) `roadmap-discover-v3-deep-dive.md` phases P1–P4.
> **Card Preservation Rule:** `ItemCard.tsx`, `VideoCard.tsx`, `MasonryGrid.tsx` are COMPLETELY OFF-LIMITS.
>
> ⚠️ **COLLISION FIX (2026-03-25 — i18n compliance):** The `DISCOVERY_CATEGORIES` labels in `CategoryTabBar.tsx` must use `next-intl` translation keys (e.g., `t('discover.tabs.all')`) instead of hardcoded strings like `"Alle"`. Add keys under `"discover.tabs"` in all 4 locale JSONs. This ensures compliance with CLAUDE.md Rule 33.

---

## ⚠️ RUN MIGRATION FIRST?
No database migrations required. No new Supabase tables.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| P0 — Read current state | 🟢 SAFE | Nothing | Read-only |
| P1 — `CategoryTabBar.tsx` (new) | 🟢 SAFE | Nothing | New file, not imported yet |
| P2 — Integrate tabs into `discover/page.tsx` | 🟡 MEDIUM | Existing CategoryPills + API fetch | Read page first, surgically add state |
| P3 — URL `?category` sync | 🟡 MEDIUM | SSR hydration mismatch | Use `useSearchParams` correctly |
| P4 — Redirect `discover/nails/page.tsx` | 🟢 SAFE | Only removes old page — no consumers left after P3 redirect | Verify no other links to `/discover/nails` first |
| P5 — Rule additions | 🟢 SAFE | No code changes | Docs only |

---

## P0 — Codebase Scan (READ BEFORE ANY CODE)

```bash
# Read the discover page to understand current state:
cat app/[locale]/discover/page.tsx

# Check what CategoryPills currently receives and renders:
cat components/discovery/CategoryPills.tsx

# Check the nails page content:
cat app/[locale]/discover/nails/page.tsx

# Check if api/discover supports ?category param:
cat app/api/discover/route.ts | head -60

# Check if anything else links to /discover/nails:
grep -rn "discover/nails" app/ components/ --include="*.tsx" --include="*.ts"
# If results found → update those links to /discover?category=nails BEFORE the redirect
```

> ⚠️ **BE CAREFUL P0:**
> - If `discover/page.tsx` uses a Server Component pattern, adding `useState` requires a `"use client"` directive. Check first.
> - If `api/discover` already has a `?category` param → use it. If not → filter items client-side (simpler, safe for now).
> - If `grep` for `discover/nails` returns links in `BottomNav`, `Header`, or any nav file → update those links FIRST before doing the redirect.

**Git commit:** _(no commit for P0 — read-only)_

---

## P1 — [NEW] `CategoryTabBar.tsx`

### Files to create

#### [NEW] `components/discovery/CategoryTabBar.tsx`

```tsx
"use client";

import { useRef } from "react";

export interface CategoryTab {
  key: string;
  label: string;
}

export const DISCOVERY_CATEGORIES: CategoryTab[] = [
  { key: "alle",    label: "Alle" },
  { key: "hair",    label: "Hair" },
  { key: "nails",   label: "Nails" },
  { key: "lashes",  label: "Lashes" },
  { key: "brows",   label: "Brows" },
  { key: "makeup",  label: "Makeup" },
];

interface CategoryTabBarProps {
  activeCategory: string;
  onChange: (key: string) => void;
}

export default function CategoryTabBar({ activeCategory, onChange }: CategoryTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
      role="tablist"
      aria-label="Kategorien"
    >
      {DISCOVERY_CATEGORIES.map((tab) => {
        const isActive = activeCategory === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              "flex-shrink-0 px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-all duration-150",
              isActive
                ? "bg-s-coral text-white"
                : "bg-s-ink/[0.05] dark:bg-white/[0.07] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.12]",
            ].join(" ")}
            style={
              isActive
                ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

> ✅ **DO:** Pill tabs with coral active state + glow shadow. Horizontal scroll on mobile, scrollbar hidden.
> ❌ **DON'T:** Don't use `flex-wrap` — tabs MUST stay on one scrollable row. Don't use `rounded-full` — use `rounded-pill`.

> ⚠️ **BE CAREFUL P1:**
> - `scrollbar-none` utility must be in `globals.css` or `tailwind.config.js`. Check with:
>   ```bash
>   grep -n "scrollbar-none" app/globals.css tailwind.config.js
>   ```
>   If not present, add to `globals.css`:
>   ```css
>   .scrollbar-none { scrollbar-width: none; }
>   .scrollbar-none::-webkit-scrollbar { display: none; }
>   ```
> - `DISCOVERY_CATEGORIES` is exported so `discover/page.tsx` can import it for the initial state.

**Git commit:** `git add components/discovery/CategoryTabBar.tsx && git commit -m "DISC-TABS-P1: [NEW] CategoryTabBar — coral active pills, horizontal scroll, 6 categories"`

---

## P2 — [MODIFY] Integrate tabs into `discover/page.tsx`

### What to add

1. Add `"use client"` if not already present (check P0 scan)
2. Import `CategoryTabBar` and `DISCOVERY_CATEGORIES`
3. Import `useRouter`, `useSearchParams` from `next/navigation`
4. Add `activeCategory` state initialized from `?category` searchParam
5. Place `<CategoryTabBar>` immediately ABOVE the existing `<CategoryPills>` row
6. Filter items based on `activeCategory` (client-side OR pass to API — see P0 decision)
7. Add `opacity` transition on the grid when category changes

### Code additions (surgical — do NOT rewrite page)

```tsx
// At top of file (add to existing imports):
import CategoryTabBar, { DISCOVERY_CATEGORIES } from "@/components/discovery/CategoryTabBar";
import { useRouter, useSearchParams } from "next/navigation";

// Inside the component (add after existing state declarations):
const router = useRouter();
const searchParams = useSearchParams();
const [activeCategory, setActiveCategory] = useState<string>(
  searchParams?.get("category") ?? "alle"
);
const [gridVisible, setGridVisible] = useState(true);

const handleCategoryChange = (key: string) => {
  setGridVisible(false);
  setTimeout(() => {
    setActiveCategory(key);
    setGridVisible(true);
    // Update URL without full navigation:
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (key === "alle") {
      params.delete("category");
    } else {
      params.set("category", key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, 80); // 80ms = half the fade duration
};
```

> Client-side filtering (add after items are fetched):
```tsx
const filteredItems = activeCategory === "alle"
  ? items
  : items.filter((item) => item.category === activeCategory);
```

> Replace `items` with `filteredItems` in the `<MasonryGrid>` render — that's the ONLY change to the grid.

> Grid wrapper — add opacity transition:
```tsx
// Wrap the MasonryGrid (or its outer div) with:
<div
  className="transition-opacity duration-150"
  style={{ opacity: gridVisible ? 1 : 0 }}
>
  {/* existing MasonryGrid render — UNCHANGED */}
</div>
```

> `<CategoryTabBar>` placement — add DIRECTLY ABOVE the existing CategoryPills block:
```tsx
{/* Category tab row — add this before the CategoryPills scroll row */}
<CategoryTabBar
  activeCategory={activeCategory}
  onChange={handleCategoryChange}
/>
{/* existing CategoryPills — unchanged */}
```

> ✅ **DO:** Surgically insert ≤20 new lines. Everything else stays.
> ❌ **DON'T:** Do NOT reorder or restructure the existing JSX tree. Do NOT refactor the fetch logic. Do NOT touch `ItemCard`, `VideoCard`, or `MasonryGrid`.

> ⚠️ **BE CAREFUL P2:**
> - If `discover/page.tsx` is a Server Component (no `"use client"` at top), you MUST add it. Check `P0`.
> - `useSearchParams` requires the component to be wrapped in `<Suspense>`. If the page already has Suspense, you're fine. If not, wrap the component export as needed.
> - The `item.category` field name may differ — check the actual DB column name from the API response in P0 before writing the filter.
> - If `api/discover` already filter by category server-side: pass `activeCategory` to the fetch URL instead of filtering client-side. Don't do both.

**Git commit:** `git add app/[locale]/discover/page.tsx components/discovery/CategoryTabBar.tsx && git commit -m "DISC-TABS-P2: integrate CategoryTabBar into discover page — ?category URL sync, fade transition"`

---

## P3 — [MODIFY] Redirect `/discover/nails`

### Pre-check (from P0 scan)
If any component links directly to `/discover/nails`, update those links to `/discover?category=nails` BEFORE this phase.

```bash
# Confirm zero remaining links:
grep -rn "discover/nails" app/ components/ --include="*.tsx" --include="*.ts"
# Expected: 0 results (or: only the nails/page.tsx itself)
```

### Files to modify

#### [MODIFY] `app/[locale]/discover/nails/page.tsx`

Replace the entire file content with:

```tsx
import { permanentRedirect } from "next/navigation";

interface Props {
  params: { locale: string };
}

export default function NailsDiscoverRedirect({ params }: Props) {
  permanentRedirect(`/${params.locale}/discover?category=nails`);
}
```

> ✅ **DO:** Use `permanentRedirect()` — it returns 308, which is semantically correct for a permanent URL change and is cache-friendly.
> ❌ **DON'T:** Do not use `redirect()` (307) for a permanent URL restructure. Do not leave the old nails page content in place.

> ⚠️ **BE CAREFUL P3:**
> - `permanentRedirect` is from `next/navigation` (App Router only). Confirm the project's Next.js version supports it (Next.js 13.3+). Check `package.json`.
> - The `[id]` sub-route (`discover/[id]/page.tsx`) is a DETAIL page — do NOT redirect that. It handles individual post detail views. Leave it completely alone.
> - Verify the redirect works locally: navigate to `/de/discover/nails` → should land on `/de/discover?category=nails` with Nails tab pre-selected.

**Git commit:** `git add app/[locale]/discover/nails/page.tsx && git commit -m "DISC-TABS-P3: /discover/nails → permanentRedirect to /discover?category=nails"`

---

## P4 — [MODIFY] Rule additions

### To CLAUDE.md (add after Rule 31)

#### [MODIFY] `CLAUDE.md`

Add after the Rule 31 block (around line 704):

```markdown
### Rule 32: ONE DISCOVERY PAGE — NO PARALLEL CATEGORY ROUTES

> **INCIDENT**: `/discover/nails` existed as a separate page with its own layout, fragmenting the navigation flow and creating inconsistent UX. All category discovery routes must live on a single page.

- The discovery experience MUST live at a single route: `/[locale]/discover`.
- **NEVER** create `/[locale]/discover/[category-name]` as an independent page with its own layout.
- Category separation is handled via `?category=VALUE` query params + in-place tab switching via `CategoryTabBar.tsx`.
- If a category needs special content sections, extend `discover/page.tsx` with category-specific sections WITHIN the same page — do not create a new route.
- Adding a new beauty vertical? Add a tab to `DISCOVERY_CATEGORIES` in `CategoryTabBar.tsx` — NOT a new route.
- Old category-specific discovery routes MUST redirect to `/discover?category=X` using `permanentRedirect()`.

```bash
# Verify no parallel category discovery routes exist:
ls app/[locale]/discover/
# Expected: page.tsx, error.tsx, [id]/ directory only.
# Any other named subdirectory (nails/, hair/, etc.) = violation.
```
```

### To UI_RULES.md §4 (add clarification after the "Tab Switching" bullet)

#### [MODIFY] `_rules/UI_RULES.md`

Find the line:
```
- **Tab Switching:** Use a smooth **slide left/right** animation (like turning pages), not a simple fade.
```

Add immediately after:
```
  - **Exception — Filter/Category tabs:** When a tab switch changes a **filter state** (not a page section), use a 150ms `opacity` fade on the content grid only — NOT a slide animation. Slide animations imply page-level navigation. Switching from "Hair" to "Nails" on the Discover page is a filter change, not navigation.
```

> ⚠️ **BE CAREFUL P4:**
> - Rule 32 number must not conflict with any existing rule. Count current rules before inserting. If Rule 32 already exists, use the next available number.

**Git commit:** `git add CLAUDE.md _rules/UI_RULES.md && git commit -m "DISC-TABS-P4: Rule 32 — single discovery route policy; UI_RULES §4 filter-tab exception"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| P0 | 🤖 Read | Scan page, API, nails route, grep for links | Nothing |
| P1 | 🤖 Code | Create `CategoryTabBar.tsx` | P0 |
| P2 | 🤖 Code | Integrate tabs into `discover/page.tsx` | P1 |
| P3 | 🤖 Code | Redirect `discover/nails/page.tsx` | P0 grep confirms zero consumers |
| P4 | 🤖 Docs | Add Rule 32 to CLAUDE.md + UI_RULES clarification | P2, P3 done |
| Build | 🤖 Verify | `npm run build` + smoke test | P4 |

---

## Final Smoke Test (Post-execution)

```bash
# 1. Build passes:
npm run build

# 2. Type check:
npx tsc --noEmit

# 3. CategoryTabBar is imported and used:
grep -rn "CategoryTabBar" app/ components/
# Expected: import in discover/page.tsx + the component file itself

# 4. Nails page is redirect-only:
grep -c "permanentRedirect" app/[locale]/discover/nails/page.tsx
# Expected: 1

# 5. No remaining links to /discover/nails (old URL):
grep -rn "discover/nails" app/ components/ --include="*.tsx" --include="*.ts"
# Expected: 0 results (or only the nails/page.tsx itself)

# 6. Cards preserved:
grep -rn "ItemCard\|VideoCard\|MasonryGrid" app/[locale]/discover/page.tsx
# Expected: still imported, rendered identically to before

# 7. No banned tokens in new file:
grep -n "shadow-md\|rounded-full\|font-medium\|bg-gray\|text-gray" components/discovery/CategoryTabBar.tsx
# Expected: 0 results

# 8. Rule 32 exists:
grep -n "Rule 32" CLAUDE.md
# Expected: 1 match

# Manual:
# ✅ /de/discover → "Alle" tab active, full feed visible
# ✅ Click "Nails" → grid fades, nails content shown, URL = /de/discover?category=nails
# ✅ Navigate to /de/discover/nails → browser immediately redirects to /de/discover?category=nails
# ✅ Navigate directly to /de/discover?category=nails → Nails tab pre-selected on load
# ✅ /de/discover/[id] detail pages → unaffected, still work
```
