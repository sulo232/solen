# V3 Wire-up Audit — 2026-05-10

> Status: **IN PROGRESS — Phase A** (inventory). Started after V2-D51 Path C ship.
>
> Origin: user observation that V3 UI surfaces look finished but most are visually-only — no real data, broken navigation, unverified state contracts. This audit maps what's wired vs what's a Potemkin mockup, then reconnects.

---

## Locked decisions

- **Scope:** customer-facing surfaces only (~78 pages). B2B dashboard (35+ `/dashboard/*` routes), Stripe webhooks, cron jobs, transactional email = separate audit later.
- **Legacy treatment:** **Modified Z — rebuild all customer-facing legacy pages in V3, sequenced in 3 tiers with shipping milestones between**. All 91 legacy customer pages eventually get V3 treatment, but we ship after each tier so we get user feedback + don't go silent for months.
- **3-tier sequencing:**
  - **Tier 1 (~15 critical-funnel pages, ~2 weeks):** ships first. Lock V2-D52, merge to main.
  - **Tier 2 (~30 secondary-surface pages, ~3 weeks):** ships second. Lock V2-D53.
  - **Tier 3 (~45 long-tail pages, ~3 weeks):** ships last. Lock V2-D54. Possible some Tier 3 pages don't need full V3 rebuild if we discover they're never visited.
- **No commits during audit phases A–E.** Punch list assembled first, then fix commits in Phase F (which now has 3 sub-phases F.1 / F.2 / F.3 — one per tier).
- **Branch:** stay on `claude/vigorous-spence-0e9aa7`. All Tier 1 audit + fix work piles into this branch; first merge to main when Phase G.1 passes (Tier 1 verify). Tiers 2 + 3 get their own branches off `main` after.

## Stunning Phase A.1 finding

**91 of 114 customer page.tsx files (80%) import from `components-legacy/`.** Only the homepage truly uses V3 components. The V3 work so far (V2-D14 → V2-D51) has been concentrated entirely on the homepage. Everything users click *off* the homepage lands them on a legacy page.

## Phases

### Phase A · Surface inventory (read-only, ~45 min)

Outputs to fill in below:
- [ ] **A.1 Routes table** — every directory under `app/[locale]/` tagged V3 / legacy / not-built / dead.
- [ ] **A.2 Components table** — every file under `app/[locale]/_components/` tagged real-data / DEMO-array / hardcoded-constant.
- [ ] **A.3 API routes table** — every directory under `app/api/` tagged producer-known / orphaned.
- [ ] **A.4 Navigation graph** — every (source, destination) pair from `router.push`, `<Link href=`, `redirect(`.

### Phase B · Critical-path walkthrough (~1 hr)

Click 4 user flows on localhost:
- [ ] **B.1 Cold visit → discovery → booking** (homepage → click salon card → salon detail → click Buchen).
- [ ] **B.2 Direct search** (type in SearchBar → click result → result page).
- [ ] **B.3 Returning user** (submit search → reload → recent pill → results).
- [ ] **B.4 Heart-save** (click heart → persist → favorites page).

Each step gets ✅ / ⚠️ / ❌ / 🟡.

### Phase C · State-contract audit (~45 min)

For each cross-surface state, verify producer + consumer agree:
- [ ] **C.1 SearchBar URL params** (`q, service, city, date, period`) → does `/search/page.tsx` read all of them?
- [ ] **C.2 Heart state** → where stored? Does any page consume?
- [ ] **C.3 Recent searches localStorage** → only consumed in SearchBar (already verified).
- [ ] **C.4 Locale + city cookies** → set + read consistently?
- [ ] **C.5 PostHog session ID** → identified across all pages?

### Phase D · Static-data ledger (~30 min)

- [ ] **D.1 List every `DEMO` array** in homepage feed sections.
- [ ] **D.2 Map each to real query** that would replace it.
- [ ] **D.3 Tag each as cheap-fix / needs-backend-route / blocked**.

### Phase E · Punch list assembly (~30 min)

Combine A–D into one prioritized doc with severity + effort tags. Per-page decisions on rebuild-vs-patch (per Option A direction but with cost reality).

### Phase F · Execute fixes (variable)

Work the punch list top-down. Each fix = its own commit. Localhost verification between commits. Stop when all 🔴 Blockers + cheap 🟠 fixes are done.

### Phase G · End-to-end re-verify + lock (~1 hr)

Re-walk Phase B's 4 critical paths. All must be ✅. Lock with V2-D52 entry. Merge to main.

---

## A.1 Routes table — DONE 2026-05-10

114 customer `page.tsx` files inventoried. Tier assignments below drive Phase F sequencing.

### Tier 1 — critical funnel (15 pages, ~2 weeks)

| Route | Status | Imports legacy? | Notes |
|---|---|---|---|
| `/` (homepage) | **V3 ✓** | No | Already shipped (V2-D14 → V2-D51) |
| `/search` | **legacy** | `@/components-legacy/search/SplitView` | Rebuild — receives URL params from V3 SearchBar |
| `/salon/[slug]` | **legacy** | `@/components-legacy/salon/StaffSection` (and probably more) | Rebuild — primary booking-flow entry |
| `/salon/[slug]/booking` | **legacy** | (assumed) | Rebuild — booking wizard |
| `/checkout` | **inline (no legacy)** | Stripe direct | Rebuild as V3 — payment step |
| `/confirmation` | **inline (no legacy)** | None | Rebuild as V3 — confetti + summary |
| `/auth/login` | **legacy** | `@/components-legacy/auth/SignIn` | Rebuild — first auth wall |
| `/auth/signup` | **inline (no legacy)** | None | Rebuild as V3 — first auth wall |
| `/profile` | **legacy (assumed)** | TBD verify | Rebuild — main profile page |
| `/profile/favorites` | **legacy** | `@/components-legacy/ui/EmptyStateFTU`, `SignatureLockup` | Rebuild — heart-saved targets |
| `/profile/bookings` | **legacy** | `@/components-legacy/booking` | Rebuild — bookings list |
| `/coiffeur` | **legacy** | `@/components-legacy/CategoryPage`, `CoiffeurSections` | Rebuild — category page |
| `/barbershop` | **legacy (assumed)** | TBD verify | Rebuild — category page |
| `/nails` | **legacy (assumed)** | TBD verify | Rebuild — category page |
| `/spa` | **legacy (assumed)** | TBD verify | Rebuild — category page |
| `/[city]` | **legacy** | `@/components-legacy/CityPage` | Rebuild — city homepage |

### Tier 2 — secondary surfaces (~30 pages, ~3 weeks)

Auth: `/auth/register`, `/auth/reset-password`
Salon detail extras: `/salon/[slug]/reviews`, `/staff`, `/packages`, `/gift-card`, `/barber`, `/barber/[barberSlug]`, `/staff/[staffId]`
Profile extras: `/profile/looks`, `/profile/gift-cards`, `/profile/intake-forms`, `/profile/packages`, `/profile/referral`, `/profile/stamps`, `/profile/vouchers`
Account: `/account`, `/account/saved`, `/account/messages`
Help + offers: `/help`, `/help/[slug]`, `/angebote`, `/last-minute`
Booking adjustments: `/booking-action`, `/bookings/[id]/approve-increase`, `/bookings/[id]/respond-adjustment`, `/termine`
Vouchers: `/vouchers`, `/vouchers/buy`
Discovery: `/discover`, `/[city]/[category]`
Other: `/onboarding/salon`, `/makeup`, `/waxing`, `/compare`, `/coming-soon`

### Tier 3 — long-tail (~45 pages, ~3 weeks)

Legal: `/agb`, `/datenschutz`, `/impressum`, `/privacy`, `/privacy/components`, `/tos`, `/terms`, `/terms/components`, `/terms/discovery`, `/legal/privacy`, `/legal/terms` (~11 pages of overlapping legal — Tier 3 includes deduping)
Treatments: `/behandlungen/[...slug]`
Brand: `/brand/[slug]`
Discovery extras: `/discover/[id]`, `/discover/nails`
Niche: `/loyalty/stamp`, `/referral/[code]`, `/staff-invite`, `/tip/[bookingId]`, `/walk-in-pay`
B2B funnel (still customer-facing): `/partner`, `/warum-solen`, `/fuer-salons`
Misc: `/nail-tech/[id]`, `/dev/primitives`

### Deferred (out of scope this audit)

All `/dashboard/*` routes (35+) — B2B side. Separate audit after customer-side ships.

## A.2 Components table — DONE 2026-05-10

21 files in `app/[locale]/_components/homepage/`. **6 of 7 feed sections use static DEMO arrays — none fetch real data.**

| Component | Data source | Replace with | Status |
|---|---|---|---|
| AtmosphereBlobs.tsx | n/a (decorative SVGs) | — | ✅ V3 final |
| AtmosphereGrain.tsx | n/a (SVG noise) | — | ✅ V3 final |
| Hero.tsx | n/a (static copy) | — | ✅ V3 final |
| HeartButton.tsx | n/a (state-only) | — | ✅ V3 final |
| SearchBar.tsx | **real** (`/api/search/suggest`) | — | ✅ V3 + wired (V2-D51) |
| SectionHeader.tsx | n/a (layout primitive) | — | ✅ V3 final |
| SalonCard.tsx | n/a (props-only) | — | ✅ V3 final |
| TestimonialsColumn.tsx | n/a (column primitive) | — | ✅ V3 final |
| **RecentlyViewed.tsx** | **DEMO array** | localStorage of last viewed salon slugs + bulk fetch | 🔴 fake — click goes to non-existent slugs |
| **LastMinute.tsx** | **DEMO array** | `select * from salons where last_minute_discount_percent > 0 limit N` | 🔴 fake |
| **Nearby.tsx** | **DEMO array** | needs geo / city — `select salons where city_id = X order by distance limit N` | 🔴 fake |
| **Coiffeur.tsx** | **DEMO array** | `select salons where 'coiffeur' = any(categories) and is_active limit 6` | 🔴 fake |
| **FeaturedStylists.tsx** | **DEMO array** (Stylist type) | `select * from staff_members order by feature_score limit 4` (or similar) | 🔴 fake |
| **Entdecken.tsx** | **DEMO array** (Look[]) | needs `discovery` table content | 🔴 fake |
| **Reviews.tsx** | TBD — comment mentions "TODO: client-side fetch" | recent reviews query | 🟡 TODO |
| WhySolen.tsx | n/a (static B2B card) | — | ✅ V3 final |
| searchCategories.ts | hardcoded counts | `select unnest(categories), count(*) from salons` | 🟡 cosmetic — counts go stale |
| searchFeatured.ts | static demo salons | replace with prop from page.tsx | 🟡 cosmetic — fake salon names |
| searchTrending.ts | hardcoded curated list | `/api/search/trending` aggregate (v2) | 🟡 by design |
| useRecentSearches.ts | localStorage | — | ✅ wired (V2-D51) |
| useSearchSuggest.ts | `/api/search/suggest` | — | ✅ wired (V2-D51) |

**Damage assessment:** clicking *any* salon card in the visible homepage feed sections (RecentlyViewed, LastMinute, Nearby, Coiffeur) → 404, because the demo slugs (`salon-maria`, `atelier-coiffure`, etc) don't match real salons in DB.

**Fix difficulty:**
- 🟢 Easy (~30 min each): Coiffeur, LastMinute, Nearby — 1 supabase query each at the page level, pass as prop.
- 🟠 Medium (~1-2 hr): FeaturedStylists, RecentlyViewed (needs localStorage strategy), Entdecken (needs `discovery` table contract), Reviews.

## A.3 API routes table — DONE 2026-05-10

327 total API route files. Customer-side homepage components use ONE of them: `/api/search/suggest`. The rest are admin / B2B / dashboard / unwired-but-built.

### Customer-side fetch surface (extremely small)

| Caller (homepage) | Route called | Status |
|---|---|---|
| `useSearchSuggest.ts` (V2-D51 hook) | `/api/search/suggest` | ✅ wired, real data |
| **all other homepage components** | none | 🔴 zero fetches — entirely DEMO arrays |

### Built-but-unwired routes the homepage SHOULD use

These exist on the backend, ready to call. Just nobody wires them in:

| Route | Existed? | Should be called by |
|---|---|---|
| `/api/salons/last-minute` | ✅ yes | LastMinute homepage section |
| `/api/salons/by-slug/[slug]` | ✅ yes | Salon detail page |
| `/api/profile/favorites` | ✅ yes | `/profile/favorites` page |
| `/api/reviews/featured` | ✅ yes | Reviews homepage section |
| `/api/discovery/feed` | ✅ yes | `/discover` page + Entdecken homepage section |
| `/api/slots/last-minute` | ✅ yes | LastMinute section detail |
| `/api/slots/next-available` | ✅ yes | salon detail availability |

### Routes referenced as TODOs (don't exist, comments only)

These appear in JSDoc / TODO comments but **no route file**. Future-build items:

| Route | Referenced in | Notes |
|---|---|---|
| `/api/salons/by-category` | `Coiffeur.tsx:15` (JSDoc TODO) | Comment-only — Coiffeur uses DEMO array, doesn't actually call this. **Need to build** for Tier 1 category pages. |
| `/api/favorites/toggle` | `HeartButton.tsx:45` (TODO comment) | Heart-save is local-only currently. **Need to build** so saves persist. |
| `/api/search/trending` | `searchTrending.ts:9` (v2 upgrade comment) | Hardcoded list works for v1; this is a v2 polish item. |

### Inventory by category

| Namespace | Count | Customer-relevant? |
|---|---|---|
| `/api/admin/*` | ~50 | ❌ B2B admin only |
| `/api/dashboard*` (mostly via /api/admin) | included above | ❌ B2B |
| `/api/auth/*` | ~7 | ✅ Tier 1 — login, signup, callback, logout, verify-otp, verify-phone |
| `/api/bookings/*` | ~10 | ✅ Tier 1 — create / cancel / confirm / dispute |
| `/api/salons/*` | ~15 | ✅ mostly Tier 1 — by-slug, by-category (TBD), last-minute, mine, search |
| `/api/search/*` | 4 | ✅ Tier 1 — suggest, smart, treatments, detect-category |
| `/api/availability/*` | ~5 | ✅ Tier 1 — slot picking |
| `/api/profile/*` | ~5 | ✅ Tier 1 — favorites, vouchers |
| `/api/reviews/*` | ~5 | ✅ Tier 1 — featured, my-booking, write |
| `/api/stripe/*` | ~3 | ✅ Tier 1 — checkout webhook, payment intent |
| `/api/discovery/*` | ~3 | ✅ Tier 2 — feed, etc. |
| Other (analytics, ai, barber, content, gift-cards, loyalty, packages, etc.) | ~120 | mixed; Tier 2/3 |

### Orphaned routes I haven't checked

I did not enumerate which of the 327 routes have **zero callers anywhere**. Plausible there are dead routes — admin/seed-test-salons, maybe legacy AI experiments, etc. **Not critical for Tier 1 audit; defer.**

## A.4 Navigation graph — DONE 2026-05-10

V3 homepage components have 8 distinct navigation targets. **3 are broken.**

| Source | Destination | Destination exists? | Severity |
|---|---|---|---|
| `SearchBar.tsx` (submit) | `/${locale}/search?qs` | ✅ exists (legacy SplitView) | OK but Tier 1 rebuild needed for V3 |
| `SearchBar.tsx` (trending click) | `/${locale}/search?q=X` | ✅ exists | OK |
| `SearchBar.tsx` (recent pill) | `/${locale}/search?qs` | ✅ exists | OK |
| `SearchBar.tsx` (salon-result click) | `/${locale}/salon/${slug}` | ✅ exists (legacy salon page) | OK but Tier 1 rebuild needed |
| `SearchBar.tsx` (stylist-result click) | `/${locale}/salon/${slug}` | ✅ exists | OK (acceptable v1 — UX caveat from earlier audit) |
| `SearchBar.tsx` (featured salon click) | `/${locale}/salon/${slug}` | ✅ exists | OK |
| `TestimonialsColumn.tsx:71` (review card) | `/salon/${slug}/reviews` | ✅ exists, but **no `${locale}` prefix** | 🟡 Probably middleware-corrected, but inconsistent |
| `WhySolen.tsx:129` (Salon registrieren CTA) | `/business/signup` | 🔴 **NOT FOUND** | 🔴 Visible CTA → 404 |
| `Entdecken.tsx:94` (Alle entdecken link) | `/entdecken` | 🔴 **NOT FOUND** (English route is `/discover`) | 🔴 Section see-all → 404 |
| `Entdecken.tsx:115` (look card click) | `/entdecken/${slug}` | 🔴 **NOT FOUND** | 🔴 Every look card → 404 |
| `Entdecken.tsx:187` (footer link) | `/entdecken` | 🔴 **NOT FOUND** | 🔴 Same as above |

**Plus the implicit problem:** all 4 homepage feed sections (Coiffeur / LastMinute / Nearby / RecentlyViewed) use static DEMO arrays with fake slugs like `salon-maria` and `atelier-coiffure`. Clicking those salon cards → `/de/salon/atelier-coiffure` — route exists, but **the slug doesn't exist in DB** → "salon not found" response from `/api/salons/by-slug/atelier-coiffure`. Effectively 404 user experience even though the route handler is fine.

### Summary of broken navigation

- 🔴 `/business/signup` — non-existent route (B2B funnel)
- 🔴 `/entdecken*` — non-existent route (homepage discovery section). German label, English route.
- 🔴 4× feed sections click → demo slugs don't match real DB rows → effective 404

### Phase A.4 conclusion

The V3 homepage has **3 confirmed broken nav targets + 4 sections-worth of demo-slug 404s.** Total estimated visible breakage when a user clicks around: ~7 broken click destinations on the homepage alone.

## B Critical-path results — DONE 2026-05-10

### 🔴 ROOT-CAUSE FINDING — 2 broken imports were 500-ing 11 pages

**Before patch:** every customer page in the bookings funnel returned HTTP 500. Cause: `components-legacy/booking/BookingsList.tsx:7` and `components-legacy/discovery/KISection.tsx:6` imported from `@/components` (singular, non-existent). Webpack failed to compile, cascade-broke the dev build.

**After 2-line patch:** 11 pages went from 500 → 200. Patches (already applied to working tree, not committed):
```
components-legacy/booking/BookingsList.tsx:7
- import { Spinner, EmptyState } from '@/components';
+ import Spinner from '@/components-legacy/ui/Spinner';
+ import EmptyState from '@/components-legacy/ui/EmptyState';

components-legacy/discovery/KISection.tsx:6
- import { SalonCard } from "@/components";
+ import SalonCard from "@/components-legacy/SalonCard";
```

**This is the single highest-leverage fix in the whole audit.** Tier 1 punch list will include this as fix #1.

### B.1 — Cold visit → homepage → click salon → salon detail → Buchen

| Step | Result |
|---|---|
| `/de` (homepage) | ✅ 200 — V3 homepage renders |
| Click homepage feed salon (e.g. `salon-maria` from DEMO) | 🔴 "Salon nicht gefunden" 404 page (slug not in DB) |
| Click real-DB salon (`salon-lumiere` via search) | ⚠️ 200 BUT page renders skeletons indefinitely — salon data never loads |
| `/de/salon/salon-lumiere/booking` | ⚠️ 200 (after import patch) — renders unverified |
| Header "Entdecken" category link | 🔴 → `/entdecken` (404 not-found page) |
| WhySolen "Salon registrieren" CTA | 🔴 → `/business/signup` (404 not-found page) |

### B.2 — Type in SearchBar → click result → result page

| Step | Result |
|---|---|
| Type "hair" in SearchBar | ✅ Live results from `/api/search/suggest` |
| Click real salon result | ⚠️ Lands on `/de/salon/[slug]` — skeleton loop (same as B.1) |
| Click trending card | ✅ Lands on `/de/search?q=Balayage` — page renders 200, q param IS read (visible as filter chip), but salon cards stuck in skeletons |
| Click recent pill | ✅ Same — submits to `/de/search?qs` correctly |

### B.3 — Submit → reload → recent pill → results

| Step | Result |
|---|---|
| Submit search → results page | ✅ URL params reach `/search` |
| Reload page | ✅ Recent search appears in localStorage |
| Open picker → click recent | ✅ Submits with restored state |

### B.4 — Heart-save → persist → favorites page

| Step | Result |
|---|---|
| Click heart on a salon card | 🟡 Visual state changes, but per `HeartButton.tsx:45` TODO comment, **no `/api/favorites/toggle` call** — local-only |
| Reload | 🔴 Heart state is lost (no persistence) |
| `/de/profile/favorites` | ⚠️ 200 (after import patch) — renders unverified, likely shows nothing because no saves persisted |

## C State-contract results — DONE 2026-05-10

### C.1 — SearchBar URL params (q, service, city, date, period) read by /search

| Param | SearchBar produces | /search consumes | Status |
|---|---|---|---|
| `q` (free-text query) | ✅ V2-D51 D8 | ✅ visible as filter chip after submit | ✅ contract OK |
| `service` (category) | ✅ when category card clicked | ⚠️ unverified — need to read SplitView | ⚠️ |
| `city` | ✅ when city chip clicked | ⚠️ unverified | ⚠️ |
| `date` | ✅ ISO yyyy-mm-dd | ⚠️ unverified | ⚠️ |
| `period` | ✅ morning/noon/afternoon/evening | ⚠️ unverified | ⚠️ |

**Action for Phase F.1:** read `components-legacy/search/SplitView.tsx` to verify it reads all 5 params. If not, patch SplitView to honor the V2-D51 contract.

### C.2 — Heart state storage + consumer

🔴 **No persistence at all.** `HeartButton.tsx:45` has TODO comment "backend mutate via /api/favorites/toggle". The route `/api/favorites/toggle` doesn't exist. Heart state is component-local only. Reloading the page loses everything.

**Action:** Tier 1 must build `/api/favorites/toggle` + wire HeartButton + verify `/profile/favorites` reads from same source.

### C.3 — Recent searches localStorage producer/consumer

✅ Working as designed (V2-D51 Phase 4). Producer = `SearchBar.handleSubmit` calling `pushRecent(...)`. Consumer = `SearchBar.EmptyHubRecent`. localStorage key `solen.recentSearches`. No bugs.

### C.4 — Locale + city cookies

- **Locale:** `[locale]` URL prefix — handled by `middleware.ts` via `next-intl`. Consistent.
- **City:** No `city` cookie set anywhere. SearchBar's Stadt picker stores stadt in component state only — doesn't persist across page loads. **Gap:** if user picks "Basel" then navigates away + back, picker resets to "Aktueller Standort" placeholder.

**Action for Phase F.1:** consider city cookie or URL param for persistence.

### C.5 — PostHog session ID

✅ `posthog-js/react` is wired (used in `app/[locale]/salon/[slug]/page.tsx:25` and now in `SearchBar.tsx`). Requires `NEXT_PUBLIC_POSTHOG_KEY` env var. If unset → events are no-ops via try/catch. Verify env in `.env.local` or production. Otherwise wired.

## D Static-data ledger — DONE 2026-05-10

7 components, 6 with DEMO arrays. Mapping each to its real-data replacement:

| Component | DEMO size | Replace with | Backend route exists? | Effort |
|---|---|---|---|---|
| `RecentlyViewed.tsx` | 6 demo salons | localStorage list of recently-viewed slugs + `select * from salons where slug in (...)` | ❌ needs query (could reuse `/api/salons/by-slug/[slug]` in a loop, or add `/api/salons/by-slugs?slugs=a,b,c`) | 🟡 Medium |
| `LastMinute.tsx` | 6 demo salons | `/api/salons/last-minute` | ✅ exists | 🟢 30 min |
| `Nearby.tsx` | 6 demo salons | `select salons where city_id = X order by distance limit 6` (needs geolocation OR fall back to all in city) | ❌ no `/api/salons/nearby` route | 🟡 1 hr |
| `Coiffeur.tsx` | 6 demo salons | `select salons where 'coiffeur' = any(categories) and is_active limit 6` | ❌ no `/api/salons/by-category` route (referenced in TODO comment) | 🟡 1 hr |
| `FeaturedStylists.tsx` | 4 demo stylists | `select * from staff_members order by created_at desc limit 4` | ❌ no `/api/staff/featured` route | 🟡 1 hr |
| `Entdecken.tsx` | 6 demo looks | `/api/discovery/feed` | ✅ exists | 🟢 30 min |
| `Reviews.tsx` | needs to check actual usage | `/api/reviews/featured` | ✅ exists | 🟢 30 min |

**Plus:** the 4 category page components (`/coiffeur`, `/barbershop`, `/nails`, `/spa`) each render a list of category salons. They likely use the same query as Coiffeur.tsx homepage feed. Build `/api/salons/by-category` once → reuse in 5 places.

### Routes that need to be built for Tier 1

1. **`/api/salons/by-category?cat=X&city=Y&limit=N`** — used by Coiffeur/Barbershop/Nails/Spa homepage sections + 4 category pages (5 callers).
2. **`/api/salons/by-slugs?slugs=a,b,c`** — used by RecentlyViewed (1 caller). Bulk fetch by slug list.
3. **`/api/salons/nearby?lat=X&lng=Y&limit=N`** — used by Nearby section (1 caller). Geolocation-aware.
4. **`/api/staff/featured?limit=N`** — used by FeaturedStylists (1 caller).
5. **`/api/favorites/toggle`** — used by HeartButton (1 caller). Build for heart persistence.

**5 new routes for Tier 1.** Each ~30-60 min to build (existing salons table queries are straightforward). Roughly 2.5-5 hrs of backend work for Tier 1.

## E Tier 1 punch list — DONE 2026-05-10

Ordered by leverage (highest first). Each task = one commit.

### F.1.0 — INSTANT WINS (already in working tree, just commit)

| # | Task | Files | Effort | Severity |
|---|---|---|---|---|
| 1 | Patch 2 broken `@/components` imports in legacy code | `components-legacy/booking/BookingsList.tsx`, `components-legacy/discovery/KISection.tsx` | already done, **commit only** | 🔴 BLOCKER — unblocks 11 pages |

### F.1.A — BACKEND: build the 5 missing API routes for Tier 1

These each follow the same pattern as `/api/salons/last-minute`. Each ~30-60 min.

| # | Task | New file | Used by | Severity |
|---|---|---|---|---|
| 2 | Build `/api/salons/by-category` | `app/api/salons/by-category/route.ts` | Coiffeur/Barbershop/Nails/Spa homepage sections + 4 category pages | 🔴 BLOCKER for 4 homepage sections + 4 category pages |
| 3 | Build `/api/salons/by-slugs` (bulk fetch) | `app/api/salons/by-slugs/route.ts` | RecentlyViewed homepage section | 🟠 |
| 4 | Build `/api/salons/nearby` | `app/api/salons/nearby/route.ts` | Nearby homepage section | 🟠 |
| 5 | Build `/api/staff/featured` | `app/api/staff/featured/route.ts` | FeaturedStylists homepage section | 🟠 |
| 6 | Build `/api/favorites/toggle` | `app/api/favorites/toggle/route.ts` | HeartButton + Favorites page persistence | 🔴 BLOCKER for heart-save |

### F.1.B — INVESTIGATE: why salon detail + search results render skeletons forever — DONE

| # | Task | Result |
|---|---|---|
| 7 | Diagnose skeleton-loop | **Root cause identified.** Legacy `components-legacy/salon/SalonHero.tsx` calls `t("backToList")`, `t("addToFavorites")`, `t("removeFromFavorites")`, `t("shareProfile")` — none of these keys exist in `messages/de.json`. `next-intl` throws on missing key, error cascades into fallback render → skeletons. **Resolution:** when SalonHero is replaced in F.1.E #20 V3 rebuild, the issue disappears. **Don't patch the legacy translations** — that's a band-aid for code we're deleting. (Could optionally add the keys for safety, but it's a half-fix.) |

### F.1.C — FRONTEND: wire homepage feed sections to real backend

| # | Task | Files | Severity |
|---|---|---|---|
| 8 | Wire `LastMinute.tsx` to `/api/salons/last-minute` | `LastMinute.tsx` | 🔴 |
| 9 | Wire `Coiffeur.tsx` to `/api/salons/by-category?cat=coiffeur` | `Coiffeur.tsx` | 🔴 |
| 10 | Wire `Nearby.tsx` to `/api/salons/nearby` | `Nearby.tsx` | 🔴 |
| 11 | Wire `RecentlyViewed.tsx` to localStorage + `/api/salons/by-slugs` | `RecentlyViewed.tsx` | 🟠 |
| 12 | Wire `FeaturedStylists.tsx` to `/api/staff/featured` | `FeaturedStylists.tsx` | 🟠 |
| 13 | Wire `Entdecken.tsx` to `/api/discovery/feed` | `Entdecken.tsx` | 🟠 |
| 14 | Wire `Reviews.tsx` to `/api/reviews/featured` | `Reviews.tsx` | 🟠 |
| 15 | Wire `HeartButton.tsx` to `/api/favorites/toggle` | `HeartButton.tsx` | 🔴 |

### F.1.D — FRONTEND: fix navigation 404s

| # | Task | Files | Severity |
|---|---|---|---|
| 16 | Fix Header "Entdecken" link `/entdecken` → `/discover` (or build `/entdecken` route) | `app/[locale]/_components/layout/Header.tsx:33` | 🔴 every page has this link |
| 17 | Fix WhySolen CTA `/business/signup` → existing B2B signup route OR build it | `app/[locale]/_components/homepage/WhySolen.tsx:129` | 🟠 |
| 18 | Fix Entdecken.tsx links (`/entdecken`, `/entdecken/${slug}`) — same root issue as #16 | `app/[locale]/_components/homepage/Entdecken.tsx:94,115,187` | 🔴 |

### F.1.E — REBUILD: Tier 1 legacy pages in V3

These are full V3 rebuilds of legacy pages. Each is its own multi-hour project with its own mockup → component lock cycle.

| # | Task | Source | Effort |
|---|---|---|---|
| 19 | Rebuild `/search` results page in V3 (replace SplitView) | `app/[locale]/search/page.tsx` | ~6 hrs |
| 20 | Rebuild `/salon/[slug]` salon detail page in V3 | `app/[locale]/salon/[slug]/page.tsx` | ~8 hrs |
| 21 | Rebuild `/salon/[slug]/booking` booking flow in V3 | `app/[locale]/salon/[slug]/booking/page.tsx` | ~8 hrs (multi-step) |
| 22 | Rebuild `/checkout` Stripe payment in V3 | `app/[locale]/checkout/page.tsx` | ~4 hrs |
| 23 | Rebuild `/confirmation` in V3 (already inline, just polish) | `app/[locale]/confirmation/page.tsx` | ~2 hrs |
| 24 | Rebuild `/auth/login` in V3 | `app/[locale]/auth/login/page.tsx` | ~3 hrs |
| 25 | Rebuild `/auth/signup` in V3 | `app/[locale]/auth/signup/page.tsx` | ~3 hrs |
| 26 | Rebuild `/profile` in V3 | `app/[locale]/profile/page.tsx` | ~3 hrs |
| 27 | Rebuild `/profile/favorites` in V3 | `app/[locale]/profile/favorites/page.tsx` | ~3 hrs |
| 28 | Rebuild `/profile/bookings` in V3 | `app/[locale]/profile/bookings/page.tsx` | ~3 hrs |
| 29 | Rebuild `/coiffeur` category page in V3 | `app/[locale]/coiffeur/page.tsx` | ~3 hrs |
| 30 | Rebuild `/barbershop` category page in V3 | `app/[locale]/barbershop/page.tsx` | ~3 hrs |
| 31 | Rebuild `/nails` category page in V3 | `app/[locale]/nails/page.tsx` | ~3 hrs |
| 32 | Rebuild `/spa` category page in V3 | `app/[locale]/spa/page.tsx` | ~3 hrs |
| 33 | Rebuild `/[city]` city homepage in V3 | `app/[locale]/[city]/page.tsx` | ~5 hrs |

### F.1 punch-list summary

| Category | Tasks | Total effort |
|---|---|---|
| Instant wins (commit existing patches) | 1 | 5 min |
| Backend routes | 5 | ~3-5 hrs |
| Diagnostic investigations | 1 | ~1-2 hrs |
| Frontend wiring | 8 | ~6-8 hrs |
| Navigation fixes | 3 | ~30 min |
| Legacy page rebuilds (Tier 1) | 15 | ~58 hrs |
| **TOTAL Tier 1** | **33 commits** | **~70-80 hrs (~2 working weeks)** |

### Recommended execution order for Phase F.1

1. **Commit the 2-import patch first** (#1) — unblocks the rest of the audit + lets the legacy pages render so we can iterate.
2. **Investigate skeleton-loop** (#7) — could be one root cause that fixes salon detail + search at once.
3. **Build the 5 backend routes in parallel** (#2-6) — small, independent, can sit while frontend work happens.
4. **Wire the homepage feeds** (#8-15) — moves the homepage from Potemkin to functional. Each fix is visible.
5. **Fix navigation 404s** (#16-18) — quick wins.
6. **Tier 1 rebuilds** (#19-33) in dependency order: salon detail before booking, auth before profile, etc.

## F Fix commits — TBD (Phase F)

## G Final verification — TBD (Phase G)
