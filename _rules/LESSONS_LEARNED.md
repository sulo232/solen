# Solen.ch — Lessons Learned & Common Pitfalls

> LEDGER STATUS (updated 2026-07-11, supersedes the 2026-07-03 note): this file is the ONLY ledger the `~/.claude/hooks/lessons-ledger-inject.py` PreToolUse hook reads (hardcoded path, see `~/.claude/REGRESSION_SYSTEM.md`). The 2026-07-03 banner told agents to also check CLAUDE.md pinned blocks and memory feedback files "since newer lessons live there" , that left a month+ of lessons (entries stopped at 2026-06-05) invisible to the edit-time injector, which is the whole point of this file. Current law: feed EVERY new non-obvious bug/footgun here, in the same turn as the fix, not just backend/DB. CLAUDE.md pinned blocks and memory feedback files are still useful reading, but the injector does not see them , if a lesson only lives there, it will not resurface at edit time.

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

### A migration file describes a replay, not the live database
- **Date**: 2026-07-27
- **File(s)**: `supabase/migrations`, `_inventory/_db-snapshot.json`
- **What happened**: Two independent research agents each filed a CRITICAL finding straight off the migration folder. One read `005_reviews_trust.sql:29` (creates a permissive `FOR UPDATE USING (true)` policy) plus `009_verified_reviews_rls.sql:30` (drops a differently-named policy) and concluded the permissive policy survives live; querying `pg_policies` directly showed the `reviews` table has exactly four correctly scoped policies and the permissive one does not exist. The other read `20260530_seed_salon_amenities.sql`, which fabricates nine amenity booleans (including `wheelchair_accessible`) from a hash of the salon id, and reported them as live data; counting live returned 0 true across all 20 active salons; the seed was never applied, or was reverted. A third finding had the same shape one level out: email builders were reported as ignoring their locale parameter from reading the builder source, when all 27 use it correctly and the real defect was at the call sites.
- **Why it happened**: A migration file reads exactly like a schema description, and nothing about its syntax marks it as historical intent rather than current state. Two migrations naming different policy names on the same table look, on paper, like the earlier one survives; only a live catalog query resolves which policy actually exists. Nothing in this estate ever replays the migration folder onto a clean database, so a replay-only landmine (or a reverted one) is invisible to every check except a direct live query.
- **Fix / What to do instead**: Any claim about current schema, policy, or data state is made against the LIVE database: a read-only SQL query first (`pg_policies`, `information_schema.columns`, or the Supabase MCP `execute_sql`), then `_inventory/_db-snapshot.json` / `_db-columns.json` as a fast but staleness-prone second check (14 days and 4 tables stale when this was written: 146 recorded vs 150 live tables, and `_db-columns.json` carries column names only, no types), and the migration files LAST, as evidence only about what a replay would produce. State explicitly which question an audit answers: "is this true now" or "would a restore make this true". Full rule: `_rules/DB_SCHEMA.md` section 9.

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

### An ancestor `overflow` value other than `visible` can silently strip a descendant's `sticky` pin (layout-geometry-03)
- **Date**: 2026-07-27
- **File(s)**: `app/[locale]/_components/salon/SalonDetailV3.tsx:194-201` (the original fix, V3-D229, 2026-05-27)
- **What happened**: Setting `overflow-hidden` (or `overflow-x-clip` / `overflow-y-auto` / `overflow-scroll`) on ANY ancestor of a `position: sticky` element creates a new containing block for that ancestor's subtree. The sticky descendant's own `sticky`/`top` declaration is untouched, but it silently stops being able to pin against the viewport because it is now scoped to the wrong containing block. On `SalonDetailV3`, the desktop sidebar wrapper had `sticky top-24` but an ancestor carried `overflow-hidden` for an unrelated reason; the sidebar scrolled away with the page instead of staying pinned, hiding the "Termin buchen" CTA.
- **Fix**: Before adding `overflow-hidden`/`overflow-x-clip`/`overflow-y-auto`/`overflow-scroll` to any container, grep its subtree for a `sticky` descendant (`grep -rln sticky app --include=*.tsx` currently returns 55 files, so the collision surface is wide). If a `sticky` descendant exists, either move the `overflow` rule to a narrower wrapper that does not sit between the sticky element and the viewport, or re-verify after the change that the sticky element still pins. If it stopped pinning, the `overflow` value on the ancestor is the cause, not the `sticky` rule itself. See `_design-system/LOCKFILE.md`'s sticky-header-offset subsection for the separate (and already-locked) z-index/stacking-order rule; that rule is a DIFFERENT failure class from this containing-block trap.

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
- **What happened**: `npm run build` on Windows consistently fails with webpack chunk ID race conditions (`Cannot find module './8548.js'`) when run multiple times in the same session. The error does not occur in CI (Linux, clean build environment — was Vercel at the time, now Netlify).
- **Why it happened**: Windows file system behavior + Next.js webpack incremental cache = chunk IDs change between runs, causing the second build to fail when it can't find chunks from the first.
- **Fix / What to do instead**: Confirm the error exists on the original unmodified codebase (do a git stash and build). If it does, the error is pre-existing and safe to push — Linux CI builds cleanly. Check the Netlify deploy status after push to confirm.

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

### Coral rebalance — errors use s-amber not s-brand (lesson principle still holds for V3 teal)
- **Date**: 2026-04-04 (lesson) · **V2-D15-3 supersession** 2026-05-07: V3 brand is dark teal `#043338`, not coral. The discipline below is unchanged — substitute "brand teal" wherever this lesson says "coral".
- **File(s)**: `components/ui/ErrorFallback.tsx`
- **What happened**: AlertTriangle in ErrorFallback used `text-s-coral` / `bg-s-coral/10`. The brand color is not an error color.
- **Why it happened**: Quick implementation without semantic color system consideration.
- **Fix (V3-aligned)**: Error states → `text-s-error` `#D32F2F` (or `text-s-warning` `#F59E0B` for soft alerts). **Brand teal `#043338` (`s-brand` / `s-coral` token) is ONLY for:** Book Now CTAs, primary action buttons, eyebrow accents, em underlines, time-pulse signal, focus rings, "Heute frei" status text, the ONE saturated Solen Pro feature panel. **NOT brand teal:** active hearts (use love-red `#FF4A6B` literal per LIVE_TRUTH §3), star ratings (use `s-star` `#F3A864`), "open now" (use `s-success` `#16A34A`), active filter pills on category pages (use category combo bg/text per LIVE_TRUTH §25.5). See `_design-system/SOURCE.md` + `_design-system/LOCKFILE.md` + `_rules/SOLEN_UI.md` for the current, canonical semantic-color discipline. (The teal hexes in this lesson are retired; `_tasks/archive/SOLEN_LIVE_TRUTH.archived.md` is archived.)

### Booking date/time formatting must use dynamic locale
- **Date**: 2026-04-04
- **File(s)**: `components/BookingSuccess.tsx:112`
- **What happened**: `toLocaleDateString("de-CH")` was hardcoded regardless of the user's locale, showing German date format to English/French/Italian users.
- **Fix**: Derive `localeCode` from `useLocale()` → `de-CH / fr-CH / it-CH / en-GB`. Apply to all date/time formatting in user-facing components.
- **copy-i18n-05 (2026-07-27)**: this exact bug recurred at 112 call sites months after the fix above, because the fix was prose-only with no mechanical check. `eslint.config.mjs` now has a `no-restricted-syntax` rule that blocks any literal BCP-47 tag (`de-CH`/`fr-CH`/`it-CH`/`en-CH`) passed directly to `toLocale*String`/`Intl.*Format` outside `lib/format.ts`, so the next occurrence fails lint instead of shipping silently a third time.

---

### `opening_hours` uses SHORT day keys (`mon`/`tue`…), never `monday`
- **Date**: 2026-06-05
- **File(s)**: `lib/salon-hours.ts`, `components-legacy/CategoryPage.tsx`, `app/api/salons/route.ts`
- **What happened**: The "Jetzt geöffnet" (open-now) filter silently returned an EMPTY list on every city/category page. Root cause: live `salons.opening_hours` jsonb is keyed by SHORT day names (`{ mon: {open,close}, tue: … }`, missing key = closed that day) — what the onboarding form, `_shared.ts`, and 18/18 seeded salons use — but `lib/salon-hours.ts isOpenNow()` looked up LONG names (`opening_hours["monday"]`). `undefined` every time → `isOpen:false` for every salon. `StatusPill` looked fine only because it computes open/closed via the short-key helper in `_shared.ts`, not `isOpenNow`.
- **Why it happened**: Two same-named `OpeningHours` types (`lib/salon-hours.ts` vs `lib/types.ts`) and two day-key conventions coexisting; the long-key path was never exercised against real data, so it "compiled and shipped" broken.
- **Fix / What to do instead**: `isOpenNow` now reads BOTH conventions (`DAY_KEYS_SHORT[d] ?? DAY_KEYS_LONG[d]`). When touching opening_hours anywhere, assume SHORT keys (`mon` `tue` `wed` `thu` `fri` `sat` `sun`), each `{ open, close }` as "HH:MM", missing key = closed. Verify any is-open helper against REAL data + the current Zurich time (`npx tsx` one-shot), never just that it type-checks.

---

### Compute-based filters resolve IDs BEFORE `.range()` — and must be proven to DISCRIMINATE
- **Date**: 2026-06-05
- **File(s)**: `app/api/salons/route.ts`, `app/[locale]/_components/search/SearchTemplate.tsx`, `components-legacy/CategoryPage.tsx`
- **What happened**: `open_now` was a dead filter — the UI set the param + counted it as active, but nothing filtered by it. A first pass filtered client-side over one fetched page, so the count + "load more" lied (page-1 only).
- **Why it happened**: Filters that depend on JS/compute logic (open-now via `isOpenNow` over jsonb; Zurich tz + overnight wrap) can't be a PostgREST `.eq()/.gte()` predicate, so they get deferred or faked client-side.
- **Fix / What to do instead**: Mirror the `instant_bookable`/`gender`/`price` pattern in `/api/salons` — resolve matching `salon_id`s first (sub-query, or in-JS over a light `select("id, opening_hours")`), then `query.in("id", ids)` **before** `.range(offset, …)`, so `count`/pagination stay honest. FE forwards the param via `buildUrl`; toggle pills go through the generic `TOGGLE_PILLS` set (no per-pill hardcoding). When QAing ANY filter, prove it returns a correct SUBSET (compare against the helper applied to the full set), not just that the control renders or the route returns 200.

## 2026-07-15 , dormant source code resurrected an owner-rejected treatment in a mockup
Copying UI from a component file into a mockup reproduced a discount badge that never renders in the product and that the owner had explicitly rejected. Lesson: before including any element in a mockup or rebuild, prove it RENDERS live (real route, real data) and check REJECTED_TREATMENTS.json / REMOVED.md / TASTE_LOG.md. Dead code is where rejected taste hides. Gate: scripts/hooks/mockup-resurrection-gate.py.
---

## Auth / RLS

### `getSession()` trusts an unverified cookie; server code must use `getUser()`
- **Date**: 2026-07-10
- **File(s)**: `app/api/bookings/route.ts`, `lib/supabase/server.ts`
- **What happened**: `getSession()` reads the session straight out of the cookie without contacting Supabase Auth, so a forged/stale cookie is trusted as-is. 256 files + 14 `app/[locale]` server components across the backend used it for identity checks, a forged-cookie authz hole that shipped and typechecked fine.
- **Why it happened**: `getSession()` and `getUser()` look interchangeable (`session.user` vs `user` are the same shape) and both compile; nothing failed a type check or a happy-path test.
- **Fix / What to do instead**: Server-side identity checks (route handlers, server components, middleware) MUST call `getUser()` (round-trips to Supabase Auth to verify the JWT), never `getSession()`. `no-getsession-authz-gate.py` now blocks server-side `getSession()` reintroduction, commit `c01310364` — if the gate fires, use `getUser()`, don't bypass it.

### A customer's session client silently no-ops on owner-only RLS writes
- **Date**: 2026-07-07
- **File(s)**: `app/api/bookings/route.ts:CAS`, `app/api/bookings/[id]/reschedule/route.ts`, `app/api/bookings/express-rebook/confirm/route.ts`
- **What happened**: `availability_slots` UPDATE/DELETE is owner-only under RLS and `bookings` has no DELETE policy. A CAS slot-claim fix run through the logged-in customer's session client matched 0 rows on every write (not an error, just 0 affected rows), so the fix returned a false 409 on 100% of real bookings and left orphaned rows on rollback. The logic was correct, the client was wrong.
- **Why it happened**: RLS denials on `.update()`/`.delete()` are silent no-ops (0 rows), not thrown errors, so a typecheck + logic review sees nothing wrong; only a live non-owner run exposes it.
- **Fix / What to do instead**: Any customer-initiated write to `availability_slots` (claim/free/reschedule) or a `bookings` row delete MUST go through the service-role/admin client, never the session client. Plain `bookings` UPDATEs can stay on the session client (`bookings_update_own` permits the owner). Booking-critical fixes must be LIVE-VERIFIED as a real non-owner customer (`GET /api/dev/login?to=<path>` mints one), not just typechecked.

---

## Cron / Background Jobs

### An unchecked `.select()` error looks identical to "zero matching rows"
- **Date**: 2026-07-07
- **File(s)**: `app/api/cron/release-deposits/route.ts`, `app/api/cron/birthday-messages/route.ts`
- **What happened**: Both crons selected a column that had drifted from the live schema. The `.select()` error was never checked, so the cron logged "0 rows processed" every run, indistinguishable from a genuinely empty batch, and stayed broken silently for weeks.
- **Why it happened**: A phantom-column select doesn't throw in Supabase, it returns `{ data: null, error: {...} }`; ignoring `error` and only checking `data` (or `data?.length`) hides the failure behind an innocuous "nothing to do today."
- **Fix / What to do instead**: Every cron/batch `.select()` must check `error` explicitly and fail loud (`console.error("[CronName] select failed:", error)` + non-zero exit or alert), never fall through to "processed 0 rows." Verify a cron's SELECT columns against the live snapshot (`npm run exists <column>`), not the TS type.

---

## Payments / Stripe

### A webhook retry must be idempotent even after the underlying row already flipped state
- **Date**: 2026-07-11
- **File(s)**: `app/api/stripe/webhook/route.ts`
- **What happened**: `charge.dispute.closed` decremented the salon's payout balance on every delivery. Stripe redelivers webhooks (retries, at-least-once delivery), so a redelivered `dispute.closed` event double-decremented the same dispute, a real money bug in prod.
- **Why it happened**: The handler treated the event as a one-time transition instead of guarding against replay; nothing marked "this dispute's payout impact was already applied."
- **Fix / What to do instead**: Added an atomic CAS marker (`salon_payouts.lost_dispute_id`, migration `20260711160000`) so a retry/redelivery matches 0 rows and no-ops instead of decrementing twice. Any webhook handler that mutates money must be provably idempotent against redelivery, not just correct on the first delivery, kill-tested with the old-buggy-shape case included (`scripts/ring8b-kill-test.ts`).

---

## Agent Workflow

### Audit findings must be re-verified against live data before acting on them
- **Date**: 2026-07-07
- **File(s)**: `_plans/SCALABILITY_AUDIT_P2.md`
- **What happened**: A scalability audit claimed "137k dead availability_slots rows" and "thumb proxy down, every Inspo card renders a gradient." Live re-measurement found ~1,983 actually-dead rows and 433 cached thumbs covering 87% of items, both audit claims were false or badly overstated.
- **Why it happened**: The audit reasoned from migration files / a projected future scale (1000 salons) instead of the live DB (28 salons, one table over 10k rows), so several "criticals" didn't reflect production reality.
- **Fix / What to do instead**: Before acting on an audit/report finding (fixing it, or deprioritizing it as premature), re-measure against the LIVE database (`execute_sql` / `get_advisors` on the real tables), not the migration files or the audit's stated numbers. Also verify RLS policies against live `pg_policies`, migration files can be stale vs what's actually applied.

### A workflow's custom agent type has no ToolSearch/MCP access
- **Date**: 2026-07-11
- **File(s)**: `_plans/BACKEND_IMPROVEMENT.md`
- **What happened**: DB-touching bulk work dispatched to the `coder`/`loop-reviewer` custom workflow agent types silently couldn't reach ToolSearch-gated tools or MCP servers, work that needed direct DB access stalled without an obvious error pointing at the cause.
- **Why it happened**: Custom `agentType`s in a workflow inherit a narrower tool surface than the default agent type; nothing in the workflow definition flags the gap up front.
- **Fix / What to do instead**: Any workflow step that needs to touch the DB or another MCP server directly must run on the DEFAULT workflow agent type (or have the orchestrator do the MCP call itself), not a custom `coder`/`loop-reviewer` type.

### Fabricated display values are a CLASS, not incidents , now gated
- **Date**: 2026-07-16
- **File(s)**: `scripts/hooks/fabricated-value-gate.py`, historical: `forYouSalons.ts`, `Nearby.tsx`, `RecentlyViewed.tsx`, `searchCategories.ts`
- **What happened**: Owner: "isnt ths maiking up fake sh a reccuring pattern". It was: fake times (2026-06-05), hardcoded homepage ratings/prices/addresses contradicting the live DB for weeks, "42 Salons" category counts vs 20 real salons total, fake distances, a fabricated-discount list, isSaved: true. Root cause: demo-first building ("static demo data, real queries are a later phase" comments) where the wiring phase never arrives, plus rule 1 existing only as advice.
- **Why it happened**: A plausible literal renders identically to a wired value, so review, typecheck, and screenshots all pass; only a DB cross-check exposes it. Advice loses to task focus; nothing blocked the literal at edit time.
- **Fix / What to do instead**: Wire real values via the salonCardData.ts pattern (server batch fetch, null-safe omission, never invented fallbacks) or omit the element. `fabricated-value-gate.py` (PreToolUse, selftest 15/15) now blocks net-new rating/price/address/distance/clock-time/discount/isSaved literals on customer surfaces; escape is `live-data-ok: <reason>`. When building UI before data exists, render the honest empty/omitted state, never a placeholder number.

### Section-card grammar DRIFT is a CLASS: sibling section wrappers diverge from the §427 lock
- **Date**: 2026-07-19
- **File(s)**: `app/[locale]/_components/salon/SalonTeam.tsx`, `app/[locale]/_components/salon/SalonReviews.tsx`, `app/[locale]/_components/salon/SalonServices.tsx`, `app/[locale]/_components/primitives/SeeAllButton.tsx`
- **What happened**: On the salon PDP the three section wrappers each rendered a DIFFERENT card grammar , Services `rounded-[24px] border border-s-border shadow-whisper` (correct §427), Team `rounded-3xl shadow-float` (no border), Reviews `rounded-2xl(16) shadow-float` (no border, wrong radius). The owner saw "the borders of services vs team vs reviews are so different." The see-all was a 150x45 `bg-s-bg-sunken px-8 py-3` gray pill instead of the locked ink text-link + chevron (LOCKFILE §170). This drifted off a grammar the owner LOCKED the same day (LOCKFILE §427, 2026-07-19).
- **Why it happened**: 5 rounds of mockups were built INVENTING a change instead of DERIVING it from a measured diff of the real rendered page vs the locked law , the real defects (three §427 divergences + the see-all form) were sitting in the measured facts the whole time and never got named. It was a code drift-sweep mis-routed as a design exploration.
- **Fix / What to do instead**: A salon-PDP section wrapper (Services/Team/Reviews and peers) must use the §427 grouped-list-card grammar `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper` (rows hairline-divided), never `rounded-3xl`/`rounded-2xl` or `shadow-float`. See-all: SPLIT by intent (LOCKFILE §170 row updated 2026-07-19 , Services/Reviews pill, Team ink link). Before ANY mockup, DERIVE the change from a measured page-vs-lock diff (`getComputedStyle`); do not invent it. Gate: `.claude/hooks/mockup-diagnosis-gate.py` (blocks a mockup with no measured/cited `Diagnosis:` manifest + no-op rows); `card-radius-gate.py` already enforces whisper-only radius 24.

### Blanket-law application OVERRODE a dated owner approval , precedence inversion is a CLASS
- **Date**: 2026-07-19
- **File(s)**: `app/[locale]/_components/primitives/SeeAllButton.tsx`, `_design-system/LOCKFILE.md` (§1.5 see-all row), `_design-system/TASTE_LOG.md`
- **What happened**: The LOCKFILE row said see-all = ink + chevron, so ALL see-alls were "fixed" to ink via the shared primitive , wiping out the gray pill on the Services see-all that the owner had EXPLICITLY approved 2026-07-15 (recorded in the component's own header comment). Owner: "why did you remove the pill for the services? do you understand WHY I want the pill for that and why I didn't want it for the stylist?"
- **Why it happened**: A blanket LOCKFILE row was applied without checking for a more-specific DATED decision. The precedence chain says the latest dated owner decision wins , it was inverted. The evidence (the approval) was sitting in the component's header comment and was even quoted by the subagent, then overridden anyway.
- **Fix / What to do instead**: Before changing a shipped component's treatment to satisfy a general rule: (1) read the component's header comments for `owner-approved` notes; (2) grep TASTE_LOG for the surface; (3) if a dated approval conflicts with the blanket row, the DATED decision wins , update the LOCKFILE row to record the split instead of "fixing" the component. Per-element INTENT (why THIS element differs) is design information, not drift.

### Skip-flag SPAM neutered the whole gate system , gates only work if they can fire
- **Date**: 2026-07-20
- **File(s)**: `~/.claude/hooks/flag-spam-gate.py` (the fix), all `.claude/hooks/mockup-*-gate.py`
- **What happened**: Five design rounds failed IN A ROW while a full set of mockup gates existed (depicts, resurrection, english, preflight, grounding, no-flat, fullscreen, diagnosis). They never fired because every turn began with `for f in <12 skip flags>; do echo > ~/.claude/$f.flag; done` , wholesale pre-flagging that disarmed every gate before writing a single line. The gates were treated as friction to route around, not as the review.
- **Why it happened**: Gate messages cost a retry each; mass-flagging made the loop "smooth". But the smoothness WAS the failure: each gate that would have fired mapped to a real owner rejection that then happened live instead.
- **Fix / What to do instead**: A skip flag is a PER-GATE, PER-INCIDENT override with its own reason, set only AFTER that gate fired and the block was verified a false positive. `flag-spam-gate.py` (global PreToolUse Bash, self-test 4/4, live-fire proven) now BLOCKS any command setting flags in a loop or 3+ flags at once. When several gates fire on one write, satisfy them or fix the gate , never mute the system.

### Handing over a link that was never opened (the 'link' recurrence)
- **Date**: 2026-07-26
- **File(s)**: public/_research/missing-principles/index.html, .claude/launch.json
- **Match**: trycloudflare, localhost:3210, preview link, tunnel, serve dir
- **What happened**: Links kept reaching the owner dead. Three distinct causes in one session: a
  page written into the worktree's `public/` while the running dev server on :3000 served the MAIN
  repo's `public/` (the file 500s), a cloudflared hostname handed over before the tunnel had
  connected (it never did), and a browser tab showing a cached older build while I read numbers
  off it.
- **Why it happened**: four link gates exist (clickable-link, LAN-IP, branch-naming, tunnel-relink)
  and every one of them checks how the link is WRITTEN. None checks whether the URL RESPONDS. A
  link can satisfy all four and still be dead on arrival.
- **Fix / What to do instead**: Before handing over any localhost / 127.0.0.1 / trycloudflare URL,
  OPEN that exact URL in the same turn (browser navigate + get_page_text or a screenshot, or curl)
  and confirm it returns the page you mean. If it does not resolve, say so instead of shipping the
  link. ~~Enforced by `~/.claude/pending-hooks/link-verified-gate.py` (Stop hook, self-tested 11/11:
  4 block cases, 7 pass cases incl. backticked and fenced URLs and public https as out of scope).
  ARM IT WITH: `bash ~/.claude/pending-hooks/arm-link-verified-gate.sh` from a non-sandboxed shell.
  It is NOT armed yet: `~/.claude/settings.json` and the whole `~/.claude/hooks` directory are
  read-only under SANDBOX_RUNTIME=1 (`open(path,"r+")` -> PermissionError Errno 1, measured).~~
  **CORRECTED 2026-08-18, stale in three ways, and the one that matters is that this rule IS
  enforced.** (a) **The gate is LIVE.** `link-verified-gate.py` appears in no settings file, but
  that is not the test here: it is a MEMBER of `~/.claude/hooks/link-family-aggregator.py`, which IS
  wired in `~/.claude/settings.json` and runs each member as a subprocess. Verified today by reading
  that aggregator's `MEMBERS` list, where it sits with the comment "the link must have been OPENED
  this turn". (b) **The path is wrong.** The file lives at `~/.claude/hooks/link-verified-gate.py`.
  `~/.claude/pending-hooks/` does exist as a directory, but it holds nothing except a stray
  `.claude` subfolder, so nothing is pending there. (c) **The arming script does not exist.** There
  is no `arm-link-verified-gate.sh` anywhere under `~/.claude`, so that instruction was never
  runnable. Nothing needs arming: open the URL in the same turn before handing it over.
- **Trap for the next session**: to test write permission here use `open(p,"r+")` or
  `os.access(p, os.W_OK)`. Append mode `open(p,"a")` returns a FALSE POSITIVE and reports
  read-only paths as writable; that mistake cost a wrong claim in this session's own report.

### Handing a localhost preview link instead of a cloudflare tunnel
- **Date**: 2026-07-26
- **File(s)**: .claude/launch.json, public/_research/missing-principles/index.html
- **Match**: localhost:3210, localhost:3000, preview link, trycloudflare, tunnel
- **What happened**: The delivery link for a finished page went out as
  `http://localhost:3210/principles/`. On the owner's phone `localhost` resolves to the phone
  itself, so that link can never work for them. It is a worse failure than the LAN IP rule 0.5 was
  written to stop, because a LAN IP at least points at the right machine.
- **Why it happened**: `lan-ip-preview-gate.py` enforces rule 0.5 and blocks 10.x, 192.168.x and
  172.16-31.x. It does not match `localhost` or `127.0.0.1`, so the localhost form sailed past
  every existing link gate (clickable-link, LAN-IP, branch-naming, tunnel-relink).
- **Fix / What to do instead**: A preview link is a `https://<name>.trycloudflare.com/...` URL, or
  it is not a preview link. If the tunnel genuinely cannot connect, say so in the same message with
  cloudflared's own evidence next to the link (its connectivity pre-check, blocked port 7844, or
  hard_fail=true), because that evidence only exists if you actually ran it. Enforced by
  ~~`~/.claude/pending-hooks/cloudflare-link-gate.py` (Stop hook, self-tested 12/12: 4 block cases
  including a vague "the tunnel did not work" excuse and evidence placed too far from the link, 8
  pass cases including backticked and fenced URLs). ARM IT WITH:
  `bash ~/.claude/pending-hooks/arm-link-verified-gate.sh` from a non-sandboxed shell; the same
  script also arms link-verified-gate.py.~~
  **CORRECTED 2026-08-18, the same three staleness points as the entry above, and the same
  conclusion: this rule IS enforced.** `cloudflare-link-gate.py` lives at
  `~/.claude/hooks/cloudflare-link-gate.py`, not in `pending-hooks/` (that directory exists but is
  empty), and it is a MEMBER of the armed `~/.claude/hooks/link-family-aggregator.py`, so it runs on
  every closing message alongside nine sibling link checks. The `arm-link-verified-gate.sh` script
  named here does not exist anywhere under `~/.claude` and never did. Nothing to arm.

### A "cosmetic facet" seed migration fabricated accessibility and identity data
- **Date**: 2026-07-26
- **File(s)**: supabase/migrations/20260530_seed_salon_amenities.sql
- **Match**: wheelchair_accessible, lgbtq_friendly, woman_owned, hashtext, amenity, cosmetic facet, seed migration
- **What happened**: This migration set nine boolean columns on every active salon from
  `abs(hashtext(id::text || salt)) % 100 < N`, calling them "cosmetic facets" in its own header.
  Three of the nine are not cosmetic: `wheelchair_accessible` is an accessibility claim,
  `lgbtq_friendly` and `woman_owned` are identity claims about a real business. The live DB shows 0
  true across all nine columns on all 20 active salons (verified 2026-07-26 via
  `execute_sql`), so the UPDATE never actually ran against live data, it sat inert. But a migration
  replay (a restore drill, a fresh environment, a `supabase db reset`) would run it and invent
  those claims from a hash with no source of truth behind it.
- **Why it happened**: Grouping a real accessibility flag and two identity flags in with genuinely
  decorative ones (wifi, pet-friendly, student discount) under one "cosmetic" label made a
  hash-seed pattern look safe to apply to all nine, when it should only ever apply to the truly
  decorative ones.
- **Fix / What to do instead**: Never derive an accessibility or identity claim about a real
  business from a hash or any synthetic hashtext hash. Those need a real source (owner-entered
  profile data) or they stay unset. The migration's UPDATE is now commented out in place (with a
  dated block explaining why) rather than deleted or rewritten, per the never-edit-a-historical-
  migration's-effect rule. Before writing any new seed migration that touches a boolean/enum flag,
  check by name whether that flag is a decorative facet or an accessibility/identity/eligibility
  claim, only decorative facets may be hash-seeded.
- **Enforcement (2026-07-27)**: ~~`.claude/hooks/migration-fabrication-gate.py` blocks a new/edited
  `supabase/migrations/*.sql` file that writes to a non-test-scoped table using `hashtext(`,
  `random()`, or `md5(...) %`, unless a `fabricated-data-ok: <owner, date, plan>` comment is
  present. **CORRECTED 2026-08-26, and both earlier corrections on this line are themselves
  stale, so this is what is true today, measured rather than carried across.** The original
  2026-07-27 "Self-tested 8/8" was false when it was written; the 2026-08-21 correction that
  replaced it said the file was 103 lines with no test cases and wired nowhere, and that has
  since been overtaken. `migration-fabrication-gate.py` is now 275 lines, carries a
  `--selftest`, and IS registered in `.claude/settings.json` on `Write|Edit|MultiEdit`.~~
- **Enforcement, NAME CORRECTED 2026-08-18. This rule IS armed, under a different filename.** Two
  near-identical gates sit in `.claude/hooks/`. The one named in the struck line above,
  `migration-fabrication-gate.py`, is in no settings file and has never run, so its "NOT YET ARMED"
  sentence was true about that file. But **`.claude/hooks/migration-fabricated-data-gate.py` IS
  armed**, wired at three separate places in `/Users/sulo/Documents/solen/.claude/settings.json` on
  PreToolUse `Edit|Write|MultiEdit`, and it enforces the identical rule off the identical incident
  (the same `20260530_seed_salon_amenities.sql` hash-seeded amenity booleans). It denies a
  `supabase/migrations/**/*.sql` write whose added content pairs an INSERT/UPDATE with a value
  built from `hashtext(` / `random()` / `md5(` through a modulo. **The escape hatch differs, and
  that is the practical trap:** the armed gate looks for `seed-ok:` in the added content, NOT the
  `fabricated-data-ok:` string named above. Use `seed-ok:`.
- **THE WARNING ABOVE CAME TRUE, found 2026-08-26 while merging these two histories together.**
  That bullet ended "the unarmed twin is a duplicate to leave alone or delete, never to wire,
  since running both would double every deny". It got wired anyway. Measured in
  `.claude/settings.json` today, BOTH twins are registered on PreToolUse: the fabricated-data one
  at three entries (Edit, Write, MultiEdit) and the fabrication one at a single combined
  `Write|Edit|MultiEdit`. So one seed migration is now refused twice by two different files that
  want two different escape strings, and satisfying one still leaves the other refusing. Nothing
  is broken until someone writes such a migration, which is why it went unnoticed. Open decision:
  which twin to keep. Do not simply unregister one without checking which escape string the rest
  of this file and the migration docs tell people to use.

### `touch-action: pan-x` on a horizontal scroller BLOCKS vertical page scroll (I shipped it to 6 elements)
- **Date**: 2026-07-31
- **File(s)**: public/_mockups/home-v3/search-a.html
- **Match**: touch-action, pan-x, cannot scroll, can't scroll, blocked from scrolling, horizontal scroller, rail, scroll-snap
- **What happened**: The owner said three times he could not scroll a mockup on his phone. Every
  test available in the browser pane passed: `scrollTo()` moved the page, a real wheel gesture over
  a rail moved it 0 -> 532, `document.scrollHeight` was 1849 against an 844 viewport. So I
  diagnosed CSS and put `touch-action: pan-x` on the category row, the filter row and all four
  section rails, reasoning it would "give those elements the horizontal axis and let vertical pass
  through to the page". That is not what the property does. `touch-action` declares the COMPLETE
  set of gestures permitted for a touch that STARTS on the element, so `pan-x` permits horizontal
  panning and FORBIDS VERTICAL. Those six elements cover most of the screen, so a vertical swipe
  starting almost anywhere was refused by the browser, by my own rule. Owner, immediately after:
  "im blocked from scrolling bro". My second attempt, `pan-x pan-y`, permits both scroll axes but
  silently kills pinch-zoom, which is wrong on a phone mockup.
- **Why it happened**: Two compounding causes. (1) The property was read as a hint about axis
  OWNERSHIP rather than a whitelist of PERMITTED gestures. (2) A wheel gesture and `scrollTo()`
  are not touch, and `touch-action` is only consulted for touch, so the entire local test suite is
  structurally blind to this bug. A CSS property that only manifests under a real finger cannot be
  validated by any tool in the browser pane.
- **Fix / What to do instead**: Do not set `touch-action` on a horizontal scroller. The default
  (`auto`) already routes a sideways drag to the scroller and a vertical drag to the page by
  gesture direction, and keeps pinch-zoom. Only reach for `touch-action` to suppress a specific
  browser gesture you have measured interfering (double-tap zoom on a custom control), never as a
  scroll "fix". If a scroll complaint cannot be reproduced with a wheel, the cause is not CSS,
  instrument the owner's device instead of guessing again.

### A static-server 301 to the extensionless path DROPS the query string
- **Date**: 2026-07-31
- **File(s)**: public/_mockups/home-v3/search-a.html
- **Match**: 301, query string, debug=1, mockup link, trycloudflare, extensionless, redirect
- **What happened**: A diagnostic panel was gated on `?debug=1`. Opening
  `/_mockups/home-v3/search-a.html?debug=1` 301s to `/_mockups/home-v3/search-a`, and the query is
  gone after the redirect, so the panel never rendered and the gate silently read as "the feature
  does not work".
- **Why it happened**: The extensionless-URL redirect is invisible in normal use, so a query param
  is assumed to survive a same-origin 301. It does not, here.
- **Fix / What to do instead**: Gate any mockup debug/variant switch on `location.hash`, which
  survives the redirect, not on a query param. If a query param is genuinely required, link the
  extensionless path directly (`/_mockups/<dir>/<name>?x=1`) so no redirect happens.
### A view is INVISIBLE to row level security by default , the rule only ever said "tables"
- **Date**: 2026-07-29
- **File(s)**: `_rules/SECURITY_RULES.md` (rule S3), `supabase/migrations/20260728155748_availability_slots_public_security_invoker.sql`, live DB views `availability_slots_public`, `staff_ratings_view`
- **What happened**: TWO views leaked past RLS in two days. `availability_slots_public` exposed all 2,114 slots to anon including 833 booked ones with `staff_member_id` and exact times, i.e. every salon's real booking rate and staff schedule. Then `staff_ratings_view` was found doing the same thing: it emits 70 rows where the `staff_members` policy (`owner OR is_active = true`) allows anon only 67, so 3 deactivated stylists are visible to anyone with the public key.
- **Why it happened**: PostgreSQL runs a view with the permissions of its OWNER unless `security_invoker = true` (PG15+). Verbatim from the PG17 CREATE VIEW docs: "if any of the underlying base relations has row-level security enabled, then by default, the row-level security policies of the view owner are applied". Rule S3 says "ALWAYS enable RLS" and "ALWAYS add explicit policies" and is entirely about TABLES. Every one of its bullets can be satisfied while a view over the same table hands out everything. Supabase's own advisor flagged the first view and does NOT flag the second, so the linter is not a sufficient control either.
- **Fix / What to do instead**: Any new view in an API-exposed schema is `security_invoker = true` unless there is a written reason not to. Rule S3 needs a views clause. **Check the whole class, not the instance**: `select relname, reloptions, has_table_privilege('anon', oid, 'SELECT') from pg_class where relkind in ('v','m')`. Same shape applies to `SECURITY DEFINER` functions granted to `anon`, which is a second unguarded door past every API-route security layer (`create_group_booking` is a live unauthenticated WRITE at `/rest/v1/rpc/create_group_booking`).

### A register/copy sweep keyed on PRONOUNS is blind to VERBS , three separate holes in one tool
- **Date**: 2026-07-29 to 2026-07-31
- **File(s)**: `scripts/register-sweep.mjs`, `messages/de.json`, `messages/it.json`, `_design-system/COPY_LAW.md` (section 8)
- **What happened**: Converting de/it/fr from informal to formal address, the tool matched pronouns and possessives only. It reported "0 changed" while the files were still full of informal copy, three separate ways. (1) German weak-verb imperatives end in `-e`, not `-st`, so the needs-a-human detector had near-zero recall on the single most common CTA shape; ~30 half-converted sentences would have shipped silently. (2) Strings with an informal VERB and NO pronoun never entered the changed set at all; 41 measured in German, 32 more found later, 18 in Italian. (3) `IT_MAP` never mapped `te`, the disjunctive pronoun after a preposition, so 22 more Italian strings survived every scan including two I had already recorded as fixed. Review rounds went 5 findings, then 34, then 39: it never converged.
- **Why it happened**: Each scan was a VERB-STEM LIST, so every round added stems and found a new layer. A structural detector (sibling-mismatch inside a JSON object) was tried instead and returned 441 candidates that were almost all false positives, because German and Italian noun phrases are shaped exactly like imperatives to a regex: `Keine Ergebnisse`, `Alle ansehen`, `Revisione e conferma`.
- **Fix / What to do instead**: A register check must match VERBS, not only pronouns, or its "0 findings" is a false all-clear. And accept the ceiling: **no regex certifies a natural-language file clean**; separating `Finde` the imperative from `Freunde` the noun needs morphology. Closing that gap needs a fluent human read of the customer-visible strings or a real POS tagger. Say which of the two, do not run a fourth grep round. Corollary that generalises: when a tool reports zero, state what it CANNOT see next to the zero.

### `apply_migration` writes NO local file, so the repo silently stops describing the database
- **Date**: 2026-07-31
- **File(s)**: `scripts/check-migrations.mjs` (the detector), `_inventory/_migrations-snapshot.json`, `_rules/DB_SCHEMA.md` (section 7), `supabase/migrations/`
- **What happened**: 310 migrations are applied live; only 78 have a matching local file. **232 live migrations exist nowhere in the repo (75%)**, plus 43 local files with no live version and 2 collisions where two different files share one version prefix. A fresh environment rebuilt from `supabase/migrations/` would be missing three quarters of the schema. The 2026-07-28 security fix was among the missing until this was caught.
- **Why it happened**: The Supabase MCP `apply_migration` tool applies the SQL live AND records it in `supabase_migrations.schema_migrations`, but does not write a file. `_rules/DB_SCHEMA.md` section 7 predicted this exact drift in its own words and shipped a five-step backfill recipe. The recipe ran once, in July, and drift resumed immediately, because **nothing ever called it**. A recipe with no caller is documentation, not enforcement.
- **Fix / What to do instead**: `npm run check:migrations` (report) and `gate:migrations` (exit 1 on drift) now exist and are the caller the recipe never had. Wire the gate into CI once the backfill lands, so it starts green rather than as a permanently red check nobody reads. General class: any workflow where the authoritative change happens in a remote system and the repo copy is a manual second step will drift; the fix is a detector that diffs the two, not a better-written manual step.

### A hardcoded German string literal renders German on /en, /fr and /it, and a prop-only scan misses half of them

**File(s):** `app/[locale]/_components/homepage/*.tsx`, `messages/{de,en,fr,it}.json`

Found 2026-08-15 after the owner asked, on the English homepage, "why is their English and German?"
He was right. Eleven user-visible strings were plain string literals rather than translation calls,
so every one of them rendered German on all four locales. `ui.recentlyViewed.title` had existed in
all four locale files the whole time and had simply never been called.

**Three things this class teaches, in the order they cost time.**

1. **Check for an existing key BEFORE minting one.** Four of the eleven already had a key that
   nobody called. Adding a second key for the same string is the duplication failure wearing an
   i18n hat.

2. **A scan keyed on PROPS is blind to JSX TEXT, which is the same shape of hole as the pronoun/verb
   sweep two entries above this one.** The first pass matched `title=` / `label=` / `aria-label=`
   and reported ten. Three more were sitting in plain element children:

       <h3 ...>Alle entdecken</h3>
       <h2 ...>Für Sie</h2>
       <h2 ...>Solen für<br />Ihr Geschäft.</h2>

   Grep BOTH shapes, always: the prop form and the `>text<` form.

3. **Measure whether the string is VISIBLE before calling it a bug.** Of those three extra hits, one
   rendered at 71x35 and two measured 0x0 (one section carries `hidden`, one is desktop-only). And
   two of the original ten lived inside `_DeprecatedSearchBar` in `Hero.tsx`, a function declared
   once and imported by nobody, so they render on no page in any language. I wired them anyway and
   only found out because typecheck said `t` was not in scope. **A string in dead code is not a bug,
   and "fixed" on it is a false report.**

**A THIRD BLIND SPOT, found by the design-verifier after I had declared the sweep done: GERMAN
WITHOUT UMLAUTS.** Both greps below key on `[äöüßÄÖÜ]`, so all four of these walked straight past
them and shipped, live and visible on /en at 402px:

    PopularLooks.tsx:78    ab CHF {look.priceFromCHF}
    Entdecken.tsx:381      ab CHF {look.price}
    WalkInBand.tsx:132     bis frei
    WalkInBand.tsx:150     "Niemand wartet" / `${s.queueLength} vor Ihnen`

Same shape as the props-versus-JSX-text miss above, one layer down: the sweep matched a CHARACTER
CLASS rather than the language. Grep German WORDS too, and grep the price and count fragments
specifically, since those are where umlaut-free German hides:

    grep -rnE '\b(ab|bis|vor|ohne|mit|und|oder|kein[e]?|Niemand|wartet|frei|Ihnen|Ihre?)\b' app/**/_components/

**How to find them:**

    grep -rnE '(title|label|aria-label|placeholder)="[^"]*[äöüßÄÖÜ]' app/**/_components/
    grep -rnE '^\s*[A-ZÄÖÜ][^<>{}]*[äöüß][^<>{}]*$' app/**/_components/   # JSX text children

then, for each hit, confirm it actually renders (getBoundingClientRect on the live page) before
touching it, and confirm the enclosing function is imported somewhere.

**Not mechanically fixable, left open on purpose:** a headline split across a `<br>`
(`"Solen für<br />Ihr Geschäft."` in `BusinessTeaser.tsx` and `WhySolen.tsx`). French and Italian do
not break in the same place, so it needs a copy decision, not a key swap.

**THE REAL SIZE OF IT, measured 2026-08-15 after the eleven were fixed: 13 of the 37 homepage
components still carry a user-facing German literal.** Named, so the next pass starts from a list
and not from a scan: ArtistOfTheMonth, BentoBusiness, BusinessTeaser, CategoryStack, Entdecken,
FeatureBento, Hero, MobileCategoriesRow, SearchBar, SolenStory, WalkInBand, WhySolen. (NearbyMap is
a false positive: the matcher caught `Math.abs(k.x - p.x)` inside code.) The eleven fixed that day
were the ones a props-only grep could see, which is roughly half the problem.

**The gate for this already exists and is armed:** `~/.claude/hooks/i18n-write-gate.py`, built
2026-07-27 for the owner's "we need a gate to enforce multi langual while writing". It did not stop
these because it only inspects the text BEING WRITTEN, by design, so pre-existing literals never
block an unrelated edit. That is correct behaviour, not a hole. Do not build a second gate for this
class; run the existing one over a file to get its finding:

    python3 -c "import importlib.util,os,sys; s=importlib.util.spec_from_file_location('g', os.path.expanduser('~/.claude/hooks/i18n-write-gate.py')); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(m.offending(open(sys.argv[1]).read()))" <file.tsx>

### A mockup that injects into the LIVE page must take its spacing from the page, not from the reference

**File(s):** `public/_mockups/**/*.html`, `public/_mockups/**/variants/*.js`

Owner, 2026-08-15, drawing a red line down the left of a screenshot: *"why is it, like, weirdly just
on the middle? Like, look at the reference where it's attached. There's, like, a line. Right? ...
Make it actually attached to the left side, you know, where everything goes."*

**Measured on our own live page, which is the step that was skipped:**

    page: category pill        left 16
    page: "Top Coiffeur" h2    left 16
    page: Top Coiffeur card    left 16
    mine: Recently viewed h2   left 40     <- Airbnb's 23.6pt gutter, imported
    mine: first thumb          left 40

I had measured the Airbnb reference to a tenth of a point (gutter 23.6pt, thumb 106.1 x 100.7,
arrow 27.0) and never once measured OUR page's own gutter. The reference number went straight into
`MK.REF.gutter` and put the whole block 24px right of every other section on the page.

**Then I fixed it wrong and had to measure again.** Setting the gutter to our 16 produced left 32,
because the host container the block is injected into ALREADY pads 16. The correct value inside a
padded host is **0**. A mockup that injects into a live page inherits the host's box; the gutter you
write is added to the host's, not instead of it.

**THE RULE.** When a mockup renders inside the real page, every spacing value is a property of THAT
PAGE and must be measured there:

    // before writing any padding/gutter into an injected block
    const L = el => Math.round(el.getBoundingClientRect().left);
    // sample 3+ existing sections; they agree, and their agreement IS the line
    [pill, sectionH2, firstCard].map(L)      // -> 16, 16, 16

The reference tells you SIZE and SHAPE (a photo's ratio, a card's height, a circle's diameter). The
host page tells you POSITION and RHYTHM (gutter, gap, section padding). Taking position from the
reference is how a correctly-sized block lands in the wrong place, which is exactly FLOORS LAW 8:
the same thing has to look the same everywhere, and "everywhere" means the page it ships on.

**Same class, same turn, three more:** section h2 was 22px against the page's 18px; the see-all
circle was 28px against the page's 32px; the thumb radius was 16px against the page's 22px. All
three were Airbnb's numbers on our page. Measure the host for these too.

### "Make it like this" while pointing at an existing component means USE that component, not draw a smaller one

**File(s):** `public/_mockups/**/variants/*.js`, `app/[locale]/_components/homepage/*.tsx`

Owner, 2026-08-15, round TEN on one row, selecting the live Top Coiffeur card and my proposed
Recently-viewed row together: *"I told you to make it like this."*

**Measured, and the number is the whole story:**

    the page's card      photo 242 x 194, radius 22, card 242 x 258
    my hand-drawn thumb  photo 112 x  90, radius 22
    photo AREA ratio     7.71 to 1

For nine rounds I read "make it a normal section of the page" as the section CHROME: heading size,
arrow diameter, gutter, radius. I matched all four and the row still looked wrong, because the thing
he was pointing at was the CARD, and mine was one seventh the size of the one directly below it on
the same screen.

**The tell I walked past three times.** He said "normal section", "like this", and "recently viewed"
while a perfectly good card sat on the same screen. Every round I ported one more measurement from
the Airbnb reference instead of asking what the page already renders. FLOORS LAW 9 already says it:
a screen is composed from the components we own, and hand-drawn UI is a defect however good it
looks. The live `RecentlyViewed.tsx` was ALREADY using the real card. I built a smaller one beside it
and spent nine rounds tuning the wrong object.

**THE RULE. When he points at something already on screen and says "like this", the first move is to
measure THAT ELEMENT and reproduce its anatomy exactly**, not to adjust the thing you built:

    // his reference is on the page, so read it, do not eyeball it
    const ref = pageCard.getBoundingClientRect();      // 242 x 258
    const refPhoto = pageCard.querySelector('img').getBoundingClientRect();  // 242 x 194
    // then check the ratio between his reference and yours BEFORE changing anything
    (refPhoto.w * refPhoto.h) / (mine.w * mine.h)      // 7.71 -> you are not close

**Cheap check that would have ended this at round two:** when a proposed block sits on a page that
already renders the same KIND of thing, measure both and print the area ratio. Anything past about
1.5 means you are proposing a different component, not a variant of the existing one, and that has
to be a deliberate decision with a stated reason rather than an accident of porting a reference.
