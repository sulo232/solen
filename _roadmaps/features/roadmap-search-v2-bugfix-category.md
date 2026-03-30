# Roadmap: Search Flow v2 — Bug Fixes + Airbnb Category UX

> **Goal:** Fix verified bugs from the Phase 1-6 audit, add Airbnb-style sticky
> category collapse on the homepage, and verify everything end-to-end once the
> Supabase env vars are restored.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — env var setup only | — |
| Phase 2 | 🟢 SAFE | Nothing — already committed bugfixes | Verify with `tsc --noEmit` |
| Phase 3 | 🟡 MEDIUM | Header scroll morph, category icon display | Do NOT change `scrolled` threshold or glass-frost classes |
| Phase 4 | 🟡 MEDIUM | Homepage layout, category section | Do NOT move the category `<section>` — only hide it when observer fires |
| Phase 5 | 🟢 SAFE | Nothing — docs only | — |

### 🟡 Risk Details

**Phase 3 — Sticky category inline row in Header:**
- `components/layout/Header.tsx` (lines 120–200): The header pill already morphs on scroll. Adding a category row inside it risks breaking the `transition-[max-width,padding,min-height]` animation.
- **How to avoid:** Render the inline categories as a SEPARATE row inside the `<header>` element, below the main pill. Use `AnimatePresence` for show/hide. Do NOT nest it inside the glass-frost pill.

**Phase 4 — Homepage category section hide/show:**
- `components/HomePage.tsx` (lines 286–330): The category grid section with squircle icons. An `IntersectionObserver` on this section triggers the header inline categories to appear.
- **How to avoid:** Use a shared Context or CustomEvent (like the existing `openSearchSheet` pattern) to communicate between `HomePage.tsx` and `Header.tsx`. Do NOT add global state.

---

## Phase Overview (R2)

### 🧑 MANUAL PHASES

| Phase | Title |
|---|---|
| Phase 1 | Restore local dev (env vars) |

### 🤖 CLAUDE CODE PHASES

| Phase | Title |
|---|---|
| Phase 2 | Commit bug fixes (already applied) |
| Phase 3 | Airbnb-style sticky category row in header |
| Phase 4 | Homepage category observer + hide-on-scroll |
| Phase 5 | Update CLAUDE.md + INCOMPLETE_FEATURES.md |

---

## Phase 1 (🧑 Manual): Restore Local Dev Server

### Problem
The local dev server returns 500 on ALL pages because `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing from `.env.local`.

### Steps

1. Open your Supabase dashboard at https://supabase.com/dashboard
2. Go to your project → Settings → API
3. Copy the **Project URL** and **anon public** key
4. Create or update `c:\Users\sulod\solen\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

5. Restart the dev server:
```bash
npm run dev
```

6. Verify http://localhost:3000/de loads without 500

> ⚠️ **BE CAREFUL:**
> - Do NOT commit `.env.local` to git — it's already in `.gitignore`
> - The anon key is a PUBLIC key — safe for client-side code
> - Do NOT use the `service_role` key — that's for server-side only
> - If you see "Invalid API key" errors, double-check for copy-paste whitespace

---

## Phase 2 (🤖 Code): Commit Bug Fixes

### Problem
Two bugs were fixed in the current session but not yet committed.

### What was fixed

**Bug 1 — ISO date display in trigger pill** (`GuidedSearch.tsx`):
- **Before:** Selecting a specific date (e.g., April 15) showed raw `2026-04-15` in the pill
- **After:** Shows formatted `15. Apr` (de-CH) or `Apr 15` (en) using `Intl.DateTimeFormat`

**Bug 4 — Missing Suspense boundary** (`SplitView.tsx`):
- **Before:** `SearchCriteriaChips` uses `useSearchParams()` without `<Suspense>`, causing Next.js client bailout
- **After:** Wrapped in `<Suspense fallback={null}>`

### Files
- [MODIFY] `components/ui/GuidedSearch.tsx` — formatted ISO date in `wannLabel`
- [MODIFY] `components/search/SplitView.tsx` — added `Suspense` import + boundary

### Verification
```bash
# Type check
npx tsc --noEmit 2>&1 | Select-String -Pattern "GuidedSearch|SplitView"
# Expected: 0 results

# Verify Suspense wraps chips
grep -n "Suspense" components/search/SplitView.tsx
# Expected: import line + wrapper line

# Verify date format logic
grep -n "Intl.DateTimeFormat" components/ui/GuidedSearch.tsx
# Expected: 1 result
```

```bash
git add components/ui/GuidedSearch.tsx components/search/SplitView.tsx
git commit -m "fix(search): format specific date in pill + wrap SearchCriteriaChips in Suspense"
git push origin main
```

> ⚠️ **BE CAREFUL:**
> - The `Intl.DateTimeFormat` with `{ day: "numeric", month: "short" }` is safe in all modern browsers and Node.js 14+
> - Do NOT remove the `catch { return dateKey; }` fallback — it handles edge cases where the date string is malformed

---

## Phase 3 (🤖 Code): Airbnb-Style Sticky Category Row in Header

**Zone:** Zone 1 (Header/Navigation). Glass allowed, animations allowed.

### Problem
When users scroll past the homepage category grid, there's no way to quickly access categories. Airbnb solves this with a sticky icon row that appears in the header when the main category grid scrolls out of view.

### Design

```
┌─────────────────────────────────────────────────────┐
│ SOLEN  [✂ Coiffeur] [💈 Barber] [💅 Nails] ...  👤 │  ← header pill
│                                                      │
│  ✂ Coiffeur  💈 Barber  💅 Nails  🧖 Spa ...       │  ← new inline row
│  ─ ─ ─ selected underline ─ ─ ─                     │     (appears when
│                                                      │      main grid is
└─────────────────────────────────────────────────────┘      out of viewport)
```

**On mobile (375px):** The inline row becomes horizontally scrollable with snap behavior. Active category has a coral underline.

### Files

#### [NEW] `components/layout/CategoryStickyRow.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";

const CATEGORIES = [
  { key: "coiffeur", Icon: CoiffeurIcon },
  { key: "barbershop", Icon: BarberIcon },
  { key: "nails", Icon: NailsIcon },
  { key: "spa", Icon: SpaIcon },
  { key: "makeup", Icon: MakeupIcon },
  { key: "waxing", Icon: WaxingIcon },
] as const;

interface CategoryStickyRowProps {
  locale: string;
}

export default function CategoryStickyRow({ locale }: CategoryStickyRowProps) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // Listen for a CustomEvent from HomePage when the category grid
  // scrolls out of the viewport
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setVisible(detail?.visible === false); // visible=false → grid out of view → show row
    };
    window.addEventListener("categoryGridVisibility", handler);
    return () => window.removeEventListener("categoryGridVisibility", handler);
  }, []);

  const currentCategory = CATEGORIES.find((c) =>
    pathname.includes(`/${c.key}`)
  )?.key;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="category-sticky-row"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5 px-1">
            {CATEGORIES.map(({ key, Icon }) => {
              const isActive = currentCategory === key;
              return (
                <Link
                  key={key}
                  href={`/${locale}/${key}`}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg shrink-0 transition-colors relative",
                    isActive
                      ? "text-s-coral"
                      : "text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
                  )}
                >
                  <Icon width={20} height={20} className="shrink-0" />
                  <span className="text-[10px] font-heading font-semibold whitespace-nowrap">
                    {t(key as Parameters<typeof t>[0])}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="category-underline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-s-coral"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

#### [MODIFY] `components/layout/Header.tsx`

**Changes:**
1. Import `CategoryStickyRow`
2. Render `<CategoryStickyRow locale={locale} />` below the main nav pill, inside the `<header>` element
3. Only render on homepage and category pages (not dashboard, auth, booking)

**BEFORE (line ~200, after the main pill `</div>`):**
```tsx
        </div>
        {/* Profile button */}
```

**AFTER:**
```tsx
        </div>
        {/* Inline category row — appears when homepage grid scrolls away */}
        <CategoryStickyRow locale={locale} />
        {/* Profile button */}
```

**✅ DO:**
```tsx
// Render OUTSIDE the glass-frost pill, but INSIDE the <header>
<header className="sticky top-0 z-50 w-full px-4">
  <div className="flex items-center justify-between ..."> {/* pill */}
    {/* ... logo, nav, profile ... */}
  </div>
  <CategoryStickyRow locale={locale} />  {/* ← HERE */}
</header>
```

**❌ DON'T:**
```tsx
// DON'T put it inside the pill — breaks glass morph
<div className="... glass-frost ...">
  <CategoryStickyRow />  {/* BAD — inside pill */}
</div>

// DON'T use position:fixed — it's already inside a sticky header
<div className="fixed top-[60px] ...">{/* BAD */}</div>
```

### Verification
```bash
# Check new component exists
ls components/layout/CategoryStickyRow.tsx
# Expected: file exists

# Check imported in Header
grep -n "CategoryStickyRow" components/layout/Header.tsx
# Expected: import line + render line

# Check CustomEvent listener
grep -n "categoryGridVisibility" components/layout/CategoryStickyRow.tsx
# Expected: addEventListener line

npm run build 2>&1 | tail -5
```

```bash
git add components/layout/CategoryStickyRow.tsx components/layout/Header.tsx
git commit -m "feat(nav): add Airbnb-style sticky category row in header"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT change the header's `glass-frost` or `shadow-warm-lg` classes — the sticky row sits BELOW the pill
> - Do NOT add `backdrop-filter` to the sticky row — it inherits from the header background
> - The `layoutId="category-underline"` must be unique across the page — do NOT reuse the same layoutId in other components
> - The row must NOT appear on dashboard pages (`pathname.includes("/dashboard")`) — the Header already hides on those pages via `isHidden`, so the row auto-hides too
> - On mobile, the row is horizontally scrollable — use `overflow-x-auto scrollbar-hide` with `shrink-0` on items

---

## Phase 4 (🤖 Code): Homepage Category Observer

**Zone:** Zone 1 (Hero/Homepage). Animations allowed.

### Problem
The `CategoryStickyRow` in Phase 3 listens for `categoryGridVisibility` events, but nothing dispatches them yet. We need an `IntersectionObserver` on the homepage category section that fires the event when the grid leaves/enters the viewport.

### Files

#### [MODIFY] `components/HomePage.tsx`

**Changes:**
1. Add a `ref` to the category grid section (line 286)
2. Add an `IntersectionObserver` in a `useEffect` that dispatches `categoryGridVisibility` events

**✅ DO:**
```tsx
// Add ref to the section
const categoryRef = useRef<HTMLDivElement>(null);

// Observer — fires CustomEvent when category grid enters/leaves viewport
useEffect(() => {
  const el = categoryRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      window.dispatchEvent(
        new CustomEvent("categoryGridVisibility", {
          detail: { visible: entry.isIntersecting },
        })
      );
    },
    { threshold: 0.1 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

```tsx
{/* Category Grid */}
<section id="tour-services" ref={categoryRef} className="py-10 md:py-14">
  {/* ... existing content ... */}
</section>
```

**❌ DON'T:**
```tsx
// DON'T use scroll position math — IntersectionObserver is more efficient
const onScroll = () => {
  if (window.scrollY > 500) { /* BAD — hardcoded pixel value */ }
};

// DON'T import useRef conditionally
if (typeof window !== "undefined") { useRef(); } // BAD — hooks rule violation
```

### Verification
```bash
# Check observer exists
grep -n "IntersectionObserver" components/HomePage.tsx
# Expected: 1 result

# Check ref is on the section
grep -n "categoryRef" components/HomePage.tsx
# Expected: 2+ results (declaration + usage)

# Check event dispatch
grep -n "categoryGridVisibility" components/HomePage.tsx
# Expected: 1 result

npm run build 2>&1 | tail -5
```

```bash
git add components/HomePage.tsx
git commit -m "feat(homepage): add IntersectionObserver for category grid visibility"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT move or restructure the category section — just add `ref={categoryRef}` to the existing `<section>` tag
> - The `IntersectionObserver` must use `threshold: 0.1` (not `0` or `1`) — `0.1` means "fire when 10% visible" which gives a smooth handoff
> - `useRef` is already imported in `HomePage.tsx` if not, add it to the existing React import — do NOT add a second import line
> - The CategoryStickyRow on non-homepage pages (like `/coiffeur`) should still show the row since the homepage grid doesn't exist there. Handle this by dispatching `categoryGridVisibility { visible: false }` on mount if we're not on the homepage, or let the row default to `visible=true` on category pages.
> - Test the scroll handoff: scroll the homepage slowly past the category grid. The sticky row should appear just as the grid leaves the viewport.

---

## Phase 5 (🤖 Code): Update Documentation

### Files

#### [MODIFY] `CLAUDE.md`

Add to Section 3.3 (Component Standards):
```markdown
- **CategoryStickyRow**: `<CategoryStickyRow>` in `components/layout/CategoryStickyRow.tsx` — Airbnb-style category icon row that appears in the header when the homepage category grid scrolls out of view. Uses `CustomEvent("categoryGridVisibility")` from `HomePage.tsx`. Zone 1 only.
```

#### [MODIFY] `_tasks/INCOMPLETE_FEATURES.md`

Append:
```markdown
## Category Row — Deferred Items (2026-03-30)

- **Snap scrolling on mobile** — `scroll-snap-type: x mandatory` for category row items, deferred.
- **Category row on search results page** — should the row appear when browsing `/search` with a category param? Deferred.
- **Keyboard navigation** — left/right arrow key navigation within the sticky row, deferred.
```

### Verification
```bash
grep -n "CategoryStickyRow" CLAUDE.md
# Expected: at least 1 result

npm run build 2>&1 | tail -5
```

```bash
git add CLAUDE.md _tasks/INCOMPLETE_FEATURES.md
git commit -m "docs: add CategoryStickyRow to CLAUDE.md and deferred items"
```

> ⚠️ **BE CAREFUL:**
> - Do NOT delete any existing content in CLAUDE.md or INCOMPLETE_FEATURES.md — only APPEND
> - Do NOT add `.env.example` entries — no new env vars in this roadmap

---

## Dependency Ordering Table (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🧑 | Restore local dev (env vars) | Nothing |
| Phase 2 | 🤖 | Commit bug fixes | Nothing |
| Phase 3 | 🤖 | Sticky category row component | Nothing |
| Phase 4 | 🤖 | Homepage observer for category row | Phase 3 (component must exist first) |
| Phase 5 | 🤖 | Documentation update | Phase 3 + Phase 4 |

---

## What's NOT in This Roadmap

- **Mobile swipe-to-close gesture** for the bottom sheet — separate task, requires `@use-gesture/react`
- **Autocomplete search suggestions** in Was step — requires `/api/search/suggest` endpoint
- **Desktop-specific search popover** (instead of bottom sheet) — deferred
- **Re-open search sheet with pre-filled state** from URL params — deferred
- **Search results page category row** — whether the sticky row should also appear on `/search` pages
- **Dark mode testing** — all new components use `dark:` variants but visual testing deferred until env vars are restored
