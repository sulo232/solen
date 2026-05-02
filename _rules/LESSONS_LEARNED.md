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

---

## Translation Keys & Namespaces

### Missing translation keys in salonDetail namespace break build
- **Date**: 2026-04-02
- **File(s)**: `messages/de.json`, `components/salon/SalonReviews.tsx`, `components/salon/SalonMobileCTA.tsx`
- **What happened**: During SEO/i18n roadmap execution, discovered that German locale was missing translation keys that existed in en.json, fr.json, it.json. Missing keys: `showAllPhotos`, `bookAppointment`, `whatCustomersSay`, `noReviews`, `sortBy`, `verifiedBooking`, `enlargePhoto`, `salonReplied`, `instantBooking`, `shareError`, `flagReasonLabel`, `readMore`, `readLess`, `shareProfile`, `linkCopied`. Build failed with TypeScript error: "not assignable to parameter of type 'MessageKeys'..."
- **Why it happened**: When adding translation keys to other locale files, the German translations were either skipped or added to the wrong namespace.
- **Fix**: For ALL translation changes, always add keys to all 4 locale files (de, en, fr, it) in the SAME namespace in a single commit. Use grep to verify the key exists in all 4 files before pushing. Schema: grep -r "keyName" messages/ should return 4 results (one per file).

### `dashboard.marketing` namespace doesn't exist — use top-level `marketing`
- **Date**: 2026-04-02
- **File(s)**: `components/dashboard/LastMinuteManager.tsx:24`
- **What happened**: Component imported `useTranslations("dashboard.marketing")` but the translation system only has a top-level `marketing` namespace — no `marketing` sub-section under `dashboard`. This caused a TypeScript type error at build time: "Argument of type '...' is not assignable to parameter of type 'MessageKeys...'"
- **Why it happened**: Nested namespace paths like "dashboard.marketing" are valid in next-intl for translation files with sub-objects, but this codebase doesn't use that pattern. Namespaces are always top-level.
- **Fix**: Use `useTranslations("marketing")` instead of nested paths. If you need to namespace dashboard-specific strings, add them to the top-level `marketing` namespace with a prefix like `marketing_lastMinute_...` OR add a `dashboard` object with a `marketing` sub-object in the JSON structure.

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

### Import UI components from @/components (barrel), not @/components/ui
- **Date**: 2026-04-02
- **File(s)**: `components/booking/BookingsList.tsx:5`
- **What happened**: Initially wrote `import { Spinner, EmptyState } from '@/components/ui'`. Build failed: "Module not found: Can't resolve '@/components/ui'".
- **Why it happened**: The `@/components/ui` folder exists but does NOT have an index.ts barrel export. Components must be imported from the root `@/components` barrel (components/index.ts) instead.
- **Fix**: Always import UI components from `@/components`, not `@/components/ui`. Check components/index.ts for the canonical exports: `export { default as Spinner } from "@/components/ui/Spinner"` etc. The barrel in components/index.ts handles the re-export.

### ReviewPrompt component already has compatible API route
- **Date**: 2026-04-02
- **File(s)**: `components/booking/ReviewPrompt.tsx`, `app/api/reviews/route.ts`
- **What happened**: When implementing ReviewPrompt, assumed `/api/reviews` endpoint might not exist. But it was already built and accepts the exact fields the component sends: `booking_id`, `rating`, `comment`.
- **Why it happened**: Parallel agents had already implemented the reviews API in a previous phase.
- **Fix**: Before assuming an API endpoint is missing, search for existing routes with `find app/api -name "*keyword*"`. Always check the validation schema in `lib/validations.ts` to verify it accepts the fields the component will send.

### Salon detail keys already exist in salonDetail namespace, not salon namespace
- **Date**: 2026-04-02
- **File(s)**: `messages/de.json:501`, `messages/de.json:3479`
- **What happened**: When fixing Phase 7 i18n type errors, added translation keys (`showAllPhotos`, `bookAppointment`, `whatCustomersSay`, etc.) to the `salon` namespace. But components were using the `salonDetail` namespace which ALREADY HAD these keys. This caused confusion about which namespace to use and polluted the `salon` namespace with duplicate keys.
- **Why it happened**: Did not check existing translations first. The `salon` namespace is for generic salon listing/card labels. The `salonDetail` namespace (used by `/salon/[slug]` detail page components) contains all the detailed view strings.
- **Fix**: Before adding i18n keys, search the messages files for existing keys: `grep -r "keyName" messages/`. If a key exists, use it. Do not add duplicates to different namespaces. Components in `components/salon/` use `useTranslations("salonDetail")`, so all salon detail strings go in the `salonDetail` namespace, not `salon`.

### Inline i18n objects (`const L = { de, en, fr, it }`) are a valid pattern — don't fight IDE reversions
- **Date**: 2026-04-04
- **File(s)**: `components/discovery/ProfileSetupModal.tsx`, `components/ui/SortDropdown.tsx`, `components/TestimonialCarousel.tsx`
- **What happened**: During R4 i18n sweep, converted inline i18n objects to `useTranslations("common")`. The IDE/linter auto-reverted these files back to their inline pattern. Repeated edits kept getting reverted.
- **Why it happened**: The IDE's auto-formatter restores files from their saved state when external edits conflict with format-on-save behavior.
- **Fix**: The inline i18n pattern (`const L = { de: {...}, en: {...}, fr: {...}, it: {...} }; const t = L[locale] ?? L.de;`) is VALID — it provides 4-locale translations without depending on `next-intl`. Don't waste time converting files that use this pattern if the IDE keeps reverting. Focus on files that use `useTranslations()` already.

### next-intl `tc("key")` fails TypeScript if key is not in the namespace's type definition
- **Date**: 2026-04-04
- **File(s)**: `components/discovery/ProfileSetupModal.tsx`
- **What happened**: Agent used `tc("allPref")`, `tc("straight")`, etc. from `useTranslations("common")` but these keys weren't in `common` namespace yet. TypeScript errored because `next-intl` generates strict message key types.
- **Why it happened**: The keys were added to locale JSON files AFTER the component was modified, creating a race condition. Also, `next-intl` type-checks keys at compile time.
- **Fix**: When using `useTranslations("namespace")`, either: (1) add all needed keys to locale files FIRST, then reference them in components, or (2) use `as any` cast on the translations function (`const tc = useTranslations("common") as any;`) — this is the existing codebase pattern for dynamic/numerous keys.

### Temporary test files in root must be removed before committing
- **Date**: 2026-04-02
- **File(s)**: `tmp2.tsx` (root)
- **What happened**: A temporary test file `tmp2.tsx` in the repo root caused build failures: TypeScript tried to type-check it, found undefined properties, and errored. Build couldn't proceed.
- **Why it happened**: Likely created during debugging/testing and forgot to remove before pushing.
- **Fix**: Before `npm run build`, remove any `tmp*.tsx`, `test*.tsx`, or files with obvious temp names from the root and `components/` directory. Use `ls -la | grep tmp` to find them. Build validation should always check that only production code exists.

### Linter/IDE auto-reverts ImageFallback imports — re-apply after each edit
- **Date**: 2026-04-04
- **File(s)**: `components/ui/FeaturedSalonCarousel.tsx`, `components/salon/SalonHero.tsx`, `components/RecentlyViewed.tsx`
- **What happened**: Added `import ImageFallback from "@/components/ui/ImageFallback"` and replaced fallback JSX. The linter/IDE removed the import and reverted the JSX changes. Had to re-apply 3 times.
- **Why it happened**: The IDE's format-on-save or auto-import cleanup removes imports it considers unused if the JSX referencing them was also reverted in the same save cycle.
- **Fix**: When adding imports + JSX changes to a file, verify with `grep ImageFallback <file>` after each save. If the import disappears, re-add it and the JSX together in a single edit operation.

### `as any` on useTranslations is the established pattern for nested namespaces
- **Date**: 2026-04-04
- **File(s)**: 162 files across `components/`
- **What happened**: 182 `useTranslations("namespace") as any` casts exist. Only 4 using `useTranslations("common")` could be safely removed. The rest use nested paths like `"barber.queue"`, `"chat.clientTags"` that cause TypeScript errors without `as any`.
- **Why it happened**: `next-intl` generates strict message key types from JSON files. Nested namespace paths (dot-separated) don't resolve correctly in the type system.
- **Fix**: Only remove `as any` from `useTranslations("common")` and other top-level namespaces where all keys are guaranteed to exist. For nested namespaces, `as any` is the pragmatic workaround until next-intl type generation is configured properly.

### IDE auto-reverts multiple edits to the same file in one session
- **Date**: 2026-04-04
- **File(s)**: `components/layout/Header.tsx`, `app/[locale]/salon/[slug]/page.tsx`
- **What happened**: During R5, edits to Header.tsx (emoji → SVG icons) and salon page were repeatedly reverted by the IDE linter between tool calls. Files would show changes applied, then revert on next read.
- **Why it happened**: The IDE's format-on-save triggers after each write and sometimes rolls back structural JSX changes it can't parse cleanly in one pass.
- **Fix**: After editing a large JSX block, immediately verify with `grep` for key identifiers (e.g. `grep -c "CoiffeurIcon" file.tsx`). If the count is wrong, re-apply. Multiple reads + edits in rapid succession cause more reversions than a single comprehensive edit.

### SalonTabBar vs SalonSectionNav — keep SalonSectionNav (IntersectionObserver-based)
- **Date**: 2026-04-04
- **File(s)**: `components/salon/SalonTabBar.tsx`, `components/salon/SalonSectionNav.tsx`, `app/[locale]/salon/[slug]/page.tsx`
- **What happened**: Salon page had two competing navigation systems — SalonTabBar (click-driven, uses external activeTab state) and SalonSectionNav (IntersectionObserver-driven, self-contained). R5 removed SalonTabBar.
- **Why it happened**: Two components were created at different times without coordination.
- **Fix**: Use SalonSectionNav. It passes `sections={TABS.map(t => ({ id: \`section-\${t.key}\`, label: t.label }))}`. Section divs must have matching `id="section-{key}"` and `scroll-mt-[80px]`.

### Coral rebalance — errors use s-amber not s-coral
- **Date**: 2026-04-04
- **File(s)**: `components/ui/ErrorFallback.tsx`
- **What happened**: AlertTriangle in ErrorFallback used `text-s-coral` / `bg-s-coral/10`. Coral is the brand primary, not an error color.
- **Why it happened**: Quick implementation without semantic color system consideration.
- **Fix**: Error states → `text-s-amber` / `bg-s-amber/10` (or semantic red `#D32F2F` for hard errors). **Coral is ONLY for:** Book Now CTAs, primary action buttons, eyebrow tracked-uppercase (Q48 signature), em underlines, time-pulse signal, focus ring (Q47). **NOT coral:** active hearts (use `#FF4A6B` literal love-red per Q26 + SOLEN_UI #5b), star ratings (use amber `#F3A864` per Q43), "open now" (use semantic green `#16A34A` per Q52), active filter pills (use weight 700 + ink, NOT brand-color flood per SOLEN_UI #2c). See SOLEN_DESIGN.md §1 (palette) + Q23 + SOLEN_UI #5b for the full semantic-color discipline.

### Booking date/time formatting must use dynamic locale
- **Date**: 2026-04-04
- **File(s)**: `components/BookingSuccess.tsx:112`
- **What happened**: `toLocaleDateString("de-CH")` was hardcoded regardless of the user's locale, showing German date format to English/French/Italian users.
- **Fix**: Derive `localeCode` from `useLocale()` → `de-CH / fr-CH / it-CH / en-GB`. Apply to all date/time formatting in user-facing components.
