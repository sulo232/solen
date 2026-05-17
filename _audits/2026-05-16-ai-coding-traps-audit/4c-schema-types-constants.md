# Topic 4C — Type / Schema / Constants Duplication
Date: 2026-05-16
Scope: Repeated type defs, zod schema dup, constants scattered

## Summary
- Duplicate type/interface groups: 9 (Salon, Service, StaffMember, Review, Booking, CitySlug, BookingStatus chain, Stylist, SalonDetail)
- Duplicate zod schemas: 6 groups (loginSchema, signupSchema, otpSchema, adminUserPatch, leadSchema, voucher/voucherCreate)
- Duplicate constants groups: 9 (CATEGORIES chain, hair-cat enum, gender enum, DAY_KEYS, PAGE_SIZE, LOCALES, role list, time math, phone regex)
- Tailwind ↔ globals.css token drift: 5 active conflicts (substrate, heading ink, ink-2, border, warning) + 2 retired colors still live in CSS (`#043338`, `#7A2415`)
- CRITICAL (design lock currently violated in prod): 1 (`<body>` substrate white in CSS vs cream in Tailwind)
- HIGH severity (drift confirmed, prod-affecting): 9
- MEDIUM (drift waiting to happen, not yet incident): 13
- LOW (defensible scoping or local UI labels): 7

Headline confirmations:
- CLAUDE.md's "4-place CATEGORIES chain" is now a **6-place chain** spread across `lib/types.ts`, `lib/constants/categories.ts`, `lib/validations.ts`, `lib/search/category-detect.ts`, `app/sitemap.ts`, `app/[locale]/[city]/[category]/page.tsx`, plus 3 secondary CATEGORY_OPTIONS / CATEGORY_ICONS sub-renderings in pages.
- Worst type duplicate is `Service` — defined 9 times across the repo with at least 3 distinct, drifted shapes (megabuild fields vs salon-detail fields vs dashboard `{id, name_de}` stub).
- Worst zod drift: `signupSchema` exists with **different validation rules** in `lib/validations.ts` (min 8, max 200) vs `app/api/auth/signup/route.ts` (min 8 + must contain uppercase + must contain digit + birthday/salon_name branch). The lib copy is referenced by nothing.

---

## Type / interface duplicates

| Name | Definition count | Locations | Drift? |
|---|---|---|---|
| **Service** | **9** | `lib/types.ts:172` (canonical, megabuild fields) · `lib/service-templates.ts:1` (`ServiceTemplate` — alt name, same shape role) · `app/[locale]/_components/salon/_shared.ts:9` · `app/[locale]/dashboard/staff/page.tsx:14` (`{id, name_de}` stub) · `components-legacy/booking/BookingWizard.tsx:42` · `components-legacy/booking/ServicesStaffStep.tsx:15` · `components-legacy/dashboard/LastMinuteManager.tsx:15` · `components-legacy/dashboard/barber/ExpressMenu.tsx:7` · `components-legacy/staff/StaffProfilePage.tsx:33` (`StaffService`) | **YES — 3+ shapes**: canonical has `salon_id, suitable_for, suitable_gender, buffer_minutes, processing_minutes, photo_urls, …`; `_shared.ts` has `subcategory` but no `salon_id` and `name_en\|null`; dashboard stub has only `id+name_de` |
| **Salon** | **5** | `lib/types.ts:105` (canonical) · `app/[locale]/_components/salon/_shared.ts:55` (`SalonDetail` — incompatible shape, calls it `quartier` required, lacks `owner_id/is_active`) · `app/[locale]/_components/search/SearchResults.tsx:33` (`type Salon`) · `app/[locale]/vouchers/page.tsx:21` · `hooks/useSalonProfile.ts:5` (`SalonProfile`) | **YES**: `SalonDetail` (`_shared.ts:55`) and canonical `Salon` have wildly different required-field sets — `SalonDetail` doesn't extend `Salon`, redeclares from scratch. Same conceptual entity, no shared parent. |
| **StaffMember / Staff** | **6** | `lib/types.ts:150` (canonical) · `app/[locale]/_components/salon/_shared.ts:22` · `components-legacy/discovery/PickStylistFlow.tsx:8` · `components-legacy/discovery/StaffPortfolio.tsx:7` · `components-legacy/staff/StaffProfilePage.tsx:12` (`StaffProfile`) · `app/[locale]/dashboard/staff/page.tsx:19` (`StaffModalProps` references it ambiently) | **YES**: canonical has 20 fields incl. permissions (`can_edit_schedule`, `commission_rate`); legacy and shared variants pick 5-8 fields each, with `salon_name`/`salon_slug` added in legacy that aren't on canonical |
| **Review** | **5** | `lib/types.ts:297` (canonical) · `app/[locale]/_components/salon/_shared.ts:33` (legacy-compat: dual `comment` + `comment_de`/`comment_en`) · `app/[locale]/dashboard/review-moderation/page.tsx:11` · `app/[locale]/dashboard/reviews/page.tsx:11` · `app/[locale]/_components/homepage/Reviews.tsx:29` (UI shape: `{stars, text, initials, name, salonName, salonSlug, meta}`) · `components-legacy/staff/StaffProfilePage.tsx:41` (`StaffReview`) | **YES**: 3 shapes — DB shape (canonical), Fresha-API shape (`_shared.ts`), UI demo shape (homepage). Homepage one is unrelated semantically but reuses the name. |
| **Booking** | **5** | `lib/types.ts:225` (canonical, megabuild) · `app/[locale]/dashboard/clients/page.tsx:27` (5-field stub) · `app/[locale]/_components/homepage/WhySolen.tsx:40` (`BookingBlock` — unrelated UI label) · `components-legacy/booking/BookingCard.tsx:15` (different status union: `'confirmed'\|'pending'\|'cancelled'\|'completed'`, no `pending_approval/no_show`) · `app/[locale]/checkout/page.tsx:26` (`BookingIntent`) | **YES — status union drift**: canonical has 6 values (`pending\|pending_approval\|confirmed\|cancelled\|completed\|no_show`); legacy `BookingCard.tsx` has 4 values, missing `pending_approval` and `no_show`. State machine drift. |
| **Stylist** | 2 | `app/[locale]/_components/homepage/FeaturedStylists.tsx:26` · `app/[locale]/_components/homepage/useSearchSuggest.ts:38` (`StylistResult`) | LOW — distinct purposes (UI demo vs search-result row), but both reach into staff territory and could converge with `StaffMember`. |
| **CitySlug** | 2 | `lib/types.ts:19` · `lib/cities.ts:7` | **YES — identical literal type definition in 2 files**. `lib/cities.ts` is the canonical (has helpers `getCityName`/`findNearestCity`); `lib/types.ts:19` is a verbatim copy. Importing from either is allowed, so half the codebase uses each. |
| **SalonDetail** | 2 | `app/[locale]/_components/salon/_shared.ts:55` · `app/[locale]/salon/[slug]/page.tsx:58` (`interface SalonDetail extends Salon`) | **YES — different definitions, same name**: one stand-alone, the other extends canonical `Salon`. Importer confusion guaranteed. |
| **Database row types redefined** (umbrella) | n/a | No `lib/database.types.ts` generated file exists. ALL ~80 entity types in `lib/types.ts` are hand-rolled and have to be kept in sync with Postgres manually. Then re-inlined into route handlers/pages as ad-hoc subsets. | **YES system-wide** — the absence of generated types is the root cause that every page invents its own subset of `Salon`/`Service`/`StaffMember`/`Review`/`Booking` instead of importing a row type. |

---

## Zod schema duplicates

| Schema purpose | Inline locations | Canonical (if any) | Recommendation |
|---|---|---|---|
| **`loginSchema`** | `app/api/auth/login/route.ts:8` (`{email, password.min(1)}`) | `lib/validations.ts:486` (`{email, password.min(1).max(200)}`) | **HIGH drift**: route ignores max(200) cap. Route inline copy is what runs in prod; the `lib/validations.ts` export is unreferenced. Delete dead export or replace inline with import. |
| **`signupSchema`** | `app/api/auth/signup/route.ts:16` (full: `email + password.min(8).regex(uppercase).regex(digit) + birthday + salon_name + refine(age>=16)`) | `lib/validations.ts:491` (`{email, password.min(8).max(200), display_name}`) | **HIGH drift**: lib copy is a totally different schema for a totally different signup flow. Same name, incompatible semantics. lib copy is unreferenced. |
| **`otpSchema` / `verifyOtpSchema`** | `app/api/auth/verify-otp/route.ts:8` (`token.length(6) + type.enum(["signup","email"]).default("signup")`) | `lib/validations.ts:497` (`token.min(4).max(10) + type.enum(["email","sms","magiclink"]).optional()`) | **HIGH drift**: token length and `type` enum members differ. Both schemas valid for different OTP modes but share the name. |
| **`adminUserPatch`** | `app/api/admin/users/route.ts:8` (`role enum`) | `lib/validations.ts:587` (`role + banned_at + ban_reason`) | MEDIUM: route version is a subset. Use lib version. |
| **`badgeCreate / badgeAssign`** | `app/api/admin/badges/route.ts:8` and `app/api/admin/badges/assign/route.ts:8` | `lib/validations.ts:511` (`adminBadgeSchema`), `:518` (`adminBadgeAssignSchema`) | MEDIUM: routes redefine inline; lib copies exist but unused. |
| **`createVoucher / createVoucherCreate`** | `app/api/vouchers/route.ts:12` (`createVoucherSchema`) and `app/api/vouchers/create/route.ts:21` (`CreateVoucherSchema` — different casing, same purpose) | none | MEDIUM: same business purpose (mint a voucher), camelCase vs PascalCase, different schema shapes. Pick one. |
| **`leadSchema`** | `app/api/partner/leads/route.ts:5` | none | LOW: inline-only, fine. |
| **Email validation** | 18 distinct inline `z.string().email()` calls across `app/api/auth/*`, `app/api/admin/*`, `app/api/newsletter/route.ts`, `app/api/partner/leads/route.ts`, `app/api/vouchers/*`, `lib/registration-validation.ts`, `lib/validations.ts` (9× inside) | none | MEDIUM: most just `z.string().email()` but `lib/registration-validation.ts:7` + `app/api/auth/signup/route.ts:17` + `:login:9` use `"Ungültige E-Mail-Adresse"` message; others use English default. Centralize to `email: z.string().email("Ungültige E-Mail-Adresse")` in `lib/schemas/primitives.ts`. |
| **Phone (Swiss)** | `lib/registration-validation.ts:3` (`/^\+41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/`) · `lib/validations.ts:254` (`/^\+41[0-9]{9}$/`) | none | **HIGH drift — REGEX MISMATCH**: registration accepts `+41 76 123 45 67` (spaces optional); walk-in accepts `+41761234567` only. Same phone number rejected by one and accepted by other. Centralize. |
| **UUID** | 131 inline `z.string().uuid()` / `z.string().uuid()` calls; `lib/validations.ts:16` has `const uuid = z.string().uuid()` but only used in a few places within that file | `lib/validations.ts:16` | LOW: zod inlining is fine; not a real drift target unless format requirements change. |
| **`locale` enum** | 8 sites of `z.enum(["de","en","fr","it"])`: `lib/validations.ts:55,525,568,845,846,904` + `app/api/admin/help/route.ts:17` + `app/api/recommendations/route.ts:15` | `i18n.ts:3` has `locales = ["de", "en", "fr", "it"] as const` (canonical), but it's the runtime array, not a zod schema | MEDIUM: every site re-types the same enum. Should be `localeSchema = z.enum(locales)` once. |

---

## Constants drift (most-affected by drift)

### CATEGORIES chain (CLAUDE.md known issue — **confirmed and worse than documented**)

CLAUDE.md said 4 places. Actually **9 distinct definitions** of the Salon category list:

| # | Location | Definition | Drift |
|---|---|---|---|
| 1 | `lib/types.ts:11` | `type SalonCategory = "coiffeur" \| "barbershop" \| "nails" \| "spa" \| "makeup" \| "waxing"` | canonical |
| 2 | `lib/constants/categories.ts:9` | `CATEGORY_OPTIONS` with `{value, label, emoji}` rows for all 6 | OK — imports `SalonCategory` |
| 3 | `lib/validations.ts:153` | `const salonCategory = z.enum(["coiffeur","barbershop","nails","spa","makeup","waxing"])` | drift risk — string literals copy-pasted from canonical |
| 4 | `lib/search/category-detect.ts:5` | `const CATEGORIES = ["coiffeur","barbershop","nails","spa","makeup","waxing"]` + same list pasted into the Gemini prompt at line 23 | **TRIPLE COPY** (TS array + Gemini prompt + types.ts) |
| 5 | `app/sitemap.ts:10` | `const CATEGORIES = ["coiffeur","barbershop","nails","spa","makeup","waxing"]` | drift risk |
| 6 | `app/[locale]/[city]/[category]/page.tsx:16` | `const CATEGORIES = ["coiffeur","nails","barbershop","spa","makeup","waxing"]` (note **order differs** — `nails` before `barbershop`) | drift confirmed |
| 7 | `components-legacy/layout/CategoryStickyRow.tsx:15` | `const CATEGORIES = ["coiffeur","barbershop","nails","spa","makeup","waxing"] as const` | drift risk |
| 8 | `app/[locale]/_components/homepage/searchCategories.ts:35` | `CATEGORIES: SearchCategory[]` — only **4 entries** (no makeup, no waxing — V3 4-cat lock) | **DRIFT INTENTIONAL but un-marked**: this is the V3 4-cat truth; types.ts still has all 6 |
| 9 | `app/[locale]/auth/register/page.tsx:436` | `CATEGORY_OPTIONS` redefined inline as `{value, label, icon: React.ReactNode}[]` | drift — `lib/constants/categories.ts` already exists with the same name; this file shadows it |

Plus secondary derivations:
- `app/[locale]/salon/[slug]/page.tsx:74` — `CATEGORY_ICONS: Record<SalonCategory, FC>` — maps to lucide icons; OK because it uses `SalonCategory`
- `app/[locale]/help/page.tsx:20` — `const CATEGORIES = [...]` — different help-article categories, naming collision only
- `app/[locale]/angebote/page.tsx:40` — `FILTER_CATEGORIES = [...]` — derivation
- `app/[locale]/salon/[slug]/layout.tsx:6-9` — 4 locale-keyed objects `de/en/fr/it: {coiffeur, barbershop, nails, spa, makeup, waxing}` — 4× ordered repetition of all 6 keys for translations
- `app/[locale]/dashboard/services/page.tsx:16` — `{coiffeur:"Coiffeur", barbershop:"Barbershop", ...}` — inline label map

**Hair-discovery sub-enum** (separate chain — 8 locations):
`z.enum(["hair","beard","nails","makeup","waxing"])` appears 8× inside `lib/validations.ts` (lines 124, 135, 215, 223, 232, 605, 623, 630) and once in `components-legacy/discovery/DiscoveryAdmin.tsx:20`. Should be a single exported `discoveryCategorySchema`. (Note this is **NOT** the same set as `SalonCategory` — it has `hair` and `beard` but no `coiffeur`/`barbershop`/`spa`. Conceptually related, deliberately distinct.)

**Verdict on CATEGORIES chain:** Confirmed. Worse than CLAUDE.md flagged. 9 primary definitions + 5+ secondary derivations. Ordering already drifted (`/(city)/[category]/page.tsx` has nails before barbershop). The 4-cat V3 lock in `searchCategories.ts` versus 6-cat in `lib/types.ts` is an undocumented semantic split that will keep biting.

### Other constants — full inventory

| Constant | Locations | Severity | Notes |
|---|---|---|---|
| **`LOCALES = ["de","en","fr","it"]`** | `i18n.ts:3` (canonical `locales`) · `app/sitemap.ts:8` · `lib/seo.ts:24` · `components-legacy/ProfilePage.tsx:524` (inline literal) · `lib/validations.ts` (8× as inline `z.enum`) · `app/api/admin/help/route.ts:17` · `app/api/recommendations/route.ts:15` | MEDIUM | `i18n.ts` is canonical. Reuse via `Locale` type + `z.enum(locales)`. Currently the array literal is copy-pasted in `sitemap.ts` and `seo.ts`. |
| **`DAY_KEYS`** (**8 defs, 3 orderings**) | `lib/salon-hours.ts:18` (**`["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]` — full-name Sunday-first, third convention!**) · `app/[locale]/_components/salon/_shared.ts:103` (`["mon","tue","wed","thu","fri","sat","sun"]` Mon-first short) · `app/[locale]/dashboard/settings/page.tsx:26` (Mon-first short) · `app/[locale]/dashboard/calendar/page.tsx:135` (Mon-first short) · `components-legacy/onboarding/steps/OpeningHoursStep.tsx:8` (Mon-first short) · `app/[locale]/salon/[slug]/page.tsx:72` (**`["sun","mon","tue","wed","thu","fri","sat"]` — Sun-first short**) · `components-legacy/ui/QuickPreviewSheet.tsx:27` (Sun-first short) · `components-legacy/salon/SalonOpeningHours.tsx:8` (Sun-first short) | **HIGH drift** | **Three competing conventions** under one name: full-name Sun-first (used by `salon-hours.ts` business-hours logic), short-form Sun-first (used by `getDay()` indexing in salon-detail pages), short-form Mon-first (used in dashboard forms). An engineer importing `DAY_KEYS` from the wrong file and indexing with `new Date().getDay()` will silently produce a one-day-off bug. |
| **`PAGE_SIZE`** | `app/[locale]/angebote/page.tsx:18` (20) · `components-legacy/ChatWindow.tsx:32` (30) · `components-legacy/CategoryPage.tsx:30` (12) · `components-legacy/search/SplitView.tsx:23` (12) · `app/api/directory/route.ts:7` (`DEFAULT_LIMIT = 12`) | MEDIUM | 4 different values across files, all named `PAGE_SIZE`. Some are legitimately context-specific (chat vs gallery), but no central `DEFAULT_PAGE_SIZE` / `CHAT_PAGE_SIZE` namespace. |
| **`UserRole`** | `lib/types.ts:33` (`"customer"\|"salon_owner"\|"admin"`) · `lib/validations.ts:588` (inline `z.enum`) · `app/api/admin/users/route.ts:10` (inline `z.enum`) | LOW | Drift risk if a 4th role is added. |
| **`Gender` enums** | `lib/types.ts:31` (`"male"\|"female"\|"non_binary"\|"prefer_not_to_say"` — 4 values, customer-facing) · `lib/validations.ts:60,125,136,224,606,751` (`["male","female","unisex"]` — 3 values, service-facing) | LOW | Intentionally different domains (user gender ≠ service suitability), but the naming collision (`Gender` vs `suitable_gender`) is confusing. |
| **`PaymentStatus`, `AdjustmentStatus`, `DisputeStatus`** | `lib/types.ts:705-710` (canonical) · `lib/validations.ts:540` (`reportDisputeSchema` re-types `'quality'\|'no_show_by_salon'\|'wrong_service'\|'overcharge'\|'other'` from `DisputeIssueType`) | LOW | One redundant restatement; not a real drift target since zod needs the literal anyway. |
| **`BookingStatus`** | `lib/types.ts:21` (canonical, 6 values) · `components-legacy/booking/BookingCard.tsx:24` (4 values, missing `pending_approval` and `no_show`) · `lib/validations.ts:668` (`["completed","no_show","cancelled"]` — partial subset used as `bookingPatchSchema`) | **HIGH drift** | BookingCard's 4-value union will fail type-check against bookings whose status was set to `pending_approval` by API. |
| **Bucket names** (`'avatars'`, `'discovery-images'`, `'salon-documents'`, `'service-photos'`, `'review-photos'`, `'client-photos'`) | 4 file groups: `app/api/clients/[id]/photos/route.ts` · `app/api/salon/documents/route.ts` · `app/api/admin/discovery/*` · `app/api/services/[id]/photos/route.ts` · `app/api/reviews/[id]/photos/route.ts` + `components-legacy/ui/Image{Uploader,Upload}.tsx` (passes `bucket` as prop, accepts any string) | MEDIUM | No central `lib/storage-buckets.ts` constant. Each route file hardcodes the bucket name; one rename = N edits and no compile-time guarantee. Recommend `BUCKETS = { discoveryImages: "discovery-images", salonDocuments: "salon-documents", … } as const`. |
| **RPC function names** | 8 distinct names called from exactly 1 file each: `toggle_discovery_save`, `toggle_discovery_like`, `match_search_embeddings`, `increment_unread`, `increment_discovery_view`, `get_nearby_salon_ids`, `get_last_minute_slots`, `create_group_booking` | LOW | No cross-file dup (each called once). Centralization would help refactors but isn't drift-prone today. |
| **Time math** | 20+ inline expressions of `1000 * 60 * 60`, `24 * 60 * 60 * 1000`, `7 * 24 * 60 * 60 * 1000` (one week), `365 * 24 * 60 * 60 * 1000` (one year) across `app/api/**`, `app/[locale]/profile/vouchers/page.tsx`, etc. | MEDIUM | No `ONE_DAY_MS`, `ONE_WEEK_MS`, `ONE_HOUR_MS` constants anywhere. Read-error and arithmetic-error risk grows with each new file. |
| **TABS / sort options** | Each page has its own `TABS = [...]` array (`salon/[slug]/page.tsx:250`, `dashboard/discovery-admin/page.tsx:20`, `dashboard/content-editor/page.tsx:24`, `components-legacy/layout/BottomTabBar.tsx:13`, etc.) | LOW | These are legitimately page-local; not drift candidates. |

---

## Tailwind config vs CSS variables drift

`tailwind.config.js` declares brand tokens; `app/globals.css` declares parallel CSS custom properties under `:root`. Both feed UI styling. **Multiple tokens with the same intent drift between the two files.** Per LIVE_TRUTH the single source of truth should be Tailwind tokens, but globals.css repeats values and they don't all match.

| Token (intent) | tailwind.config.js | app/globals.css | Match? | Severity |
|---|---|---|---|---|
| **Primary ink / heading text** | `s-ink.DEFAULT = #2A1F18` (line 60) | `--color-heading: #1A1209` (globals.css:58), `--color-body: #1A1209` (:59) | **NO** — Tailwind warm-charcoal `#2A1F18` vs globals warm-near-black `#1A1209`. ~16 RGB unit difference, visibly different ink tone. | **HIGH** — any component reading `text-s-ink` vs `color: var(--color-body)` will display different darknesses |
| **Secondary ink** | `s-ink-2 = #5C4A3A` (line 61) | `--color-muted: #56463E` (:60) | **NO** — `#5C4A3A` vs `#56463E`. Both warm-grey but distinguishable. | **MEDIUM** |
| **Border line** | `s-border = #EAE0D0` (line 63) | `--color-border: #EFE7DD` (:61) | **NO** — `#EAE0D0` (V2-D60 desaturated bone) vs `#EFE7DD` (older warmer cream). | **MEDIUM** — globals.css `* { border-color: var(--color-border) }` rule (line 103) means EVERY default-bordered element uses the OLD `#EFE7DD`, not the new `#EAE0D0`. The token in Tailwind has effectively no users in the default-bordered path. |
| **Warning color** | `s-warning.DEFAULT = #F59E0B` (Tailwind amber/oj) | `--color-warning: #F3A864` (globals.css:65 — labeled "s-amber") | **NO** — `#F59E0B` is Tailwind's `amber-500`; `#F3A864` is a custom warm-peach. The comment in globals.css says `s-amber` but `s-amber` is not even declared in tailwind.config.js. | **MEDIUM** — warning toasts/inline messages will show different oranges depending on whether they `bg-s-warning` or `color: var(--color-warning)` |
| **Page substrate (bg.base)** | `s-bg.base = #FAF3E6` (line 66 — V2-D60 lighter cream lock) | `--bg = #FFFFFF; --base = #FFFFFF` (:68-69, locked-comment cites Q15 "white page 2026-04-22") | **NO** — Tailwind says cream substrate, globals.css says **white substrate** with a Q15 lock comment from April. The `<body>` line uses `background-color: var(--base)` → white. **The V2-D60 cream `#FAF3E6` substrate locked in CLAUDE.md is NOT applied by globals.css** — only by anything that explicitly `bg-s-bg-base`. | **CRITICAL — design lock violation**. Per CLAUDE.md anti-pattern #1, "`bg-white` on `<body>` element kills atmosphere wash." Globals.css does exactly this via `--base: #FFFFFF`. The atmosphere wash relies on the cream substrate; whichever path overrides which silently determines the page substrate. |
| **Success color** | `s-success.DEFAULT = #16A34A` | `--color-success: #16A34A` (:64) | YES | LOW |
| **Error color** | `s-error.DEFAULT = #D32F2F` | `--color-error: #D32F2F` (:63) | YES | LOW |
| **Border-radius card** | `borderRadius.card = 16px` (line 98) | `--radius-card: 16px; --radius-card-outer: 16px` (:38-39) | YES | LOW |
| **Border-radius pill** | `borderRadius.pill = 9999px` (line 102) | `--radius-pill: 9999px` (:40) | YES | LOW |
| **Border-radius input** | `borderRadius.input = 16px` (line 104) | `--radius-input: 16px` (:41) | YES | LOW |
| **Shadow elevations** | `boxShadow["elevation-1/2/3"]` (lines 122-124) | `--shadow-rest`, `--shadow-hover`, `--shadow-floating` (:44-46) | YES — same triple `rgba(50,47,44,…)` recipe | LOW |
| **Easing tokens** | `transitionTimingFunction.ease-out-strong, ease-in-out-strong, ease-drawer` (151-153) | `--ease-out-strong, --ease-in-out-strong, --ease-drawer` (:82-84) | YES | LOW |
| **HSL legacy vars** | `border = hsl(var(--border))`, etc. — refs `--border: 30 15% 85%` (globals.css:17) → ≈ `#DCD5CD` | `--border: 30 15% 85%` directly | YES (consistent) — but separate channel from `s-border` Tailwind token | MEDIUM — **two parallel border-color systems** (`border` HSL chain vs `s-border` direct hex). Random shadcn-derived components use HSL chain; Solen V3 components use `s-border`. Each renders a different cream depending on origin. |
| **Retired V2-D15-3 dark teal `#043338` still in globals.css** | n/a (removed from Tailwind config in V2-D48) | `globals.css:299` outline focus, `:309-310` focus-ring border + shadow, `:653` `--driver-theme-color`, `:691` driver `background-color` | **NO — RETIRED COLOR STILL ACTIVE** in globals.css | **HIGH** — per CLAUDE.md "Retired — do not reintroduce", the V2-D15-3 dark teal `#043338` is on the retired list. It still drives focus outlines, focus-ring shadow, and a "driver"-overlay theme color (likely a tour-driver lib) on the live site. Anyone tabbing through inputs sees the OLD teal focus ring on the NEW emerald page. |
| **Retired V2-D15-3 brand text `#7A2415`** | n/a (not in Tailwind) | `globals.css:249` `color: #7A2415` | **NO — RETIRED COLOR STILL ACTIVE** | **MEDIUM** — checking the surrounding rule will confirm scope, but this hex is from the older orange/coral palette. |
| **Comment-as-doc references to retired colors** | n/a | `globals.css:825` cites `#C2F0F1`, `#E1F4F4`, `#CAE8FF`, `#005898`, `#031E48` in a `/* … */` block | n/a — comment only, doesn't affect runtime | LOW — but a future engineer copying the comment-cited hex will use a retired color. |

### Tailwind / CSS drift — summary

- **CRITICAL**: `--base: #FFFFFF` in globals.css contradicts `s-bg.base: #FAF3E6` in Tailwind. The `<body>` uses `var(--base)` → page substrate is WHITE despite V2-D60 cream lock. This is the anti-pattern #1 violation that CLAUDE.md explicitly flags as "kills atmosphere wash" — and it's currently shipped.
- **HIGH**: `--color-heading` / `--color-body` drift (`#1A1209` in CSS vs `#2A1F18` in Tailwind). Ink darkness depends on whether a component uses `text-s-ink` className or `color: var(--color-body)`.
- **HIGH**: Retired dark teal `#043338` still active in 4 globals.css rules — focus rings + driver overlay still rendering V2-D15-3 brand.
- **MEDIUM**: Border, muted, warning all drift by 5-30 RGB units between the two files.
- **LOW**: Border-radius, shadows, easing tokens are duplicated but values match.

### Recommendation

Globals.css `:root` block should be **derived from** Tailwind tokens, not parallel-declared. Either:
1. Generate `:root` block from `tailwind.config.js` at build time (similar to shadcn's CSS vars approach).
2. Strip color/radius/shadow CSS variables from globals.css entirely; have all components consume Tailwind classes only. Keep only what HSL-shadcn-compat requires.

Either way, the retired-color `#043338` runtime usage in globals.css needs surgical removal *now* — it ships a different focus-ring color than the locked palette.

---

## Notes

1. **The root issue is the absence of a generated Supabase types file.** No `lib/database.types.ts` exists. `lib/types.ts` (1180 lines) is hand-maintained and mirrors the schema "exactly" per its header comment — but every page that needs a subset of a row re-types it inline rather than importing/Pick-ing. This is the source for ~70% of the duplicate type definitions found. Recommend `supabase gen types typescript` into `lib/database.types.ts`, then `lib/types.ts` becomes thin re-exports (`export type Salon = Database["public"]["Tables"]["salons"]["Row"]`). Several entity-defs (`Booking`, `Salon`, `StaffMember`) already have "Megabuild extensions" comments, suggesting they DID drift from the schema during the Megabuild phase and were patched ad-hoc.

2. **`lib/validations.ts` is a 927-line junk drawer** with 124 exported schemas — but at least 6 of them are dead code shadowed by inline API-route redefinitions (`loginSchema`, `signupSchema`, `verifyOtpSchema` are the loudest). Half the route handlers import from it, half ignore it and inline. No naming convention enforces which is preferred. Recommend splitting into `lib/schemas/{auth,admin,booking,salon,discovery,nail,barber}.ts` and a `lib/schemas/primitives.ts` for shared `uuid`, `email`, `locale`, `phone`, `salonCategory`.

3. **The CATEGORIES chain is the most concerning** because of the Gemini-prompt copy in `lib/search/category-detect.ts:23`. If a new category is added (e.g. `tattoo`), it needs to be added in ≥10 files including a prose-string LLM prompt that won't fail typecheck. The current `searchCategories.ts` already silently drifted to 4 cats (V3 lock) while `types.ts`/`validations.ts`/sitemap still have 6 — meaning if a salon is `makeup`-only, the homepage search hub won't surface it and the sitemap will still list a 404-ing category page.

4. **DAY_KEYS Mon-first vs Sun-first** is a latent bug — both orderings appear under the same constant name. A future engineer importing "DAY_KEYS" from the wrong file and indexing with `new Date().getDay()` will silently produce a one-day-off bug.

5. **Phone regex drift** is a quiet production hazard. A user registers their salon with `+41 76 123 45 67` (passes `phoneSchema`), then a walk-in booking flow rejects the same number because `walkInSchema` requires no spaces. Same user, same number, two opposite verdicts.

6. **No fix is trivial** — every dedupe requires touching N call sites and rerunning typecheck. The high-leverage move is generating `lib/database.types.ts` from Postgres first; that automatically fixes ~30 of the type drift cases by giving everyone a shared row type to Pick from.

7. **The Tailwind ↔ globals.css drift is a separate, urgent fix from the type drift.** Two parallel token systems silently fight each other on the live site — `<body>` is white because of globals.css `--base`, the locked palette says cream, and CLAUDE.md anti-pattern #1 explicitly forbids exactly this. The Q15 lock comment in globals.css dated 2026-04-22 predates V2-D48 (2026-05-09) and V2-D60 (2026-05-14) substrate changes; the comment was never updated. This is the kind of "token sweep without grep" failure CLAUDE.md L8 / the `pre-sweep-check.sh` hook is designed to catch — except `globals.css` lives in the hook's exclusion list, so the sweep never reached it. Add globals.css to the sweep allow-list **or** strip color/radius/shadow from globals.css entirely.

---

## Severity recap

**CRITICAL (design lock currently violated in prod):**
- `<body>` substrate is WHITE in globals.css (`--base: #FFFFFF`) while Tailwind tokens lock cream `#FAF3E6` — directly violates CLAUDE.md anti-pattern #1 ("kills atmosphere wash"). Currently shipped.

**HIGH (active drift, can cause real bugs):**
- CATEGORIES chain (9 defs, 1 already mis-ordered, V3 4-cat vs DB 6-cat split)
- `Service` interface (9 defs, 3 incompatible shapes)
- `Booking` interface + `BookingStatus` (legacy missing 2 status values; type guards will fail)
- `loginSchema` / `signupSchema` / `otpSchema` drift between lib and route handlers
- Swiss phone regex drift (`registration-validation.ts` vs `validations.ts`)
- `DAY_KEYS` 3 conventions (full-Sun-first, short-Sun-first, short-Mon-first) under one name — latent off-by-one
- `Salon` / `SalonDetail` divergent definitions, same names
- Tailwind `s-ink` (`#2A1F18`) vs globals.css `--color-heading` (`#1A1209`) — visibly different ink tone
- Retired V2-D15-3 dark teal `#043338` still drives focus rings + driver overlay in globals.css

**MEDIUM (drift waiting to happen):**
- `Review`, `StaffMember` re-defined per-page (5-6 places each)
- `CitySlug` defined twice (`lib/cities.ts` + `lib/types.ts`)
- Bucket name string literals scattered
- `LOCALES` array literal duplicated in `sitemap.ts` + `seo.ts` + 8 inline zod sites
- Time math `1000 * 60 * 60 * 24 * N` inlined 20+ places
- Hair-discovery `z.enum(["hair","beard","nails","makeup","waxing"])` repeated 9 times
- `PAGE_SIZE` 4 different values, same name
- Email validation message inconsistency (German vs English)
- `adminUserPatchSchema`, badge schemas redefined in routes
- `createVoucher` casing inconsistency
- `UserRole` literals repeated inline in zod
- Tailwind `s-border` (`#EAE0D0`) vs globals.css `--color-border` (`#EFE7DD`) — affects EVERY default-bordered element via globals.css preflight override
- Tailwind `s-ink-2` (`#5C4A3A`) vs globals.css `--color-muted` (`#56463E`)
- Tailwind `s-warning` (`#F59E0B` amber) vs globals.css `--color-warning` (`#F3A864` peach)
- Two parallel border-color systems (HSL `--border` chain vs hex `s-border` direct)
- Retired V2-D15-3 brand text `#7A2415` still in globals.css:249

**LOW (defensible local-scope use):**
- `Stylist` 2 defs (intentional UI demo vs search result)
- `Gender` vs `suitable_gender` enum collision (different domains)
- Page-local `TABS` arrays
- RPC names (each used once)
- `PaymentStatus` etc. duplicated in zod schemas (zod needs the literal)
- `uuid = z.string().uuid()` 131 inline call sites (formatting drift only)
- Border-radius, shadow, easing tokens duplicated between Tailwind + globals.css but values match (only the duplication itself is the smell)
