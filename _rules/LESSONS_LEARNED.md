# Solen.ch — Lessons Learned & Common Pitfalls

> **MANDATORY**: Every AI agent MUST read this file before making changes.
> **MANDATORY**: Every AI agent MUST append new entries here whenever they discover a new bug, footgun, or non-obvious pattern — whether they caused it or fixed it.

---

## How to Add an Entry

```markdown
### [Short title of the bug/lesson]
- **Date**: YYYY-MM-DD
- **File(s)**: path/to/file.tsx[:line]
- **What happened**: One sentence — what went wrong or what was surprising
- **Why it happened**: Root cause
- **Fix / What to do instead**: Concrete rule to follow
```

---

## DB / Supabase

### Selecting non-existent columns crashes the entire SSR query
- **Date**: 2026-03-30
- **File(s)**: `app/[locale]/page.tsx:42`
- **What happened**: Added `minimum_price` to the popular salons SELECT. That column doesn't exist in the DB. Supabase returned an error, `popularData` was null, `initialData.salons` defaulted to `[]`, and every salon section on the homepage disappeared silently.
- **Why it happened**: The TypeScript type `SalonCard` has `min_price?: number | null` (a computed/enriched field), but the actual DB column doesn't exist. The name mismatch was invisible at compile time.
- **Fix**: Before adding ANY column to a Supabase `.select()`, verify it exists in `_rules/DB_SCHEMA.md` or run a quick grep: `grep -n "column_name" supabase/migrations/`. If it's only in the TypeScript type (not in migrations), it's an enriched field — don't select it from the DB.

---

### `min_price` / `avg_price` are enriched fields, NOT DB columns
- **Date**: 2026-03-30
- **File(s)**: `lib/types.ts:386-387`, `app/[locale]/page.tsx`
- **What happened**: `SalonCard` extends `Salon` with extra optional fields (`min_price`, `avg_price`, `city_slug`, etc.) that are computed client-side or injected after the query, not stored in the DB.
- **Why it happened**: The TypeScript type blurs the line between DB columns and enriched fields.
- **Fix**: Fields declared in `SalonCard` (not `Salon`) are almost always enriched. Only fields in `Salon` base interface are actual DB columns. When in doubt, check `supabase/migrations/` for the column definition.

---

## Component Architecture

### Removing a section from the page also removes its sheet/modal
- **Date**: 2026-03-30
- **File(s)**: `components/HomePage.tsx`, `components/ui/GuidedSearch.tsx`
- **What happened**: Deleted the hero section which contained `<GuidedSearch>`. This removed the search trigger pill AND the bottom sheet. The header search icon dispatching `openSearchSheet` had nothing to listen to — tapping it did nothing.
- **Why it happened**: `GuidedSearch` renders both the trigger pill AND the bottom sheet in one component. Removing the component removes both.
- **Fix**: If a modal/sheet needs to stay mounted (for custom event listening) but you don't want its trigger visible, pass `hideTrigger={true}` or mount it separately. Never assume a sheet will work if its component isn't in the render tree.

### Deleting a component removes event listeners silently
- **Date**: 2026-03-30
- **File(s)**: `components/ui/GuidedSearch.tsx`
- **What happened**: `GuidedSearch` listens for `openSearchSheet` via `window.addEventListener`. When the component was unmounted (by deleting its JSX), the listener was removed too. The header's search icon dispatched the event but nothing responded.
- **Fix**: Before removing a component that mounts `window.addEventListener`, check what custom events it listens to and make sure those dispatchers are also removed or re-wired.

---

## SSR / Next.js

### Components that call `localStorage`/`document.cookie` in `useState` initializer need SSR guards
- **Date**: 2026-03-30
- **File(s)**: `components/ui/AirbnbSearchBar.tsx:30`, `lib/city-cookie.ts`
- **What happened**: `useState(() => getPersistedCity() ?? "basel")` is safe because `getPersistedCity()` already guards with `typeof document !== "undefined"`. But this pattern is easy to get wrong.
- **Fix**: Any `useState` initializer that touches browser APIs must guard with `typeof window !== "undefined"` or `typeof document !== "undefined"`. The `getPersistedCity()` helper in `lib/city-cookie.ts` already does this correctly — always use it as the reference pattern.

### `AnimatePresence` content doesn't render if the parent component isn't mounted
- **Date**: 2026-03-30
- **File(s)**: `components/ui/GuidedSearch.tsx`
- **What happened**: Sheet was inside `AnimatePresence` which only renders when `isOpen = true`. But `isOpen` is set by the `openSearchSheet` event listener. If the component isn't mounted, the event listener doesn't exist, `isOpen` never changes, and the sheet never opens.
- **Fix**: Always mount sheet/modal components at a stable point in the component tree. Don't nest them inside sections that may be conditionally removed.

---

## CSS / Tailwind

### `overflow-x-hidden` on a parent clips absolutely-positioned children
- **Date**: 2026-03-30
- **File(s)**: `components/HomePage.tsx`, `components/ui/AirbnbSearchBar.tsx`
- **What happened**: The homepage wrapper uses `overflow-x-hidden`. Dropdown menus inside `AirbnbSearchBar` use `absolute` positioning — if their parent has `overflow: hidden` in any direction, they can get clipped.
- **Fix**: Dropdowns and tooltips that use `position: absolute` must be inside a container with `overflow: visible`. `AirbnbSearchBar` uses `overflow-visible` on its container for this reason. Alternatively, use a portal (`ReactDOM.createPortal`) for dropdowns that need to escape overflow constraints.

### `body overflow: hidden` scroll lock causes layout shift on mobile
- **Date**: 2026-03-30
- **File(s)**: `components/ui/GuidedSearch.tsx`
- **What happened**: Setting `document.body.style.overflow = "hidden"` hides the scrollbar, causing the page to shift sideways by the scrollbar width. On mobile this causes a visual jump when opening the search sheet.
- **Fix**: Use the `position: fixed` approach:
  ```typescript
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  // On close:
  document.body.style.position = "";
  document.body.style.top = "";
  window.scrollTo(0, scrollY);
  ```
  This is already implemented in `GuidedSearch.tsx` — use it as the reference.

---

## i18n

### Adding a translation key to one locale file but not all 4 causes runtime errors
- **Date**: 2026-03-30
- **File(s)**: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
- **What happened**: `next-intl` throws at runtime (not build time) if a key exists in `de.json` but is missing from `en.json`. The English page crashes.
- **Fix**: Whenever adding keys to `de.json`, immediately add them to all 4 files in the same commit. Check with: `grep -c "your_key" messages/*.json` — should return 4 matches.

---

## Navigation / Routing

### Custom events dispatched to `window` need the listener component to be mounted
- **Date**: 2026-03-30
- **File(s)**: `components/layout/Header.tsx`, `components/ui/GuidedSearch.tsx`
- **What happened**: `Header.tsx` dispatches `openSearchSheet` and `CategoryStickyRow` listens for `categoryGridVisibility`. If either listener component is unmounted (e.g. removed from the render tree during a refactor), the events fire silently with no effect.
- **Fix**: Before removing or conditionally rendering a component, grep for the event names it listens to: `grep -rn "addEventListener.*customEventName" components/`. If other parts of the app dispatch that event, the listener must stay mounted.

### Home tab active state needs special handling for locale-prefixed routes
- **Date**: 2026-03-30
- **File(s)**: `components/layout/BottomTabBar.tsx`
- **What happened**: The home tab has `href: "/"` which becomes `/${locale}` (e.g. `/de`). The generic `pathname === fullHref || pathname.startsWith(fullHref + "/")` check would match `/de/coiffeur` as active for the home tab because `/de/coiffeur`.startsWith(`/de/`) is true.
- **Fix**: For the home tab specifically, use exact match only:
  ```typescript
  const isActive = href === "/"
    ? pathname === `/${locale}` || pathname === `/${locale}/`
    : pathname === fullHref || pathname.startsWith(fullHref + "/");
  ```
  This is already in `BottomTabBar.tsx` — use it as reference when adding locale-aware tabs.
