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

### When a roadmap says "render X containing Y", open the file and verify Y is actually being rendered
- **Date**: 2026-03-31
- **File(s)**: `components/ui/CityCarouselSection.tsx`
- **What happened**: Roadmap Phase 3 R1 said "`CityCarouselSection` containing the `SalonCard` components". Instead of opening `CityCarouselSection.tsx` to confirm it renders `SalonCard`, I assumed it did and only addressed R2 (typography). `CityCarouselSection` was actually rendering its own inline `AirbnbSalonCard` — a stripped-down card with no image carousel, no pagination dots, no Airbnb badges.
- **Why it happened**: Surface-level assessment instead of code verification. Read the roadmap requirement, ticked it off mentally, moved on without checking the actual file.
- **Fix / Rule**: When a roadmap spec says "component A must contain/use component B", **open component A's file and grep for `import B` or `<B`** before marking it done. Never assume a wrapper component is rendering the right child — verify it. If the import isn't there, it needs to be added.

---

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

---

## Roadmaps can describe problems already solved by a prior agent

### Check if a feature already exists before building it
- **Date**: 2026-03-31
- **File(s)**: `components/HomePage.tsx:363`, `components/RecentlyViewed.tsx`
- **What happened**: Phase 4 of `roadmap-empty-states-discovery.md` assumed "Recently Viewed" was never surfaced. But `<RecentlyViewed />` was already imported and rendered in `HomePage.tsx`. Another agent had implemented it between when the roadmap was written and when it was executed.
- **Why it happened**: Roadmaps are written at a point in time. Parallel agents can implement features that a roadmap assumed were missing.
- **Fix / What to do instead**: Before implementing any roadmap phase, grep for the target feature in the codebase. If it exists, assess whether the existing implementation satisfies the goal — if yes, skip or extend rather than rebuild.

---

### Windows local build failures don't block pushes when pre-existing
- **Date**: 2026-03-31
- **File(s)**: `.next/`, `package.json`
- **What happened**: `npm run build` on Windows consistently fails with webpack chunk ID race conditions (`Cannot find module './8548.js'`) when run multiple times in the same session. The error does not occur on Vercel (Linux, clean build environment).
- **Why it happened**: Windows file system behavior + Next.js webpack incremental cache = chunk IDs change between runs, causing the second build to fail when it can't find chunks from the first.
- **Fix / What to do instead**: Confirm the error exists on the original unmodified codebase (do a git stash and build). If it does, the error is pre-existing and safe to push — Vercel will build cleanly. Always check Vercel deployment status after push to confirm.

---

## API Routes

### `/api/waitlist` is a booking waitlist, NOT a generic email capture
- **Date**: 2026-03-31
- **File(s)**: `app/api/waitlist/route.ts`, `app/[locale]/coming-soon/page.tsx`
- **What happened**: Roadmap said "verify `/api/waitlist` accepts `{ email, feature }`". The actual route requires auth + `salon_id`/`service_id`/`preferred_date` fields — it's for booking waitlists, not email signups.
- **Why it happened**: The roadmap assumed a generic waitlist endpoint existed.
- **Fix**: Created a dedicated `/api/coming-soon-notify/route.ts` that accepts `{ email, feature }` without auth. The Coming Soon page uses this endpoint. If the `coming_soon_signups` table doesn't exist yet, the route fails silently so the UX still works.

---

## i18n / next-intl

### `t("key", { fallback: "..." })` is not supported by next-intl — renders raw key path on screen
- **Date**: 2026-03-31
- **File(s)**: `components/SalonCard.tsx:210,228`
- **What happened**: `SalonCard.tsx` called `t("guestFavorite", { fallback: "Guest Favorite" })` and `t("topRated", { fallback: "Top Rated" })`. Because the keys were missing from the messages files AND next-intl does not support the `fallback` option, it rendered the raw key path (e.g. "salon.guestFavorite") literally on screen as a badge label.
- **Why it happened**: `next-intl` does NOT support a `fallback` option in the `t()` call. The correct way to avoid missing-key crashes is to add the key to all 4 locale files. The `{ fallback }` pattern works in some other i18n libraries (e.g. `react-i18next`) but not here.
- **Fix**: (1) Add the missing key to all 4 locale files (`messages/de.json`, `en.json`, `fr.json`, `it.json`) under the correct namespace. (2) Call `t("key")` with no second argument. Never use `{ fallback: "..." }` in next-intl — it is silently ignored and the raw key is displayed.

---

## Booking Wizard

### BookingStep enum uses 'confirm' not 'confirmation'
- **Date**: 2026-04-02
- **File(s)**: `lib/booking-state.ts:7`
- **What happened**: When creating ConfirmationStep.tsx, initially expected to call `goToStep('confirmation')` but the BookingStep type union is `'services' | 'staff' | 'date' | 'time' | 'confirm' | 'payment'`. The correct step name is `'confirm'` (shortened).
- **Why it happened**: The BookingStep type uses abbreviated step names for brevity.
- **Fix**: When navigating the booking wizard, reference the exact BookingStep enum values, not expanded names. Always check `lib/booking-state.ts` for the canonical step names before building components.

### Payment method is already in BookingFormData
- **Date**: 2026-04-02
- **File(s)**: `lib/booking-state.ts:28`, `lib/booking-context.tsx:24`
- **What happened**: When creating PaymentStep component, assumed `paymentMethod` field didn't exist in BookingFormData. It was already defined with type `'online' | 'in_person' | null`.
- **Why it happened**: Didn't check the booking state types file before writing the component.
- **Fix**: Always verify field names in BookingFormData at `lib/booking-state.ts` before adding payment/form handling logic. The field was already there; just use `updateFormData({ paymentMethod: method })` from the context.

### Page params must be Promise<T> in Next.js 15+ with App Router
- **Date**: 2026-04-02
- **File(s)**: `app/[locale]/salon/[slug]/booking/page.tsx:10`
- **What happened**: Initially defined `params: { locale: string; slug: string }` but Next.js 15 requires `params: Promise<{ locale: string; slug: string }>`. Build errored until fixed.
- **Why it happened**: Next.js 15+ made params async to support streaming + dynamic routes. Old patterns don't work.
- **Fix**: All page components that receive dynamic route params must declare `params: Promise<T>` and `await` them in the component. Also apply to `generateMetadata()`. Reference: coiffeur/page.tsx uses this pattern correctly.

### Translation namespaces must use dot notation for nested paths
- **Date**: 2026-04-02
- **File(s)**: `app/[locale]/confirmation/page.tsx:7`, `messages/de.json:2824`
- **What happened**: Created a new "successPage" namespace in translation files and tried to access it with `getTranslations('successPage')`, but the keys were nested under "ui.successPage". Build completed but nextl-intl threw "MISSING_MESSAGE" errors at runtime.
- **Why it happened**: Misunderstood the namespace hierarchy. When translations are nested (`ui -> successPage`), the namespace path must use dot notation.
- **Fix**: Always use `getTranslations('namespace.subnamespace')` or `useTranslations('namespace.subnamespace')` when accessing nested translation keys. Check existing examples like `BookingSuccess.tsx` which uses `useTranslations("ui.bookingSuccess")` for reference.

### Use createAdminSupabaseClient in Server Components, not createServerClient
- **Date**: 2026-04-02
- **File(s)**: `app/[locale]/salon/[slug]/booking/page.tsx:4`
- **What happened**: Imported `createServerClient` which doesn't exist. Should use `createAdminSupabaseClient()`.
- **Why it happened**: Assumed a generic "server client" function existed when the actual exports are `createServerSupabaseClient()` and `createAdminSupabaseClient()`.
- **Fix**: Check lib/supabase.ts for actual function names before importing. For data fetching in Server Components (like booking page), use `createAdminSupabaseClient()`.

### Metadata must be hardcoded or imported as static strings, not via i18n getTranslations
- **Date**: 2026-04-02
- **File(s)**: `app/[locale]/salon/[slug]/booking/page.tsx:18-20`
- **What happened**: Tried to use `getTranslations({ locale, namespace: 'metadata' })` inside generateMetadata. TypeScript error: metadata namespace doesn't exist, and the call pattern was wrong.
- **Why it happened**: Misunderstood how next-intl's getTranslations works in Server Components.
- **Fix**: Metadata should be static strings or Metadata objects returned directly. Use getTranslations for page content only, not metadata. See coiffeur/page.tsx for the correct pattern of hardcoding titles + descriptions.
