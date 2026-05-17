# Topic 3B — Type Assertions Audit
Date: 2026-05-16
Scope: `as Foo`, `as unknown as Foo`, `X!` non-null assertions

## Summary

- **Total findings: 273 lines flagged across ~150 files** (HIGH: 38 | MEDIUM: 196 | LOW: 39)
- **Sub-counts:**
  - `as X` casts (non-`as const`, non-import-alias): **214** matches
  - `as unknown as X` double casts: **28** matches
  - `X!` non-null assertions: **59** matches (after filtering comments/aliases)
  - `as any` casts (related anti-pattern, not the primary slice): **430** matches
  - `as const` (positive signal): **132** matches in real code
- **Files scanned:** 997 .ts/.tsx files (excluding `node_modules`, `.next`, `_audits`, `_tasks`, `_rules`, `_docs`, `_specs`, `_plans`, `_visual-qa`, `public`, `.claude`). Note: `components-legacy/` IS included — it powers ~80% of customer pages per CLAUDE.md V3 wireup audit.
- **Schema validation in codebase:** 257 calls to `validateBody`, `schema.parse`, or `schema.safeParse` — there IS a Zod culture, but it's inconsistently applied; many of the HIGH findings below are exactly the spots where Zod was skipped.
- **TypeScript strictness:** project is in strict mode (`tsconfig.json`) — these assertions are voluntarily bypassing the very type system that strict mode is supposed to guarantee.

---

## Findings by severity

### HIGH severity (38) — assertions on external data, no validation

External-data definition: data crossing the trust boundary (HTTP request, Supabase row, FormData, JSON.parse, localStorage, payment provider response, Realtime payload). These can be `null/undefined` or wrong shape; the assertion is a lie that crashes at runtime.

#### H1. `formData.get()` / `formData.getAll()` cast to file/string without validation (12 instances)

`formData.get(name)` returns `FormDataEntryValue | null` (`string | File | null`). Casting to `File | null` skips the string-vs-file check; casting to `as File` (no null) is even worse — if the field is absent the value is `null` and downstream `.type` / `.size` accesses crash.

- `app/api/reviews/[id]/photos/route.ts:42` — `const files = formData.getAll("photos") as unknown as File[];` Double cast through `unknown` actively hides that `getAll` returns `(string | File)[]`. The next lines access `.type` and `.size` on each entry — a non-image string would explode. **Fix:** filter `files.filter((f): f is File => f instanceof File)` before mapping; reject non-File entries with 400.
- `app/api/clients/[id]/photos/route.ts:40-42` — `formData.get("file") as File | null` / `formData.get("photo_type") as string ?? "progress"` / `formData.get("booking_id") as string | null`. None of these guarantee the entry is actually a `File` vs `string`. **Fix:** validate with `instanceof File` + Zod string-shape check.
- `app/api/salon/documents/route.ts:44-45` — same pattern: `formData.get("file") as File | null`, `formData.get("document_type") as string`.
- `app/api/admin/discovery/upload/route.ts:26-27` — same pattern.
- `app/api/salons/[slug]/gallery/route.ts:16` — `formData.get("file") as File;` — **no null check at all**, will crash if field absent.
- `app/api/services/import/route.ts:14-15` — same pattern.
- `app/api/services/[id]/photos/route.ts:30` — same pattern.
- `app/api/dashboard/coiffeur/formula-photo/route.ts:40-43` — four lines of the same pattern.

**Fix recommendation (all 12):** create a small `lib/formdata.ts` helper:
```ts
function getFile(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  return v instanceof File ? v : null;
}
function getString(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" ? v : null;
}
```
Then `if (!file || file.size > MAX) return 400`.

#### H2. `searchParams.get()` cast to typed union without `includes()` check (5 instances)

URL params are attacker-controlled strings. Casting `searchParams.get("status") as BookingStatus` will silently coerce `?status=DROP_TABLE` to a "valid" `BookingStatus` in TypeScript while runtime stores the raw string.

- `app/[locale]/dashboard/bookings/page.tsx:113` — `(searchParams.get("status") as BookingStatus) ?? "all"` — no membership check.
- `app/[locale]/_components/search/SearchResults.tsx:89` — `(searchParams.get("sort") ?? "rating") as SortValue` — at least the next line filters via `SORTS.some(...)` ✓ (this one is actually fine in context — flagged only for pattern visibility).
- `app/api/bookings/user/route.ts:20` — `(url.searchParams.get('tab') as 'upcoming' | 'past' | 'cancelled') || 'upcoming'` — no membership check; downstream query is gated on tab so a garbage value won't match.
- `app/[locale]/discover/page.tsx:39` — `(searchParams?.get("category") as DiscoveryCategory | "all") || "all"` — no membership check.
- `components-legacy/search/SplitView.tsx:145` — `searchParams.get("category") as SalonCategory | undefined` — no membership check.

**Fix recommendation:** make the union a `const` array and use a type-guard predicate. Example: `const VALID_TABS = ["upcoming","past","cancelled"] as const; type Tab = typeof VALID_TABS[number]; const tab: Tab = (VALID_TABS as readonly string[]).includes(raw) ? raw as Tab : "upcoming";`

#### H3. `JSON.parse(...)` cast to typed object without validation (6 instances)

`JSON.parse` returns `any`. Casting to a concrete type after parse is the textbook lie — the type system claims a shape that the runtime hasn't verified.

- `lib/ai-vision.ts:159` and `lib/ai-vision.ts:262` — `JSON.parse(cleaned) as AIVisionResult;` where `cleaned` is **Gemini AI output**, the least trustworthy source possible. If Gemini returns malformed JSON or omits a required field, downstream consumers (which extensively dereference `aiResult.category`, `aiResult.tags?.length`, etc. in `app/[locale]/discover/[id]/page.tsx`) will crash with `Cannot read property of undefined`. **Fix:** define a Zod schema for AIVisionResult and use `safeParse`; on failure, return null and log.
- `app/[locale]/_components/primitives/CookieConsent.tsx:83` — `JSON.parse(raw) as CookieConsentState;` where `raw` comes from localStorage (user can edit). The next line `new Date(parsed.timestamp).getTime()` will return `NaN` if `parsed.timestamp` isn't a valid date string. **Fix:** Zod schema with default fallback. The surrounding `try/catch` only protects against parse errors, not shape mismatches.
- `components-legacy/RecentlyViewed.tsx:28, 45, 70` — 3 instances of `JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentSalon[]`. User can put anything in localStorage. The next operations (`.filter`, `.slice`) work because arrays-of-anything pass, but `salon.average_rating` access in the JSX will produce `undefined` rendering bugs. **Fix:** Zod array schema, fallback to `[]`.

#### H4. `await res.json()` cast to typed response without runtime check (2 instances)

- `app/[locale]/_components/homepage/useSearchSuggest.ts:91` — `const data = (await res.json()) as SearchResults;` This is the V3 search hub — failure here breaks the homepage hero. The catch swallows `err.name === "AbortError"` but a network response with the wrong shape will still propagate as a render-time crash. **Fix:** Zod validation; on shape failure, treat as `EMPTY`.
- `components-legacy/ui/ServiceAutosuggest.tsx:82` — `return r.json() as Promise<SuggestResponse>;` Same pattern, same fix.

#### H5. Supabase `payload.new` (Realtime postgres_changes) cast without runtime check (6 instances)

Supabase Realtime broadcasts `Record<string, any>` for `payload.new` — the type system has no shape guarantee. Casting it to a domain type lets a renamed/removed DB column flow through silently.

- `components-legacy/ChatWindow.tsx:107` — `const m = payload.new as Message;`
- `components-legacy/ChatWindow.tsx:114` — `const updated = payload.new as Message;`
- `components-legacy/notifications/NotificationBell.tsx:61` — `const newNotif = payload.new as NotificationData;`
- `components-legacy/notifications/NotificationBell.tsx:75` — `const updatedNotif = payload.new as NotificationData;`
- `components-legacy/dashboard/barber/LiveQueuePanel.tsx:47, 66` — `payload.new as BarberWalkinQueue;` twice.

**Fix recommendation:** Define Zod schemas matching DB row shape, validate `payload.new` per event. If validation fails, log + refetch from the REST endpoint as fallback.

#### H6. Supabase nested-relation casts: `as unknown as { owner_id: string }` (11 instances)

When you do `.select("..., salons(owner_id)")` Supabase returns `salons` as either an object or array depending on the relation. The codebase **explicitly casts through unknown** to claim the relation is a single object — but if the FK joins multiple rows (or none), this lies.

- `app/api/reviews/reply/route.ts:38` — `(review.salons as unknown as { owner_id: string })?.owner_id;`
- `app/api/bookings/[id]/refund/route.ts:46` — same shape.
- `app/api/bookings/[id]/report/route.ts:62` — same.
- `app/api/bookings/[id]/dispute/route.ts:68, 131` — two of these.
- `app/api/services/[id]/route.ts:47, 96` — two of these.
- `app/api/services/[id]/photos/route.ts:26` — same.
- `app/api/conversations/[id]/price-offer/route.ts:40` — same.
- `app/api/staff/services/route.ts:72` — same.
- `app/api/staff/time-off/route.ts:56` — same.
- `app/api/staff/breaks/route.ts:59` — same.
- `app/api/admin/segments/[id]/members/route.ts:29` — `(m.profiles as unknown as { display_name: string | null })?.display_name`.

All gate authorization (`if (salonOwner !== user.id) return 403`). If Supabase ever returns an array here (e.g. one-to-many relation typing changes), these will read `.owner_id` on an array → `undefined` → 403 forbidden for the real owner. Or `salons[0]?.owner_id` would have been the explicit shape — currently the assertion masks the ambiguity.

**Fix recommendation:** Generate Supabase types via `supabase gen types typescript` and consume them directly. Or check at runtime: `const salons = booking.salons; const ownerId = Array.isArray(salons) ? salons[0]?.owner_id : salons?.owner_id;`

#### H7. Process env non-null assertions in code paths actually running (~28 instances)

`process.env.X!` claims the env var exists. Missing env vars crash at construction time with a confusing TypeError instead of a clear startup error.

- `lib/supabase.ts:19, 20, 63, 64, 87` — supabase URL + anon/service-role keys (server).
- `lib/supabase-browser.ts:9, 10` — same (client).
- `app/api/auth/callback/route.ts:23, 24` — supabase URL/anon key.
- `app/api/salons/[slug]/gallery/route.ts:5, 6` — supabase URL + service-role key.
- `app/[locale]/checkout/page.tsx:20`, `app/[locale]/vouchers/page.tsx:19`, `app/[locale]/vouchers/buy/page.tsx:24` (via `loadStripe`), `components-legacy/profile/PaymentMethodsSection.tsx:10` — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!` on the **client** — if missing, Stripe.js silently fails to load.
- All cron `route.ts` files (`release-payments`, `pending-timeout`, `no-show`, `late-cancel`, `pre-charge`, `salon-onboarding`, `welcome-series`, `rebooking-nudge`), all `bookings/[id]/*` Stripe routes, `tips/route.ts`, `gift-cards/purchase/route.ts`, `packages/purchase/route.ts`, `admin/booking-disputes/[id]/action/route.ts`, `admin/salons/[id]/freeze/route.ts`, `conversations/[id]/price-offer/route.ts` — all use `new Stripe(process.env.STRIPE_SECRET_KEY!, ...)`.

**Fix recommendation:** Add an `lib/env.ts` validator that runs at startup using Zod (or just-check-and-throw):
```ts
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
export const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
```
Converts ~28 silent `!` assertions to one explicit startup-time check.

#### H8. `data!.X` after silently-failed query (6 instances)

When a Supabase call errors and the code logs+continues, `data` is `null` but the next line does `data!.something`. This is exactly the pattern Topic 1B was about (ignored DB errors); here it surfaces in the type system.

- `components-legacy/dashboard/barber/PLComparison.tsx:55` — `stats!.walkin_revenue / total` — after the fetch's `catch {}` block on line 46-48 swallows errors. If the fetch failed, `stats` is `null`; the `total > 0 ?` ternary only short-circuits if `total === 0`. **Fix:** guard on `stats && total > 0`.
- `app/api/analytics/salon/[id]/route.ts:169` — `reviews!.reduce(...)` after a query with `error` discarded. **Fix:** `(reviews ?? []).reduce(...)`.
- `app/[locale]/dashboard/analytics/page.tsx:323, 367` — `data.acquisition_sources!.map(...)`, `data.popular_services!.map(...)`. The outer `&&` guards on 318 and 362 do check existence, so these are conditionally safe — but `!` is unnecessary and masks future regressions. **Fix:** Use `?? []`.
- `components-legacy/ui/ServiceAutosuggest.tsx:164, 209` — `data!.services.map(...)`, `data!.salons.map(...)`. The `hasServices`/`hasSalons` derivation does `data?.services?.length` so the JSX is gated, but `data!` here defeats narrowing.
- `app/api/salons/route.ts:189` — `availableIds!.has(id)` — `availableIds` is reassigned conditionally inside an outer `if (date)` block; subtle but a clearer guard would help.
- `app/[locale]/salon/[slug]/reviews/page.tsx:75` — `const salon = salonRes.data!;` after `if (!salonRes.data) notFound();` — **this one is legitimately safe** because `notFound()` throws; flagging only for the pattern review.

#### H9. `.find(...)!` and `arr[index]!` (2 instances, retail-checkout)

- `app/api/nail/retail/checkout/route.ts:70, 81` — `const product = products!.find((p) => p.id === item.product_id)!;` used **twice in retail-checkout stock decrement**. The find returns `undefined` if the product ID doesn't match anything in `products`. The earlier loop on lines 55-64 does check `if (!product) return 404`, but **only on the validation pass**, not on the decrement/total pass — the cached `products` array doesn't change between passes, so the same product IDs WILL be found again, but the pattern is fragile. **Fix:** Build a `Map<id, product>` once, look up, throw on miss.

#### H10. Other HIGH external-data casts

- `components-legacy/ui/DiscoverCarousel.tsx:64` — `(json.items as DiscoveryItem[]).slice(0, 5)` after `await res.json()` with no validation. The DEMO fallback hides bad data; a runtime crash only happens when the API returns malformed items.
- `app/api/discovery/salons-for-style/route.ts:45` — `(salon as Record<string, unknown>).services as { price: number; name_de: string; ...}[]` — TWO chained casts on one line. The `.services` from Supabase has no type guarantee; the next line `services.map((s) => s.price)` will crash if it's an array of strings or null. **Fix:** Generate Supabase types or Zod-validate.
- `components-legacy/dashboard/ActivityFeed.tsx:73` — `channelRef.current = channel as unknown as ReturnType<typeof createBrowserSupabaseClient>["channel"];` — Supabase v2 channel type leakage; double-cast through unknown is a code smell. **Fix:** import the proper channel type from `@supabase/realtime-js`.
- `app/[locale]/dashboard/services/page.tsx:46-48, 53` — 4 instances of `(initial as unknown as Record<string, number>)?.buffer_minutes`. The double cast indicates the inferred `initial` type is wrong; **the actual fix is to define the right Service type** that includes `buffer_minutes`, `processing_minutes`, `finishing_minutes`, `photos`.
- `app/[locale]/profile/stamps/page.tsx:83` — `((cardsRaw ?? []) as unknown as LoyaltyCardRow[])` — Supabase select with nested join; the double cast bypasses the (correct) Supabase response type. **Fix:** generate types.
- `components-legacy/ProfilePage.tsx:743` — same pattern: `((data ?? []) as unknown as LoyaltyCardRaw[])`.
- `lib/demo-data.ts:20, 27, 34, 41, 48` — 5 instances of `} as unknown as SalonCard,` for demo data. The comment on line 11 (`All other Salon fields are cast away via 'as unknown as SalonCard'`) acknowledges this is intentional pruning. **Acceptable but indicates `SalonCard` is over-specified** for the public-card use case — split into `SalonCardCore` (used by cards) and `SalonCardFull` (used by detail pages).
- `app/api/vouchers/create/route.ts:67` — `} as unknown as import("stripe").Stripe.PromotionCodeCreateParams);` — Stripe SDK version mismatch workaround. Will break silently when SDK updates.

---

### MEDIUM severity (196) — internal data that should have been typed

These are not external-data crashes but they're code-smell: a slot where the type system could have been correct from the start. They constitute the bulk of the project's `as` usage.

#### M1. Domain type narrowing on string literals (51 instances)

Casts like `as CitySlug`, `as SalonCategory`, `as EmailLocale`, `as DayKey`, `as BookingStep`, `as DiscoveryCategory`, etc. The string is internal-ish (hardcoded ID or `.replace(...)` result) but the assertion isn't unsafe per se — it just hides that TS couldn't infer the narrower type.

Highlights:
- `lib/cities.ts:50, 69` — `slug as CitySlug` after `CITY_SLUGS.includes(slug)` check ← actually safe (assertion follows membership check). TS 5+ should narrow this without the cast via a type predicate.
- `lib/search/category-detect.ts:34-35` — `text as SalonCategory` after `VALID_CATEGORIES.includes(text as SalonCategory)` — circular: the cast is needed because `includes` widens the parameter. **Fix:** typed `is` predicate.
- `app/[locale]/_components/salon/_shared.ts:154`, `app/[locale]/_components/salon/SalonSidebar.tsx:165`, `app/[locale]/_components/salon/SalonOpeningTimes.tsx:23` — `(["sun"...][now.getDay()]) as DayKey` — three duplicate occurrences of the same constant-array-index pattern. **Fix:** Make `DAY_KEYS` a `readonly` tuple `as const` and TS infers the right type without `as DayKey`.
- 9 cron/webhook route locations (`app/api/stripe/webhook/route.ts:104, 166, 267, 293`, `voucher-handler.ts:50`, `cron/welcome-series/route.ts:51`, `cron/salon-onboarding/route.ts:53`, `cron/rebooking-nudge/route.ts:76`, `bookings/[id]/confirm/route.ts:54`) — all do `(profile?.locale as EmailLocale) ?? "de"`. The DB column type is `string`; TS can't narrow. **Fix:** Validate via `EMAIL_LOCALES.includes(profile.locale)` or generate Supabase types matching the enum.

#### M2. Supabase row type widening (~50 instances)

Casts like `salon as Salon & { facebook_url?: string }` — the project extends inferred Supabase row types ad-hoc instead of generating canonical types via `supabase gen types typescript`.

- `app/[locale]/dashboard/settings/page.tsx:74, 75, 88, 250, 378, 435, 448, 591, 683, 718, 956` — eleven `as Salon & { ... }` casts. The component knows fields like `facebook_url`, `cancellation_fee_type`, `payment_mode` exist but `Salon` type doesn't list them.
- `components-legacy/MapView.tsx:148`, `components-legacy/StaffPortfolio.tsx:46, 48`, `app/[locale]/profile/intake-forms/page.tsx:100`, `app/[locale]/angebote/page.tsx:57, 61, 67, 68`, `components-legacy/ProfilePage.tsx:396, 430` — same pattern with `Salon`, `Profile`, `LastMinuteSlot`, `StaffMember`, `intake.responses`.

**Fix recommendation:** One-shot job to regenerate `lib/types/database.ts` from the live schema, then delete these cast extensions. They'll either typecheck cleanly or surface real DB-vs-code drift.

#### M3. i18n parameter narrowing (46 instances)

`t("foo.bar" as Parameters<typeof t>[0])` — used when constructing message keys dynamically. The cast is needed because `next-intl`'s `t` is fully typed against the message catalog; dynamic keys break the guarantee.

- 5 instances in `components-legacy/ui/GuidedSearch.tsx`
- 3 in `components-legacy/dashboard/DashboardLayout.tsx`
- 1 in `components-legacy/search/SearchCriteriaChips.tsx`
- More across `_components/`, `discover/`, `dashboard/`

**Fix recommendation:** Localize the cast: `function tDynamic(key: string, params?: any) { return t(key as Parameters<typeof t>[0], params); }`. One cast site, many call sites.

#### M4. DOM event target casts (~18 instances)

`e.target as HTMLElement`, `e.currentTarget as HTMLElement`, `e.target as Node` — needed because React's synthetic event types are `EventTarget` for the underlying contract.

- `components-legacy/shared/InteractiveZoneDiagram.tsx:32-33, 85-86` (4 instances)
- `components-legacy/BrowseByCitySection.tsx:70, 77`
- Many `(e.target as Node)` checks for click-outside in `ClientSelectorDropdown`, `FilterDrawer`, `DateRangePicker`, `LanguageSwitcher`, `SearchAutocomplete`, `SortDropdown`, `NotificationCenter`, etc.

These are conventional in React-land and effectively unavoidable. **Not a real concern** but counted because they constitute most of the cast volume.

#### M5. `as React.CSSProperties` (10 instances)

Wrappers around inline-style objects with non-standard properties (`WebkitOverflowScrolling`, `scrollbarWidth`).

- `components-legacy/RecentlyViewed.tsx:90`, `components-legacy/CategoryPage.tsx:402`, `components-legacy/ui/border-beam.tsx:35`, `components-legacy/ui/FeaturedSalonCarousel.tsx:108`, `components-legacy/ui/CityCarouselSection.tsx:76`.

Acceptable. These vendor-prefixed props exist in `@types/react` v18+; the cast may be unnecessary in current React types. Worth checking once.

#### M6. `as React.ElementType` for dynamic icon components (5 instances)

`tmp3.tsx:98, 108, 118, 128, 138` — `CoiffeurIcon as React.ElementType`. **`tmp3.tsx` is a leftover scratch file** in repo root — should be deleted.

#### M7. Misc internal narrowing (rest, ~60)

- `app/[locale]/discover/[id]/page.tsx:21, 68` — `data as DiscoveryItem | null`, `{ ...item, ...updates } as DiscoveryItem` — fine after spread/single().
- `app/[locale]/_components/primitives/Checkbox.tsx:44` — `internalRef.current as HTMLInputElement` — ref forwarded to consumer; cast is fine.
- `app/[locale]/salon/[slug]/page.tsx:342`, `components-legacy/salon/SalonOpeningHours.tsx:23, 70, 107` — `opening_hours[key] as OpeningHours | null` — JSONB column, fix via DB types.
- `app/[locale]/_components/salon/SalonStickyTabNav.tsx:58` — `id.replace("section-", "") as TabKey` — should be membership-checked.
- `app/[locale]/_components/primitives/DateTimePicker.tsx:103` — `date as CalendarDate` — internal lib type, fine.
- `app/[locale]/[city]/page.tsx:28` — `getCityName(city as CitySlug, locale)` — should be membership-checked at the page-param boundary.
- `app/api/staff/schedule/auto-apply/route.ts:45` — `salon.opening_hours as Record<string, { open?: string; close?: string } | null> | null` — should be a typed JSONB column.
- `app/api/salon/setup-progress/route.ts:42` — `salon.opening_hours as Record<string, unknown> | null` — fine for setup-progress logic.
- `app/api/content/route.ts:37` — `row as Record<string, unknown>` — used to bypass typing; indicates the row type isn't generated.
- `app/api/ai/intake-recommendation/route.ts:47` — `intake.responses as Record<string, string>` — JSONB column; not validated.
- `app/api/auth/callback/route.ts:32` — `options as Parameters<typeof response.cookies.set>[2]` — Supabase SSR signature mismatch, common pattern.
- `components-legacy/ui/GuidedSearch.tsx:140, 610, 611, 945, 146-147` — multiple `as CitySlug`, `as SalonCategory`, `as CalendarDate`, `as Step`, `as CustomEvent` casts. The `as CustomEvent<{ step?: number }>` relies on a homemade custom event protocol that should have a Zod schema for the detail payload.
- Various `as HTMLElement` / `as HTMLInputElement` from `querySelector` results — conventional.
- `app/[locale]/onboarding/salon/page.tsx:382-383` — `data.basics as BasicsData`, `data.quickWin as QuickWinData` after a localStorage/draft-state pull.

---

### LOW severity (39) — test/dev/script code or definitively safe patterns

- All 5 instances in `tmp3.tsx` (root-level scratch file).
- `scripts/send-outreach-emails.ts:31-33`, `scripts/collect-basel-salons.ts:32-34` — env-var `!` assertions in CLI scripts (acceptable; scripts crash loudly on missing env).
- `scripts/backfill-embeddings.ts:84` — `(r as PromiseRejectedResult).reason` — TS doesn't narrow `PromiseSettledResult` from a `status === "rejected"` check; conventional.
- `app/[locale]/salon/[slug]/reviews/page.tsx:75` — `salon = salonRes.data!` after `notFound()` throw — provably safe.
- `components-legacy/ui/expandable-tabs.tsx:57` — `useRef<HTMLDivElement>(null!)` — provably safe React pattern.
- All ~18 DOM-event-target casts in M4 above.
- `lib/cities.ts:50, 69`, `lib/city-cookie.ts:21`, `lib/search/category-detect.ts:34-35` — casts that follow a membership check (the redundancy is the issue, not safety).
- Supabase edge functions (`supabase/functions/compute-analytics/index.ts:161, 267`) — `badge.auto_rule as Record<string, unknown>` — internal data-access pattern.

---

## Notes

### Patterns observed

1. **Two consistent failure modes in API routes:**
   - `formData.get(...) as File | null` — happens in 8+ route files following the same template; would benefit from a shared `lib/formdata.ts` helper.
   - `(table.relation as unknown as { owner_id: string })?.owner_id` for authorization gating — happens in 11 files in `app/api/`; the double cast through `unknown` is a code smell that says "Supabase types are wrong, force it." The real fix is `supabase gen types` + use them.

2. **The HIGH findings cluster around the trust boundary:**
   - Realtime → `payload.new as X` (6 instances)
   - User input → `formData.get(...) as File`, `searchParams.get(...) as Status`, `JSON.parse(...) as ...` (23 instances)
   - localStorage → `JSON.parse(...) as RecentSalon[]` (3 instances)
   - AI APIs → `JSON.parse(geminiText) as AIVisionResult` (2 instances)
   - Network responses → `await res.json() as SearchResults` (2 instances)
   
   Every one of these crosses an untrusted boundary; every one of them is a Zod-schema-shaped hole.

3. **Inconsistent Zod adoption:** 257 calls to validation helpers exist (`validateBody`, `schema.parse`, etc.), so the team knows the pattern. But the riskiest external-data spots — FormData, JSON.parse, Realtime payloads — are ALL missing validation. This is a "we believed our internal types were enough" gap.

4. **No `satisfies` operator usage** (0 matches). The codebase predates TS 4.9 idioms or hasn't adopted them. `satisfies` would replace many `as Salon & { ... }` casts with provably-narrower types.

5. **`as const` usage (132 instances) is a positive signal** — used predominantly in:
   - `lib/motion.ts`, `lib/animations.ts` (4 each) — animation config tuples
   - `components-legacy/ui/GuidedSearch.tsx` (4) — step-tuple definitions
   - `components-legacy/dashboard/DashboardLayout.tsx` (5) — nav tuples
   
   These are correct use of `as const`. No anti-pattern here.

6. **`as any` cohort (430 instances)** — not the primary slice of this audit but a related anti-pattern worth flagging. Highest concentration: `components-legacy/`, `app/api/stripe/webhook/route.ts` (uses `(booking.services as any)?.[\`name_${locale}\`]`). A separate audit pass would be valuable.

7. **`tmp3.tsx`, `tmp_header.tsx`, `tmp_homepage.tsx`, `tmp_out.tsx`** are scratch files at repo root containing assertions. They should be deleted regardless of this audit.

8. **Generated/external code excluded by default:** `node_modules`, `.next`, and `next-env.d.ts` (Next's generated type) are excluded — no findings there.

### Recommended remediation order

1. **`lib/env.ts`** — replace ~28 `process.env.X!` with one validator. Single quickest, highest-impact fix.
2. **`lib/formdata.ts`** — replace ~12 `formData.get(...) as File | null` lines. Second-easiest fix.
3. **Generate Supabase types via `supabase gen types typescript`** — eliminates ~50 M2 casts AND the 11 H6 `as unknown as { owner_id: string }` casts.
4. **Zod schemas for the 4 external-data crash points:** `AIVisionResult`, `CookieConsentState`, `RecentSalon`, `SearchResults`. Add `safeParse` wrappers, log on shape failure.
5. **Realtime payload validation helpers** — one helper per table that takes `payload.new` and returns a typed-or-null result, used in `ChatWindow`, `NotificationBell`, `LiveQueuePanel`, `ActivityFeed`.
6. Delete `tmp3.tsx`, `tmp_header.tsx`, `tmp_homepage.tsx`, `tmp_out.tsx` from repo root.
