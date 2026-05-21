# Topic 4A — Utility / Helper Duplication
Date: 2026-05-16
Scope: formatDate, slugify, cn, debounce, generateICS, haversine, capitalize, etc. — multiple implementations

## Summary
- **Distinct duplicate utility groups: 12** (functions with 2+ same-name or near-identical implementations).
- **Total duplicate definitions across codebase: ~150+** when counting inline `toLocaleDateString` (83), inline `toLocaleTimeString` (29), inline `charAt(0).toUpperCase()` (26 — splits into 16 `capitalize`-style + 10 single-letter-initials), inline `Math.random().toString(36)` (11), inline `toLocaleString("de-CH")` swiss-number formatters (10+).
- **Worst offender (most duplications): inline `toLocaleDateString("de-CH", …)` — 83 raw matches across dashboard/profile/API routes**, all should consolidate into a single `formatDate(date, locale, style)` helper. Also inline `toLocaleTimeString` (29 raw) — same pattern, sibling helper needed.
- **Second-worst: `capitalize` / `s.charAt(0).toUpperCase()` pattern — 1 canonical + 16 inline `capitalize`-form + 10 inline `getInitials`-form** (26 total `charAt(0).toUpperCase()` instances split into 2 distinct intents).
- **Severity breakdown:**
  - CRITICAL: `formatDate` (5 distinct + 83 inline `toLocaleDateString` + 29 inline `toLocaleTimeString`) — drift = wrong dates/times shown on user-facing booking, confirmation, dashboard, profile, invoice emails. Locale also frozen to de-CH for non-DE users (i18n correctness bug).
  - HIGH: `capitalize` (17 impls), `formatPrice` vs `formatCurrency` (2 lib defs side-by-side, 55 total imports split between them), inline `toLocaleString("de-CH")` swiss-number formatters (≥10 dupes).
  - MEDIUM: `generateICS` (3 impls), `haversine` (2 impls), `relativeTime` / `getTimeAgo` (4 inline impls), `Math.random().toString(36)` ID-gen (11 inline), `getInitials`-style single-char (10 inline).
  - LOW: dead `lib/utils.ts` exports never imported (slugify, formatPrice, formatDuration, isWithinHours, advanceByFrequency); `fmt()` name collisions (3 unrelated formatters).

---

## Duplicate groups

### Group 1: `capitalize` (1 canonical + 16 inline → 17 impls) — HIGH

Canonical lives in `app/[locale]/_components/salon/_shared.ts:116` as `export function capitalize(s: string): string`.
Identical inline implementations of `x.charAt(0).toUpperCase() + x.slice(1)` exist in 16 other files.

| File:Line | Form | Notes |
|---|---|---|
| `app/[locale]/_components/salon/_shared.ts:116` | `export function capitalize(s)` | **CANONICAL CANDIDATE** (typed, null-safe) |
| `app/[locale]/_components/salon/SalonBreadcrumb.tsx:35,51` | inline | Already imports `capitalize` from `_shared.ts` (good) — but file also has inline `.toLowerCase().normalize("NFD").replace(...)` instead of using `slugify` |
| `app/[locale]/salon/[slug]/layout.tsx:111` | inline | Replace with import |
| `app/[locale]/angebote/page.tsx:328` | inline | Replace with import |
| `app/[locale]/dashboard/page.tsx:373` | inline | Replace |
| `app/[locale]/dashboard/admin-sandbox/page.tsx:219` | inline | Replace |
| `app/[locale]/_components/search/SearchResults.tsx:166` | inline | Replace |
| `app/[locale]/nail-tech/[id]/page.tsx:114` | inline | Replace |
| `lib/seo.ts:123` | inline | Replace |
| `components-legacy/SalonCard.tsx:312` | inline IIFE | Replace with import |
| `components-legacy/ui/HomeSearchBar.tsx:127` | inline | Replace |
| `components-legacy/ui/FeaturedSalonCarousel.tsx:154` | inline (+ `.toLowerCase()` suffix) | Variant — replace with `capitalize` |
| `components-legacy/home/NearbySection.tsx:45` | inline | Replace |
| `components-legacy/discovery/DiscoveryAdmin.tsx:182,406` | inline (×2) | Replace |
| `components-legacy/search/SearchResultGrid.tsx:74` | inline | Replace |
| `components-legacy/nail/NailBookingSteps.tsx:171` | inline | Replace |
| `components-legacy/editor/EditPanel.tsx:313` | inline | Replace |

**Recommendation:** Move `capitalize` from `_shared.ts` to `lib/format.ts` (or `lib/strings.ts`); replace all 16 inline copies with one import.

---

### Group 1b: `getInitials` / single-letter avatar initial (1 named + 10 inline) — MEDIUM

The single-letter-avatar pattern `name.charAt(0).toUpperCase()` is a different intent from `capitalize` (it takes ONE char for avatar fallback, not capitalizes a full string). It also has 10 inline copies plus 1 named.

| File:Line | Form |
|---|---|
| `components-legacy/ReviewCarousel.tsx:15` | `function getInitials(name)` — splits, takes first chars, max 2. **CANONICAL CANDIDATE** |
| `app/[locale]/_components/salon/SalonReviews.tsx:100` | inline `displayName.charAt(0).toUpperCase()` |
| `app/[locale]/_components/salon/SalonTeam.tsx:87` | inline `member.name.charAt(0).toUpperCase()` |
| `app/[locale]/_components/homepage/FeaturedStylists.tsx:72` | inline `s.name.charAt(0).toUpperCase()` |
| `app/[locale]/_components/homepage/SalonCard.tsx:278` | inline `name.trim().charAt(0).toUpperCase()` |
| `app/[locale]/compare/ComparePageClient.tsx:151` | inline `salon.name.charAt(0).toUpperCase()` |
| `components-legacy/TestimonialCarousel.tsx:153,154` | inline (×2 — first + last initial) |
| `components-legacy/discovery/CommentSection.tsx:128` | inline `c.user.display_name.charAt(0).toUpperCase()` |
| `components-legacy/profile/ProfileHero.tsx:20` | inline `profile.display_name.charAt(0).toUpperCase()` |

**Recommendation:** Hoist `getInitials` from `ReviewCarousel.tsx` to `lib/format.ts` (or `lib/avatar.ts`) and replace 10 inline copies. Should pair with `avatarColor` (currently in `_shared.ts:186`) — both belong together for avatar fallback.

---

### Group 2: `formatDate` / inline date formatting (5 named + 83 inline `toLocaleDateString` + 29 inline `toLocaleTimeString`) — CRITICAL

5 distinct `formatDate` definitions, all with different signatures and locale handling, plus **83 raw `toLocaleDateString` matches** and **29 raw `toLocaleTimeString` matches** scattered across dashboard/profile/API routes. (The 40+ figure in the earlier summary was a partial count of just dashboard/profile inline calls; the full sweep including emails, API routes, salon detail, and components-legacy is 83 / 29.)

**Severity = CRITICAL because:** (a) different impls produce different output for the same Date input (some include weekday, some don't; some hardcode `de-CH`, some respect locale); (b) ~60% of inline calls hardcode `de-CH` regardless of user locale, producing wrong-language dates for FR/IT/EN users on bookings, invoices, reminders; (c) this is user-visible payment/booking data — drift causes real complaints.

| File:Line | Signature | Notes |
|---|---|---|
| `app/[locale]/confirmation/page.tsx:59` | `(date: Date) => string` | inline, multi-locale, weekday + time |
| `app/[locale]/_components/search/SearchResults.tsx:404` | `function formatDateLabel(iso)` | de-CH only, "Mo. 13. Mai" |
| `components-legacy/salon/SalonSidebar.tsx:74` | `(dateStr: string) => string` | uses `useLocale()`, month+day+time |
| `components-legacy/discovery/DetailPage.tsx:28` | `(dateStr, locale) => string` | day+month+year only |
| `components-legacy/barber/ExpressRebook.tsx:121` | `(iso) => string` | de-CH hardcoded |

**Inline `toLocaleDateString` instances (40+ in app/dashboard, app/profile, app/api):**
`dashboard/page.tsx:116,325`, `dashboard/all-salons/page.tsx:255`, `dashboard/clients/page.tsx:158,334,373`, `dashboard/settings/page.tsx:579,634,937`, `dashboard/messages/page.tsx:103`, `dashboard/calendar/page.tsx:267,268,317,581,583,584`, `dashboard/all-users/page.tsx:222`, `dashboard/bookings/page.tsx:223,226`, `dashboard/disputes/page.tsx:132,174`, `dashboard/queue-display/page.tsx:13`, `dashboard/verification/page.tsx:153`, `dashboard/earnings/page.tsx:152`, `dashboard/content-editor/page.tsx:106`, `dashboard/review-moderation/page.tsx:188`, `dashboard/approvals/page.tsx:96`, `dashboard/revenue/page.tsx:166,179`, `dashboard/reviews/page.tsx:123`, `profile/gift-cards/page.tsx:139`, `profile/intake-forms/page.tsx:114`, `profile/packages/page.tsx:107,145`, `account/messages/page.tsx:145`, `walk-in-pay/page.tsx:219`, `help/[slug]/page.tsx:91`, `api/gift-cards/purchase/route.ts:95`, `api/salon/invoices/[payoutId]/route.ts:67,92`, `api/bookings/route.ts:113,114`, `api/bookings/walk-in/route.ts:83`, `api/bookings/[id]/cancel/route.ts:135,146`, `api/bookings/[id]/confirm/route.ts:58,59`, `api/admin/booking-disputes/[id]/action/route.ts:79`, `api/dashboard/today/route.ts:105`.

**Inline `Intl.DateTimeFormat` instances:** `app/[locale]/_components/homepage/SearchBar.tsx:116`, `app/[locale]/_components/search/SearchResults.tsx:408`, `components-legacy/ui/GuidedSearch.tsx:320`, `components-legacy/booking/PayConfirmStep.tsx:53`.

Also: `app/[locale]/_components/salon/_shared.ts:198` `formatReviewDate(iso)` — domain-specific (review timestamps).

**Recommendation:** Add to `lib/format.ts`:
```ts
export function formatDate(d: Date | string, locale: Locale, style: "short" | "long" | "weekday-day-month" | "datetime"): string
```
Replace all named `formatDate` instances + the 40+ inline `toLocaleDateString("de-CH", …)` calls. Pick locale via existing locale-code mapping. Note: `PayConfirmStep.tsx:49` already has the `de → de-CH / fr → fr-CH / it → it-CH / else en-GB` mapping inlined — extract that to `lib/format.ts` as `localeToBCP47(locale)`.

---

### Group 3: `formatPrice` (2 lib impls, 1 dead) — MEDIUM

| File:Line | Signature | Notes |
|---|---|---|
| `lib/format.ts:22` | `(amount, locale="de-CH") => string` | **CANONICAL** — used by 6 importers, integer-aware ("CHF 85" vs "CHF 85.50") |
| `lib/utils.ts:32` | `(amount, locale="de-CH") => string` | **DEAD** — uses `style: "currency"` (CHF prefix automatic), always 2 decimals; never imported |

**Recommendation:** Delete `lib/utils.ts:32-38`. The canonical `lib/format.ts:22` is correct (Q43 lock — `CHF ` prefix, integer-aware).

---

### Group 4: `formatPrice` vs `formatCurrency` — two adjacent currency helpers — MEDIUM

| File:Line | Func | Output |
|---|---|---|
| `lib/format.ts:22` | `formatPrice(85)` | `"CHF 85"` (no decimals when integer) |
| `lib/format-currency.ts:1` | `formatCurrency(85)` | `"CHF 85"` (Intl.currency style, no decimals when integer) |

Both are imported and used. They differ slightly:
- `formatPrice` uses `style: "decimal"` + manual `CHF ` prefix.
- `formatCurrency` uses `style: "currency"` + currency: "CHF" — locale-aware ordering (de-CH puts "CHF" before, fr puts "CHF" after).

20+ files import `formatCurrency`, 6 files import `formatPrice`. The split is accidental, not designed.

**Recommendation:** Consolidate. Pick `formatPrice` (manual prefix, Q43-locked) and inline-import `formatCurrency` callers, OR keep both but document the difference (e.g. "formatPrice for marketing price displays, formatCurrency for payment receipts").

Also note inline price formatters:
- `components-legacy/dashboard/barber/PLComparison.tsx:58` — `formatCHF = (v) => \`CHF ${(v / 100).toFixed(0)}\`` (cents→CHF)
- `components-legacy/dashboard/nail/RetailSalesDashboard.tsx:54` — `fmt = (cents) => \`CHF ${(cents / 100).toFixed(2)}\``
- `app/[locale]/dashboard/revenue/page.tsx:36` — `fmt(n) = n.toLocaleString("de-CH", {minFrac:2, maxFrac:2})`
- `app/[locale]/dashboard/analytics/page.tsx:385` — `CHF ${(s.revenue / 100).toFixed(0)}` (inline JSX)

These cents-to-CHF wrappers should live in `lib/format-currency.ts` as `formatCents(n)`.

---

### Group 5: `formatDuration` (1 def, dead) — LOW

| File:Line | Signature | Notes |
|---|---|---|
| `lib/utils.ts:44` | `(minutes) => "1h 30min"` | **DEAD** — never imported |

**Recommendation:** Delete from `lib/utils.ts` OR move to `lib/format.ts` next to `formatTimeOffset` (which has similar semantics). If kept, decide canonical between `formatTimeOffset(150)` → `"in 2.5h"` vs `formatDuration(150)` → `"2h 30min"`.

---

### Group 6: `generateICS` (3 impls) — MEDIUM

| File:Line | Sig | Notes |
|---|---|---|
| `lib/ics-generator.ts:4` | `({title, description, location, startsAt, endsAt, organizerName?})` | Cleanest API, takes Date objects |
| `lib/booking-email.ts:21` | `(data: BookingEmailData)` | Adds Europe/Zurich VTIMEZONE block, parses `data.date` + `data.time` strings |
| `components-legacy/BookingSuccess.tsx:48` | `(props: BookingSuccessProps)` | Computes `end = start + duration*60s`; no TZ block |

All three define an inline `fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")` helper internally.

**Recommendation:** Promote `lib/booking-email.ts:21` (most production-correct — Europe/Zurich VTIMEZONE block is needed for outlook/apple calendar). Refactor `lib/ics-generator.ts:4` to call it with a Date→{date,time,duration} adapter. Delete `components-legacy/BookingSuccess.tsx:48` and import from lib.

---

### Group 7: `haversine` / distance-km (2 impls) — MEDIUM

| File:Line | Sig | Notes |
|---|---|---|
| `lib/cities.ts:57` | `haversine(lat1, lon1, lat2, lon2): number` | Uses `Math.atan2(sqrt(a), sqrt(1-a))` form |
| `app/api/salons/nearby/route.ts:87` | `haversineKm(lat1, lng1, lat2, lng2): number` | Uses `Math.asin(sqrt(a))` form — mathematically equivalent |

**Recommendation:** Promote one to `lib/geo.ts` (new file) as `haversineKm(lat1, lng1, lat2, lng2)`. Import from both consumers. They're literally the same math expressed two ways.

---

### Group 8: relative-time / time-ago (4 inline impls) — MEDIUM

No canonical `lib/format-relative.ts` exists. Each consumer rebuilds the same logic:

| File:Line | Form | Locale |
|---|---|---|
| `components-legacy/dashboard/NotificationCenter.tsx:34` | `makeRelativeTime(t)` returning `relativeTime(dateStr)` with `t("justNow"/"minutesAgo"/…)` | i18n via `t()` |
| `components-legacy/dashboard/ActivityFeed.tsx:43` | `relativeTime(dateStr)` via `useCallback`, calls `t("timeJustNow"/…)` | i18n via `t()` |
| `components-legacy/TestimonialCarousel.tsx:46` | `getTimeAgo(dateStr)` returns hardcoded `"heute" / "gestern" / "vor N Tagen/Wochen/Monaten"` | de-only hardcoded |
| `components-legacy/notifications/NotificationItem.tsx:38` | `formatDistanceToNow(date, {addSuffix, locale})` | uses `date-fns` |

**Recommendation:** Standardize on `date-fns` `formatDistanceToNow` (already a dep, used in `NotificationItem.tsx`, `AirbnbSearchBar.tsx`, etc.) wrapped as `lib/format.ts:formatTimeAgo(date, locale)`. Replace all 4 inline impls.

---

### Group 9: ID generation (10 inline `Math.random().toString(36)` impls) — MEDIUM

No canonical `lib/id.ts`. Every file rolls its own.

| File:Line | Pattern |
|---|---|
| `lib/ics-generator.ts:13` | `${Date.now()}-${Math.random().toString(36).slice(2)}@solen.ch` |
| `app/api/referral/complete/route.ts:99` | `Math.random().toString(36).substring(2, 4).toUpperCase()` |
| `app/api/salon/documents/route.ts:57` | `${salonId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}` |
| `app/api/admin/test-salon/route.ts:81` | `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` |
| `app/api/admin/test-salon/seed/route.ts:66` | `test-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}` |
| `app/api/admin/nail/generate/route.ts:104` | `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp` |
| `app/api/salons/[slug]/gallery/route.ts:70` | `${slug}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}` |
| `components-legacy/ui/ImageUploader.tsx:72` | `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}` |
| `components-legacy/ui/ImageUpload.tsx:114,168` | same pattern (×2) |
| `components-legacy/ui/Toast.tsx:86` | `Math.random().toString(36).slice(2)` |

Plus `crypto.randomUUID()` used directly in 6 places (`app/api/admin/discovery/*`, `app/api/admin/users/route.ts`) — those are fine (real UUIDs).

**Recommendation:** Add `lib/id.ts` with:
```ts
export function randomFileId(length = 8): string  // for image upload filenames
export function randomShortId(length = 6): string  // for tracking tokens, ICS uid suffix
```
Server-only UUIDs already use `crypto.randomUUID()` — leave those alone.

---

### Group 10: open-status checks (`isOpenNow` vs `computeOpenStatus`) — LOW

Not strict dupes (different return shapes), but overlapping logic:

| File:Line | Return | Notes |
|---|---|---|
| `lib/salon-hours.ts:50` | `{isOpen, closesAt, opensAt, todayHours}` | Uses Europe/Zurich TZ via `Intl.DateTimeFormat`; handles overnight hours (close < open) |
| `app/[locale]/_components/salon/_shared.ts:149` | `{isOpen, label, nextOpen}` | Uses local `new Date()` getDay/getHours/getMinutes (server-vs-client TZ bug risk); doesn't handle overnight |

**Recommendation:** Keep `lib/salon-hours.ts:isOpenNow` (Zurich TZ correct, overnight-safe). Refactor `_shared.ts:computeOpenStatus` to call `isOpenNow` and just compose the label string.

---

### Group 11: `getInitials` / inline initials (1 named, only 1 found) — LOW

| File:Line | Sig |
|---|---|
| `components-legacy/ReviewCarousel.tsx:15` | `getInitials(name): string` — splits, takes first chars, max 2 |

Only one impl found. No duplicate. But `lib/` should hoist it for reuse in future avatar components. Currently `avatarColor` (in `_shared.ts:186`) is the avatar-paired helper but doesn't pair with initials.

**Recommendation:** Co-locate `getInitials` in `lib/format.ts` next to `avatarColor` (once `avatarColor` is also moved out of `_shared.ts`).

---

### Group 12: `fmt()` ad-hoc helpers (3 distinct, name-collision risk) — LOW

The name `fmt` is reused for unrelated formatting:
- `lib/ics-generator.ts:12` — `(d: Date) => string` (ICS timestamp)
- `components-legacy/BookingSuccess.tsx:51` — same ICS timestamp formatter (duplicate of above)
- `components-legacy/dashboard/nail/RetailSalesDashboard.tsx:54` — `(cents) => "CHF X.XX"`
- `app/[locale]/dashboard/revenue/page.tsx:36` — `(n) => "1'234.56"` (locale number)

**Recommendation:** Rename to specific functions (`fmtIcsTimestamp`, `fmtCents`, `fmtSwissNumber`) and move to `lib/`.

---

## Inline utilities that should be in `lib/` (not duplicates yet, but at risk)

- `app/[locale]/_components/salon/_shared.ts:198` — `formatReviewDate(iso)`: move to `lib/format.ts`. Currently locked inside the salon-detail folder, can't be reused by dashboard/profile review tiles.
- `app/[locale]/_components/salon/_shared.ts:186` — `avatarColor(name)`: same — move to `lib/format.ts` or `lib/avatar.ts`.
- `app/[locale]/_components/salon/_shared.ts:116` — `capitalize(s)`: move to `lib/format.ts` (per Group 1 above).
- `app/[locale]/_components/salon/_shared.ts:143` — `postalToCity(postalCode)`: move to `lib/cities.ts` (lib/cities.ts already exists and handles city slugs — this is the natural home).
- `app/[locale]/_components/salon/_shared.ts:149` — `computeOpenStatus(hours)`: consolidate with `lib/salon-hours.ts:isOpenNow` per Group 10.
- `app/[locale]/dashboard/revenue/page.tsx:36` `fmt(n)` — Swiss number formatter, used 1x but identical-shape helpers in `components-legacy/TrustStatsBanner.tsx:162`, `components-legacy/ui/SocialProofStrip.tsx:67`, `components-legacy/home/TrustStatsBanner.tsx:49,50` — should be `lib/format.ts:formatSwiss(n)`.
- `components-legacy/dashboard/NotificationCenter.tsx:34` + `components-legacy/dashboard/ActivityFeed.tsx:43` — relative-time logic per Group 8 above.
- `app/[locale]/_components/salon/SalonBreadcrumb.tsx:44` — inline diacritic strip `city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")` is exactly the first 4 lines of `lib/utils.ts:slugify`. Should call `slugify(city)`.

---

## Dead code in `lib/utils.ts`

Verified via grep that NO file imports any of these — only `cn` from this file is used:

| Export | Status |
|---|---|
| `cn` | LIVE (used 50+ places) |
| `slugify` | DEAD (0 imports; consumers either skip or inline) |
| `formatPrice` | DEAD (shadowed by `lib/format.ts:formatPrice` which is the one consumers import) |
| `formatDuration` | DEAD (0 imports) |
| `isWithinHours` | DEAD (0 imports) |
| `advanceByFrequency` | DEAD (0 imports) |

**Recommendation:** Trim `lib/utils.ts` to just the `cn` export (and the `import { type ClassValue, clsx } from "clsx"` line). Or, conversely, accept `lib/utils.ts` as the strings/format home and migrate everything in (move `slugify` etc. to be consumed). Pick one; current state is "the file exists, nobody uses it, identical functions live elsewhere."

---

## Singletons (good — keep)

- **`cn`** — only in `lib/utils.ts:7` (uses `clsx` directly, no `tailwind-merge` wrapper needed). 68 importers. No duplicate implementations, no `classNames(` / `twMerge(` reimplementations found. Healthy.
- **`slugify`** — only in `lib/utils.ts:15`. (Dead — 0 imports, but no duplicate either. One inline diacritic-strip in `SalonBreadcrumb.tsx:44` — that's a partial duplicate, not a full one.)
- **`formatCount`, `formatTime`, `formatRating`, `formatTimeOffset`** — all single-source in `lib/format.ts`. No duplicates.
- **`isOpenNow`** — single canonical in `lib/salon-hours.ts:50` (`computeOpenStatus` in `_shared.ts:149` is a different return shape — covered as Group 10).
- **`postalToCity`, `avatarColor`, `formatReviewDate`** — all single-source in `_shared.ts`. No duplicates yet but at risk; recommend hoisting to `lib/` for reuse.

## Notes

- **`debounce` / `throttle` not implemented.** One inline numeric constant `debounce = opts?.debounceMs ?? 300` in `useSearchSuggest.ts:79` — that's just a config var, not a function. No real debounce util exists. If/when needed, add to `lib/async.ts`.
- **No `slugify` duplicates** by name — but `SalonBreadcrumb.tsx:44` inlines the equivalent diacritic-stripping logic. Single inline reimplementation, not a true duplicate group.
- **`escapeHtml` / `stripHtml` / `sanitize` / `kebabCase` / `camelCase` / `snakeCase` / `titleCase` / `truncate` / `parseDate` / `parsePhone` / `formatPhone`:** none found. Either not needed yet or hidden behind libraries (zod for validation, etc.).
- **No type guards** (`isString`, `isNumber`, `isObject`, etc.) — TypeScript code relies on `typeof`/`Array.isArray()` inline.
- **No object utilities** (`deepClone`, `deepMerge`, `pick`, `omit`, `groupBy`, `chunk`, `uniq`) — only `groupByPeriod` (`DateTimePicker.tsx:359`) and `pickOneSlot` / `pickSlot` / `pickCardLabel` which are domain-specific, not generic utility helpers. No `JSON.parse(JSON.stringify(...))` shallow-clone pattern found either.
- **No storage wrappers** — `localStorage`/`sessionStorage` used directly 59 times across the codebase, no `lib/storage.ts` helper. One file-local `readStorage` in `RecentlyViewed.tsx:93`. If consolidating, add `lib/storage.ts:getItem<T>(key, default): T` to handle JSON parse + try/catch + null fallback.
- **No logger.** Direct `console.error` (327 calls), `console.log` (6 calls). No `lib/logger.ts` exists. PostHog server logging happens via `lib/posthog-server.ts` but that's analytics, not a general log helper.
- **`date-fns` is already a dependency** (`AirbnbSearchBar.tsx`, `LastMinuteStrip.tsx`, `StaffAvailability.tsx`, `NotificationItem.tsx`). Use it as the canonical date library instead of the 5 ad-hoc `formatDate` impls.
- **83 inline `toLocaleDateString` instances + 29 inline `toLocaleTimeString` instances** — by far the biggest centralization opportunity. Each one re-encodes the locale string ("de-CH" hardcoded even though `locale` is available via `useLocale()` or route params). Single `formatDate(date, locale, style)` + `formatTime(date, locale)` helper pair would clean up 100+ inline calls and fix the i18n bug (every dashboard timestamp is hardcoded to de-CH regardless of user locale).
- **`Intl.DateTimeFormat` direct usage (6 instances)** — `confirmation/page.tsx:60`, `SearchBar.tsx:116`, `SearchResults.tsx:408`, `salon-hours.ts:28`, `GuidedSearch.tsx:320`, `PayConfirmStep.tsx:53`. Each one repeats the `locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : …` mapping. Extract as `lib/format.ts:localeToBCP47(locale): string`.

## Prioritized fix order (if/when this audit is acted on)

1. **Delete dead `lib/utils.ts` exports** (`slugify`, `formatPrice`, `formatDuration`, `isWithinHours`, `advanceByFrequency`) — 0 risk, 1 commit. (Keep `cn` and `slugify` only if `SalonBreadcrumb.tsx:44` is also fixed to import `slugify`.)
2. **Add `formatDate(date, locale, style)` + `formatTime(date, locale)` to `lib/format.ts`** and replace 83 + 29 inline `toLocaleDateString` / `toLocaleTimeString` calls. Fixes i18n bug as side effect. CRITICAL severity — biggest user-visible-correctness win.
3. **Move `capitalize` to `lib/format.ts`** and replace 16 inline copies — mechanical refactor.
4. **Hoist `getInitials` to `lib/format.ts`** alongside `avatarColor` (move both out of `_shared.ts`) and replace 10 inline single-char avatar patterns.
5. **Consolidate `generateICS` (3 impls → 1)** in `lib/ics-generator.ts`. Promote the `lib/booking-email.ts:21` implementation (has Europe/Zurich VTIMEZONE block — needed for Outlook/Apple Calendar correctness).
6. **Consolidate `haversine` (2 impls → 1)** in new `lib/geo.ts`.
7. **Add `lib/format.ts:formatTimeAgo` wrapping `date-fns/formatDistanceToNow`** and replace 4 inline relative-time impls.
8. **Add `lib/id.ts` with `randomFileId` / `randomShortId`** and replace 11 inline `Math.random().toString(36)` patterns.
9. **Decide `formatPrice` vs `formatCurrency`** — pick one canonical, migrate 55 importers to the chosen helper.
10. **Add `lib/format.ts:formatSwiss(n)`** Swiss-locale integer formatter and replace 10+ inline `n.toLocaleString("de-CH")` calls in trust banners / dashboard stat pills.
