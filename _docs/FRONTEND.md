# Solen frontend , how every customer surface works and connects

> The frontend counterpart to `_docs/BACKEND.md`. For each customer FLOW: the screens in order,
> what you can DO on each, what every element is wired to (real data vs computed vs hardcoded),
> and , the point of this doc , the HANDOFF to the next screen (what data carries over).
>
> Auto-synthesised 2026-07-17 from a 10-agent read-only code map (workstream #29). Grounded in
> real file:line. When a claim here disagrees with the code, the code wins , re-verify then fix
> this doc. Regenerate by re-running the frontend-flow-spec workflow.

**Coverage:** 10 flows · 62 screens · 113 documented connections · 60 gaps/dead-ends/fabrications flagged.

## Contents
1. [Discovery & Search](#1-discovery---search)
2. [Salon page (PDP) — /de/salon/[slug] — and its handoff into the booking wizard](#2-salon-page--pdp-----de-salon--slug----an)
3. [Booking flow](#3-booking-flow)
4. [Checkout & Payment](#4-checkout---payment)
5. [Confirmation & post-booking](#5-confirmation---post-booking)
6. [Walk-in & Queue (join → pay → number → track → tip)](#6-walk-in---queue--join---pay---number---t)
7. [Reviews & ratings](#7-reviews---ratings)
8. [Profile & account](#8-profile---account)
9. [Value store (loyalty / vouchers / gift cards / credits / referrals) — how value is earned, stored, and spent across Solen's customer surfaces](#9-value-store--loyalty---vouchers---gift-c)
10. [Inspo / discovery feed](#10-inspo---discovery-feed)
11. [The connection graph (all handoffs)](#connection-graph)
12. [Gaps, dead ends & fabrications (all flows)](#gaps)

---

## 1. Discovery & Search

The Discovery & Search flow is how a Solen customer goes from the homepage to a filtered list of bookable salons and then into a specific salon. It has three real surfaces: (1) the homepage (app/[locale]/page.tsx) whose Hero renders a resting search pill (SearchBar.tsx); (2) a full-screen 3-step search composer (SearchOverlay.tsx, opened as a portal from the pill) that collects a free-text query, a city, and a date/period and pushes them as URL query params to /search; and (3) the results template (SearchTemplate.tsx) that also backs the SEO city+category routes /[locale]/[city]/[category], reads every filter from the URL, and fetches GET /api/salons. All state that carries between screens travels as URL query params (q, category/service, city, date, period, and the filter set), with the single exception of precise geolocation (held in React state, injected only into the API fetch). The whole card is a Link to the salon PDP (/[locale]/salon/[slug]); no service or slot preselection carries into booking. Data is genuinely wired to Supabase (salons/services/availability RPCs + a semantic-rank RPC) with almost no fabrication, but there is one dead-code gap: the card's "featured service + time pills + Alle Services" booking block is computed but never rendered.

### Homepage
**Route:** `/[locale] (e.g. /de)`  ·  **Code:** `app/[locale]/page.tsx:163-217`

_Landing surface; entry to search + browse. Server component, revalidate=300, batches homepage salon-card data in one server fetch._

**Shows:**
- Hero with H1 + resting 3-field search pill (Service / Stadt / Zeit) + 'Termine finden' CTA (Hero.tsx:1 imports SearchBar)
- MobileCategoriesRow 'Für dich' tiles: Coiffeur / Barber / Nails / Karte / Walk-in / Spa (MobileCategoriesRow.tsx:43-48)
- Feed rows: SalonOfMonth, ForYouSalonRows, RecentlyViewed, Nearby, WalkInBand, Entdecken (Inspo), Reviews, BusinessTeaser

**You can:**
- Tap any of the 3 resting search rows or the CTA -> opens SearchOverlay focused on that field (SearchBar.tsx:152-163, openOverlay)
- Tap a category tile -> Link to /[locale]/{slug} category landing; Karte -> /[locale]/search?view=map; Walk-in -> /[locale]/barbershop?walk_in=true (MobileCategoriesRow.tsx:46-47,88)
- Tap a feed salon card -> that salon's PDP
- Scroll the discovery feed rows

**Data wiring:**
- Homepage card data: getSalonCardDataMap over FORYOU_SALONS + NEARBY_SALON_IDS + getTopSalonIds(4) — real Supabase batch (salonCardData.ts), curated id LISTS are hardcoded but the rendered rating/price/address are live (page.tsx:172-183)
- SalonOfMonth: real admin pick from salon_of_month_winners, feature-flag gated, renders null when off (page.tsx:35-41)
- Hero greeting: live session user (Hero.tsx:8 getSessionUser)
- FeaturedStylists section pulled because it linked to a non-existent /stylist/[slug] route (page.tsx:67-82, documented dead-link avoidance)

**-> Handoff:** SearchOverlay (in-page portal) — passes initialService, initialCity, and initialFocus (which of service/stadt/zeit the user tapped) via SearchBar.tsx:626-635; OR direct Link navigation to a category landing route carrying the category/walk_in/view params.

### SearchOverlay (3-step composer)
**Route:** `portal over current page (no route change) — app/[locale]/_components/search/SearchOverlay.tsx`  ·  **Code:** `app/[locale]/_components/search/SearchOverlay.tsx:134-930`

_Full-screen search composer. Collects free-text query + city + date/period, shows live autocomplete, then pushes a /search URL. Ported from the locked search-morph mockup._

**Shows:**
- Service step: query input + live autocomplete grouped into Salons (SalonResultCard suggest variant), Services (name + 'ab CHF X'), Stylists, Places (geocode), Looks/Für dich (Inspo). Idle state: recent searches, Beliebte Stores, category shortcuts (SearchOverlay.tsx:558-738)
- Location step: city search input + 'Keine Präferenz' (city=all) + SEARCH_CITIES list (740-750)
- Date step: month calendar (42-day window) with a per-day time-of-day chip row (morning/afternoon/evening), plus a 'Flexibel' tab of preset ranges (838-919)

**You can:**
- Type a query (>=2 chars triggers suggest) and press Enter / tap 'Suchen' -> submit (539, 756)
- Tap an autocomplete term -> set query without searching yet (searchTerm, 401-412)
- Tap a suggested Salon or Beliebte Store -> jump straight to its PDP (openSalon/goSalon, 413-422); on the map context it recenters instead of navigating
- Pick a city (or 'Keine Präferenz'=all) and a date + period; tap a Look -> opens /[locale]/inspo/{id} (423)
- Reset all fields (396); close (395)

**Data wiring:**
- Autocomplete: useSearchSuggest -> GET /api/search/suggest?q=&city= (real); useGeocodeSuggest -> GET /api/search/geocode (real, restricted to enabled cities); useStyleLooks -> GET /api/discovery/style-suggest; useInspoLooks + useForYouLooks -> discovery feed (all real)
- Beliebte Stores: FEATURED_SALONS is an identity-only hardcoded id list, but their addresses are fetched live via GET /api/salons?ids= (SearchOverlay.tsx:217-235) — no stale hardcoded address
- Recent searches: useRecentSearches (localStorage); recents deliberately store only query+city, never date (369-393)

**-> Handoff:** Search results — navigate() does router.push(`/[locale]/search?<params>`) where buildParams emits q (>=2 chars), category (if the picked service is a category slug) or service, city, date, period (SearchOverlay.tsx:338-366). A picked salon/store instead bypasses results and pushes /[locale]/salon/{slug} directly.

### Search results (SearchTemplate)
**Route:** `/[locale]/search (generic) AND /[locale]/[city]/[category] (SEO landing)`  ·  **Code:** `app/[locale]/[city]/[category]/page.tsx:121-158 -> app/[locale]/_components/search/SearchTemplate.tsx:403`

_The results surface for every discovery path. Reads all filters from the URL, fetches salons, renders cards + a filter system + an optional map split. On /[city]/[category] the city+category are injected as props (server-validated against active cities + a fixed category list)._

**Shows:**
- Result cards (SalonResultCard): mobile 1-col 'feed' variant, desktop 2-3 col 'card' grid; ?layout=list/grid escape hatches; walk_in mode keeps the queue-bar 'card' variant (SearchTemplate.tsx:1574-1678)
- Filter pill row + a sort dropdown (rating/price/distance/newest/last_minute) + result count (1436-1502)
- FilterSheet (lazy) for price / rating / gender / amenities / deals / sort (2039+)
- Optional map split (?map=1 / ?view=map) with MapView + a salon detail sheet
- EmptyState (no results, with recovery CTAs) / ErrorState / Skeletons
- On /[city]/[category]: a breadcrumb, an H1 hero, and a static SEO FAQ (page.tsx:79-119)

**You can:**
- Tap a result card -> salon PDP /[locale]/salon/{slug} (SalonResultCard.tsx:203,628 whole-card Link); walk-in cards append ?walkin=1 (390)
- Toggle filter pills (open_now, walk_in, price, gender, rating, amenities, deals) and change sort -> writes URL params via updateParam/toggleBooleanParam/router.replace
- Open the search composer again (SearchOverlay with showCategoryPills) to change query/city/date (732-737)
- Load more (pagination, page+1 refetch, 986)
- Save/heart a salon -> POST/DELETE /api/profile/favorites (1159-1183)
- Switch list<->map view, 'In diesem Bereich suchen' (areaBounds -> bounds query), pick a date to narrow

**Data wiring:**
- Cards: GET /api/salons?with_slots=1&<filters> (buildUrl, SearchTemplate.tsx:825-885; fetch 894). Real Supabase: salons table (public column allowlist) + joined services + availability RPCs. rating/review_count/avg_price/address all live
- Free-text q: /api/salons resolves search_salons_ranked RPC (semantic pgvector rank with a 500ms embedding timeout -> lexical fallback), then AND-combines with structured filters (route.ts:113-143)
- Computed filters resolve id-sets first then .in('id',ids) before pagination: city lookup, service ilike, gender, price band, period (salons_with_slot_in_hours RPC), instant_bookable, date-narrow, open_now (JS isOpenNow over opening_hours) — route.ts:224-409
- next-available-date labels: next_available_dates RPC; card slot data: earliest_slots_by_service RPC (route.ts:498-565)
- Walk-in live wait/queue: GET /api/walkin/availability?salon_ids= (SearchTemplate.tsx:949); favorites: GET /api/profile/favorites?ids_only=1 (970)
- Precise geo for distance sort held in React state (coords), injected as lat/lng into the fetch only, never the page URL (510, 862-865)

**-> Handoff:** Salon PDP — every card variant is a Link to /[locale]/salon/{slug} (SalonResultCard.tsx:203). Only the slug carries over; NO selected service, slot, date, or query is passed into the PDP/booking (the featured-slot deep-link pills are dead code, see gaps). Walk-in cards carry ?walkin=1.

### Salon PDP (handoff target)
**Route:** `/[locale]/salon/[slug]`  ·  **Code:** `app/[locale]/salon/[slug] (destination, not deep-read in this flow)`

_Terminal of the discovery flow: the salon detail + booking entry. Where service/slot/date selection actually happens._

**Shows:**
- (out of scope for this map) salon detail, services, staff, availability, booking CTA

**You can:**
- Start the booking flow (a separate flow)

**-> Handoff:** Booking flow. Note: because search passes only the slug, the user re-picks service/date on the PDP; the search-side date/service context is discarded at this boundary.

**Connections in this flow:**
- Homepage Hero pill/CTA -> SearchOverlay: tapping a resting row calls openOverlay(seg); passes initialService, initialCity, initialFocus (the tapped field) as props (SearchBar.tsx:152-163, 626-635). No URL change (portal).
- Homepage category tile -> category landing: Link to /[locale]/{slug} (e.g. /de/coiffeur); Karte -> /[locale]/search?view=map; Walk-in -> /[locale]/barbershop?walk_in=true (MobileCategoriesRow.tsx:88,46-47).
- SearchOverlay -> Search results: router.push(/[locale]/search?<params>) with params built by buildParams -> q (>=2), category|service, city, date, period (SearchOverlay.tsx:338-366, 363-366). Recents persist query+city only (never date).
- SearchOverlay -> Salon PDP (shortcut): tapping a suggested salon / Beliebte Store pushes /[locale]/salon/{slug} directly, bypassing results (openSalon 413-416).
- Search results <-> URL: every filter/sort is a URL query param; changing one does router.replace/push then the buildUrl effect refetches /api/salons (SearchTemplate.tsx:888-916). Filters and the typed query all co-combine server-side (single /api/salons endpoint).
- Search results -> /api/salons: GET with category, city, date, period, sort, min/max_price, min_rating, gender, amenity booleans, walk_in, deals, open_now, instant_bookable, with_slots=1, q, page, limit, plus lat/lng (distance) and north/south/east/west (map 'search this area'). (buildUrl 825-885 -> route.ts GET 34-625).
- Search results -> Salon PDP: whole-card Link to /[locale]/salon/{slug}; only the slug transfers, no service/slot/date/query (SalonResultCard.tsx:203, 628). Walk-in cards add ?walkin=1 (390).
- /[locale]/[city]/[category] page -> SearchTemplate: server-validates city (active cities DB) + category (fixed list), injects serviceFilter+cityFilter props and a breadcrumb/hero (page.tsx:121-158); SearchTemplate then behaves like /search but scoped.

**Notable features:**
- Single combined search endpoint: /api/salons fuses free-text semantic rank (search_salons_ranked pgvector RPC) with all structured filters; the older q-only /api/salons/search that ignored filters was retired (route.ts:878-881 comment).
- Semantic search resilience: embedding call raced against a 500ms timeout, falls back to lexical ranking if slow/failed (route.ts:113-133).
- Correct computed-filter pattern: open_now / period / instant_bookable / date / distance resolve matching salon-id sets first, then .in('id',ids) BEFORE .range(), so count + pagination stay correct (the codebase's documented anti-silent-no-op discipline).
- Public column allowlist (SALON_PUBLIC_COLS) replaces select('*'), so owner/payment/moderation columns are not shipped to anon clients (route.ts:99-105).
- Dynamic-Island-style morphing search pill + full-screen scroll-linked expanding overlay (motion/react), with prefers-reduced-motion honored throughout.
- Context-aware overlay: the SAME SearchOverlay recenters the map on a salon tap when opened from the map (onSalonLocate) vs navigating to the PDP otherwise (SearchOverlay.tsx:419-422).
- Map 'In diesem Bereich suchen': viewport bounds (north/south/east/west) override the city filter; areaBounds auto-clears when the underlying search changes (SearchTemplate.tsx:918-929).
- Beliebte-Stores addresses fetched live (via /api/salons?ids=) rather than shipped as stale hardcoded strings — an explicit no-fabrication fix (SearchOverlay.tsx:211-235).
- Precise geolocation kept out of the shareable URL (React state only), injected into the fetch for distance sort (SearchTemplate.tsx:507-510).

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD BOOKING DEEP-LINK: SalonResultCard computes featuredName/featuredDur/featuredSlots/hasMoreSlots/allServicesLabel (SalonResultCard.tsx:223-229) and its own doc says 'each pill links into booking with that service preselected' (221), but these variables are never rendered in ANY card variant. The card only shows a plain-text nextSlot label. Net effect: the search->booking handoff carries only the salon slug; no service/slot/date preselection reaches the PDP or booking flow. (Not fabricated data — just an unwired, dormant feature.)
- ⚠️ DORMANT DUPLICATE SEARCH UI: SearchBar.tsx still contains a full in-place morphing 'island' composer (segment tabs + SERVICES/CITIES/PERIODS chips + handleSubmit that pushes /search, lines 224-621), but the resting rows now all call openOverlay() instead, so the island and its handleSubmit are unreachable (kept intentionally dormant per the Path C comment at 139-144). Two search implementations live in one file; only SearchOverlay is reachable.
- ⚠️ STALE DOC (not a functional bug): FilterSheet.tsx:33 header comment claims 'Preis (min_price/max_price read but not applied)'. In reality the price filter IS wired end-to-end now — SearchTemplate.buildUrl forwards min_price/max_price (SearchTemplate.tsx:845-846, 'V3-D384 fix') and /api/salons applies buildPriceTask (route.ts:276-282, 371-376). The comment is outdated.
- ⚠️ HARDCODED CURATED ID LISTS (benign, flagged for transparency): FEATURED_SALONS (searchFeatured.ts), FORYOU_SALONS, NEARBY_SALON_IDS are hand-maintained id lists; the rendered content (rating/price/address/name) is live from Supabase, so no fabricated values are shown, but which salons appear in those homepage rows is editorially hardcoded, not algorithmic.
- ⚠️ BOUNDARY DATA LOSS: at the results->PDP boundary the user's chosen date/period/service context is dropped (only the slug transfers), so a customer who filtered by 'tomorrow morning' must re-select date/time on the PDP.

---

## 2. Salon page (PDP) — /de/salon/[slug] — and its handoff into the booking wizard

The Salon PDP is the conversion hub of Solen: a server-rendered profile at /[locale]/salon/[slug] that shows a salon's photos, services, team, reviews, hours, amenities and location, then routes the visitor into the booking wizard. app/[locale]/salon/[slug]/page.tsx is a thin SERVER component that calls loadSalonDetailWithStatus() (lib/salon-detail.ts) to fetch the salon + services + staff + reviews from Supabase and pre-compute open/closed status server-side (a deliberate 2026-07-04 hydration fix), then hands everything as props to the client orchestrator SalonDetailV3. All page data is wired to real DB tables (salons, services, staff_members, staff_services, reviews); no fabricated numbers were found on the render path. The flow's whole purpose is the handoff: multiple CTAs across the page navigate to /salon/[slug]/booking with URL query params that seed the booking cart (?service=, ?services=csv, ?staff=, ?bundle=, and combinations). The booking page re-validates every param against the live DB before seeding, so a stale/bogus id is silently ignored rather than crashing. Two side-flows branch off the same page: retail product purchase (its own Stripe path, NOT the booking wizard) and barbershop walk-in mode (a pay-gated queue panel).

### Salon PDP (SalonDetailV3)
**Route:** `/[locale]/salon/[slug]  (e.g. /de/salon/muse-beauty-studio)`  ·  **Code:** `app/[locale]/salon/[slug]/page.tsx:26 (server page) → app/[locale]/_components/salon/SalonDetailV3.tsx:68 (client orchestrator)`

_Public salon profile — the marketing + selection surface that feeds the booking wizard. Server-rendered for SEO (JSON-LD) and first-paint; interactive state (lightbox, gallery, walk-in toggle, favorite) is client-side._

**Shows:**
- Breadcrumb (desktop only, SalonDetailV3.tsx:217)
- Hero photo grid / gallery with lightbox (SalonHero, opened via onOpenLightbox/onOpenGallery, SalonDetailV3.tsx:234)
- Header: salon name, rating stars + review count, open/closed status, address, Share + Heart(favorite) (SalonHeader.tsx:75)
- Sticky tab nav that fades in on scroll: Photos·Services·Team·Reviews·About (SalonStickyTabNav, sections computed SalonDetailV3.tsx:137-150)
- Services grouped into Express/Klassisch/Signature tiers derived from duration_minutes (SalonServices.tsx:96-105)
- Bundles (async), Retail products (async), Team grid, Reviews (up to 20), Portfolio gallery, About text, Location/map, Opening times, Amenities, Contact, Other locations (siblings), Venues nearby
- Desktop sticky right sidebar with name/rating/'Jetzt buchen' CTA/status/address (SalonSidebar.tsx:107); mobile sticky bottom 'Termin buchen' bar (SalonMobileBookBar.tsx:31)

**You can:**
- Tap a single service's 'Buchen' → booking with that service preselected (SalonServices.tsx:213-216)
- Open 'Alle ansehen' services sheet, multi-select services into a cart, tap 'Weiter' → booking with all selected (SalonServicesSheet.tsx:167-169, 488)
- Tap sidebar 'Jetzt buchen' / mobile 'Termin buchen' / Team 'Alle ansehen' → booking with no preselection (SalonSidebar.tsx:137, SalonMobileBookBar.tsx:33, SalonTeam.tsx:120)
- Open a stylist profile sheet and tap 'Buchen' → booking with that stylist preselected (StaffProfilePage.tsx:186,353)
- Add a bundle → booking with the bundle's services + bundle id (SalonBundles.tsx:135)
- Buy retail products inline via Stripe (separate flow, POST /api/salon/retail/purchase, SalonProducts.tsx:148-153)
- Barbershop only: toggle Book↔Walk-in; walk-in shows a pay-gated queue panel (SalonDetailV3.tsx:255-260)
- Favorite the salon (HeartButton), Share (Web Share/copy), open photo lightbox/gallery
- Scroll-jump to Reviews / Hours / Location via header+sidebar buttons; 'Alle ansehen' reviews → /salon/[slug]/reviews (SalonReviews.tsx:147); Route link → Google Maps directions (SalonSidebar.tsx:89)

**Data wiring:**
- salon record: REAL, Supabase 'salons' table via loadSalonDetailWithAccess() with an EXPLICIT public column list (no stripe_account_id/search_doc leak) — lib/salon-detail.ts:61-67
- services: REAL, 'services' table, is_active=true — lib/salon-detail.ts:77-83
- staff + which-services-each-performs: REAL, 'staff_members' + 'staff_services' join — lib/salon-detail.ts:84-128
- reviews: REAL, 'reviews' table via createAdminSupabaseClient() (service-role) to bypass profiles RLS so reviewer display_name/avatar survive for logged-out visitors; is_hidden=false filter applied — lib/salon-detail.ts:94-102
- open/closed status + todayKey: COMPUTED server-side ONCE in salon timezone (computeOpenStatus) to avoid hydration mismatch — lib/salon-detail.ts:198-210
- service tiers Express/Klassisch/Signature: COMPUTED client-side from duration_minutes, pure derivation, NOT fabricated — SalonServices.tsx:96-105
- bundles: REAL, async GET /api/salon/bundles?salon_id= (price recomputed server-side from live services.price) — SalonBundles.tsx:69
- retail products: REAL, async GET /api/salon/retail?salon_id= (nail_retail_products) — SalonProducts.tsx:75
- view analytics: POST /api/analytics/track-view + PostHog salon_profile_viewed + localStorage recently-viewed (trackSalonView) — SalonDetailV3.tsx:108-130
- gift card / SalonBuy: HIDDEN, hasGiftCards=false + commented JSX (owner 2026-06-14) — SalonSidebar.tsx:101, SalonDetailV3.tsx:303-305
- SalonLoyalty: REMOVED from render (rendered identical static copy with no data behind it) — SalonDetailV3.tsx:322-323

**-> Handoff:** → Booking wizard (/salon/[slug]/booking). Data carried varies by CTA: single service id (?service=), CSV of service ids (?services=), stylist id (?staff=), bundle id (?bundle=), or nothing (bare /booking → wizard starts at step 1). Retail products branch instead to an inline Stripe purchase; walk-in branches to the queue-pay panel.

### Booking wizard (handoff target)
**Route:** `/[locale]/salon/[slug]/booking?service=|services=|staff=|bundle=`  ·  **Code:** `app/[locale]/salon/[slug]/booking/page.tsx:25`

_Receives the PDP handoff params, validates each against the live salon data, and seeds the BookingProvider so the wizard opens with the cart/stylist/bundle already populated instead of an empty step 1. (Downstream wizard steps are out of scope for this flow map.)_

**Shows:**
- BookingWizard seeded with services, staff, salon, staff↔service map, add-ons, options; or EmptyServicesState when the salon has zero bookable services (booking/page.tsx:204-235)

**You can:**
- Continue through the booking steps (services → staff → time → pay) with the preselected items already in the cart

**Data wiring:**
- salon/services/staff: REAL, admin Supabase client (booking/page.tsx:41-88)
- ?service= validated → initialService (booking/page.tsx:98-115)
- ?services= CSV split+validated → initialServices (booking/page.tsx:123-137)
- ?staff= validated, dropped if the stylist does not offer the chosen service (booking/page.tsx:92-93,170-177)
- ?bundle= validated as a real ACTIVE bundle for THIS salon → initialBundleId (booking/page.tsx:184-194)
- isLoggedIn boolean read server-side (getSessionUser) so the guest form can show for logged-out users (booking/page.tsx:37-38)

**-> Handoff:** → POST /api/bookings at the wizard's PayConfirmStep (server recomputes bundle/price). End of this flow's scope.

**Connections in this flow:**
- PDP ServiceRow 'Buchen' → /salon/[slug]/booking?service=<serviceId> — carries ONE service id; booking page validates it and seeds initialService (SalonServices.tsx:214 → booking/page.tsx:98-115)
- PDP 'Alle ansehen' → SalonServicesSheet multi-select → 'Weiter' → /salon/[slug]/booking?services=<id1,id2,...> — carries a CSV of selected service ids (client sums price+duration only for the sheet's cart display; the ids are the real handoff); booking page validates each and seeds initialServices (SalonServicesSheet.tsx:167-169 → booking/page.tsx:123-137)
- PDP desktop sidebar 'Jetzt buchen' → /salon/[slug]/booking — NO params, wizard starts empty at step 1 (SalonSidebar.tsx:137)
- PDP mobile 'Termin buchen' bar → /salon/[slug]/booking — NO params (SalonMobileBookBar.tsx:33)
- PDP Team 'Alle ansehen' → /salon/[slug]/booking — NO params (SalonTeam.tsx:120)
- PDP stylist profile sheet 'Buchen' → /salon/[slug]/booking?staff=<staffId> — carries stylist id; booking page validates + drops it if the stylist doesn't offer a co-selected service (StaffProfilePage.tsx:186 → booking/page.tsx:170-177)
- PDP BundleCard → /salon/[slug]/booking?services=<serviceCsv>&bundle=<bundleId> — carries the bundle's constituent service ids AND the bundle id; server later recomputes the discounted price from live services (SalonBundles.tsx:135 → booking/page.tsx:184-194)
- PDP Reviews 'Alle ansehen' → /salon/[slug]/reviews — separate full reviews page, not booking (SalonReviews.tsx:147)
- PDP retail products 'checkout' → POST /api/salon/retail/purchase → Stripe clientSecret, inline pay — SEPARATE from the booking wizard (SalonProducts.tsx:148-153)
- PDP walk-in toggle (barbershop + walkin_enabled, or ?walkin=1 deep-link) → SalonWalkInPanel pay-gated queue join — separate flow, hides service/team browsing (SalonDetailV3.tsx:88-90,255-260)
- PDP sidebar 'Route' → Google Maps directions (external) (SalonSidebar.tsx:89)
- Booking wizard PayConfirmStep → POST /api/bookings (end of this flow's scope) (booking/page.tsx comments 179-183)

**Notable features:**
- Server-first data + once-computed open status: page.tsx is a server component; open/closed + todayKey are computed once in the salon's timezone and passed as props to kill the SSR/client hydration mismatch (lib/salon-detail.ts:198-210)
- Security-conscious loader: explicit public column allowlist (no stripe_account_id/search_doc), moderation fields only shipped to the owner's own session, owner_id stripped for all callers (lib/salon-detail.ts:61-64,132-149)
- Reviews use the service-role client on purpose to defeat profiles-RLS nulling reviewer names for anonymous visitors, while exposing only display_name+avatar_url (lib/salon-detail.ts:89-102)
- Every booking handoff param is re-validated server-side against the real DB before seeding the cart — bogus/foreign/inactive ids are ignored, never trusted (booking/page.tsx:92,98,123,184)
- Cross-param safety: a deep-linked stylist is dropped if they don't actually offer the co-selected service (booking/page.tsx:170-177)
- Sticky tab nav is data-driven: a tab only appears if that section has content, and async bundles/products register their tab only after their fetch confirms data (SalonDetailV3.tsx:137-150,96-97)
- Click-triggered overlays (lightbox, gallery, services sheet, staff profile) are dynamic()-imported for load performance (SalonDetailV3.tsx:37-38, SalonServices.tsx:14)
- Service tiering (Express/Klassisch/Signature) is pure derivation from duration_minutes — grouping UI with no schema change and no invented data (SalonServices.tsx:96-105)
- Barbershop walk-in mode deep-linkable via ?walkin=1 and gated on real opening hours so the panel can't say 'open' while the salon is closed (SalonDetailV3.tsx:88-90,171)

**Gaps / dead ends / fabrications:**
- ⚠️ Gift card / SalonBuy purchase is fully HIDDEN (hasGiftCards=false + commented JSX) in favor of a Solen-wide loyalty card — dead-but-preserved code paths, intentional (SalonSidebar.tsx:101,209; SalonDetailV3.tsx:300-305)
- ⚠️ SalonLoyalty section is removed from render because it showed identical static copy on every salon with no data behind it — a former fabricated/static surface, correctly deleted rather than faked (SalonDetailV3.tsx:322-323)
- ⚠️ Portfolio + Loyalty no longer have sticky-nav TAB affordances (Fresha-parity 5-tab reduction) even though the Portfolio SECTION still renders below — minor nav/section mismatch, intentional (SalonDetailV3.tsx:133-136)
- ⚠️ Retail product purchase and walk-in queue are genuinely separate flows sharing the PDP surface; a reader could mistake them for part of the booking handoff — they are NOT (they never hit /booking) (SalonProducts.tsx:148, SalonDetailV3.tsx:258)
- ⚠️ No fabricated data found on the main PDP render path — ratings, review counts, reviewer names, services, staff, bundles and products are all wired to real tables/APIs

---

## 3. Booking flow

The Solen booking flow is a client-side multi-step wizard mounted at /[locale]/salon/[slug]/booking. A React Server Component (page.tsx) fetches the salon, its active services, staff, and the enhancement tables (staff_services, service_addons, service_options) with the admin Supabase client, seeds a BookingProvider (useReducer context) from URL params, and renders BookingWizard. The wizard walks a dynamically-computed step list (services-staff -> staff [only if >1 staff] -> datetime -> hair [only if a hair-category service is in the cart] -> pay-confirm). All state (chosen services, add-ons/options, staff, date/time, note, totals) lives in ONE in-memory context object (formData); nothing is persisted between steps except this context, and it is lost on a hard refresh. Duration and price are summed CLIENT-side on every service/add-on/option mutation and carried forward as formData.totalPrice / formData.totalDuration, displayed in every step's bottom bar and the final summary. The final step POSTs to /api/bookings, which RE-RESOLVES the slot and RE-COMPUTES the price from the live DB (never trusting the client total), then either redirects in-person bookings straight to /confirmation or creates a Stripe PaymentIntent and shows the card form before redirecting. The flow is guest-first (no login required); a logged-out user fills a contact/guest form at the pay step.

### Booking page shell (RSC)
**Route:** `/[locale]/salon/[slug]/booking`  ·  **Code:** `app/[locale]/salon/[slug]/booking/page.tsx:25`

_Server component: fetch all booking data, read session, seed the context from deep-link params, render the wizard (or the empty state if the salon has no active services)._

**Shows:**
- Sunken (#F4F4F5) full-height body, no salon-name header bar (Mockup 20 Fresha bones)
- BookingWizard when services exist, else EmptyServicesState with call/back paths

**You can:**
- Arrive via deep links that preselect state: ?staff=<id>, ?service=<id>, ?services=<csv>, ?start=<ISO>, ?note=<text>, ?bundle=<id>
- See a dead-end empty state if the salon is onboarded-but-empty

**Data wiring:**
- salon: real DB table 'salons' via admin client, .eq slug .eq is_active (page.tsx:41-50)
- services: real DB table 'services' .eq salon_id .eq is_active (page.tsx:57-64)
- staff: real DB table 'staff_members' .eq salon_id .eq is_active (page.tsx:71-82)
- staffServices: real 'staff_services' (page.tsx:143-150); serviceAddons: real 'service_addons' (page.tsx:151-158); serviceOptions: real 'service_options' (page.tsx:159-168)
- isLoggedIn: real session via getSessionUser() server-side, passed as a single bool (page.tsx:37-38)
- bundle validated against real 'service_bundles' .eq salon_id .eq is_active (page.tsx:184-194)
- All deep-link params validated against the real fetched lists before seeding; bogus ids ignored (page.tsx:92-177)

**-> Handoff:** BookingProvider receives salonId + validated initial{StaffId,Service,Services,Start,Note,BundleId}; BookingWizard receives services, staffList, salon, staffServices, serviceAddons, serviceOptions, isLoggedIn as props (page.tsx:204-220)

### Wizard controller
**Route:** `(same route, client)`  ·  **Code:** `components-legacy/booking/BookingWizard.tsx:111`

_Compute the active step sequence, render the current step, own the back-arrow + step-title + exit-X chrome, animate step swaps._

**Shows:**
- Back arrow (or exit-to-origin on step 1), centered step title (i18n booking.stepTitles.*), BookingExitButton (X)
- AnimatePresence step-swap slide (useStepSwapMotion)

**You can:**
- Go back one step (goToStep(STEPS[currentIndex-1]))
- On step-1 back: router.back() to the true origin (Inspo/search/PDP), fallback to the salon page
- Exit the wizard via the X
- **(ia-navigation-01, fixed 2026-07-27)** Physical/gesture back and a tab close are guarded the SAME
  way the X is: `BookingExitButton.tsx` pushes a sentinel history entry on mount, a `popstate` re-arms
  it and raises its own "leave this booking?" confirm when the cart is non-empty (instead of silently
  discarding the step state the browser's own history stack never saw), and `beforeunload` covers a
  hard refresh/tab close the same way.

**Data wiring:**
- STEPS array computed from data: staff step only if staffList.length>1 (BookingWizard.tsx:121); hair step only if a cart service's category is in HAIR_CATEGORIES {coiffeur,barbershop} (BookingWizard.tsx:118-128) — data-driven, not a component category branch
- currentStep + formData read from useBooking() context; legacy step keys normalized to 'pay-confirm' (BookingWizard.tsx:131-136)
- selectedStaff derived from formData.selectedStaffId against staffList (BookingWizard.tsx:146-149)

**-> Handoff:** Renders each step, passing the shared context down; nextStep prop tells each step where to advance (services->staff or datetime; datetime->hair or confirm)

### Step 1 — Services + add-ons
**Route:** `step 'services-staff'`  ·  **Code:** `components-legacy/booking/ServicesStaffStep.tsx:64`

_Pick one or more services (grouped by subcategory), open a detail sheet to choose required options + add-ons, see the running total._

**Shows:**
- Sticky scroll-spy category tabs + a List-icon quick-jump sheet
- Grouped service rows (name, duration with Clock icon, price or 'from' min-option price, ToggleCircle)
- Floating 'N chosen' scroll-to-top pill (only after scrolling)
- Fixed bottom bar: rolling total price + item count + total duration + Weiter CTA

**You can:**
- Toggle a service in/out of the cart (handleSelectService)
- Open ServiceDetailSheet to pick a required option (replaces base price/duration) and toggle add-ons live (commitSheetSelection)
- Remove a service (also clears its owned add-ons)
- Filter visible services to a preselected stylist's offerings (#6)
- Fly-to-cart dot animation; Weiter advances (blocked if cart empty)

**Data wiring:**
- Cart + totals computed CLIENT-side: totalPrice = services.reduce(+price), totalDuration = reduce(+duration_minutes), recomputed on EVERY mutation (ServicesStaffStep.tsx:130-141, 236-241)
- A picked option REPLACES the service line's price+duration (ServicesStaffStep.tsx:216-225)
- Add-ons resolved from the real serviceAddons/serviceById maps; no fabricated data
- Writes into context via updateFormData({services,totalPrice,totalDuration})

**-> Handoff:** formData.services (+ totals) persist in context; goToStep(nextStep) = 'staff' if >1 staff else 'datetime' (ServicesStaffStep.tsx:166-174)

### Step 2 — Staff picker (conditional)
**Route:** `step 'staff'`  ·  **Code:** `components-legacy/booking/StaffStep.tsx:54`

_Choose a stylist or 'Egal' (any). Only shown when the salon has >1 active staff._

**Shows:**
- 'Egal' row pinned first (pre-selected by default), then capable-staff rows: avatar, name, one specialty, rating+count, 'Profil ansehen' link, selected check
- Same bottom bar (total price, item/duration count, Weiter)

**You can:**
- Pick 'any' or a specific stylist (updateFormData selectedStaffId)
- Open a READ-ONLY StaffProfileSheet (bio + reviews) — no service re-pick (B7/B19 selection-only)
- Weiter -> datetime

**Data wiring:**
- 'capable' = staff who can perform EVERY selected service; staff with no staff_services mappings count as can-do-all (StaffStep.tsx:75-80) — real staffServices data
- rating/review_count/specialties/avatar from the real staff_members rows fetched on the page
- No fabricated 'soonest slot' line (explicitly omitted — no live per-staff availability endpoint)

**-> Handoff:** formData.selectedStaffId persists in context; goToStep('datetime') (StaffStep.tsx:192)

### Step 3 — Date + time
**Route:** `step 'datetime'`  ·  **Code:** `components-legacy/booking/DateTimeStep.tsx:37`

_Pick a day (date strip) then an available time slot; offer waitlist when a day is full._

**Shows:**
- Stylist pill (jumps back to staff/services step)
- Shared DateTimePicker primitive: date strip + grouped morning/afternoon/evening slots, loading + empty states, 'more dates' month sheet
- Waitlist card (full) when the day has zero free slots, else a quiet waitlist link
- Fixed bottom Weiter CTA (disabled until date AND time picked)

**You can:**
- Select a date -> triggers slot fetch; select a time slot
- Join a waitlist (WaitlistModal; requires login + a chosen date, else redirects to /auth/login)
- Weiter advances

**Data wiring:**
- unavailable dates: real fetch GET /api/availability/unavailable-dates?salon_id&staff_id&service_ids (DateTimeStep.tsx:80)
- time slots: real fetch GET /api/availability/time-slots?salon_id&date&staff_id&service_ids&duration_minutes — note it PASSES formData.totalDuration so the slot length matches the multi-service cart (DateTimeStep.tsx:98-106)
- selectedDate/selectedTime written to context via updateFormData (DateTimeStep.tsx:138-144)
- NOTE: the task-referenced components-legacy/ui/date-picker.tsx is NOT used here — it has zero importers; the live picker is app/[locale]/_components/primitives/DateTimePicker.tsx

**-> Handoff:** formData.selectedDate + selectedTime persist in context; goToStep(nextStep) = 'hair' if cart has a hair-category service, else 'confirm' (=pay-confirm) (DateTimeStep.tsx:123-134, BookingWizard.tsx:164)

### Step 4 — Hair details (conditional)
**Route:** `step 'hair'`  ·  **Code:** `components-legacy/booking/HairStep.tsx:60`

_Optional hair-profile capture (type/length/thickness, beard for barbershop) + a per-booking note. Fully skippable, never gates._

**Shows:**
- Card 1: Haartyp/Länge/Dicke pill groups, pre-filled provenance chip if profile data loaded
- Card 2: stylist header + (barbershop-only) Bart pills + a Notiz textarea (500 chars, doubles as the discovery cut-instruction)
- Non-blocking mismatch warning; Weiter + Überspringen

**You can:**
- Select hair facts, type a booking note, or skip entirely
- Jump back to services on a length mismatch

**Data wiring:**
- Prefill: real GET /api/profile (logged-in only; guests skip via local session check) (HairStep.tsx:85-104)
- showBeard is data-driven from the cart (barbershop category) — passed by the wizard (BookingWizard.tsx:166)
- On Weiter: note -> formData.customerNote (context); hair facts -> best-effort fire-and-forget PATCH /api/profile (logged-in only), never blocks the step (HairStep.tsx:126-145)

**-> Handoff:** formData.customerNote persists in context; goToStep('pay-confirm') (HairStep.tsx:116)

### Step 5 — Confirm + Pay
**Route:** `step 'pay-confirm'`  ·  **Code:** `components-legacy/booking/PayConfirmStep.tsx:54`

_Review summary + price, collect contact/guest info, choose payment per the salon's mode, POST the booking, then either redirect (in-person) or show the Stripe card form._

**Shows:**
- Summary card (salon, stylist, each service, date/time) with 'Ändern' links to jump back to owning steps
- Price card: per-service lines + included-VAT line (vat_registered salons only) + total
- Contact block (logged-in prefilled) OR GuestBookingForm (logged-out)
- Payment selector driven by salon.payment_mode: at_salon = customer chooses online/in-person; deposit = deposit% now + rest at salon; prepay = full now
- Cancellation-policy banner; sticky CTA (Buchen / Weiter zur Zahlung / Anzahlung)
- Phase 'pay': BookingPaymentForm (Stripe Elements)

**You can:**
- Edit contact / fill guest name+phone(+email)
- Choose payment method (only when payment_mode = at_salon and salon accepts_online_payment)
- Confirm: POST /api/bookings; in-person -> redirect; online -> create PaymentIntent -> card form -> pay
- Retry / switch payment method (drops back to selector)

**Data wiring:**
- Contact prefill: real GET /api/profile (PayConfirmStep.tsx:82-96)
- payment_mode/deposit_percent/accepts_online_payment/vat_registered/vat_rate all read from the real salon row; chargeNow + depositAmount + vatIncludedAmount computed client-side for DISPLAY only (PayConfirmStep.tsx:135-160)
- Booking create: real POST /api/bookings with salon_id, service_id (first), extra_service_ids (rest), bundle_id, staff_member_id (null if 'any'), starts_at (TZ-safe local ISO), payment_method, promo_code, gift_card_code, total_price, customer_note, guest_* (PayConfirmStep.tsx:229-258)
- SERVER re-resolves the slot from availability_slots and RE-COMPUTES price from slot.price_override ?? services.price + extras' real prices — the client total_price is NOT trusted (app/api/bookings/route.ts:280-300)
- PaymentIntent: real POST /api/stripe/booking-pay-intent {booking_id} (PayConfirmStep.tsx:293-297)
- gift_card_code accepted by schema but intentionally NOT redeemed (gift cards hidden); logged + dropped server-side (route.ts:151-158)

**-> Handoff:** On success resetForm() + router.replace(/[locale]/confirmation?booking_id=... [+access_token&ref for guests]); real page app/[locale]/confirmation/page.tsx. Stripe redirect-3DS uses the same confirmation path as return_url (PayConfirmStep.tsx:164-178, 286-287, 630-648)

**Connections in this flow:**
- page.tsx (RSC) -> BookingProvider: passes salonId + validated deep-link seeds (initialStaffId/Service/Services/Start/Note/BundleId); trigger = server render; data = validated salon/service/staff ids from URL params (page.tsx:204-205)
- BookingProvider -> BookingWizard: children get the shared formData context + the fetched services/staff/enhancement tables as props (page.tsx:212-220)
- ServicesStaffStep -> StaffStep OR DateTimeStep: trigger = Weiter; carries formData.services + client-summed totalPrice/totalDuration in context; nextStep = 'staff' if >1 staff else 'datetime' (ServicesStaffStep.tsx:172, BookingWizard.tsx:160)
- StaffStep -> DateTimeStep: trigger = Weiter; carries formData.selectedStaffId in context (StaffStep.tsx:192)
- DateTimeStep -> HairStep OR PayConfirmStep: trigger = Weiter; carries formData.selectedDate + selectedTime; nextStep = 'hair' if a hair-category service is in the cart else 'confirm' (DateTimeStep.tsx:133, BookingWizard.tsx:164)
- DateTimeStep -> /api/availability/time-slots: sends salon_id, date, staff_id, service_ids AND totalDuration so slot length matches the multi-service cart (DateTimeStep.tsx:98-106)
- HairStep -> PayConfirmStep: trigger = Weiter/Überspringen; carries formData.customerNote; fire-and-forget profile PATCH does NOT block (HairStep.tsx:116, 126-145)
- PayConfirmStep -> POST /api/bookings: sends full formData (first service_id + extra_service_ids, staff, TZ-safe starts_at, payment_method, total_price, note, guest fields); server RE-RESOLVES slot + RE-PRICES from DB (PayConfirmStep.tsx:229-258 -> route.ts POST)
- PayConfirmStep (online) -> POST /api/stripe/booking-pay-intent -> BookingPaymentForm: booking_id -> client_secret -> Stripe Elements card form (PayConfirmStep.tsx:293-306)
- PayConfirmStep -> /[locale]/confirmation: trigger = in-person book success OR Stripe payment success; carries booking_id (+ access_token & ref for guests) in the URL; resetForm() clears the wizard so back cannot re-book (PayConfirmStep.tsx:286-287, 638)

**Notable features:**
- 3-to-5 step dynamic wizard: staff step auto-skipped for 0/1-staff salons; hair step appears ONLY when a coiffeur/barbershop service is in the cart (data-driven via service.category, not a component branch)
- Single in-memory useReducer context (lib/booking-context.tsx) is the whole state carrier; no localStorage/URL persistence of in-progress state — a hard refresh resets the flow
- Duration + price summed client-side and recomputed on every mutation, but the SERVER re-prices from the live DB on POST (client total_price is display-only, never trusted) — the correct anti-fabrication pattern
- Deep-link seeding: ?service/?services/?staff/?start/?note/?bundle all validated against the real fetched lists before entering the cart (Inspo 'book this look', PDP, search-card handoffs)
- Service detail sheet supports required OPTIONS (replace base price/duration) and ADD-ONS (added as extra cart lines); deselecting a base service auto-clears its add-ons
- Guest-first: no login required; logged-out users fill GuestBookingForm at pay; guest booking writes via service-role admin client (RLS blocks user_id IS NULL)
- Payment surface driven by the salon's payment_mode (at_salon / deposit / prepay) + accepts_online_payment, not a free customer choice; create-then-charge with a reused idempotent PaymentIntent and a double-tap guard (chargeRef)
- Waitlist path when a day is fully booked (WaitlistModal, login-gated)
- TZ-safe datetime handling: local yyyy-mm-dd + wall-clock HH:MM, no toISOString UTC shift when building starts_at
- This flow is walkable login-free via the dev harness at /[locale]/dev/flows (real slug muse-beauty-studio), per _plans/FLOW_HARNESS.md

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD FILE: the task-referenced components-legacy/ui/date-picker.tsx (a react-aria DatePicker) has ZERO importers across app/components-legacy/lib. The live date/time UI is app/[locale]/_components/primitives/DateTimePicker.tsx. The brief points at the wrong (unused) picker.
- ⚠️ gift_card_code is a live field in the booking POST body + accepted by createBookingSchema, but redemption is intentionally NOT wired (gift cards owner-hidden 2026-06-14). The server logs a console.warn and drops it (route.ts:151-158). The wizard never renders a gift-card input today, so it's dormant plumbing, not a user-facing dead control.
- ⚠️ In-memory-only state: no persistence means an accidental refresh or deep back-nav past step 1 loses the whole cart. Acceptable per design (resetForm on success is deliberate) but a real drop-off risk with no recovery.
- ⚠️ promoCode / giftCardCode / referralCode fields exist in BookingFormData and are POSTed, but the wizard UI does not expose promo/referral entry in this flow (they arrive pre-seeded or stay empty); the promo path is present in the schema but not surfaced as a control here.
- ⚠️ No live per-staff next-availability endpoint: StaffStep deliberately omits a 'soonest slot' line rather than fabricate one (correctly flagged in its own code comment) — a known data gap, handled honestly, not a fabrication.

---

## 4. Checkout & Payment

Solen's real checkout-and-payment flow is the final step of the multi-step booking wizard, NOT the /de/checkout route named in the brief. The wizard (app/[locale]/salon/[slug]/booking/page.tsx -> BookingWizard) collects service(s), staff, date/time (+ optional hair step) into client-side BookingContext state, then step 3 PayConfirmStep (components-legacy/booking/PayConfirmStep.tsx) shows a review + contact/guest form + a payment-method choice driven by the salon's payment_mode (at_salon / deposit / prepay). On confirm it does a create-then-charge: POST /api/bookings mints a pending booking row, then for online pay POST /api/stripe/booking-pay-intent creates a Stripe Connect destination-charge PaymentIntent (server-trusted price, platform commission, promo re-validation, Solen Plus member waiver, credit + voucher spend), and BookingPaymentForm confirms the card inline. The Stripe payment_intent.succeeded webhook is the sole source of truth that flips the booking to confirmed/paid; the UI merely routes to /confirmation. IMPORTANT CONTRADICTION: /de/checkout (app/[locale]/checkout/page.tsx) was dead code (page deleted earlier, commit 523e60a9f), it read a booking_intent JSON query param nothing in the app ever builds, called the older /api/stripe/create-payment-intent (manual-capture deposit hold, deleted on local main 2026-09-08), and redirected to /checkout/success which does not exist as a route.

### Booking wizard — PayConfirmStep (phase 'select')
**Route:** `/{locale}/salon/{slug}/booking (final step, client-rendered)`  ·  **Code:** `components-legacy/booking/PayConfirmStep.tsx:326 (host: app/[locale]/salon/[slug]/booking/page.tsx:25, wizard: components-legacy/booking/BookingWizard.tsx:45)`

_Single review-and-pay screen (Q55 lock): summarise the booking, capture contact/guest details, let the customer pick how to pay, and commit._

**Shows:**
- Booking summary card: salon name + cover + rating/review count + address, stylist (Avatar), each service with duration, date+time (PayConfirmStep.tsx:333-417)
- Price card: per-service price lines, optional 'incl. VAT' line (only if salon.vat_registered), bold total (PayConfirmStep.tsx:420-439)
- Logged-in: prefilled contact summary row (name+phone) with Ändern (PayConfirmStep.tsx:451-499); logged-out: GuestBookingForm name/phone/email (PayConfirmStep.tsx:501-517)
- Payment section driven by paymentMode: at_salon => online/in_person chooser (PayConfirmStep.tsx:524-564); deposit => deposit-now / rest-at-salon / grand-total breakdown (565-587); prepay => full-price panel (588-594)
- Cancellation-policy banner using salon.cancellation_window_hours (PayConfirmStep.tsx:598-603)
- Sticky ink CTA whose label switches on paymentMode: Buchen / Anzahlung CHF x / Weiter zur Zahlung CHF x (PayConfirmStep.tsx:608-624)

**You can:**
- Edit/guest-fill name, phone, email; Ändern jumps back to services-staff or datetime step via goToStep (PayConfirmStep.tsx:378,396,412)
- Choose online vs in-person when salon is at_salon mode (setPayChoice, PayConfirmStep.tsx:531,548)
- Press the commit CTA -> handleConfirm (PayConfirmStep.tsx:180)

**Data wiring:**
- Summary/price = client BookingContext formData (formData.services, selectedDate, selectedTime, totalPrice) built across earlier wizard steps via lib/booking-context (PayConfirmStep.tsx:63,123-131) — client state, price is display-only and re-derived server-side later
- salon.payment_mode / deposit_percent / accepts_online_payment / vat_registered / vat_rate / cancellation_window_hours = REAL, from salons table fetched server-side in the booking page (app/[locale]/salon/[slug]/booking/page.tsx:44-49), passed as props
- Logged-in contact prefill = REAL GET /api/profile (display_name, phone_number) (PayConfirmStep.tsx:85-91)
- depositAmount / remainingAtSalon / vatIncludedAmount / chargeNow = computed client-side for DISPLAY only (PayConfirmStep.tsx:144-160); the server (booking-pay-intent / bookings) is the source of truth
- onlineAvailable gate = salon.accepts_online_payment === true (PayConfirmStep.tsx:139)

**-> Handoff:** On confirm, POST /api/bookings with salon_id, service_id, extra_service_ids, bundle_id, staff_member_id, starts_at (TZ-safe local ISO), payment_method, promo_code (formData.promoCode), gift_card_code, total_price, customer_note, and guest_name/phone/email when logged out (PayConfirmStep.tsx:229-258). In-person => resetForm + router.replace to /confirmation?booking_id=... . Online => carry the returned booking id into phase 'pay'.

### Booking wizard — PayConfirmStep (phase 'pay') / BookingPaymentForm
**Route:** `same URL, in-place phase switch (no navigation)`  ·  **Code:** `components-legacy/booking/BookingPaymentForm.tsx:215 (mounted by PayConfirmStep.tsx:630-649)`

_Real Stripe card step for online payment (full prepay or deposit)._

**Shows:**
- Stripe PaymentElement (tabs layout), Inter loaded into the iframe, ink theme (BookingPaymentForm.tsx:170,224-234)
- Ink Pay CTA 'CHF x bezahlen' with lock icon (BookingPaymentForm.tsx:181-189)
- Processing state: full spinner + 'Zahlung wird bestätigt' (BookingPaymentForm.tsx:153-162)
- Declined state: inline error 'Karte abgelehnt, nichts belastet' + 'Andere Zahlungsart' fallback (BookingPaymentForm.tsx:173-205)

**You can:**
- Enter card / wallet (Apple/Google Pay/Link surface via Payment Element; redirects/BNPL/TWINT excluded by allow_redirects:'never') and pay -> stripe.confirmPayment(redirect:'if_required') (BookingPaymentForm.tsx:121-126)
- On decline, drop back to the payment-method selector -> onUseOtherMethod (PayConfirmStep.tsx:639-646)

**Data wiring:**
- clientSecret = REAL, from POST /api/stripe/booking-pay-intent for the just-created booking (PayConfirmStep.tsx:293-306)
- amount shown = chargeNow (client display); the charged amount is authoritative server-side (booking-pay-intent recomputes from services.price, applies promo/member/credit/voucher) (BookingPaymentForm.tsx:73 comment)
- Never writes 'paid' itself — success only fires onSucceeded; the webhook owns paid state (BookingPaymentForm.tsx:14-16,134-138)

**-> Handoff:** On succeeded|processing, resetForm + router.replace to the /confirmation path built at create time (PayConfirmStep.tsx:638). Same path is Stripe's return_url for redirect-3DS so inline and redirect confirm land identically (PayConfirmStep.tsx:114-117,637).

### Confirmation
**Route:** `/{locale}/confirmation?booking_id=...(&access_token=&ref= for guests)`  ·  **Code:** `app/[locale]/confirmation/page.tsx:39 (renders components-legacy/booking/BookingConfirmation.tsx)`

_Post-booking success + receipt; the shared landing for in-person, online-paid, and guest bookings._

**Shows:**
- Salon, service, stylist, date/time, price paid, reference code, paid-via, paid-now vs remaining-at-salon, VAT/MwSt receipt breakdown (computeVat) when payment settled (confirmation/page.tsx:134-166)
- Guest 'save your access link' when reference_code + raw token present (confirmation/page.tsx:114-120)

**You can:**
- View receipt; guest can save the access link to return to the booking (confirmation/page.tsx:115)
- Downstream actions live in BookingConfirmation (add-to-calendar, view bookings) — reads booking id/salon/service/staff props (confirmation/page.tsx:161-165)

**Data wiring:**
- REAL bookings table read, two paths: logged-in/owner via RLS cookie client (bookings_select_own), guest via service-role read + verifyAccessToken against stored SHA-256 hash (confirmation/page.tsx:57-97)
- Fields: price_paid, remaining_at_salon, paid_amount, status, payment_status, payment_intent_id, reference_code, paid_via, vat_rate + joined salons/services/staff_members (confirmation/page.tsx:20-24)
- VAT recomputed from price_paid via lib/vat computeVat, only rendered when payment_status 'paid' (confirmation/page.tsx:122-132)

**-> Handoff:** Terminal for the pay flow. Tipping is a SEPARATE later surface reached by the post-service review-prompt email deep-link, not linked from here.

### Tip (post-service, separate)
**Route:** `/{locale}/tip/{bookingId}`  ·  **Code:** `app/[locale]/tip/[bookingId]/page.tsx:14 (TipSheet -> TipFlow)`

_Optional gratuity to the stylist after the appointment; opened from the review-prompt email link._

**Shows:**
- TipSheet bottom-sheet: stylist name/photo/rating, service+salon context line, amount options (tip/[bookingId]/page.tsx:55-79)

**You can:**
- Pick/enter a tip amount and pay -> createIntent POST /api/tips (tip/[bookingId]/page.tsx:64-71); dismiss -> home

**Data wiring:**
- Booking context = GET /api/bookings/{bookingId} (tip/[bookingId]/page.tsx:24-27)
- POST /api/tips: server refetches booking, authorizes booking.user_id === user (logged-in only), creates a Connect destination-charge PaymentIntent 100% to salon with NO application_fee (transfer_data only), atomically claims one pending tip row per booking (partial unique index) to prevent double-charge (api/tips/route.ts:38,83-145)
- Gated: salon must have stripe_account_id AND accepts_online_payment, else 409 'tip at the counter' (api/tips/route.ts:47-49)
- Tip URL minted by the review-prompt cron only when salon is Connect-enabled + stylist known (api/cron/review-prompt/route.ts:305-314)

**-> Handoff:** Tip paid via webhook (type:'tip'); dismiss routes to home. Terminal.

### /checkout (ORPHANED — dead legacy surface)
**Route:** `/{locale}/checkout?booking_intent=<json>`  ·  **Code:** `app/[locale]/checkout/page.tsx:113`

_An older standalone checkout page. NOT part of the live flow: nothing constructs the booking_intent param or navigates here (only /dev/mockups + /dev/checkout-confirm reference /checkout)._

**Shows:**
- Booking summary from a JSON booking_intent query param, promo/voucher/credits inputs, Stripe Elements or an at_salon confirm card (checkout/page.tsx:383-729)

**You can:**
- Validate promo (/api/promo/validate), voucher (/api/vouchers/validate), pay via Stripe, or confirm at_salon via POST /api/bookings (checkout/page.tsx:200-285)

**Data wiring:**
- booking_intent = parsed from the URL (checkout/page.tsx:141-150) — NO producer exists anywhere in app/components (grep-confirmed), so the page is unreachable in normal use
- Called /api/stripe/create-payment-intent (checkout/page.tsx:166), a manual-capture 'Kaution' deposit hold (create-payment-intent/route.ts:108, route deleted on local main 2026-09-08), a DIFFERENT, older path than the live booking-pay-intent
- userCredits = /api/referral total_earned used as a proxy for available credit; the code's own comment flags it as not-really-available (checkout/page.tsx:188-197) — a display approximation, potential misrepresentation
- Stripe appearance uses colorPrimary #C05038 + DM Sans (checkout/page.tsx:710-713) — off the locked B&W/Inter system

**-> Handoff:** Stripe return_url points at /{locale}/checkout/success (checkout/page.tsx:72) which DOES NOT EXIST as a route — a dead end. This surface should be treated as removed, not documented as live.

**Connections in this flow:**
- Booking wizard steps (services-staff -> staff -> datetime -> [hair] -> pay-confirm) carry data forward as client-side BookingContext formData; NO query-string handoff between steps (BookingWizard.tsx:45, lib/booking-context)
- PayConfirmStep (select) -> POST /api/bookings: sends salon_id, service_id + extra_service_ids, bundle_id, staff_member_id, starts_at, payment_method, promo_code, gift_card_code, total_price, customer_note, guest_name/phone/email; returns booking id (+ access_token, reference_code for guests) (PayConfirmStep.tsx:229-273)
- In-person: PayConfirmStep -> router.replace /{locale}/confirmation?booking_id=<id> (guests append access_token+ref) (PayConfirmStep.tsx:164-178,287)
- Online: PayConfirmStep -> POST /api/stripe/booking-pay-intent {booking_id} -> returns client_secret; step switches to phase 'pay' and hands client_secret + confirmationPath to BookingPaymentForm (PayConfirmStep.tsx:293-306,630-637)
- BookingPaymentForm -> stripe.confirmPayment(client_secret) -> on succeeded/processing calls onSucceeded -> router.replace to the SAME /confirmation path (also Stripe's return_url for 3DS redirect) (BookingPaymentForm.tsx:121-138, PayConfirmStep.tsx:637-638)
- Stripe -> POST /api/stripe/webhook payment_intent.succeeded (type:'booking') flips bookings.status='confirmed', payment_status='paid', frees/settles slot, completes referral, increments promo use — the SOLE source of truth for paid state (webhook/route.ts:121-205)
- payment_intent.payment_failed -> releases the slot / resets payment_status; abandon-sweep cron cancels pending+unpaid bookings >30min and frees held slots, never touching a PI-succeeded booking (webhook/route.ts:461-493, cron/abandon-sweep/route.ts:24-38)
- /confirmation reads the bookings row (RLS cookie for logged-in/owner, token-verified service-role for guests) to render the receipt (confirmation/page.tsx:57-97)
- review-prompt cron email -> /{locale}/tip/{bookingId} -> GET /api/bookings/{id} + POST /api/tips (100% to salon Connect, no fee) (cron/review-prompt/route.ts:314, tip/[bookingId]/page.tsx:24-71)
- DEAD: /checkout -> /api/stripe/create-payment-intent (deleted on local main 2026-09-08) -> return_url /checkout/success (nonexistent route); no producer builds the booking_intent param (checkout/page.tsx:72,141-166)

**Notable features:**
- create-then-charge (Option B): booking row is created FIRST as pending/unpaid, then the PaymentIntent is keyed off booking_id, so an abandoned card step is swept by cron and the slot freed (PayConfirmStep.tsx:105-118, booking-pay-intent/route.ts:26-33)
- payment_mode-driven UX + charge: at_salon (customer-optional online), deposit (deposit_percent% now, rest at salon), prepay (full) — the same split is enforced server-side, client value never trusted (PayConfirmStep.tsx:141-160, booking-pay-intent/route.ts:183-198)
- Server-trusted pricing: booking-pay-intent recomputes CHF from services.price + server-set extras + bundle re-pricing (loadPricedBundle), rejecting a stale/mismatched bundle rather than charging the full sum (booking-pay-intent/route.ts:123-182)
- Stripe Connect destination charge with application_fee_amount = platform commission from platform_settings; DEV-only platform-charge fallback for seed salons without a connected account, hard-blocked in production (booking-pay-intent/route.ts:110-121,361-369,463-469)
- Promo re-validation at charge time against the live promo_codes row with atomic reserve_promo_use RPC; idempotency key on (booking, base amount) so retries reuse the same PI; orphaned-reservation release on Stripe replay (booking-pay-intent/route.ts:200-304,471-554)
- Solen Plus member commission-waiver via reserve_member_discount (reduces application_fee, salon payout unchanged) (booking-pay-intent/route.ts:368-422)
- Credits + voucher spend applied AFTER PI creation via redeem RPCs keyed on the real PI id, then paymentIntents.update shrinks the charge; restore-on-update-failure (booking-pay-intent/route.ts:564-701)
- Guest checkout: name+phone (email optional) via GuestBookingForm; guest booking is payable without a session (booking row is the auth anchor) and confirmation is reached with a SHA-256-hashed access token, never reference_code alone (PayConfirmStep.tsx:99-103, booking-pay-intent/route.ts:75-83, confirmation/page.tsx:60-97)
- Webhook is the single source of truth for paid state; the client never asserts 'paid' (BookingPaymentForm.tsx:14-16,134-138)
- Tips route 100% to the salon (transfer_data with no application_fee) with an atomic single-pending-tip claim to stop double charges (api/tips/route.ts:83-145)
- VAT shown/receipted only for vat_registered salons, using the salon's own vat_rate (PayConfirmStep.tsx:146-154, confirmation/page.tsx:122-132)

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD-END SURFACE (page deleted earlier, commit 523e60a9f): /de/checkout (app/[locale]/checkout/page.tsx) was unreachable, no code builds its required booking_intent query param (grep-confirmed, only /dev mockups mention /checkout), and its Stripe return_url targets /{locale}/checkout/success which is not a route (checkout/page.tsx:72). It also used the older /api/stripe/create-payment-intent (manual-capture deposit hold, deleted on local main 2026-09-08) that no live UI called. Treat as removed legacy, not the checkout entry.
- ⚠️ POTENTIAL MISREPRESENTATION on /checkout: userCredits is /api/referral total_earned displayed as available credit; the code's own comment concedes it is not the real available balance (checkout/page.tsx:188-197). (Moot while the page is orphaned, but flag if it is ever revived.)
- ⚠️ STALE DESIGN on /checkout: Stripe Elements colorPrimary #C05038 (warm terracotta) + DM Sans font (checkout/page.tsx:710-713), and warm-brown inline styles throughout, contradict the locked B&W/Inter system the live BookingPaymentForm uses (#0A0A0A + Inter).
- ⚠️ Voucher spend is unwired from the live booking UI: booking-pay-intent reads voucher_code from the request body but PayConfirmStep only sends {booking_id}, so no FE field reaches it (booking-pay-intent/route.ts:60-62). The wizard collects gift_card_code into /api/bookings but there is no voucher-code input in PayConfirmStep — voucher redemption at booking is effectively dormant from the customer's side (credits auto-apply server-side; promo comes via formData.promoCode).
- ⚠️ No in-app link from /confirmation to the tip flow: tipping is reachable only via the review-prompt cron email deep-link (cron/review-prompt/route.ts:314); a customer who wants to tip right after confirming has no path from the confirmation screen.
- ⚠️ onSuccess prop on the /checkout CheckoutForm is a no-op (checkout/page.tsx:721) — success relies entirely on the Stripe return_url redirect to the missing success route.
- ⚠️ Two parallel Stripe payment-intent code paths historically existed. `booking-pay-intent` is the live full-prepay/deposit destination charge; the manual-capture `create-payment-intent` route was deleted on local main 2026-09-08.

---

## 5. Confirmation & post-booking

The post-booking flow is everything a customer touches AFTER the pay step: the receipt/confirmation screen they land on, the account-less "find/re-open my booking" surfaces (guest lookup + resend access link), and the three booking-scoped action screens (report/refund entry, refund case status/timeline, salon-requested upcharge approve/decline). It exists because Solen is guest-first (KEY_FEATURES #27): a booking can be made with no account, so a guest must be able to see their confirmation, re-enter their booking later via a token-gated link, and file a refund/dispute or respond to an upcharge, all without ever logging in. The spine is the `bookings` row plus a token-gated guest-access mechanism (raw access_token -> SHA-256 hash on the row -> httpOnly cookie) and, for disputes/upcharges, the `booking_disputes` + `case_events` tables. Money only ever moves through the shared issueRefund / chargeUpcharge chokepoints; nothing auto-approves.

### Booking Confirmation / Receipt
**Route:** `/[locale]/confirmation?booking_id=…[&access_token=…&ref=…]`  ·  **Code:** `app/[locale]/confirmation/page.tsx:39 (server) renders components-legacy/booking/BookingConfirmation.tsx:129 (client)`

_The receipt landed on immediately after the pay step. One screen, three states (confirming / paid / cancelled) driven by the row, plus a guest vs logged-in split._

**Shows:**
- Salon cover photo hero (only if salons.cover_photo_url present; no fabricated placeholder) with a frosted Help link (page.tsx:325-348)
- Salon name + address row, chevron to /salon/[slug] (BookingConfirmation.tsx:352-368)
- Headline: green tBookingCard('status.confirmed') when payment_status='paid', ink t('title') while confirming/pay-at-salon, red appointmentCancelled when cancelled (BookingConfirmation.tsx:374-381)
- Details card: date+time+duration, service+services.price, stylist row with Avatar initials (BookingConfirmation.tsx:384-452)
- Money card: 'paid online now' + 'rest at salon' for deposits, else total with a paid/confirming/paid-in-person sub-label; VAT '(inkl. MWST)' + MWST-Nr only when isPaid && vatRate>0 (BookingConfirmation.tsx:454-493, 565-569)
- Guest-only: a copyable access-link card (their ONLY durable way back) (BookingConfirmation.tsx:528-552)
- Footer: reference code (SOL-…) + 'manage booking' link

**You can:**
- Add to calendar: generates an .ics blob client-side and downloads it (primary ink CTA, BookingConfirmation.tsx:280-303,496-504)
- Directions: opens Google Maps search for salon name+address in a new tab (BookingConfirmation.tsx:305-307,505-513)
- Reschedule: taps the date row -> opens RescheduleSheet, ONLY when canReschedule (logged-in, not cancelled, >24h out, status confirmed|pending) (BookingConfirmation.tsx:194-198,385-403)
- Cancel: red text button -> CancelBookingSheet -> POST /api/bookings/[id]/cancel, ONLY when logged-in + status confirmed + upcoming (BookingConfirmation.tsx:200,245-267,517-525)
- Copy the guest access link (guest only)
- Tap 'manage booking' -> lookup (logged-in) or the access link (guest)
- Tap salon name -> salon PDP

**Data wiring:**
- Booking row: fetched server-side two ways — guest path createAdminSupabaseClient + verifyAccessToken against access_token_hash/expires_at (page.tsx:60-80), logged-in/owner path createServerSupabaseClient under RLS bookings_select_own (page.tsx:82-97). REAL table `bookings` joined to salons/services/staff_members (BOOKING_SELECT page.tsx:20-24).
- VAT breakdown: computed server-side by lib/vat computeVat from bookings.vat_rate + price_paid, only when payment_status='paid' (page.tsx:127-132) — computed, not fabricated.
- isPaid/isConfirming: derived from payment_status + payment_intent_id fingerprint (BookingConfirmation.tsx:159-161) — the row is the source of truth, guards against a false 'paid'.
- accessLink: built from booking.reference_code + raw access_token (guest only) (page.tsx:114-120).
- RescheduleSheet/CancelBookingSheet get a `sheetBooking` adapter object; fields the sheets never read (user_id '', slot_id '', average_rating 0, review_count 0) are inert placeholders, explicitly NOT displayed (BookingConfirmation.tsx:206-242) — documented non-fabrication.

**-> Handoff:** Guest -> /[locale]/booking/lookup?code=REF&t=TOKEN (the accessLink, carries reference_code + raw token). Logged-in -> /[locale]/booking/lookup (no token). Reschedule/cancel act in place via API + router.refresh().

### Guest Lookup (find / re-open booking)
**Route:** `/[locale]/booking/lookup  [?code=…&t=… when arriving from an emailed/confirmation link]`  ·  **Code:** `app/[locale]/booking/lookup/page.tsx:59`

_One route, two jobs: (A) no token = a 'find your booking' form that emails a fresh link; (B) ?code&t present = exchange the raw token once for an httpOnly cookie and open the booking._

**Shows:**
- FormView: order-number (SOL- prefix + 5 chars) + email inputs, security note (page.tsx:282-443)
- SentView: uniform 'check your email' state with a 60s resend cooldown — never reveals whether a booking exists (page.tsx:449-500)
- ExchangingView: spinner while the token is consumed (page.tsx:506-517)
- OpenedView: order-number strip with copy, 14-day refund-window note, and the ONE entry to report/refund (page.tsx:557-646)
- LinkInvalidView: calm 'link can't be opened' recovery pointing at resend-link (page.tsx:523-551)

**You can:**
- Submit code+email -> POST /api/bookings/resend-access (opaque) -> uniform sent state (page.tsx:128-159)
- Resend / try a different code (returns to form)
- On token arrival: auto-exchange via GET /api/bookings/guest-lookup (page.tsx:84-110)
- Copy the order number (OpenedView)
- Tap 'report a problem / request a refund' -> /bookings/[id]/report (page.tsx:628-632)
- 'Log in instead' -> /auth/login ; request a new link -> /booking/resend-link

**Data wiring:**
- POST /api/bookings/resend-access (app/api/bookings/resend-access/route.ts:46): REAL, service-role fetch of `bookings` by reference_code; byte-identical opaque 200 for match/no-match/bad-code (anti-enumeration); only a matching GUEST booking mints a new token + emails it via Resend.
- GET /api/bookings/guest-lookup (app/api/bookings/guest-lookup/route.ts:33): REAL, verifies token against access_token_hash, runs a sentinel-hash crypto op on the no-row branch to equalize timing, sets the booking-bound httpOnly cookie via setGuestCookie, returns { booking_id } only. Uniform 404 on any failure.
- bookingId in OpenedView comes from the guest-lookup 200 body (page.tsx:98). No booking facts are shown here beyond the order number (real, from the URL/exchange).

**-> Handoff:** OpenedView -> /[locale]/bookings/[bookingId]/report (real bookingId from the token exchange; the guest cookie set by guest-lookup is what authorizes the subsequent report GET/POST). LinkInvalid -> /booking/resend-link.

### Resend Access Link
**Route:** `/[locale]/booking/resend-link`  ·  **Code:** `app/[locale]/booking/resend-link/page.tsx:50`

_A guest who lost their private link requests a fresh one, by order number + email OR phone._

**Shows:**
- FormView with an email|phone channel toggle + order-number input (page.tsx:245-448)
- SentView: uniform sent state with masked destination (l•••a@…) + 60s cooldown (page.tsx:454-510)
- LimitedView: rate-limit lockout with a live Retry-After countdown + progress bar (page.tsx:516-586)
- Desktop 'how it works' / 'in a hurry' rails (page.tsx:592-653)

**You can:**
- Choose email or phone channel
- Submit -> POST /api/bookings/resend-access (page.tsx:101-138)
- Resend after cooldown
- Back to /booking/lookup

**Data wiring:**
- Same REAL opaque POST /api/bookings/resend-access as lookup. A 429 flips to the rate-limited lockout using the server's Retry-After header (page.tsx:117-123) — real server gate, not fabricated.
- maskedDest is computed client-side from the typed contact (page.tsx:141-156).

**-> Handoff:** Sends an email whose link is /booking/lookup?code=REF&t=TOKEN -> re-enters the Guest Lookup token-exchange path. In-app it only toggles between form/sent/limited states.

### Report / Refund Entry
**Route:** `/[locale]/bookings/[id]/report`  ·  **Code:** `app/[locale]/bookings/[id]/report/page.tsx:11 (thin wrapper) -> components-legacy/refund/ReportRefundEntry.tsx:98`

_The SINGLE 'report a problem / request a refund' entry — one unified case, refund vs complaint is just a toggle. Works identically for a logged-in customer and a token-guest._

**Shows:**
- Booking summary (salon photo/initials, service, date) self-fetched
- Reason radio rows (salon_cancelled, not_delivered, wrong_amount, double_charge, quality, other) (ReportRefundEntry.tsx:70-90)
- Description textarea (20-1000 chars)
- 'I want money back' toggle + optional partial amount field (empty = full remaining)
- Sent success screen with a short case-ref chip

**You can:**
- Pick a reason, write details, toggle refund + set an amount, send -> POST /api/bookings/[id]/report (ReportRefundEntry.tsx:176-226)
- On 409 (open case exists) -> pushed to the refund status screen (ReportRefundEntry.tsx:212-215)

**Data wiring:**
- Boot GET /api/bookings/[id]/report (report/route.ts:73): REAL. resolveBookingActor authorizes customer (session)/guest (cookie); returns { case, events, booking } where booking facts come from a service-role read of `bookings` joined to salons/services/staff_members (report/route.ts:113-140). This is the ONLY guest-safe booking-facts surface (the relational /api/bookings/[id] GET is session-only). No card last4 exists on the row — code explicitly refuses to fabricate one.
- POST create (report/route.ts:~181-330): REAL insert into `booking_disputes` (direction='refund', status='open') + a 'created' case_events row; status-gate (completed, or confirmed for wrong_amount/double_charge), remaining-refundable math in Rappen (never price_paid), empty-refund guard, and a 24h re-file cooldown for rejected cases. Notifies the salon owner via Resend.
- hasOpenCase derived from the fetched case status (ReportRefundEntry.tsx:125-130) — real.

**-> Handoff:** Success or 409 -> /[locale]/bookings/[id]/refund (caseHref, same bookingId). The created booking_disputes row is the carry-over — the case view re-fetches it by bookingId.

### Refund Case Status / Timeline
**Route:** `/[locale]/bookings/[id]/refund`  ·  **Code:** `app/[locale]/bookings/[id]/refund/page.tsx:16 (server, resolves isGuest) -> components-legacy/refund/RefundCaseView.tsx`

_Status + event timeline of a refund/appeal case, with the escalate-to-Solen affordance for a salon-rejected case._

**Shows:**
- Case status + case_events timeline
- Booking facts (same guest-safe GET)
- Guest banner + 'resend access link' when isGuest
- Escalate CTA when the case is salon_rejected

**You can:**
- View the case + timeline
- Escalate a salon-rejected case -> POST /api/bookings/[id]/escalate (RefundCaseView.tsx:144)
- Guest: jump to resend-link; navigate to report or book-again

**Data wiring:**
- GET /api/bookings/[id]/report for { case, events, booking } (RefundCaseView.tsx:111) — REAL, same surface as the entry screen.
- POST /api/bookings/[id]/escalate (escalate/route.ts:20): REAL CAS update of the booking_disputes row salon_rejected -> escalated + escalated_at + a case_events entry; 409 if the status changed underneath.
- isGuest resolved server-side from the session probe (refund/page.tsx:24-35) — real.

**-> Handoff:** receiptHref = /[locale]/bookings/[id] (DEAD — no page.tsx at that level, serves the home shell). reportHref -> /bookings/[id]/report. bookAgainHref -> home. Escalate acts in place.

### Upcharge Approve / Decline
**Route:** `/[locale]/bookings/[id]/upcharge`  ·  **Code:** `app/[locale]/bookings/[id]/upcharge/page.tsx:22 (server, resolves isGuest) -> components-legacy/refund/UpchargeApproveView.tsx`

_Customer half of a salon-requested upcharge on a completed booking. Requester-only; the salon-side request form is paused/elsewhere._

**Shows:**
- Upcharge amount + reason + booking facts
- Approve / decline actions
- Guest banner when isGuest

**You can:**
- Approve or decline -> PATCH /api/bookings/[id]/dispute { action, customer_response? } (UpchargeApproveView.tsx:235)

**Data wiring:**
- GET /api/bookings/[id]/dispute for the upcharge row (direction='upcharge') + GET /api/bookings/[id]/report for booking facts (UpchargeApproveView.tsx:140-141) — REAL.
- PATCH /api/bookings/[id]/dispute (dispute/route.ts): REAL. An explicit approve charges the difference OFF-SESSION to the saved card via chargeUpcharge (open -> salon_approved CAS -> charged); SCA/decline leaves it at salon_approved. No silent auto-approve (D8).
- isGuest resolved server-side (upcharge/page.tsx:24-35).

**-> Handoff:** receiptHref = /[locale]/bookings/[id] (DEAD, see above). reportHref -> /bookings/[id]/report. Otherwise acts in place.

**Connections in this flow:**
- Pay step -> Confirmation: components-legacy/booking/PayConfirmStep.tsx buildConfirmationPath (162-178) builds /confirmation?booking_id=…; for a GUEST it appends &access_token=… (+ &ref=reference_code) from the /api/bookings POST response (267-273); router.replace(`/${locale}${path}`) after resetForm() so browser-back can't re-book (287). The same URL is reused as Stripe's 3DS return_url so inline and redirect confirms land identically (114-117).
- POST /api/bookings response -> Confirmation URL: the create handler returns { access_token, reference_code } for a guest (app/api/bookings/route.ts:657-664); those become the confirmation query params. access_token is issued once, never persisted raw (only its SHA-256 hash is stored, route.ts:454-455).
- Confirmation -> Guest Lookup: BookingConfirmation manageHref (BookingConfirmation.tsx:168) = the accessLink (?code&t) for a guest, else /booking/lookup. Data carried: reference_code + raw access_token.
- Guest Lookup token exchange -> report chain: GET /api/bookings/guest-lookup verifies the token and sets the httpOnly solen_guest_access cookie (guest-lookup/route.ts:63-65); that cookie (not the confirmation page's token read) is what later authorizes report/refund/escalate/dispute for a guest. OpenedView then links to /bookings/[bookingId]/report with the booking_id from the exchange (lookup/page.tsx:98,628-632).
- Lookup/Resend form -> email: POST /api/bookings/resend-access rotates the token and emails /booking/lookup?code=REF&t=TOKEN (resend-access/route.ts:107), which loops back into the token-exchange path.
- Report entry -> Refund status: POST /api/bookings/[id]/report inserts a booking_disputes row; the client routes to caseHref=/bookings/[id]/refund on success or on 409 (ReportRefundEntry.tsx:212-215). Carry-over = the dispute row, re-fetched by bookingId.
- Refund status -> escalate: POST /api/bookings/[id]/escalate flips salon_rejected -> escalated on the same dispute (RefundCaseView.tsx:144; escalate/route.ts).
- Upcharge -> charge: PATCH /api/bookings/[id]/dispute approve triggers chargeUpcharge off-session on the saved card (UpchargeApproveView.tsx:235; dispute/route.ts).
- Confirmation email: on booking create, lib/email bookingConfirmation is sent to the customer (app/api/bookings/route.ts:580-594) — but it carries only service/salon/date/time/total, NO booking link or guest access link (see gaps).

**Notable features:**
- Guest-first end to end: every post-booking action authorizes via resolveBookingActor — customer (session) OR guest (booking-bound httpOnly access cookie) — so the same fetch works for both (report/route.ts, reschedule/route.ts).
- Token security: raw access_token lives only in the URL/email once; the row stores a SHA-256 hash + expiry; guest-lookup exchanges it for an httpOnly cookie and never echoes it (guest-access.ts, guest-lookup/route.ts).
- Anti-enumeration everywhere on the guest surfaces: resend-access returns a byte-identical opaque 200 for match/no-match/bad-code; guest-lookup returns a uniform 404 for every failure and does sentinel-hash crypto on the no-row branch to kill the timing oracle.
- Unified dispute spine: report-a-problem and request-a-refund are the SAME booking_disputes record distinguished only by wants_refund + requested_amount; money moves only through issueRefund / chargeUpcharge; nothing auto-approves (D8).
- Money is integer Rappen throughout; the entry screen and API both compute remaining-refundable from paid_amount - refunded_amount and never from price_paid (the documented 100x bug).
- State-honest confirmation receipt: one layout, colour/copy branch on the real row (paid via payment_intent_id fingerprint, not an unconditional 'paid'); VAT lines only render on a settled payment from a registered salon.
- 24h re-file cooldown + one-open-case-per-booking partial unique index prevent refund-spam after a rejection (report/route.ts).
- Rate limiting with dedicated tight limiters on the guest brute-force surfaces (resendAccessLimiter 3/h, guestLookupLimiter), separate from the general limiter.

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD LINK: RefundCaseView + UpchargeApproveView both receive receiptHref = /[locale]/bookings/[id] (refund/page.tsx, upcharge/page.tsx), but there is NO app/[locale]/bookings/[id]/page.tsx — that path falls through to the home shell. The guest-lookup OpenedView already removed its 'View receipt' button for exactly this reason (lookup/page.tsx:639-642); the refund/upcharge receiptHref is the same broken target left wired.
- ⚠️ GUEST CANNOT CANCEL OR RESCHEDULE FROM THE CONFIRMATION SCREEN: canManage=!isGuest, so both affordances are hidden for a guest (BookingConfirmation.tsx:183). Root cause documented in-code (170-183): the confirmation page verifies the access_token itself and never calls guest-lookup, so NO solen_guest_access cookie is set; reschedule would 401/403 and the cancel route (app/api/bookings/[id]/cancel/route.ts:22-24) is session-only (createServerSupabaseClient().auth.getUser(), no guest/resolveBookingActor path at all). A guest can only cancel/reschedule after re-entering via the lookup token exchange (which sets the cookie) — and even then cancel has no guest branch, so a guest effectively cannot self-cancel anywhere.
- ⚠️ PHONE-CHANNEL RESEND IS A DELIVERY NO-OP: POST /api/bookings/resend-access rotates the token for a phone match but sends NO SMS — only the email branch dispatches (resend-access/route.ts: 'Phone-only resend has no email channel yet'). The resend-link UI offers a phone tab and shows the same uniform 'sent' state, so a phone-only guest gets a success screen but never receives a link.
- ⚠️ CONFIRMATION EMAIL HAS NO ACCESS/MANAGE LINK: lib/email bookingConfirmation (sent at app/api/bookings/route.ts:580-594) carries only service/salon/date/time/total. A guest's ONLY durable re-entry link is the copyable card on the /confirmation screen; if they leave without saving it, recovery requires the resend-link flow. The email is not a fallback.
- ⚠️ Sheet-adapter placeholders (user_id '', slot_id '', average_rating 0, review_count 0) are fed to RescheduleSheet/CancelBookingSheet (BookingConfirmation.tsx:210-242). Verified inert (neither sheet reads them) and never displayed, so not user-facing fabrication — noted only because it is placeholder data living in the render path.
- ⚠️ reschedule route pulls a second client via getSessionUser() after resolveBookingActor already proved entitlement (reschedule/route.ts) and routes slot writes through the admin client because availability_slots UPDATE is owner-only under RLS — not a bug, but a silent-no-op trap that was already fixed here; worth knowing the customer session client cannot write slots.

---

## 6. Walk-in & Queue (join → pay → number → track → tip)

The walk-in flow lets a guest (usually no login) pay upfront for a barbershop/salon walk-in and receive a queue ticket number they then track live to the chair. It is a pay-gates-the-number model: no payment authorization, no queue number. The customer never sees a "join" form in-app; entry to the pay screen is EXTERNAL (an in-shop QR / link carrying ?salon_id&service_id, or a legacy salon-SMS ?token link). /walk-in-pay creates a manual-capture Stripe hold; on authorization /api/walkin/confirm inserts a row into barber_walkin_queue and issues an atomic per-salon ticket code (A01, A47…) plus a random tracking_token; the page then hard-redirects to /queue/[token], the single live tracker. The tracker polls status adaptively (faster near the front, paused when tab hidden), walks a 4-node stepper (Bezahlt → In der Schlange → Fast dran → Dran) off real queue state, and terminates into a done/rate/tip screen (>=3 stars → Stripe tip, <3 → feedback+help), a cancelled/no-show state, or not-found. The hold is captured when staff mark the visit completed, refunded/released on cancel, or partially captured as a no-show fee. /walk-in-tip/[token] is the standalone tip deep-link (100% to salon, no platform fee). The old /walk-in-join route is a dead redirect to the homepage.

### /walk-in-join (DEAD)
**Route:** `/[locale]/walk-in-join`  ·  **Code:** `app/[locale]/walk-in-join/page.tsx:7-10`

_Orphaned legacy join screen; now a server redirect to the homepage. Kept only to bounce stray hits._

**Shows:**
- nothing (immediate redirect)

**You can:**
- nothing — server redirect(`/${locale}`)

**Data wiring:**
- No data. Pure redirect. Comment (page.tsx:3-6) documents it as orphaned audit #12 — nothing links here; the real entry is salon page → /walk-in-pay → /queue/[token]

**-> Handoff:** Redirects to /[locale] homepage. No data carried.

### Walk-in Pay
**Route:** `/[locale]/walk-in-pay`  ·  **Code:** `app/[locale]/walk-in-pay/page.tsx:53`

_Confirm-and-pay screen for a walk-in. Renders a booking summary + Stripe card form; on payment authorization it triggers ticket creation and hands off to the live tracker. This is the real entry point of the flow._

**Shows:**
- Booking summary card: salon (photo/rating/review-count/open-until/address), optional barber (avatar/role/rating), service (name + info popover + ~duration), and an adaptive When row (walk-in → green 'Sofort' + ~wait + 'Nummer nach der Zahlung'; scheduled → date/time)
- Payment breakdown card: service line, 8.1% MwSt portion, bold Total
- Stripe Payment Element (WalkInPaymentForm) with pay CTA 'CHF x bezahlen'
- Pay-at-counter / walk-ins-paused amber banner (non-destructive)
- Cancelled confirmation state; brief spinner while redirecting after pay

**You can:**
- Enter card / Apple Pay / Google Pay and pay the manual-capture hold (WalkInPaymentForm → onPaid)
- Tap salon name/review-count → /[locale]/salon/[slug]
- Tap barber → /[locale]/salon/[slug]/staff/[barberId] (only if slug+barber_id present)
- Tap address → Google Maps search
- Toggle service description info popover
- Cancel (handleCancel, page.tsx:226) → DELETE /api/walkin/queue/[queue_id]?token= (only works once a queue_id+tracking_token exist)
- Back (router.back)
- On payBlocked: 'Anderen Salon wählen' → /[locale]/search, or 'Zum Salon' → PDP
- Demo mode (?demo=1|normal): fake pay button reveals ticket without hitting Stripe

**Data wiring:**
- THREE entry modes resolved in useEffect (page.tsx:77-169): (1) ?token= → GET /api/bookings/walk-in-verify (real; HMAC-gated read of bookings + joined salons/services/staff_members, walk-in-verify/route.ts:53-125); (2) ?salon_id&service_id[&staff_id] → GET /api/walkin/salon-info (real salons/services/staff lookup) to synthesize the booking object; (3) ?demo → hardcoded sample BookingData (page.tsx:84, clearly gated on ?demo only, never the live path)
- clientSecret from POST /api/walkin/pay-intent (real; server-trusted price from services.price, barbershop/walkin_enabled/walkin_paused/accepts_online_payment/stripe_account_id guards, Connect application_fee + transfer_data, manual capture) — pay-intent/route.ts:16-172
- On pay: POST /api/walkin/confirm (real; retrieves the Stripe PI, then createWalkinTicket) sets ticket_number/queue_id/tracking_token/payment_method into local state — page.tsx:270-305
- amount/VAT computed client-side from booking.amount (Intl.NumberFormat, page.tsx:320-324)
- payment_method ('Visa ···· 4242'/'Apple Pay') is REAL — derived from the authorized charge in cardLabel() (walkin-ticket.ts:9-18), only populated post-confirm

**-> Handoff:** On paid && tracking_token, useEffect (page.tsx:173-177) does router.replace(`/${locale}/queue/${tracking_token}`). CARRIES: the tracking_token in the URL (the only handoff datum) — the queue row itself (ticket_code, position, service, barber, salon) lives in barber_walkin_queue and is re-fetched by the tracker via that token.

### Queue Tracker
**Route:** `/[locale]/queue/[token]`  ·  **Code:** `app/[locale]/queue/[token]/page.tsx:56`

_THE single live queue tracker (the ticket). Polls queue status and renders live progress, then terminal states (done+rate+tip, cancelled/no-show, not-found)._

**Shows:**
- Salon hero (swipeable gallery, name, address, back + help frosted buttons)
- Live badge + big ETA headline ('Noch 12 Min' / 'Du bist dran!' / 'Gleich bist du dran') + '<n> vor dir in der Schlange'
- Time-progress bar (elapsed vs elapsed+ETA, real joinedAt + live ETA)
- 4-node blue stepper: Bezahlt → In der Schlange → Fast dran → Dran (states derived from status+aheadCount)
- 'Während du wartest' Inspo card → PDP; barber+service card; address row → maps; small ticket-number reference
- Action bar: Directions (maps) or Home; Cancel (X, waiting only) or Refresh
- Terminal DONE screen: success check, barber chip, 5-star rating, then TipFlow (>=3) or feedback textarea + help link (<3)
- Terminal cancelled / no-show / not-found focused screens

**You can:**
- Passive live tracking via adaptive polling (page.tsx:118-139): 8/15/25s by queue depth, 10s in_chair, PAUSED when tab hidden, stops when terminal
- Manual refresh (fetchStatus)
- Cancel own entry → opens Modal → DELETE /api/walkin/queue/[id]?token= (refund/hold-release + re-sequence)
- Open Directions / maps (salonLat/Lng or address)
- Tap Inspo / help / salon → PDP
- On done: rate 1-5 stars → POST /api/walkin/review (token-gated); >=3 → tip via TipFlow → POST /api/walkin/tip; <3 → type feedback + tap help → PDP
- Go home

**Data wiring:**
- All live data from GET /api/walkin/queue/status?token= (real; findQueueEntryByToken over barber_walkin_queue, live aheadCount via count query, live ETA via estimateWaitMinutes(aheadCount, recentAvgServiceMinutes EWMA, active staff), plus joined staff_members/services/salons) — status/route.ts:13-97
- customerName = ticket_code (e.g. 'A01'); status enum waiting|in_chair|completed|no_show|cancelled drives every branch
- FLAGGED (documented, not fabricated): firstName is ALWAYS null — the queue stores the ticket code AS customer_name, so the name-led 'Während du wartest, <name>' header never personalizes (page.tsx:29,338-340). Falls back to no name, never faked.
- Rating submit: POST /api/walkin/review (real; upserts reviews on walkin_queue_id, recomputes salon + staff average_rating/review_count) — review/route.ts
- Tip: createIntent → POST /api/walkin/tip (real; Stripe PI 100% to salon Connect account, tips table) — tip/route.ts
- No fabricated ETAs/counts/walk-times: progress bar + ahead count are all real; maps link only when real coords/address exist (comment page.tsx:523)

**-> Handoff:** Terminal exits push to /[locale] (home) after sending review/tip. Tip handoff → POST /api/walkin/tip carrying {token, amount}. Cancel → DELETE carrying token, then flips local status to 'cancelled'. Also the standalone /walk-in-tip/[token] deep-link (QR/shared) reaches the same tip sheet independently.

### Walk-in Tip (standalone)
**Route:** `/[locale]/walk-in-tip/[token]`  ·  **Code:** `app/[locale]/walk-in-tip/[token]/page.tsx:14`

_Standalone tip deep-link (QR / shared link) keyed by the queue tracking_token. Opens the shared TipSheet over a plain backdrop. Same tip the in-queue done-state opens inline._

**Shows:**
- TipSheet with recipient (barber name/photo/rating/review-count) + context line (service + salon)
- 7-day-expired state screen if the visit completed > 7 days ago
- Loading spinner

**You can:**
- Pick / enter a tip amount and pay (TipSheet → createIntent → POST /api/walkin/tip → Stripe Payment Element)
- Close → router.push(`/${locale}`)
- Demo mode (?demo=1): preview the sheet with hardcoded 'Marco Bianchi' sample (clearly gated on ?demo)

**Data wiring:**
- Recipient/context from GET /api/walkin/queue/status?token= (real; same status endpoint) — page.tsx:24-31
- completedAt drives the 7-day expiry gate client-side, mirroring the 410 guard in /api/walkin/tip (page.tsx:48-49)
- createIntent → POST /api/walkin/tip (real; 100% to salon Connect, no platform fee, tips table, pending→paid via webhook) — page.tsx:101-107
- Demo recipient values are hardcoded but ?demo-gated only (page.tsx:82-87)

**-> Handoff:** Terminal: on close/success → /[locale] homepage. No onward data handoff (tip is the end of the flow).

**Connections in this flow:**
- EXTERNAL (in-shop QR / link) → /walk-in-pay?salon_id&service_id[&staff_id]: carries salon + service (+ optional preferred barber) as query params; page synthesizes the booking via GET /api/walkin/salon-info and fires pay-intent in parallel (page.tsx:110-155, 188-196)
- EXTERNAL (legacy salon-SMS) → /walk-in-pay?token=<HMAC>: carries a booking id inside a signed token; verified via GET /api/bookings/walk-in-verify which returns full booking + (if already paid) the existing ticket/tracking_token (walk-in-verify/route.ts). NOTE: no current code PRODUCES this token (see gaps)
- /walk-in-pay → POST /api/walkin/pay-intent: carries {salon_id, service_id, booking_id?|preferred_barber_id?}; returns client_secret + server-trusted amount (never the client's price)
- Stripe authorize (WalkInPaymentForm.onPaid) → /walk-in-pay POST /api/walkin/confirm: carries {token?, payment_intent_id}; returns {ticket_number, queue_id, tracking_token, payment_method, queue_ahead, wait_minutes} — this is the moment the queue row is created (barber_walkin_queue insert via createWalkinTicket)
- /walk-in-pay → /queue/[token]: router.replace carries ONLY the tracking_token in the URL (page.tsx:175); all ticket/queue/salon/barber data is re-fetched server-side by the tracker from that token
- /queue/[token] ↔ GET /api/walkin/queue/status?token=: adaptive poll carrying the token; returns live position/ETA/aheadCount/status + recipient/service/salon context
- /queue/[token] done → POST /api/walkin/review: carries {token, rating, comment?}; writes reviews row + recomputes salon & staff ratings
- /queue/[token] done (>=3★) or /walk-in-tip/[token] → POST /api/walkin/tip: carries {token, amount}; returns clientSecret, Stripe tip 100% to salon
- /queue/[token] cancel or /walk-in-pay cancel → DELETE /api/walkin/queue/[id]?token=: carries queue_id + tracking_token; refunds (captured) or releases (uncaptured) the hold and re-sequences the queue
- OPERATOR side-channel (not customer UI): PATCH /api/walkin/queue/[id] (salon owner/staff) flips status waiting→in_chair→completed/no_show, which is what the customer's status poll reflects; completed CAPTURES the held payment, no_show partial-captures the fee, cancelled refunds
- STAFF cash entry: POST /api/bookings/walk-in → createCashWalkinTicket drops an in-person walk-in into the SAME barber_walkin_queue (no Stripe), sharing the ticket-code sequence + position logic with the paid path
- Homepage WalkInBand → /[locale]/salon/[slug] (PDP) or /[locale]/barbershop: the discovery rail links ONLY to the PDP/list, NOT directly into /walk-in-pay (WalkInBand.tsx:118,155)

**Notable features:**
- Pay-gates-the-number: the queue row + ticket code are created ONLY after Stripe authorizes the manual-capture hold (walkin/confirm → createWalkinTicket); pay_first shops even block the free remote-join with 402 (remote-join/route.ts)
- Manual-capture (authorize-only) hold: captured when staff mark completed, partial-captured as a no-show fee, or refunded/released on cancel (queue/[id]/route.ts PATCH + DELETE) — with Connect reverse_transfer + refund_application_fee so refunds don't leak platform money
- Atomic per-salon ticket code via next_walkin_ticket_seq RPC (UPDATE…RETURNING) — monotonic, collision-proof, survives deletions; high-random fallback keeps the unique index safe (walkin-ticket.ts:110-119)
- Idempotent, race-safe ticket creation shared by the client confirm route AND a Stripe webhook backstop (unique index on payment_intent_id) so a dropped client request can't strand a paid hold (walkin-ticket.ts:199-268)
- Adaptive live ETA: EWMA of the salon's recent actual service durations (recentAvgServiceMinutes) × queue depth ÷ active chairs; recomputed each poll so the wait drops as the line moves
- Adaptive, visibility-aware polling: faster near the front, paused when the tab is hidden, instant refetch on return, stops when terminal (queue/[token] page.tsx:118-139)
- CAS (compare-and-swap on status) guards every money action against concurrent staff clicks and double self-cancel (PATCH .eq('status', entry.status); DELETE .eq('status','waiting'))
- Merged done+rate+tip peak-end screen: 5★ rating routes happy customers to a Stripe tip (100% to salon) and unhappy ones to feedback+help; one review write per visit (reviews.walkin_queue_id upsert)
- 7-day tip window enforced both client-side (expired state) and server-side (410 guard)
- Guest-first: the whole flow is token-authorized (tracking_token / HMAC), no login required; customer_id captured opportunistically if signed in
- Design-system discipline visible in code: no fabricated availability/times, maps only with real coords, real review counts, native window.confirm replaced by Modal primitive

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD ROUTE: /walk-in-join is a server redirect to the homepage (page.tsx:7-10) — orphaned legacy screen, nothing links to it.
- ⚠️ LEGACY/UNPRODUCED TOKEN BRANCH: /walk-in-pay?token=, /api/bookings/walk-in-verify and /api/walkin/confirm all still fully support an HMAC 'salon-SMS payment link' token, and comments claim it is 'issued by /api/bookings/walk-in (salon-SMS flow)', but the CURRENT /api/bookings/walk-in route is cash-only and generates NO token or SMS (bookings/walk-in/route.ts). No code path was found that produces/sends this walk_in payment-link token — the entire token entry mode appears to be vestigial.
- ⚠️ NO IN-APP ENTRY TO /walk-in-pay: no router.push/Link/href to /walk-in-pay exists anywhere in app/components (grep confirmed). The pay screen is only reachable via an external QR/link carrying ?salon_id&service_id (or the unproduced ?token). The homepage WalkInBand rail links ONLY to the PDP/barbershop list, so there is no wired button that takes a customer from browsing into the pay screen — a real dead-end in the in-product journey.
- ⚠️ KNOWN BACKEND GAP (self-documented, not fabricated): QueueStatus.firstName is always null because barber_walkin_queue stores the ticket code as customer_name; the personalized 'Während du wartest, <name>' header therefore never personalizes for the pay-gated path (queue/[token] page.tsx:29,338-340).
- ⚠️ REVIEW DEDUPE is by walkin_queue_id upsert which is solid, but the file comment (review/route.ts:16-19) still describes an older best-effort same-customer/day dedupe — stale comment vs the actual upsert implementation.
- ⚠️ DEV-ONLY Connect fallback: when a seed salon has no stripe_account_id, pay-intent creates a PLATFORM charge with no transfer_data/commission split in non-production (pay-intent/route.ts:63-75). Guarded to non-prod, but means local walk-in payments do not route to a salon or split commission.
- ⚠️ Several localized labels in walk-in-pay (e.g. reassure[], stepPaid/stepNow/stepChair, barberEyebrow) are defined but not rendered on the current pay screen (the in-queue/stepper view was moved to /queue/[token]) — harmless dead copy.

---

## 7. Reviews & ratings

The Reviews & ratings flow lets a customer who completed a booking rate a salon/stylist (1-5 stars + optional comment + up to 3 photos + confirmed amenities), and surfaces those reviews on the PDP, a dedicated full-reviews sub-page, and the marketplace reviews feed. It is triggered 24h post-visit by an hourly cron that emails the customer and creates an in-app "review_prompt" notification. Reviews are real DB rows (reviews table) that recompute the salon's average_rating + review_count on submit, notify the owner by email, and can be replied to (review_replies) or flagged. A parallel guest walk-in path (queue/[token]) rates via a token-gated endpoint. The flow is genuinely wired end to end with no fabricated ratings; the known landmines are unapplied schema-drift columns (score_*/owner_reply/photo_url) that are deliberately excluded from writes, and photos that don't render on client-paginated "Mehr laden" pages.

### Post-visit review prompt (cron + notification)
**Route:** `(cron) /api/cron/review-prompt · in-app: /[locale]/notifications`  ·  **Code:** `app/api/cron/review-prompt/route.ts:42-371; app/[locale]/notifications/NotificationsClient.tsx:129-131`

_Entry point of the whole flow: 24h after a completed booking, nudge the customer to review._

**Shows:**
- Email 'Wie war dein Besuch bei {salon}?' with a CTA to the salon page #bewertungen (route.ts:271-279)
- For a customer who already left a >=4-star review AND the salon has google_place_id: a Google-review nudge email instead (route.ts:259-269)
- In-app notification card 'review_prompt' in the notifications list
- Piggybacked tip-prompt email when salon has stripe_account_id + a known stylist (route.ts:308-318)

**You can:**
- Click the email CTA to jump to the salon PDP reviews anchor
- Tap the in-app notification to open the full reviews sub-page

**Data wiring:**
- bookings query: status='completed', review_prompt_sent=false, completed_at in 23h-25h window (route.ts:71-78) — REAL
- email via Resend API (route.ts:24-34) — REAL external
- in-app notification via sendNotification with data{booking_id, salon_slug, salon_name, staff_name} (route.ts:347-360) — REAL notifications table
- bookings.review_prompt_sent flag flipped true after send (route.ts:364-366) — REAL
- existing-review / already-notified dedupe batched (route.ts:114-147) — REAL

**-> Handoff:** Notification href → /[locale]/salon/[slug]/reviews (NotificationsClient.tsx:129-131), carrying salon_slug. Email href → /[locale]/salon/[slug]#bewertungen. No booking_id is passed in the URL; the reviews page re-derives the unreviewed booking server-side.

### PDP inline reviews section
**Route:** `/[locale]/salon/[slug] (#section-reviews)`  ·  **Code:** `app/[locale]/_components/salon/SalonReviews.tsx:30-157 (wired by SalonDetailV3.tsx:289-292)`

_Social-proof block on the salon detail page: big star average + count + first review cards._

**Shows:**
- 5-star average glyph row + '{average} ({count})' with the count in blue s-accent (lines 97-114)
- Up to 6 review cards (avatar, name-or-'Anonym', date, stars, line-clamped comment with 'Mehr lesen')
- '+ N Bewertungen ohne Kommentar' collapse line for rating-only reviews (lines 137-141)
- 'Bewertungstexte folgen.' softener when count>0 but no bodies loaded (line 122)

**You can:**
- Expand a long comment (Mehr lesen)
- Tap 'Alle ansehen' → full reviews sub-page (line 147)

**Data wiring:**
- reviews prop from lib/salon-detail.ts:94-102 — admin client, top 20 (id, rating, comment, created_at, profiles(display_name, avatar_url)), is_hidden=false — REAL reviews table
- average=salon.average_rating, count=salon.review_count from salons table (SalonDetailV3.tsx:290-291) — REAL
- self-fetch fallback via createBrowserSupabaseClient if reviews empty (lines 52-75) — REAL, public-read
- section only added when review_count>0 or average>0 (SalonDetailV3.tsx:145)

**-> Handoff:** 'Alle ansehen' SeeAllButton (line 147) → /[locale]/salon/[slug]/reviews (needs salonSlug+locale props; falls back to inline expand if absent). Only average+count+bodies carry; no per-review handoff.

### Full reviews sub-page
**Route:** `/[locale]/salon/[slug]/reviews`  ·  **Code:** `app/[locale]/salon/[slug]/reviews/page.tsx:42-173 → components-legacy/salon/SalonReviews.tsx:63-507`

_Dedicated all-reviews view with filtering, sorting, pagination, the write-review entry, flagging, photos, and salon replies._

**Shows:**
- Big rating summary (average + count, line 227-234)
- Filter-by-rating checkboxes with per-star count bars (lines 240-262)
- 'Bewertung schreiben' button ONLY when the viewer has an unreviewed completed booking (lines 266-277)
- Review cards: 56px avatar, name/date, 'Salon hat geantwortet' chip, stars, comment with Mehr lesen, photo thumbnails, salon reply block (lines 296-444)
- Sort sheet (Neueste/Höchste/Niedrigste, lines 480-504)
- Flag textarea inline (lines 365-407)

**You can:**
- Filter by 1-5 star buckets (client-side, lines 110-113)
- Sort newest/highest/lowest via bottom sheet
- 'Mehr laden' — first reveals loaded rows 5 at a time, then fetches next server page (lines 173-209)
- Open a review photo (onLightbox)
- Flag a review with a reason (>=5 chars) → /api/reviews/[id]/flag (lines 134-155)
- Open the write-review form (lines 462-476)

**Data wiring:**
- Server fetch: admin client, reviews .range(0,19) with profiles + review_photos + review_replies embeds (page.tsx:82-93) — REAL, admin bypasses RLS to fix null-name bug (page.tsx:49-53)
- average_rating/review_count from salons (page.tsx:59-62) — REAL
- unreviewedBookingId derived server-side: viewer's completed bookings at this salon minus those already in reviews (page.tsx:94-120) — REAL, mirrors /api/reviews/my-booking
- staff name+avatar for the unreviewed booking fetched from staff_members (page.tsx:126-137) — REAL
- 'Mehr laden' → GET /api/reviews/salon/[salon_id]?page=N&sort= (salon/[salon_id]/route.ts) — REAL, public, but omits review_photos so paged rows show no photos (KNOWN tradeoff, SalonReviews.tsx:167-172)
- user_id + booking_id deliberately NOT forwarded to client (page.tsx:139-152)

**-> Handoff:** 'Bewertung schreiben' → opens ReviewForm sheet passing salonId, salonName, bookingId=unreviewedBookingId, staffName, staffMemberId, staffPhotoUrl (SalonReviews.tsx:462-476).

### Review form (bottom sheet)
**Route:** `(modal over /[locale]/salon/[slug]/reviews)`  ·  **Code:** `components-legacy/ReviewForm.tsx:83-511`

_The actual rating capture: stars, comment, photos, amenities, submit._

**Shows:**
- Staff avatar + 'Wie war {staffName}?' (stylist variant) or 'Wie war {salonName}?' (salon variant) (lines 116-120, 301-317)
- 5 tappable 42px stars + 'Tap to rate' / rating word (lines 330-366)
- After a rating: comment textarea (max 500), full-width photo upload card (<=3), amenity chips (lines 369-468)
- Error / uploading states
- Skip button in sticky header

**You can:**
- Pick 1-5 stars (reveals the rest of the form)
- Type a comment
- Add/remove up to 3 photos (jpeg/png/webp)
- Toggle experiential amenity chips (lgbtq/wheelchair/woman-owned/wifi/kid/pet/family/transit/student)
- Submit or Skip/close

**Data wiring:**
- POST /api/reviews {booking_id, rating, comment, staff_member_id?, attributes?} (lines 160-172) — REAL
- photo POST /api/reviews/[id]/photos as FormData after review id returns (lines 183-191) — REAL
- amenity labels via useTranslations('searchUi') amenity_{key} (line 463) — i18n REAL (the line-66 'hardcoded DE / TODO i18n' comment is stale)
- score_ergebnis/atmosphaere/preis_leistung sub-scores exist in the schema/validation but the live table lacks them — server drops them (see gaps)

**-> Handoff:** onSuccess() closes the sheet and (on the reviews page) fires onReviewSubmitted. Server side: POST /api/reviews recomputes salons.average_rating+review_count, deletes the review_prompt notification, emails the owner via /api/notify/review-posted. New review then appears on the PDP + reviews page on next load.

### POST /api/reviews (submit handler)
**Route:** `/api/reviews (POST)`  ·  **Code:** `app/api/reviews/route.ts:12-150`

_Server: validate, authorize, insert the review, recompute aggregates, notify._

**Shows:**
- (no UI) returns { data } 201 or error codes

**You can:**
- Rejects if feature flag off / unauthorized / banned / rate-limited (lines 13-24)
- Verifies booking belongs to user AND status='completed' (lines 37-46)
- 409 if a review already exists for that booking (lines 48-50)
- Runs automod checkReview → is_flagged/is_hidden/flag_reason (lines 52-58)

**Data wiring:**
- INSERT into reviews {salon_id, user_id, booking_id, rating, comment, staff_member_id, is_flagged, is_hidden, flag_reason} (lines 66-80) — REAL
- attributes → review_attributes rows (lines 84-89) — REAL, non-fatal
- recompute salons.average_rating + review_count over non-hidden reviews (lines 126-146) — REAL, computed
- delete review_prompt notification for this booking via admin (lines 92-104) — REAL
- trackServerEvent 'review_submitted' PostHog (lines 119-124)
- fire-and-forget POST /api/notify/review-posted with x-internal-secret (lines 106-117) — REAL owner email

**-> Handoff:** Returns review id → ReviewForm uploads photos to /api/reviews/[id]/photos. Owner notified → Salon owner reply screen.

### Salon owner reply (dashboard)
**Route:** `/[locale]/dashboard/reviews → POST /api/reviews/reply`  ·  **Code:** `app/api/reviews/reply/route.ts:10-62; email link app/api/notify/review-posted/route.ts (dashboard/reviews)`

_Owner responds publicly or privately to a customer review._

**Shows:**
- (dashboard reviews list, not in this flow's core files) owner reply composer

**You can:**
- Reply to a review (reply_text, is_public default true)
- Owner-only: 403 unless review.salons.owner_id === user.id (lines 38-41)

**Data wiring:**
- INSERT into review_replies {review_id, salon_id, reply_text, is_public} (lines 43-52) — REAL
- 23505 → 409 'Reply already exists' (one reply per review, lines 54-58)

**-> Handoff:** Public replies (is_public) render back on the reviews sub-page as 'Salon hat geantwortet' block (SalonReviews.tsx:426-441) and as a chip on the card header (lines 324-329). Triggers /api/notify/review-replied to the customer.

### Walk-in done/rate screen (parallel guest path)
**Route:** `/[locale]/queue/[token]`  ·  **Code:** `app/[locale]/queue/[token]/page.tsx:74-90 → POST /api/walkin/review`

_A guest walk-in rates the finished visit without an account, gated only by the tracking token._

**Shows:**
- Done screen with 5-star rating; >=3 reveals tip, <3 reveals feedback+help (lines 74-77)

**You can:**
- Submit a star rating (+ optional comment) once per visit (reviewSentRef guard, lines 80-85)

**Data wiring:**
- POST /api/walkin/review {token, rating, comment} (walkin/review/route.ts) — REAL
- token resolved via findQueueEntryByToken, must be status='completed' (route.ts:42-48)
- writes a normal reviews row AND recomputes BOTH salon and barber average_rating/review_count
- dedupe is best-effort (no booking_id; keys on same customer+barber+today) — FLAGGED hardening follow-up in-code

**-> Handoff:** Written review feeds the same reviews table → appears on PDP + reviews page + grows per-staff rating shown in SalonTeam.

**Connections in this flow:**
- Completed booking → cron (/api/cron/review-prompt) → Resend email + in-app review_prompt notification. Data carried: booking_id, salon_slug, salon_name, staff_name (notification.data); email carries salon slug + locale in the URL.
- In-app notification → /[locale]/salon/[slug]/reviews (NotificationsClient.tsx:129-131). Only salon_slug carries in the URL; the reviews page re-derives the unreviewed booking server-side.
- Email CTA → /[locale]/salon/[slug]#bewertungen (PDP reviews anchor).
- PDP inline SalonReviews 'Alle ansehen' → /[locale]/salon/[slug]/reviews (SalonReviews.tsx:147). Carries salonSlug+locale only.
- Reviews sub-page derives unreviewedBookingId (+ staffName, staffMemberId, staffPhotoUrl) server-side and passes them into the 'Bewertung schreiben' button → ReviewForm (page.tsx:94-137 → SalonReviews.tsx:462-476).
- ReviewForm submit → POST /api/reviews {booking_id, rating, comment, staff_member_id, attributes} → returns {data:{id}} → if photos exist, POST /api/reviews/[id]/photos (FormData, review id in path) (ReviewForm.tsx:160-191).
- POST /api/reviews → recomputes salons.average_rating + review_count, deletes the review_prompt notification, fires POST /api/notify/review-posted {review_id} (owner email) (route.ts:92-146).
- 'Mehr laden' on the reviews page → GET /api/reviews/salon/[salon_id]?page=N&sort= → appended items (no photos on paged rows) (SalonReviews.tsx:173-209).
- Owner reply → POST /api/reviews/reply {review_id, reply_text, is_public} → review_replies row → renders back as the public reply block + 'Salon hat geantwortet' chip on the reviews page; fires /api/notify/review-replied to the customer.
- Walk-in: queue/[token] done screen → POST /api/walkin/review {token, rating, comment} → reviews row + salon AND barber aggregate recompute → surfaces in the same PDP/reviews/SalonTeam displays.
- Marketplace reviews feed (/[locale]/reviews, MarketplaceReviewsList.tsx:78 and homepage Reviews.tsx:100) → each item links to /[locale]/salon/[slug]/reviews.

**Notable features:**
- Server-derived write-review gate: the 'Bewertung schreiben' button only appears for a viewer with a completed booking at this salon that has no review yet (page.tsx:94-120), a two-step exclusion query, not a PostgREST subquery.
- Admin (service-role) client for the public reviews read to bypass the profiles RLS that otherwise nulled every reviewer name to 'Anonym' (page.tsx:49-53; lib/salon-detail.ts:90-92; featured endpoint had the same bug).
- Weighted rating: if 3 sub-scores (Ergebnis 0.5 / Atmosphäre 0.25 / Preis-Leistung 0.25) are supplied, the overall rating is computed to half-star granularity (route.ts:32-35).
- Automod on every submit (lib/automod checkReview) sets is_flagged/is_hidden/flag_reason; hidden reviews are filtered from PDP and public reads.
- Amenity attestation: reviewer confirms experiential amenities (lgbtq/wheelchair/woman-owned/etc.) persisted to review_attributes (ReviewForm.tsx:67-77, route.ts:84-89).
- High-rating routing: a >=4-star reviewer of a salon with a google_place_id gets a Google-review nudge email instead of the Solen prompt (cron route.ts:259-269).
- Tip-prompt piggybacks the same 24h pass (no extra column) when the salon has a Stripe Connect account + a known stylist (route.ts:303-318).
- Photo pipeline: up to 3 images (jpeg/png/webp, <=5MB) to the 'review-photos' Supabase Storage bucket + review_photos rows, owner-verified (photos/route.ts).
- Guest walk-in reviews via a token-only endpoint that recomputes BOTH salon and per-barber aggregates (walkin/review/route.ts).
- Aggregates (salons.average_rating, review_count) are recomputed on every submit rather than trusted from a stored counter.
- Anti-wall UI: rating-only anonymous reviews collapse into one '+N ohne Kommentar' line instead of rendering identical placeholder rows (PDP SalonReviews.tsx:78-84,137-141).

**Gaps / dead ends / fabrications:**
- ⚠️ Phantom/unapplied columns: score_ergebnis, score_atmosphaere, score_preis_leistung are declared in supabase/migrations/20260324_review_dimensions.sql but do NOT exist in the live reviews table (42703). They are deliberately dropped from the INSERT (route.ts:60-65); the weighted rating still folds them in. owner_reply, photo_url and score_* are likewise schema-drift, intentionally omitted from the public endpoint select (salon/[salon_id]/route.ts:29-36).
- ⚠️ Paged reviews lose photos: /api/reviews/salon/[salon_id] does not select review_photos, so review photos only render for the first (server-rendered) page; 'Mehr laden' rows never show photos (SalonReviews.tsx:167-172). Documented, accepted tradeoff.
- ⚠️ Dead fallback: SalonReviews.tsx:430 reads (rev as any).salon_response, a field the passed data never contains (reviews carry review_replies, not salon_response). Harmless dead branch.
- ⚠️ Walk-in review dedupe is best-effort only: barber_walkin_queue has no booking_id, so a repeat is only blocked when the same signed-in customer already reviewed that barber today; a reviews.walkin_queue_id unique index is a flagged, unbuilt hardening follow-up (walkin/review/route.ts:13-18).
- ⚠️ Stale comment: ReviewForm.tsx:66 says amenity labels are 'hardcoded DE, TODO i18n', but the code at line 463 actually resolves them via the searchUi i18n namespace — the comment no longer matches the code.
- ⚠️ Two components both named SalonReviews (app/[locale]/_components/salon/SalonReviews.tsx = PDP inline; components-legacy/salon/SalonReviews.tsx = full sub-page). Same name, different props/behavior; a maintenance/confusion hazard, not a functional bug.
- ⚠️ ReviewForm exposes a variant='salon' prop (amenity-focused, no avatar) but the reviews sub-page always instantiates it with the default stylist variant; the salon variant is effectively unused from this entry point.

---

## 8. Profile & account

The Profile & account flow is Solen's logged-in customer hub. /de/account is a pure redirect to /de/profile. The hub (/de/profile) is a server component that reads the auth user, fetches live counts (bookings, favorites, loyalty stamps) and the single next confirmed booking, renders an identity header + a next-appointment HERO card + two grouped link-lists (Aktivität / Mehr) + a sign-out form POST. Every row is a plain <Link> deep into a sub-page; there is no client state on the hub itself. Sub-pages split into three shapes: (1) real data pages backed by named tables/APIs (bookings, favorites, stamps, referral, intake-forms, settings, haarprofil, notifications), (2) deliberately HIDDEN wallets that redirect straight back to /profile (vouchers, gift-cards), and (3) one empty stub with no backing schema (looks, always renders the discovery empty-state). Notifications is NOT reached from the hub at all: its only entry is the header NotificationBell. Stamps is orphaned from the hub too (the hub's Treue/loyalty row points to /rewards, not /profile/stamps) and is reachable only via MobileMenu. Auth is enforced per-page: every server page does supabase.auth.getUser() and redirects to /auth/login?redirect=<self> when logged out. Writes funnel through PATCH /api/profile (profile fields + notification prefs + beauty prefs + hair columns), Supabase auth.updateUser (email/password), and POST /api/profile/request-deletion (30-day soft-delete arm).

### Account redirect
**Route:** `/de/account`  ·  **Code:** `app/[locale]/account/page.tsx:3-6`

_Legacy/alias entry that funnels any /account traffic into the real hub._

**Shows:**
- nothing (server redirect only)

**You can:**
- (nothing — immediately redirected)

**Data wiring:**
- No data. Hardcoded redirect(`/${locale}/profile`) at app/[locale]/account/page.tsx:5

**-> Handoff:** /de/profile — no data carried, just the locale param.

### Profile hub (Konto)
**Route:** `/de/profile`  ·  **Code:** `app/[locale]/profile/page.tsx:73-233`

_The customer account home: identity, next appointment, and navigation into every account sub-surface._

**Shows:**
- Avatar + display name + email/member-year subtitle
- Next-appointment HERO card (date tile, salon name, service+duration line, address, time, confirmed chip, total price, 'view details' chevron) — only when a future confirmed booking exists
- Aktivität list: Termine (with upcoming count), Favoriten (with fav count, pink heart icon), Treueprogramm
- Mehr list: Haarprofil, Looks, Formulare (intake), Freunde einladen (with 'CHF 10' reward meta), Einstellungen, Hilfe
- Sign-out button

**You can:**
- Tap HERO card → /profile/bookings
- Tap Termine → /profile/bookings
- Tap Favoriten → /profile/favorites
- Tap Treueprogramm → /rewards (NOTE: not /profile/stamps)
- Tap Haarprofil → /profile/haarprofil
- Tap Looks → /profile/looks
- Tap Formulare → /profile/intake-forms
- Tap Freunde einladen → /profile/referral
- Tap Einstellungen → /profile/settings
- Tap Hilfe → /help
- Submit sign-out form (POST /api/auth/logout)

**Data wiring:**
- Auth gate: supabase.auth.getUser(), redirect to /auth/login if none (page.tsx:79-82)
- profile row (display_name, avatar_url, created_at) from profiles table via maybeSingle (page.tsx:88)
- totalBookings/upcomingBookings counts: bookings table count queries eq user_id (page.tsx:89-90) — REAL
- favCount: favorites table count eq user_id (page.tsx:91) — REAL
- stampCount: loyalty_stamps table count eq customer_id (page.tsx:92) — REAL (fetched but NOT displayed on the hub)
- HERO next booking: bookings table select with joins salon:salons(slug,name,address), service:services(name_de,name_en,duration_minutes), filtered status='confirmed' + starts_at>=now, order asc limit 1 (page.tsx:94-103) — REAL. Time formatted server-side pinned to Europe/Zurich (page.tsx:125-138)
- All counts wrapped in countOf() that swallows errors → 0 (page.tsx:42-54), so a broken query silently shows 0, not an error

**-> Handoff:** HERO + Termine rows → /profile/bookings (no state passed; BookingsList refetches by userId). Other rows → their sub-pages with only locale. Sign-out → POST /api/auth/logout → redirect to /{locale} home.

### Bookings
**Route:** `/de/profile/bookings`  ·  **Code:** `app/[locale]/profile/bookings/page.tsx:18-42`

_Full booking management: upcoming/past/cancelled with cancel + reschedule._

**Shows:**
- <BookingsList> client component with upcoming/past/cancelled tabs
- Per-booking BookingCard
- Empty state per tab

**You can:**
- Switch tab (upcoming/past/cancelled) → refetches /api/bookings/user?tab=<tab>
- Cancel a booking → CancelBookingSheet (shows refund preview) → POST cancel
- Reschedule a booking → RescheduleSheet (owns POST /api/bookings/[id]/reschedule)
- Open a booking's salon/detail

**Data wiring:**
- Auth gate at page.tsx:27-31
- Passes user.id to <BookingsList> (page.tsx:38)
- BookingsList fetches GET /api/bookings/user?tab=<tab> client-side (BookingsList.tsx:39) — REAL, tab-driven
- Cancel/reschedule are real POSTs owned by the sheets

**-> Handoff:** Terminal for this flow (reschedule/cancel loop back to itself). Salon links exit to /salon/[slug]. Reached FROM the hub HERO/Termine and from notification rows that carry data.booking_id.

### Favorites
**Route:** `/de/profile/favorites`  ·  **Code:** `app/[locale]/profile/favorites/page.tsx:17-102`

_The saved-salons merkliste with remove + Undo._

**Shows:**
- Grid of favorited SalonCards (via FavoritesList), most-recently-saved first
- Rich discovery empty-state (EmptyStateDiscovery) with real top-rated salons rail + banner when empty

**You can:**
- Tap a SalonCard → /salon/[slug]
- Tap the heart on a card → optimistic drop + DELETE /api/profile/favorites?salon_id + neutral toast with Undo (Undo POSTs re-add)
- From empty-state: open Inspo / browse top-rated (/coiffeur)

**Data wiring:**
- Auth gate page.tsx:24-28
- Step 1: favorites table select salon_id ordered created_at desc (page.tsx:31-35) — REAL
- Step 2: salons table select *, services(price) in(ids) eq is_active, avg_price computed client-side, re-sorted to favorites order because .in() loses order (page.tsx:42-63) — REAL
- Empty-state rail: salons table top-6 by average_rating (page.tsx:68-73) — REAL
- Remove/Undo wired to DELETE/POST /api/profile/favorites (FavoritesList.tsx:52-70)

**-> Handoff:** Exits to /salon/[slug] on card tap or /inspo, /coiffeur from empty state. Not a linear next-screen.

### Stamps (loyalty) — ORPHANED from hub
**Route:** `/de/profile/stamps`  ·  **Code:** `app/[locale]/profile/stamps/page.tsx:45-199`

_Per-salon stamp-card loyalty surface (legacy; hub's loyalty row now points to /rewards instead)._

**Shows:**
- 'N Karten' count
- HeroStampCard = closest-to-reward card
- Aktiv grid of other in-progress StampCards
- Eingelöst (redeemed) grid at 70% opacity with green 'Belohnung verfügbar' check chip
- Rich empty-state when no stamps

**You can:**
- Tap a stamp card → /salon/[slug]
- From empty-state: browse salons (/coiffeur)

**Data wiring:**
- Auth gate page.tsx:57-59
- loyalty_cards select with loyalty_stamps!inner scoped to eq customer_id=user.id (page.tsx:64-68) — REAL, RLS-safe
- stamps_collected derived as array length (page.tsx:77); active vs redeemed split by needed/collected (page.tsx:83-84)
- Empty-state rail: salons top-6 by average_rating (page.tsx:98-103)

**-> Handoff:** Exits to /salon/[slug]. Reached ONLY via MobileMenu (app/[locale]/_components/layout/MobileMenu.tsx:283) — NOT from the profile hub.

### Referral
**Route:** `/de/profile/referral`  ·  **Code:** `app/[locale]/profile/referral/page.tsx:10-155`

_Share a referral code, see invited-friends + earned-credit stats._

**Shows:**
- Hero explainer (CHF 10 each side)
- Referral code card (JetBrains-style code + copy button)
- WhatsApp + copy-link share buttons
- Stats: Freunde eingeladen + Verdient (earned credit)
- 3-step 'So funktioniert's'

**You can:**
- Copy code (navigator.clipboard, 2s check state)
- Share via WhatsApp (wa.me deep link with code + share URL)
- Copy share link
- If logged out: shows an Anmelden CTA to /auth/login

**Data wiring:**
- Client component; fetches GET /api/referral on mount (referral/page.tsx:21)
- referral_code: read from referrals table (referrer_id, status=pending) via admin client, or minted via insertPendingReferralCode if missing (api/referral/route.ts) — REAL (schema-drift fix: no longer profiles.referral_code)
- friends_invited: count of referrals rows status=completed (api/referral/route.ts) — REAL
- total_earned: sum of unexpired user_credits.remaining (api/referral/route.ts) — REAL (was previously hardcoded 0)
- shareUrl built client-side from window.location.origin + ?ref=<code> (referral/page.tsx:28-30)

**-> Handoff:** Share URL (…/{locale}?ref=<code>) is the outbound handoff — carries the referral_code to a new visitor's home page. No in-app next screen.

### Settings
**Route:** `/de/profile/settings`  ·  **Code:** `app/[locale]/profile/settings/page.tsx:21-81`

_Edit beauty profile + account profile + notification prefs + security + delete account._

**Shows:**
- <BeautyProfileForm>: gender, hair type, skin type, categories, interests pills
- <SettingsForm>: avatar URL, name, phone, bio, language pills, email/SMS notification switches, save button
- Security: change email, change password
- Danger zone: delete account with typed confirmation

**You can:**
- Edit + save beauty profile → PATCH /api/profile (gender + hair_type columns + customer_preferences JSONB merge)
- Edit + save profile/notifications → PATCH /api/profile
- Change email → supabase.auth.updateUser({email}) (sends confirm mail)
- Change password → supabase.auth.updateUser({password})
- Delete account → POST /api/profile/request-deletion (arms 30-day soft-delete + suspend), then redirect home

**Data wiring:**
- Auth gate page.tsx:25-28
- Loads profile columns display_name, avatar_url, bio, phone_number, locale, notification_email/sms, gender, hair_type, customer_preferences from profiles (page.tsx:30-34) — REAL
- Beauty prefs parsed from customer_preferences JSONB (page.tsx:43-55)
- PATCH /api/profile validated by updateProfileSchema, rate-limited, writes profiles (api/profile/route.ts PATCH) — REAL
- Delete uses /api/profile/request-deletion (sets deletion_requested_at + account_status=suspended; cron process-deletions hard-deletes at 30d) — REAL
- Email/password go direct to Supabase auth from the browser client (SettingsForm.tsx:98,120)

**-> Handoff:** Save → router.refresh() in place. Delete → window.location to /{locale} home. Language change persists to profiles.locale. No forward screen.

### Haarprofil
**Route:** `/de/profile/haarprofil`  ·  **Code:** `app/[locale]/profile/haarprofil/page.tsx:23-53`

_Editable hair profile (V1 real subset: type/length/thickness) used by the stylist + booking HairStep._

**Shows:**
- Subtitle explaining why it helps the stylist
- <HaarprofilForm> with Haartyp / Länge / Dicke pill rows (shared beautyFields options)

**You can:**
- Pick hair type/length/thickness pills (toggle)
- Save → PATCH /api/profile (hair_type, hair_length, hair_thickness columns)

**Data wiring:**
- Auth gate page.tsx:27-29
- Reads profiles.hair_type, hair_length, hair_thickness single (page.tsx:31-35) — REAL
- Save PATCHes those columns via /api/profile (HaarprofilForm.tsx:57-65) — REAL
- Deliberately excludes allergies/coloration/stylist/photos/AI-note — no backing schema, would be fabricated (documented page.tsx:1-8)

**-> Handoff:** Save toasts in place; values feed the booking HairStep + onboarding (shared beautyFields single source). No forward screen.

### Intake forms
**Route:** `/de/profile/intake-forms`  ·  **Code:** `app/[locale]/profile/intake-forms/page.tsx:21-151`

_View submitted consultation intake forms grouped by template, with AI recommendation + answers._

**Shows:**
- Forms grouped by template_key (Haar/Nail/Waxing/Make-up/Spa-Beratung)
- Per-form collapsible card: salon name, filled date, Anzeigen/Schliessen
- Expanded: AI Analyse block (if present) + all question/answer pairs
- Empty state 'Bisher keine Formulare ausgefüllt'

**You can:**
- Expand/collapse a form card (client state)
- Read AI recommendation + responses

**Data wiring:**
- Client component; reads session via supabase.auth.getSession, redirects to /auth/login if none (page.tsx:34-39)
- intake_form_responses select *, salons(name,slug) eq customer_id ordered filled_at desc (page.tsx:41-45) — REAL
- ai_recommendation + responses rendered from the row (page.tsx:113-137) — REAL

**-> Handoff:** Terminal/read-only. No outbound screen; salon names shown but not linked in this view.

### Looks — EMPTY STUB
**Route:** `/de/profile/looks`  ·  **Code:** `app/[locale]/profile/looks/page.tsx:18-63`

_Intended saved-inspiration surface; currently a permanent empty state (no backing table)._

**Shows:**
- Always the EmptyStateDiscovery: 'Noch keine Looks' + real top-rated salons rail + Inspo banner

**You can:**
- Open Inspo (/inspo)
- Browse top-rated (/coiffeur)

**Data wiring:**
- Auth gate page.tsx:25-29
- NO looks data: TODO comment says query `looks` table once it exists; always renders empty FTU (page.tsx:31-33) — STUB
- Only real query is salons top-6 for the empty-state rail (page.tsx:35-40)

**-> Handoff:** Exits to /inspo or /coiffeur. Never shows user content (feature not built).

### Notifications inbox
**Route:** `/de/notifications`  ·  **Code:** `app/[locale]/notifications/page.tsx:19-27 + NotificationsClient.tsx`

_Customer notification inbox (read side of the notifications write path)._

**Shows:**
- Sticky header with title + unread count + 'Alle gelesen'
- HEUTE / FRÜHER grouped rows: type-icon disc (semantic color by type), title, one-line body, relative time, blue unread dot
- Empty state (BellOff) when none

**You can:**
- Mark all read → PATCH /api/profile/notifications {all:true}
- Tap a row → mark that one read (PATCH {ids:[id]}) and, if it carries data.booking_id → /profile/bookings, or review_prompt+salon_slug → /salon/[slug]/reviews

**Data wiring:**
- Server auth gate redirects to /auth/login (page.tsx:23-25)
- Client fetches GET /api/profile/notifications → notifications table latest 50 + unread count, RLS-scoped to auth.uid (api/profile/notifications/route.ts) — REAL
- No fabricated imagery: type-icon discs used because rows carry no photo (NotificationsClient.tsx:12-16)
- Mark-read PATCHes the same endpoint (NotificationsClient.tsx:78-102) — REAL

**-> Handoff:** Rows with booking_id → /profile/bookings; review_prompt rows → /salon/[slug]/reviews. Entered from the header NotificationBell (NotificationBell.tsx:39), NOT from the profile hub.

### Vouchers wallet — HIDDEN
**Route:** `/de/profile/vouchers`  ·  **Code:** `app/[locale]/profile/vouchers/page.tsx:7-14`

_Gift-card/voucher wallet, deliberately shelved for customers (owner 2026-06-14)._

**Shows:**
- nothing (redirect)

**You can:**
- (nothing — redirects to /profile)

**Data wiring:**
- Hardcoded redirect(`/${locale}/profile`) (page.tsx:13). Backend /api/profile/vouchers + gift_cards tables stay intact; only the UI is hidden. Not linked from the hub.

**-> Handoff:** /de/profile.

### Gift cards wallet — HIDDEN
**Route:** `/de/profile/gift-cards`  ·  **Code:** `app/[locale]/profile/gift-cards/page.tsx:7-14`

_Purchased gift-cards wallet, shelved with the rest of the gift-card surface._

**Shows:**
- nothing (redirect)

**You can:**
- (nothing — redirects to /profile)

**Data wiring:**
- Hardcoded redirect(`/${locale}/profile`) (page.tsx:13). /api/gift-cards/* backend intact; UI hidden. Not linked from the hub.

**-> Handoff:** /de/profile.

**Connections in this flow:**
- /de/account → /de/profile: unconditional server redirect, carries only locale (account/page.tsx:5)
- header NotificationBell → /de/notifications: unread badge count fetched client-side; click navigates, no data passed (NotificationBell.tsx:39)
- /de/profile HERO card → /de/profile/bookings: click; no state passed, BookingsList refetches by user.id (profile/page.tsx:159)
- /de/profile Termine row → /de/profile/bookings: link (profile/page.tsx:201)
- /de/profile Favoriten row → /de/profile/favorites: link (profile/page.tsx:202)
- /de/profile Treueprogramm row → /de/rewards (Solen-wide rank), NOT /profile/stamps (profile/page.tsx:204)
- /de/profile Haarprofil/Looks/Formulare/Referral/Einstellungen rows → respective sub-pages, locale only (profile/page.tsx:211-216)
- /de/profile Hilfe row → /de/help (profile/page.tsx:217)
- /de/profile sign-out form → POST /api/auth/logout → 302 redirect to /{locale} home (profile/page.tsx:221; logout route)
- MobileMenu → /de/profile/stamps: the ONLY entry to the stamps page (MobileMenu.tsx:283)
- /de/profile/bookings ← notification row with data.booking_id: notification tap navigates here (NotificationsClient.tsx:129-134)
- /de/salon/[slug]/reviews ← notification row of type review_prompt with data.salon_slug (NotificationsClient.tsx:130-131)
- /de/profile/favorites heart → DELETE /api/profile/favorites?salon_id + Undo POST /api/profile/favorites (FavoritesList.tsx:52-70)
- /de/profile/settings save → PATCH /api/profile (profile fields + notification_email/sms + customer_preferences); email/password → supabase.auth.updateUser; delete → POST /api/profile/request-deletion → window.location /{locale} home (SettingsForm.tsx)
- /de/profile/haarprofil save → PATCH /api/profile (hair_type/length/thickness) (HaarprofilForm.tsx:57)
- /de/profile/referral share URL {origin}/{locale}?ref=<referral_code>: outbound handoff carrying the code to a new visitor (referral/page.tsx:28-30)
- every profile sub-page logged-out → /auth/login?redirect=<self-path>: post-login returns to the originating page

**Notable features:**
- Auth pattern is uniform: each server page calls supabase.auth.getUser() and redirects to /auth/login?redirect=<encoded self> so login round-trips back (profile, bookings, favorites, stamps, settings, haarprofil, notifications). Intake-forms + referral do this client-side via getSession instead.
- Hub next-appointment HERO mirrors the on-system BookingCard and is time-zone-pinned to Europe/Zurich to avoid the UTC-server slot-time bug (profile/page.tsx:125).
- Counts on the hub use a countOf() wrapper that catches errors and returns 0 — resilient, but a broken count silently reads 0 rather than surfacing an error.
- Favorites re-sorts salons back into created_at-desc order because Supabase .in() does not preserve id order (favorites/page.tsx:62-63); the favorites API POST handler was a documented past silent-405 bug (heart filled, nothing saved) now fixed (V3-D462).
- Referral totals are real: friends_invited from referrals(status=completed), total_earned from unexpired user_credits.remaining — both were previously hardcoded/broken and were repaired (schema-drift + hardcoded-0 fixes documented in api/referral/route.ts).
- Notifications deliberately avoids fabricated imagery — semantic type-icon discs instead of stock salon photos because rows carry no images (NotificationsClient.tsx:12-16); icon colors follow LOCKFILE semantic palette (success green, star yellow, error red).
- Beauty profile in settings shares the exact onboarding beautyFields option set so settings and onboarding persist identical values; haarprofil shares the same pills as the booking HairStep.
- Account deletion is a 30-day soft-delete: request-deletion sets deletion_requested_at + suspends, and a cron (process-deletions) hard-deletes later, cascading a PII-anonymize trigger — nothing is hard-deleted at click time.
- Gift-cards + vouchers wallets are intentionally hidden (owner 2026-06-14) — UI redirects to /profile but the backend tables/APIs stay intact and the change is reversible from git.

**Gaps / dead ends / fabrications:**
- ⚠️ FABRICATION-ADJACENT / STUB: /de/profile/looks has no backing schema and ALWAYS renders the empty state; a TODO says query the `looks` table 'once it exists' (looks/page.tsx:31-33). The feature is unbuilt, not broken data, but the route is a permanent dead-end for real content.
- ⚠️ ORPHANED ROUTE: /de/profile/stamps is not linked from the profile hub — the hub's loyalty row points to /rewards instead (profile/page.tsx:204). Stamps is reachable only via MobileMenu (MobileMenu.tsx:283), so most users never see it. The hub also fetches stampCount (profile/page.tsx:92) but never displays it — a dead fetch.
- ⚠️ HIDDEN-BUT-ROUTED: /de/profile/vouchers and /de/profile/gift-cards are live routes that only redirect to /profile; harmless but they exist as reachable no-op URLs.
- ⚠️ NOT LINKED FROM HUB: /de/notifications has no entry point on the profile hub at all — only the header NotificationBell reaches it. A user on the profile page has no in-hub path to their notifications.
- ⚠️ MINOR: hub counts silently coerce query errors to 0 via countOf() (profile/page.tsx:42-54), so a broken bookings/favorites/stamps count would read as 0 with no user-visible error (only a console.error).
- ⚠️ Intake-forms question labels are raw DB keys with underscores replaced by spaces (intake-forms page q.replace(/_/g,' ')) — not human-localized labels, a rough presentation gap rather than fabricated data.

---

## 9. Value store (loyalty / vouchers / gift cards / credits / referrals) — how value is earned, stored, and spent across Solen's customer surfaces

Solen's "value store" is really five loosely-coupled sub-systems in very different states of liveness. (1) REFERRAL CREDIT is the only fully-live earn+spend loop: a user shares a SOLEN-xxx code, and when a referred user reaches their FIRST confirmed booking, both sides get a CHF 10 row in `user_credits` (6-month expiry). (2) CREDITS are stored in `user_credits` and SPENT silently and automatically at pay time inside /api/stripe/booking-pay-intent (redeem_user_credits RPC) — there is no customer toggle in the real booking flow. (3) GIFT CARDS / VOUCHERS are fully BUILT in the backend (vouchers table, /api/vouchers/*, /api/gift-cards/*, redeem_voucher RPC, and a spend branch in booking-pay-intent) but every customer-facing route was deliberately HIDDEN (redirected) by the owner on 2026-06-14 in favor of a Solen-wide loyalty card; the voucher spend path has NO live caller. (4) PER-SALON STAMP CARDS (loyalty_cards / loyalty_stamps) render at /profile/stamps and are stamped via the QR page /loyalty/stamp, but the profile hub now marks stamps "legacy" and routes users to /rewards instead. (5) SOLEN STATUS / PLUS (/rewards) is a frequency RANK (base/gold/platinum computed on-read from completed bookings); its "value" is a member discount funded by waiving part of Solen's own Stripe commission, applied server-side at pay time via reserve_member_discount. Two notable dead-ends: the referral share-link stores the code in localStorage but nothing ever reads it back into a booking, and the entire /checkout page (with its visible credit + voucher UI) is orphaned — the live booking flow uses PayConfirmStep instead.

### Referral hub (share your code)
**Route:** `/[locale]/profile/referral`  ·  **Code:** `app/[locale]/profile/referral/page.tsx:1-190`

_Customer-facing referral screen: show my code, share it, see friends invited + total earned_

**Shows:**
- Hero card explaining CHF 10 / CHF 10
- My referral code (data.referral_code)
- Copy + WhatsApp + copy-link buttons
- Stats: friends_invited, total_earned (CHF)
- 3-step how-it-works

**You can:**
- Copy code to clipboard (line 33-37)
- Share via WhatsApp with prefilled text incl. shareUrl `?ref=<code>` (line 39-42)
- Copy share link
- Sign in if unauthenticated (line 60-66)

**Data wiring:**
- referral_code / friends_invited / total_earned all fetched from GET /api/referral (line 25-29)
- friends_invited = count of referrals rows where referrer_id=me AND status=completed (app/api/referral/route.ts:49-58)
- total_earned = SUM of unexpired user_credits.remaining for me (app/api/referral/route.ts:63-79) — REAL, was previously hardcoded 0
- referral_code = my pending `referrals` row, or CSPRNG-minted via insertPendingReferralCode (app/api/referral/route.ts:23-40)

**-> Handoff:** Share link -> /[locale]/referral/[code]. Data carried: the referral code string embedded in the URL (?ref= or /referral/<code>).

### Referral landing (friend clicks the link)
**Route:** `/[locale]/referral/[code]`  ·  **Code:** `app/[locale]/referral/[code]/page.tsx:1-170`

_Landing page a referred friend hits; captures the code and bounces them into the app_

**Shows:**
- Gift icon, headline/subtitle (i18n)
- The referral code badge
- CTA button
- 5-second auto-redirect countdown

**You can:**
- Read code from route param
- Store code in localStorage under key `solen_referral_code` (line 27-32)
- Tap CTA to go to home now, or auto-redirect after 5s (line 35-58)

**Data wiring:**
- code comes from the URL route param (line 24)
- written to localStorage `solen_referral_code` (line 10, 30) — NOTHING in the app ever reads this key back (verified repo-wide)

**-> Handoff:** Redirects to /[locale] home. INTENDED handoff = the stored code should later attach to the friend's first booking, but that carry-over is NOT wired (see gaps).

### Stamp card wallet (per-salon loyalty)
**Route:** `/[locale]/profile/stamps`  ·  **Code:** `app/[locale]/profile/stamps/page.tsx:1-199`

_Q59 consumer loyalty page: the user's per-salon stamp cards, closest-to-reward hero, active + redeemed lists_

**Shows:**
- Count of cards
- HeroStampCard = smallest remaining-gap card (line 92-98)
- Active cards grid (StampCard)
- Redeemed cards at 70% opacity with green 'Belohnung verfügbar' chip
- EmptyStateDiscovery with REAL top-rated salons when no stamps (line 118-146)

**You can:**
- View progress per salon
- Tap a StampCard/HeroStampCard through to the salon (slug)
- From empty state, browse popular salons

**Data wiring:**
- loyalty_cards joined to loyalty_stamps!inner scoped to `loyalty_stamps.customer_id = user.id` + salons(slug,name,cover_photo_url) (line 71-74)
- stamps_collected = derived .length of the user's stamp rows, NOT a column (line 79-84)
- active vs redeemed computed client-side by collected>=needed (line 87-89)
- empty-state salons from `salons` ordered by average_rating (line 127-133)

**-> Handoff:** StampCard -> salon PDP /[locale]/salon/<slug>. Redemption itself is not a screen here (no is_redeemed column; pending v2 schema per file header).

### Stamp grant (QR one-tap stamp)
**Route:** `/[locale]/loyalty/stamp?token=...`  ·  **Code:** `app/[locale]/loyalty/stamp/page.tsx:1-155`

_The page a customer lands on after the salon scans/opens the HMAC-signed stamp QR; one tap adds a stamp_

**Shows:**
- ready state: Award icon + 'Stempel hinzufügen?' + button
- stamped state: green check + `stamps_collected/stamps_required` + 'Belohnung freigeschaltet' when complete
- error state: red AlertCircle + message

**You can:**
- Tap 'Stempel vergeben' to POST the token and add a stamp (line 25-52)

**Data wiring:**
- token read from ?token= query (line 9)
- POST /api/loyalty/stamp {token} returns stamps_collected / stamps_required / is_complete (line 32-46)
- all displayed values come from that live API response, none fabricated

**-> Handoff:** Terminal screen — no onward nav; the earned stamp then surfaces in /profile/stamps.

### Solen Status / Plus (rank + perks)
**Route:** `/[locale]/rewards`  ·  **Code:** `app/[locale]/rewards/page.tsx:1-28 + app/[locale]/rewards/RewardsView.tsx`

_The Solen-wide loyalty RANK that replaced per-salon stamps as the primary loyalty surface; shows tier, progress to next tier, and per-tier perks (incl. member discount)_

**Shows:**
- Current tier label (base/gold/platinum)
- Base->Gold->Platinum ladder with fill position (RewardsView:12-18,153-160)
- Progress: visits vs nextThreshold, 'n to next tier' (RewardsView:167-174)
- Perks list, locked perks show a Lock + required tier (RewardsView:189-219)

**You can:**
- View own tier + progress
- See which perks are unlocked vs locked

**Data wiring:**
- getLoyaltyStatus(supabase, user.id) computes tier ON-READ from completed bookings (lib/loyalty/status.ts) — no stored table/cron yet (phase 2 deferred)
- thresholds = gold 3 / platinum 6 qualifying visits in a 12-month rolling window, CHF 25 value floor (lib/loyalty/status.ts:19-27)
- perks list is config-driven; the member DISCOUNT perk is enforced separately at pay time, not spendable here

**-> Handoff:** No direct booking handoff; the tier is re-derived server-side inside booking-pay-intent (resolveMemberDiscount) on every checkout.

### Real pay step (spend happens here, silently)
**Route:** `in-flow: /[locale]/salon/<slug>/booking (BookingWizard) -> PayConfirmStep`  ·  **Code:** `components-legacy/booking/PayConfirmStep.tsx:292-307`

_The actual commit/pay step of the live booking flow; this is where stored value (credit / member discount) is applied_

**Shows:**
- Booking summary + Stripe Payment Element (card/wallets)
- Does NOT show a credit banner or voucher input

**You can:**
- Confirm booking -> POST /api/stripe/booking-pay-intent {booking_id} only (line 293-297)
- Pay via Stripe Payment Element

**Data wiring:**
- Sends ONLY { booking_id } — no voucher_code, no credit toggle (line 296)
- Credit is applied automatically server-side: getAvailableCreditRappen + redeem_user_credits (booking-pay-intent:592-614)
- Member discount applied server-side: resolveMemberDiscount + reserve_member_discount RPC (booking-pay-intent:373-425)
- Both reduce the Stripe amount AND application_fee by the same Rappen so salon payout is unchanged, platform funds it (lib/credits/redeem.ts capStoredValueRappen)

**-> Handoff:** On success -> booking confirmation; server response carries credit_applied / voucher_applied / tier discount (booking-pay-intent:715-740). Referral completion fires from the booking-confirmed paths (see connections).

### Gift-card / voucher surfaces (ALL HIDDEN)
**Route:** `/[locale]/vouchers, /vouchers/buy, /profile/vouchers, /profile/gift-cards, /salon/[slug]/gift-card`  ·  **Code:** `app/[locale]/vouchers/page.tsx:8-14 (+ the other four wrappers)`

_Formerly the buy-a-gift-card + gift-card-wallet surfaces; deliberately shelved_

**Shows:**
- Nothing — every one is a server component that immediately redirect()s (to home, salon, or /profile)

**You can:**
- Nothing; bookmarked URLs bounce out (owner decision 2026-06-14, reversible from git)

**Data wiring:**
- Pure redirect() wrappers; the gift_cards/vouchers tables, /api/vouchers/* (validate/create/confirm), /api/gift-cards/balance, and redeem_voucher RPC all stay intact underneath but are unreachable from the customer UI

**-> Handoff:** Redirect only. The voucher SPEND branch in booking-pay-intent (:624-663) accepts voucher_code but NO live client passes it, so it is dormant.

### Orphaned /checkout page (has visible credit + voucher UI)
**Route:** `/[locale]/checkout`  ·  **Code:** `app/[locale]/checkout/page.tsx:1-660`

_An older standalone checkout with promo/voucher inputs and a 'Guthaben verfügbar' credit banner — NOT part of the live booking flow_

**Shows:**
- Booking summary
- Promo code input (P5)
- 'Guthaben verfügbar' credit banner when userCredits>0 (line 578-589)
- Voucher code input (P5b)

**You can:**
- Enter promo (POST /api/promo/validate)
- Enter voucher (POST /api/vouchers/validate)
- Pay via /api/stripe/create-payment-intent (line 165-183, route deleted on local main 2026-09-08)

**Data wiring:**
- userCredits displayed from GET /api/referral total_earned (line 189-196) — DISPLAY ONLY here
- voucher/promo validated but the discount is computed client-side (line 345-346); used create-payment-intent (deleted on local main 2026-09-08), NOT booking-pay-intent
- Only linked from /dev/mockups + /dev/checkout-confirm — orphaned from the real flow

**-> Handoff:** Dead route in practice; the live flow never routes here.

**Connections in this flow:**
- profile/referral --(share link, code in URL ?ref= or /referral/<code>)--> referral/[code] landing
- referral/[code] --(writes code to localStorage 'solen_referral_code')--> home /[locale]  [BUT the code is never read back — carry-over is broken]
- BookingWizard --(POST /api/bookings, referral_code param exists at route.ts:147,485 but no client sends it)--> bookings row
- bookings CONFIRMED (create path route.ts:644-647 | confirm route [id]/confirm:59-60 | Stripe webhook:181-183) --(booking.referral_code + user.id)--> completeReferralForFirstBooking()
- completeReferralForFirstBooking (lib/referral/complete-referral.ts) --(CAS on referrals row, then 2x INSERT)--> user_credits (CHF 10 each side, source='referral', 6-mo expiry)
- PayConfirmStep --(POST /api/stripe/booking-pay-intent {booking_id})--> booking-pay-intent
- booking-pay-intent --(getAvailableCreditRappen -> redeem_user_credits RPC)--> user_credits balance decremented, Stripe amount + application_fee reduced by same Rappen
- booking-pay-intent --(resolveMemberDiscount reads current_user_tier on-read -> reserve_member_discount RPC)--> tier_discount_amount on booking, application_fee waived
- loyalty/stamp?token --(POST /api/loyalty/stamp)--> loyalty_stamps row --> surfaces in profile/stamps
- profile hub /[locale]/profile --(Loyalty row href)--> /rewards (Solen Status), NOT /profile/stamps (marked legacy at profile/page.tsx:203-204)
- [HIDDEN] vouchers/create -> vouchers table; voucher spend branch booking-pay-intent:624-663 accepts voucher_code but has no live caller

**Notable features:**
- Referral reward is idempotent + anti-farming: credited ONLY on the referred user's first status='confirmed' booking (not at create time), via a compare-and-swap on the referrals row + a UNIQUE partial index (one completed referral per referred user) (lib/referral/complete-referral.ts)
- Single chokepoint design: all three referral-completion entry points (booking-create, confirm route, Stripe webhook) funnel through completeReferralForFirstBooking so the check + credit happen once
- Referral codes are CSPRNG (nanoid customAlphabet), never derived from user UUID; a pending row is auto-minted at signup by trg_generate_referral_code, with a fallback minter (lib/referral/code.ts)
- Stored-value spend is dollar-for-dollar platform-funded: credit/voucher/member-discount reduce BOTH the Stripe charge and application_fee by the same Rappen, so the salon payout never changes (lib/credits/redeem.ts capStoredValueRappen; comment block explains the Stripe fee<=amount cap)
- Money-spend feature flags fail CLOSED: isMoneySpendFlagEnabled returns false on any error/missing row so an unreadable flag can never silently apply a discount (lib/credits/redeem.ts, deliberately NOT reusing the fail-open checkFeatureEnabled)
- Atomic redeem/restore via SQL RPCs (redeem_user_credits, redeem_voucher, restore_user_credits, restore_voucher) with idempotency keyed on the PaymentIntent id; a failed PI amount update restores the ledger (booking-pay-intent:670-697)
- Member discount tier is ALWAYS server-derived on-read (current_user_tier), never trusted from the client; reserve_member_discount advisory-locks the user + counts in-flight uses to enforce the per-window cap atomically
- Voucher validate endpoint is hardened against enumeration: exact (not ilike) code match + one GENERIC_INVALID_MESSAGE for all failure branches + IP rate limiting (app/api/vouchers/validate/route.ts)
- Loyalty stamp counts are DERIVED (.length of scoped rows), not a stored column — avoids a phantom-column silent no-op

**Gaps / dead ends / fabrications:**
- ⚠️ DEAD-END (referral attribution): app/[locale]/referral/[code]/page.tsx:30 writes the code to localStorage key 'solen_referral_code', but NOTHING in the entire repo reads that key back (verified). booking-context.tsx:23 defaults referralCode='' and it is never set; no client component passes referral_code to POST /api/bookings. Net effect: the customer share-link -> friend-books -> both-get-CHF-10 loop cannot complete through the UI, because the code never propagates from localStorage into the booking payload. The completion code (complete-referral.ts) is fully built and correct, but it only ever receives a null referral_code from the live flow.
- ⚠️ DORMANT SPEND PATH (voucher): app/api/stripe/booking-pay-intent/route.ts:62,624-663 fully implements applying a voucher_code to a charge, but the real pay step (PayConfirmStep.tsx:296) sends only { booking_id } and no live client passes voucher_code. Combined with all voucher/gift-card customer routes being redirect-only, the voucher spend path is unreachable end-to-end.
- ⚠️ DEAD-END ROUTE (page deleted earlier, commit 523e60a9f): the entire /[locale]/checkout page (app/[locale]/checkout/page.tsx, ~660 lines), the only surface that visibly showed a 'Guthaben verfügbar' credit banner and a working voucher input, was not linked from any live flow (only /dev/mockups + /dev/checkout-confirm). It also used the older /api/stripe/create-payment-intent (deleted on local main 2026-09-08), not booking-pay-intent, so its promo/voucher discounts were computed client-side and diverged from the real spend path.
- ⚠️ NO SPEND VISIBILITY IN REAL FLOW: because credit is auto-applied silently in booking-pay-intent and PayConfirmStep shows no credit banner, a user with referral credit gets no in-flow indication that (or how much) credit was applied before paying; the credit_applied figure only comes back in the API response after the intent is built (booking-pay-intent:733).
- ⚠️ LEGACY/AMBIGUOUS LOYALTY: per-salon stamp cards (/profile/stamps) are fully live but the profile hub now routes 'Loyalty' to /rewards and comments call stamps 'legacy' (profile/page.tsx:203); redemption of a completed stamp card has no wired action/screen (file header notes no is_redeemed column, 'pending v2 schema'), so a full stamp card shows 'Belohnung verfügbar' with no in-app redeem step.
- ⚠️ PHASE-2 DEFERRED: Solen Status has no stored loyalty_status table or monthly cron yet; tier is recomputed on every read from bookings (lib/loyalty/status.ts header), and the thresholds (gold 3 / platinum 6) are explicitly PLACEHOLDER values to be recalibrated before launch.

---

## 10. Inspo / discovery feed

**(ia-navigation-05, fixed 2026-07-27):** both the Inspo feed and `/search` restore scroll
position on back-navigation from a detail page via `lib/hooks/useScrollRestoration.ts`, a
shared hook keyed by pathname + querystring in sessionStorage, sourced from the NN/g
"return-to-spot" fix flagged (never implemented) in `_design-system/research/PSYCH_CONVERSION.md:160`.

**(ia-navigation-04, fixed 2026-07-27):** the Inspo feed's gender/texture/style/cuts drill-down
filters are now URL-synced (`hairGender`/`hairTexture`/`hairStyle`/`tags` params, `router.replace`),
matching the guarantee `/search`'s SearchTemplate already gave its own filters. Param names are
deliberately disambiguated from `/search`'s own `gender` (a different taxonomy, see `_rules/I18N_ROUTING.md` Rule 32b).

The Inspo flow is Solen's Pinterest-style content-discovery surface: a masonry feed of "looks" (hair/nail/beauty photos + imported TikTok videos) at /de/inspo, a full-bleed dark look-detail page at /de/inspo/[id], and a flat saved grid at /de/inspo/saved. Its product purpose is top-of-funnel inspiration that bridges into booking: a user browses/searches/filters looks, saves the ones they like, opens a look to see AI-generated details (style, upkeep, products, cut guide), and taps "Diesen Look buchen" on a real, category-matched salon — which hands the pre-selected service AND the AI cut-script into the booking wizard as a pre-filled note. The feed is genuinely data-driven (Supabase RPCs discovery_feed_v2 / discovery_feed_for_you / search_discovery, category-meta, chip-terms) with per-user DNA affinity ranking, and it is disciplined about never fabricating booking signals (rating/price/availability render only when backend-fed). The main structural weakness is a stranded "boards/collections" layer: the board and saved-collection detail routes and their APIs are live, but nothing in the current feed or saved page links to them (the named-collections UI was deliberately removed 2026-06-23), so those two routes are orphaned.

### Inspo feed
**Route:** `/[locale]/inspo`  ·  **Code:** `app/[locale]/inspo/page.tsx:42 (DiscoverPageContent), default export :642`

_Pinterest-style masonry feed of looks; the browse/search/filter/personalize surface and the entry to every other Inspo screen._

**Shows:**
- Search bar with focus-dropdown (recent searches + AI trending pills, or autocomplete when typing) — page.tsx:394-443
- Saved-heart button (top-right) routing to /inspo/saved — page.tsx:412-419
- Horizontal category pills, each with a REAL cover photo from that category's own content, ordered by the viewer's category affinity — page.tsx:451-486
- Refine row: FilterDrawer trigger + per-category quick-chip tags — page.tsx:492-554
- MasonryGrid of ItemCard (photo) / VideoCard (tiktok) — page.tsx:588-613
- Infinite-scroll sentinel + 3-dot loader — page.tsx:618-626
- Floating PostFromDiscover button; ProfileSetupModal / InlinePrefsPanel on first visit; admin-only DiscoveryAdmin panel

**You can:**
- Scroll infinitely (IntersectionObserver → fetchItems(nextPage, append, nextCursor)) — page.tsx:269-283
- Type + submit a search (commitSearch drives feed, logs the term, writes localStorage recent-searches) — page.tsx:334-352
- Pick a category pill (scopes feed; second tap on same category toggles back to Alle; clears cuts/search) — page.tsx:458-463
- Tap a quick-chip tag (routes the tag through the committed search query; clears cuts) — page.tsx:530-552
- Open FilterDrawer to set gender/texture/cut-tags (DNA pre-seeds from saved profile) — page.tsx:494-529
- Tap a look → handleItemClick: salon-sourced item → /salon/[slug]; otherwise → /inspo/[id] — page.tsx:285-292
- Tap a card heart → handleSave (logged in: toggle save, optimistic) or handleAuthRequired → /auth/login — page.tsx:296-328
- Set discovery profile prefs (handleProfileSave PATCH /api/profile) — page.tsx:357-371

**Data wiring:**
- Feed items: GET /api/discovery/feed (page.tsx:231) → route.ts branches: search_discovery RPC when ?search set (feed/route.ts:78-116), discovery_feed_for_you RPC for logged-in pure-browse DNA ranking (feed/route.ts:127-142), else discovery_feed_v2 RPC with keyset cursor + soft gender bias from profiles.disc_gender (feed/route.ts:174-210). REAL Supabase RPCs on discovery_items.
- Category pills cover+count: GET /api/discovery/category-meta (page.tsx:174) — real per-category .limit(1) cover selects; empty category shows neutral sunken tile, never a fake photo (page.tsx:473-477).
- Category order: GET /api/discovery/category-order (page.tsx:188) — DNA category-affinity order; empty for logged-out.
- Quick chips: GET /api/discovery/chip-terms?category= (page.tsx:160) — top real style tags in actual content (data-driven, replaced old hardcoded Skin-Fade/Buzz/Bob list per comment page.tsx:34-37).
- Profile/auth gate: getSession() then GET /api/profile (page.tsx:122-154) — real profiles row (disc_* fields).
- Save toggle: POST /api/discovery/save → toggle_discovery_save RPC (save/route.ts:26). savedIds is session-only, NOT hydrated from server on load, so already-saved looks show empty hearts until re-toggled (minor gap).
- Search logging: discovery_search_events insert on page-1 search (feed/route.ts:103-110). NO fabricated data anywhere in the feed.

**-> Handoff:** /inspo/[id] carrying only the look id in the URL path (router.push(`/${locale}/inspo/${item.id}`), page.tsx:291). Salon-sourced items instead carry item.salon_slug → /salon/[slug]. Heart while logged out → /auth/login. Saved-heart button → /inspo/saved (no data, just navigation).

### Look detail
**Route:** `/[locale]/inspo/[id]`  ·  **Code:** `app/[locale]/inspo/[id]/page.tsx:133 (server) + components-legacy/discovery/DetailPage.tsx:85 (client)`

_Full-bleed dark hero look page; shows the look large, its AI-derived attributes, and THE booking bridge (real salons that offer this look's category)._

**Shows:**
- 80vh hero: cover image, or inline TikTok player on tap (never opens TikTok) — DetailPage.tsx:224-277
- Frosted back button (explicitly → /inspo, never router.back) + save heart — DetailPage.tsx:246-275
- Creator pill (@handle links to author_url) + post date — DetailPage.tsx:310-321
- Title (style_name), tappable tags, clamped description with Mehr lesen — DetailPage.tsx:324-356
- Details dropdown: Upkeep / face shapes / products / cut guide — DetailPage.tsx:359-384
- 'Diesen Look buchen' — up to 3 real salons with rating(+count)/priceFrom/Buchen — DetailPage.tsx:387-424
- 'Ähnliche Looks' 2-col masonry (client-fetched) — DetailPage.tsx:427-453

**You can:**
- Play the TikTok inline (inline/sheet/fullscreen variants via ?play=) — DetailPage.tsx:225-303
- Save/unsave the look (heart → POST /api/discovery/save; logged-out → /auth/login) — DetailPage.tsx:110-129
- Tap a tag → /inspo?search=<tag> (re-enters feed pre-searched) — DetailPage.tsx:332-338
- Tap a 'Book this look' salon → booking wizard pre-loaded (see handoff) — DetailPage.tsx:390-413
- Tap 'Alle N Salons' → /[locale]/[categoryRoute] category search — DetailPage.tsx:415-421
- Tap a similar look → /inspo/[id]; 'See all' → /inspo?search=<style_name> — DetailPage.tsx:432,444-446

**Data wiring:**
- Item: getItem() server-fetches discovery_items WHERE id, status=published, is_active (page.tsx:23-33). REAL.
- On-demand AI enrichment: ensureAIData runs in next/server after() (non-blocking) calling Gemini (analyzeDiscoveryImage/TikTok), IP-rate-limited, persists description/tags/products/cut_guide/price back to discovery_items (page.tsx:36-102,142-144). Descriptions are AI-GENERATED but real+persisted, not fabricated per-render.
- View tracking: admin-client insert into discovery_interactions action='view' (page.tsx:155-158) — note comment: the old increment_discovery_view RPC was a phantom/silent no-op, now fixed via trigger. Client also POSTs /api/discovery/interactions type=view (DetailPage.tsx:145-151).
- Book-this-look salons: server query salons + services!inner filtered by services.category = DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] (page.tsx:166-202). REAL salons/services; rating=average_rating, reviewCount=review_count, priceFrom=min service price, serviceId=style-word-matched service or cheapest. Cross-taxonomy map prevents the silent 0-salon JOIN bug (comment page.tsx:162-165).
- Similar: GET /api/discovery/similar?item_id= (DetailPage.tsx:136). REAL.
- salon_script (AI cut instruction) is NOT shown as a card — it is passed into the booking note (DetailPage.tsx:186-196).

**-> Handoff:** THE key handoff: bookHref(slug, serviceId) builds /${locale}/salon/${slug}/booking?service=<serviceId>&note=<salon_script> (DetailPage.tsx:190-196). The pre-matched serviceId AND the AI cut-script carry into the booking wizard. Also: tag/see-all → /inspo?search=; similar → /inspo/[id]; back → /inspo; save → /auth/login when logged out.

### Saved (Gespeichert)
**Route:** `/[locale]/inspo/saved`  ·  **Code:** `app/[locale]/inspo/saved/page.tsx:15`

_Flat masonry grid of every look the user hearted. This IS the whole saved feature now (named-collections layer removed 2026-06-23, comment saved/page.tsx:12-14)._

**Shows:**
- Back button → /inspo + 'Gespeichert' title — saved/page.tsx:63-72
- MasonryGrid of saved ItemCard/VideoCard (all hearts filled) — saved/page.tsx:81-106
- Empty-state copy prompting to heart a look — saved/page.tsx:76-79

**You can:**
- Tap a look → /inspo/[id] (or /salon/[slug] for salon items) — saved/page.tsx:36-42
- Tap the filled heart → unsave (optimistic remove, revert on failure) — saved/page.tsx:45-59

**Data wiring:**
- GET /api/discovery/saves?limit=60 (saved/page.tsx:24) → reads discovery_saves for the user, then hydrates discovery_items via DISCOVERY_ITEM_PUBLIC_COLS allowlist (saves/route.ts:22-45). REAL, auth-required (returns [] for guests).
- Unsave: POST /api/discovery/save toggle (saved/page.tsx:49-54). REAL.

**-> Handoff:** /inspo/[id] (look id in path) or /salon/[slug]. Back → /inspo. NOTE: this page has NO link to /inspo/saved/[id] (the collection-detail route) — that route is orphaned.

### Board detail (editorial collection)
**Route:** `/[locale]/inspo/board/[id]`  ·  **Code:** `app/[locale]/inspo/board/[id]/page.tsx:15`

_An editorial/curated board: hero cover + localized name + description + the board's looks in feed masonry._

**Shows:**
- Hero cover (board.cover_images[0]) with gradient + 'Kollektion' eyebrow + localized name — board/[id]/page.tsx:62-80
- Description + MasonryGrid of the board's looks — board/[id]/page.tsx:82-107

**You can:**
- Back (router.back) — board/[id]/page.tsx:66-72
- Tap a look → /inspo/[id] (or /salon/[slug]) — board/[id]/page.tsx:52-58

**Data wiring:**
- GET /api/discovery/boards/[id] (board/[id]/page.tsx:33) → discovery_boards row + curated discovery_board_pins ordered by sort_order, falling back to search_discovery FTS on the board's style keyword when no pins (boards/[id]/route.ts:26-66). REAL; reads tables directly (not /feed) so opening a board logs no search.
- Auth check: GET /api/profile (board/[id]/page.tsx:30).

**-> Handoff:** /inspo/[id] or /salon/[slug]. ORPHANED: no current screen links into /inspo/board/[id] — the feed no longer renders a boards row, so this route is only reachable by direct URL.

### Saved-collection detail
**Route:** `/[locale]/inspo/saved/[id]`  ·  **Code:** `app/[locale]/inspo/saved/[id]/page.tsx:13`

_A single user-owned saved collection's looks in feed masonry (Phase-2 collections feature)._

**Shows:**
- Back → /inspo/saved + collection name — saved/[id]/page.tsx:52-61
- MasonryGrid of the collection's looks; empty/error states — saved/[id]/page.tsx:63-84

**You can:**
- Back → /inspo/saved — saved/[id]/page.tsx:54
- Tap a look → /inspo/[id] (or /salon/[slug]) — saved/[id]/page.tsx:42-48

**Data wiring:**
- GET /api/discovery/collections/[id] (saved/[id]/page.tsx:28) → owner-scoped discovery_collections + discovery_saves WHERE collection_id, hydrated from discovery_items (collections/[id]/route.ts:22-59). REAL, auth-required; also supports PATCH rename / DELETE.

**-> Handoff:** /inspo/[id] or /salon/[slug]. Back → /inspo/saved. ORPHANED: the current flat /inspo/saved page never links to a collection id, since collection_id is never assigned by the plain heart-save toggle — so this route + its API are stranded behind the removed collections UI.

### Nails (redirect)
**Route:** `/[locale]/inspo/nails`  ·  **Code:** `app/[locale]/inspo/nails/page.tsx:7`

_Legacy nail-discovery entry; now just a permanent redirect into the unified feed scoped to the nails category._

**Shows:**
- Nothing — server permanentRedirect

**You can:**
- N/A — immediately redirects

**Data wiring:**
- permanentRedirect(`/${locale}/inspo?category=nails`) (nails/page.tsx:9). No data.

**-> Handoff:** /inspo?category=nails (the feed pre-scoped to nails via the ?category deep-link seed at page.tsx:60-62).

**Connections in this flow:**
- Feed → Look detail: tap any non-salon card → router.push /inspo/[id]; only the look id travels in the URL path (page.tsx:285-292). The detail page re-fetches the full discovery_items row server-side.
- Feed → Salon page: tap a salon-sourced card (item.source/content_type === 'salon') → /salon/[slug] using item.salon_slug (page.tsx:287-290).
- Feed → Login: heart while logged out → handleAuthRequired → /auth/login (page.tsx:328).
- Feed → Saved: header heart button → /inspo/saved (navigation only) (page.tsx:414).
- Feed → Feed (searched): quick-chip tag routed into committed search state; a tag deep-link ?search= also seeds the feed (page.tsx:65-66, 530-552).
- Look detail → Booking wizard (THE bridge): 'Diesen Look buchen' salon row → /${locale}/salon/${slug}/booking?service=<serviceId>&note=<salon_script> (DetailPage.tsx:190-196). The booking page destructures service & note (booking/page.tsx:30), validates serviceParam against the real services list → initialService (booking/page.tsx:69-78), and passes both into BookingProvider as initialService + initialNote (booking/page.tsx:205). So the pre-matched service is preselected AND the AI cut-script pre-fills the customer note.
- Look detail → Category search: 'Alle N Salons' → /${locale}/${categoryRoute} where categoryRoute = DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] (DetailPage.tsx:201, page.tsx:166).
- Look detail → Feed (searched): tags and 'See all' similar → /inspo?search=<tag|style_name> (DetailPage.tsx:334, 202).
- Look detail → Look detail: 'Ähnliche Looks' cards → /inspo/[id] (DetailPage.tsx:444-446); similar list from /api/discovery/similar.
- Look detail → Feed: back button ALWAYS → /inspo (explicitly not router.back, to avoid the detail→similar→detail history loop) (DetailPage.tsx:252).
- Saved → Look detail / Salon: tap → /inspo/[id] or /salon/[slug] (saved/page.tsx:36-42); filled heart → unsave via POST /api/discovery/save.
- Nails → Feed: permanentRedirect → /inspo?category=nails (nails/page.tsx:9).
- Board detail / Saved-collection detail → Look detail: tap → /inspo/[id]; but NEITHER route is linked from any live screen (orphaned).

**Notable features:**
- DNA/for-you personalization: logged-in pure-browse ranks the whole feed by user_style_affinity via discovery_feed_for_you RPC; cold users score 0 (identical to neutral order) (feed/route.ts:118-142).
- Soft gender bias (not hard filter): profiles.disc_gender floats the viewer's gender + unisex to the top of discovery_feed_v2 (feed/route.ts:149-153).
- Keyset-cursor infinite scroll: discovery_feed_v2 returns an opaque base64url cursor so a mid-scroll cron insert can't shift the OFFSET and repeat the last card; client de-dupes by id as belt-and-suspenders (feed/route.ts:14-35,200-206; page.tsx:235-241).
- Relevance-ranked search: search_discovery FTS RPC ranks by ts_rank over name/author/style/tags/description, replacing a flat ILIKE (feed/route.ts:74-116).
- Data-driven category pills + chips: covers/counts/chip terms all pulled from real content, empty categories show neutral tiles not fake photos (page.tsx:167-183, 473-477).
- On-demand AI enrichment via Gemini, deferred with next/server after() so the detail page renders instantly and the description fills for the next visit; IP-rate-limited to bound the paid call from a public page (detail page.tsx:36-102,138-144).
- In-web TikTok playback: cover image + inline TikTokPlayer with inline/sheet/fullscreen variants; never opens TikTok; thumbnails proxied+persisted via /api/discovery/thumb (DetailPage.tsx:219-303; ItemCard.tsx:45-47).
- No-fabrication discipline: CardSignals renders rating/price/availability ONLY when backend-fed, otherwise nothing — explicit 'design for the backend later' contract (CardSignals.tsx:22-53).
- Style-word service pre-matching: book-this-look picks the salon service whose name matches the look's style words, else the cheapest in-category, so booking lands on a real service not an empty picker (detail page.tsx:181-201).
- Cross-taxonomy mapping (DISCOVERY_TO_MARKETPLACE_CATEGORY) prevents the known silent-no-op 0-salon JOIN between discovery categories and marketplace service categories (detail page.tsx:162-166).
- Recent searches persisted to localStorage so history works logged-out; DB search-event logging only on page-1 (page.tsx:334-352; feed/route.ts:103-110).

**Gaps / dead ends / fabrications:**
- ⚠️ ORPHANED ROUTES: /inspo/board/[id] and /inspo/saved/[id] both have live pages + working APIs (boards/[id], collections/[id]) but NOTHING in the current UI links to them. The named-collections/boards surface was removed from the feed on 2026-06-23 (saved/page.tsx:12-14), and the plain heart-save toggle never assigns a collection_id, so no collection ever gets populated or linked. These are stranded behind removed navigation.
- ⚠️ SESSION-ONLY SAVED STATE: the feed's savedIds Set starts empty on every load and is never hydrated from /api/discovery/saves, so a look the user saved previously shows an EMPTY heart on the feed until they interact again (page.tsx:110, 296-326). Not fabrication, but a real state-sync gap between feed and the saved page.
- ⚠️ DORMANT BOARDS SURFACE: the feed page comment claims 'Alle = the blended For You default (boards + personalized + all looks)' (page.tsx:447-449) but the actual render contains no boards row / ForYouSection — the saves route still carries a 'ForYouSection peek' default of 3 (saves/route.ts:18) for a component the feed no longer mounts. Stale comment vs. shipped UI.
- ⚠️ AI-DESCRIPTION LATENCY: a freshly imported look with no description_en shows title/tags/image immediately but the Details/description only fill on the NEXT visit (after the after() Gemini call persists), so a first-open detail page can look sparse (detail page.tsx:138-144). Expected by design, but a visible content gap.
- ⚠️ No fabricated data found in the render path: booking signals, ratings, prices, and availability are all backend-gated (CardSignals.tsx:22-29; DetailPage.tsx:401-409). The only 'invented' content is AI-generated look descriptions, which are persisted to discovery_items, not per-render fakes.
- ⚠️ Historical silent-no-op (now fixed, noted in comments): increment_discovery_view RPC was a phantom (never existed) and discovery_interactions inserts hit an RLS wall / phantom column 'interaction_type'; both are patched to use the admin client + correct 'action' column (detail page.tsx:151-158; interactions/route.ts:30-38).

---

<a name="connection-graph"></a>
## The connection graph (all handoffs)

Every documented edge, screen -> screen with what triggers it and what data carries over.

**Discovery & Search**
- Homepage Hero pill/CTA -> SearchOverlay: tapping a resting row calls openOverlay(seg); passes initialService, initialCity, initialFocus (the tapped field) as props (SearchBar.tsx:152-163, 626-635). No URL change (portal).
- Homepage category tile -> category landing: Link to /[locale]/{slug} (e.g. /de/coiffeur); Karte -> /[locale]/search?view=map; Walk-in -> /[locale]/barbershop?walk_in=true (MobileCategoriesRow.tsx:88,46-47).
- SearchOverlay -> Search results: router.push(/[locale]/search?<params>) with params built by buildParams -> q (>=2), category|service, city, date, period (SearchOverlay.tsx:338-366, 363-366). Recents persist query+city only (never date).
- SearchOverlay -> Salon PDP (shortcut): tapping a suggested salon / Beliebte Store pushes /[locale]/salon/{slug} directly, bypassing results (openSalon 413-416).
- Search results <-> URL: every filter/sort is a URL query param; changing one does router.replace/push then the buildUrl effect refetches /api/salons (SearchTemplate.tsx:888-916). Filters and the typed query all co-combine server-side (single /api/salons endpoint).
- Search results -> /api/salons: GET with category, city, date, period, sort, min/max_price, min_rating, gender, amenity booleans, walk_in, deals, open_now, instant_bookable, with_slots=1, q, page, limit, plus lat/lng (distance) and north/south/east/west (map 'search this area'). (buildUrl 825-885 -> route.ts GET 34-625).
- Search results -> Salon PDP: whole-card Link to /[locale]/salon/{slug}; only the slug transfers, no service/slot/date/query (SalonResultCard.tsx:203, 628). Walk-in cards add ?walkin=1 (390).
- /[locale]/[city]/[category] page -> SearchTemplate: server-validates city (active cities DB) + category (fixed list), injects serviceFilter+cityFilter props and a breadcrumb/hero (page.tsx:121-158); SearchTemplate then behaves like /search but scoped.

**Salon page (PDP) — /de/salon/[slug] — and its handoff into the booking wizard**
- PDP ServiceRow 'Buchen' → /salon/[slug]/booking?service=<serviceId> — carries ONE service id; booking page validates it and seeds initialService (SalonServices.tsx:214 → booking/page.tsx:98-115)
- PDP 'Alle ansehen' → SalonServicesSheet multi-select → 'Weiter' → /salon/[slug]/booking?services=<id1,id2,...> — carries a CSV of selected service ids (client sums price+duration only for the sheet's cart display; the ids are the real handoff); booking page validates each and seeds initialServices (SalonServicesSheet.tsx:167-169 → booking/page.tsx:123-137)
- PDP desktop sidebar 'Jetzt buchen' → /salon/[slug]/booking — NO params, wizard starts empty at step 1 (SalonSidebar.tsx:137)
- PDP mobile 'Termin buchen' bar → /salon/[slug]/booking — NO params (SalonMobileBookBar.tsx:33)
- PDP Team 'Alle ansehen' → /salon/[slug]/booking — NO params (SalonTeam.tsx:120)
- PDP stylist profile sheet 'Buchen' → /salon/[slug]/booking?staff=<staffId> — carries stylist id; booking page validates + drops it if the stylist doesn't offer a co-selected service (StaffProfilePage.tsx:186 → booking/page.tsx:170-177)
- PDP BundleCard → /salon/[slug]/booking?services=<serviceCsv>&bundle=<bundleId> — carries the bundle's constituent service ids AND the bundle id; server later recomputes the discounted price from live services (SalonBundles.tsx:135 → booking/page.tsx:184-194)
- PDP Reviews 'Alle ansehen' → /salon/[slug]/reviews — separate full reviews page, not booking (SalonReviews.tsx:147)
- PDP retail products 'checkout' → POST /api/salon/retail/purchase → Stripe clientSecret, inline pay — SEPARATE from the booking wizard (SalonProducts.tsx:148-153)
- PDP walk-in toggle (barbershop + walkin_enabled, or ?walkin=1 deep-link) → SalonWalkInPanel pay-gated queue join — separate flow, hides service/team browsing (SalonDetailV3.tsx:88-90,255-260)
- PDP sidebar 'Route' → Google Maps directions (external) (SalonSidebar.tsx:89)
- Booking wizard PayConfirmStep → POST /api/bookings (end of this flow's scope) (booking/page.tsx comments 179-183)

**Booking flow**
- page.tsx (RSC) -> BookingProvider: passes salonId + validated deep-link seeds (initialStaffId/Service/Services/Start/Note/BundleId); trigger = server render; data = validated salon/service/staff ids from URL params (page.tsx:204-205)
- BookingProvider -> BookingWizard: children get the shared formData context + the fetched services/staff/enhancement tables as props (page.tsx:212-220)
- ServicesStaffStep -> StaffStep OR DateTimeStep: trigger = Weiter; carries formData.services + client-summed totalPrice/totalDuration in context; nextStep = 'staff' if >1 staff else 'datetime' (ServicesStaffStep.tsx:172, BookingWizard.tsx:160)
- StaffStep -> DateTimeStep: trigger = Weiter; carries formData.selectedStaffId in context (StaffStep.tsx:192)
- DateTimeStep -> HairStep OR PayConfirmStep: trigger = Weiter; carries formData.selectedDate + selectedTime; nextStep = 'hair' if a hair-category service is in the cart else 'confirm' (DateTimeStep.tsx:133, BookingWizard.tsx:164)
- DateTimeStep -> /api/availability/time-slots: sends salon_id, date, staff_id, service_ids AND totalDuration so slot length matches the multi-service cart (DateTimeStep.tsx:98-106)
- HairStep -> PayConfirmStep: trigger = Weiter/Überspringen; carries formData.customerNote; fire-and-forget profile PATCH does NOT block (HairStep.tsx:116, 126-145)
- PayConfirmStep -> POST /api/bookings: sends full formData (first service_id + extra_service_ids, staff, TZ-safe starts_at, payment_method, total_price, note, guest fields); server RE-RESOLVES slot + RE-PRICES from DB (PayConfirmStep.tsx:229-258 -> route.ts POST)
- PayConfirmStep (online) -> POST /api/stripe/booking-pay-intent -> BookingPaymentForm: booking_id -> client_secret -> Stripe Elements card form (PayConfirmStep.tsx:293-306)
- PayConfirmStep -> /[locale]/confirmation: trigger = in-person book success OR Stripe payment success; carries booking_id (+ access_token & ref for guests) in the URL; resetForm() clears the wizard so back cannot re-book (PayConfirmStep.tsx:286-287, 638)

**Checkout & Payment**
- Booking wizard steps (services-staff -> staff -> datetime -> [hair] -> pay-confirm) carry data forward as client-side BookingContext formData; NO query-string handoff between steps (BookingWizard.tsx:45, lib/booking-context)
- PayConfirmStep (select) -> POST /api/bookings: sends salon_id, service_id + extra_service_ids, bundle_id, staff_member_id, starts_at, payment_method, promo_code, gift_card_code, total_price, customer_note, guest_name/phone/email; returns booking id (+ access_token, reference_code for guests) (PayConfirmStep.tsx:229-273)
- In-person: PayConfirmStep -> router.replace /{locale}/confirmation?booking_id=<id> (guests append access_token+ref) (PayConfirmStep.tsx:164-178,287)
- Online: PayConfirmStep -> POST /api/stripe/booking-pay-intent {booking_id} -> returns client_secret; step switches to phase 'pay' and hands client_secret + confirmationPath to BookingPaymentForm (PayConfirmStep.tsx:293-306,630-637)
- BookingPaymentForm -> stripe.confirmPayment(client_secret) -> on succeeded/processing calls onSucceeded -> router.replace to the SAME /confirmation path (also Stripe's return_url for 3DS redirect) (BookingPaymentForm.tsx:121-138, PayConfirmStep.tsx:637-638)
- Stripe -> POST /api/stripe/webhook payment_intent.succeeded (type:'booking') flips bookings.status='confirmed', payment_status='paid', frees/settles slot, completes referral, increments promo use — the SOLE source of truth for paid state (webhook/route.ts:121-205)
- payment_intent.payment_failed -> releases the slot / resets payment_status; abandon-sweep cron cancels pending+unpaid bookings >30min and frees held slots, never touching a PI-succeeded booking (webhook/route.ts:461-493, cron/abandon-sweep/route.ts:24-38)
- /confirmation reads the bookings row (RLS cookie for logged-in/owner, token-verified service-role for guests) to render the receipt (confirmation/page.tsx:57-97)
- review-prompt cron email -> /{locale}/tip/{bookingId} -> GET /api/bookings/{id} + POST /api/tips (100% to salon Connect, no fee) (cron/review-prompt/route.ts:314, tip/[bookingId]/page.tsx:24-71)
- DEAD: /checkout -> /api/stripe/create-payment-intent (deleted on local main 2026-09-08) -> return_url /checkout/success (nonexistent route); no producer builds the booking_intent param (checkout/page.tsx:72,141-166)

**Confirmation & post-booking**
- Pay step -> Confirmation: components-legacy/booking/PayConfirmStep.tsx buildConfirmationPath (162-178) builds /confirmation?booking_id=…; for a GUEST it appends &access_token=… (+ &ref=reference_code) from the /api/bookings POST response (267-273); router.replace(`/${locale}${path}`) after resetForm() so browser-back can't re-book (287). The same URL is reused as Stripe's 3DS return_url so inline and redirect confirms land identically (114-117).
- POST /api/bookings response -> Confirmation URL: the create handler returns { access_token, reference_code } for a guest (app/api/bookings/route.ts:657-664); those become the confirmation query params. access_token is issued once, never persisted raw (only its SHA-256 hash is stored, route.ts:454-455).
- Confirmation -> Guest Lookup: BookingConfirmation manageHref (BookingConfirmation.tsx:168) = the accessLink (?code&t) for a guest, else /booking/lookup. Data carried: reference_code + raw access_token.
- Guest Lookup token exchange -> report chain: GET /api/bookings/guest-lookup verifies the token and sets the httpOnly solen_guest_access cookie (guest-lookup/route.ts:63-65); that cookie (not the confirmation page's token read) is what later authorizes report/refund/escalate/dispute for a guest. OpenedView then links to /bookings/[bookingId]/report with the booking_id from the exchange (lookup/page.tsx:98,628-632).
- Lookup/Resend form -> email: POST /api/bookings/resend-access rotates the token and emails /booking/lookup?code=REF&t=TOKEN (resend-access/route.ts:107), which loops back into the token-exchange path.
- Report entry -> Refund status: POST /api/bookings/[id]/report inserts a booking_disputes row; the client routes to caseHref=/bookings/[id]/refund on success or on 409 (ReportRefundEntry.tsx:212-215). Carry-over = the dispute row, re-fetched by bookingId.
- Refund status -> escalate: POST /api/bookings/[id]/escalate flips salon_rejected -> escalated on the same dispute (RefundCaseView.tsx:144; escalate/route.ts).
- Upcharge -> charge: PATCH /api/bookings/[id]/dispute approve triggers chargeUpcharge off-session on the saved card (UpchargeApproveView.tsx:235; dispute/route.ts).
- Confirmation email: on booking create, lib/email bookingConfirmation is sent to the customer (app/api/bookings/route.ts:580-594) — but it carries only service/salon/date/time/total, NO booking link or guest access link (see gaps).

**Walk-in & Queue (join → pay → number → track → tip)**
- EXTERNAL (in-shop QR / link) → /walk-in-pay?salon_id&service_id[&staff_id]: carries salon + service (+ optional preferred barber) as query params; page synthesizes the booking via GET /api/walkin/salon-info and fires pay-intent in parallel (page.tsx:110-155, 188-196)
- EXTERNAL (legacy salon-SMS) → /walk-in-pay?token=<HMAC>: carries a booking id inside a signed token; verified via GET /api/bookings/walk-in-verify which returns full booking + (if already paid) the existing ticket/tracking_token (walk-in-verify/route.ts). NOTE: no current code PRODUCES this token (see gaps)
- /walk-in-pay → POST /api/walkin/pay-intent: carries {salon_id, service_id, booking_id?|preferred_barber_id?}; returns client_secret + server-trusted amount (never the client's price)
- Stripe authorize (WalkInPaymentForm.onPaid) → /walk-in-pay POST /api/walkin/confirm: carries {token?, payment_intent_id}; returns {ticket_number, queue_id, tracking_token, payment_method, queue_ahead, wait_minutes} — this is the moment the queue row is created (barber_walkin_queue insert via createWalkinTicket)
- /walk-in-pay → /queue/[token]: router.replace carries ONLY the tracking_token in the URL (page.tsx:175); all ticket/queue/salon/barber data is re-fetched server-side by the tracker from that token
- /queue/[token] ↔ GET /api/walkin/queue/status?token=: adaptive poll carrying the token; returns live position/ETA/aheadCount/status + recipient/service/salon context
- /queue/[token] done → POST /api/walkin/review: carries {token, rating, comment?}; writes reviews row + recomputes salon & staff ratings
- /queue/[token] done (>=3★) or /walk-in-tip/[token] → POST /api/walkin/tip: carries {token, amount}; returns clientSecret, Stripe tip 100% to salon
- /queue/[token] cancel or /walk-in-pay cancel → DELETE /api/walkin/queue/[id]?token=: carries queue_id + tracking_token; refunds (captured) or releases (uncaptured) the hold and re-sequences the queue
- OPERATOR side-channel (not customer UI): PATCH /api/walkin/queue/[id] (salon owner/staff) flips status waiting→in_chair→completed/no_show, which is what the customer's status poll reflects; completed CAPTURES the held payment, no_show partial-captures the fee, cancelled refunds
- STAFF cash entry: POST /api/bookings/walk-in → createCashWalkinTicket drops an in-person walk-in into the SAME barber_walkin_queue (no Stripe), sharing the ticket-code sequence + position logic with the paid path
- Homepage WalkInBand → /[locale]/salon/[slug] (PDP) or /[locale]/barbershop: the discovery rail links ONLY to the PDP/list, NOT directly into /walk-in-pay (WalkInBand.tsx:118,155)

**Reviews & ratings**
- Completed booking → cron (/api/cron/review-prompt) → Resend email + in-app review_prompt notification. Data carried: booking_id, salon_slug, salon_name, staff_name (notification.data); email carries salon slug + locale in the URL.
- In-app notification → /[locale]/salon/[slug]/reviews (NotificationsClient.tsx:129-131). Only salon_slug carries in the URL; the reviews page re-derives the unreviewed booking server-side.
- Email CTA → /[locale]/salon/[slug]#bewertungen (PDP reviews anchor).
- PDP inline SalonReviews 'Alle ansehen' → /[locale]/salon/[slug]/reviews (SalonReviews.tsx:147). Carries salonSlug+locale only.
- Reviews sub-page derives unreviewedBookingId (+ staffName, staffMemberId, staffPhotoUrl) server-side and passes them into the 'Bewertung schreiben' button → ReviewForm (page.tsx:94-137 → SalonReviews.tsx:462-476).
- ReviewForm submit → POST /api/reviews {booking_id, rating, comment, staff_member_id, attributes} → returns {data:{id}} → if photos exist, POST /api/reviews/[id]/photos (FormData, review id in path) (ReviewForm.tsx:160-191).
- POST /api/reviews → recomputes salons.average_rating + review_count, deletes the review_prompt notification, fires POST /api/notify/review-posted {review_id} (owner email) (route.ts:92-146).
- 'Mehr laden' on the reviews page → GET /api/reviews/salon/[salon_id]?page=N&sort= → appended items (no photos on paged rows) (SalonReviews.tsx:173-209).
- Owner reply → POST /api/reviews/reply {review_id, reply_text, is_public} → review_replies row → renders back as the public reply block + 'Salon hat geantwortet' chip on the reviews page; fires /api/notify/review-replied to the customer.
- Walk-in: queue/[token] done screen → POST /api/walkin/review {token, rating, comment} → reviews row + salon AND barber aggregate recompute → surfaces in the same PDP/reviews/SalonTeam displays.
- Marketplace reviews feed (/[locale]/reviews, MarketplaceReviewsList.tsx:78 and homepage Reviews.tsx:100) → each item links to /[locale]/salon/[slug]/reviews.

**Profile & account**
- /de/account → /de/profile: unconditional server redirect, carries only locale (account/page.tsx:5)
- header NotificationBell → /de/notifications: unread badge count fetched client-side; click navigates, no data passed (NotificationBell.tsx:39)
- /de/profile HERO card → /de/profile/bookings: click; no state passed, BookingsList refetches by user.id (profile/page.tsx:159)
- /de/profile Termine row → /de/profile/bookings: link (profile/page.tsx:201)
- /de/profile Favoriten row → /de/profile/favorites: link (profile/page.tsx:202)
- /de/profile Treueprogramm row → /de/rewards (Solen-wide rank), NOT /profile/stamps (profile/page.tsx:204)
- /de/profile Haarprofil/Looks/Formulare/Referral/Einstellungen rows → respective sub-pages, locale only (profile/page.tsx:211-216)
- /de/profile Hilfe row → /de/help (profile/page.tsx:217)
- /de/profile sign-out form → POST /api/auth/logout → 302 redirect to /{locale} home (profile/page.tsx:221; logout route)
- MobileMenu → /de/profile/stamps: the ONLY entry to the stamps page (MobileMenu.tsx:283)
- /de/profile/bookings ← notification row with data.booking_id: notification tap navigates here (NotificationsClient.tsx:129-134)
- /de/salon/[slug]/reviews ← notification row of type review_prompt with data.salon_slug (NotificationsClient.tsx:130-131)
- /de/profile/favorites heart → DELETE /api/profile/favorites?salon_id + Undo POST /api/profile/favorites (FavoritesList.tsx:52-70)
- /de/profile/settings save → PATCH /api/profile (profile fields + notification_email/sms + customer_preferences); email/password → supabase.auth.updateUser; delete → POST /api/profile/request-deletion → window.location /{locale} home (SettingsForm.tsx)
- /de/profile/haarprofil save → PATCH /api/profile (hair_type/length/thickness) (HaarprofilForm.tsx:57)
- /de/profile/referral share URL {origin}/{locale}?ref=<referral_code>: outbound handoff carrying the code to a new visitor (referral/page.tsx:28-30)
- every profile sub-page logged-out → /auth/login?redirect=<self-path>: post-login returns to the originating page

**Value store (loyalty / vouchers / gift cards / credits / referrals) — how value is earned, stored, and spent across Solen's customer surfaces**
- profile/referral --(share link, code in URL ?ref= or /referral/<code>)--> referral/[code] landing
- referral/[code] --(writes code to localStorage 'solen_referral_code')--> home /[locale]  [BUT the code is never read back — carry-over is broken]
- BookingWizard --(POST /api/bookings, referral_code param exists at route.ts:147,485 but no client sends it)--> bookings row
- bookings CONFIRMED (create path route.ts:644-647 | confirm route [id]/confirm:59-60 | Stripe webhook:181-183) --(booking.referral_code + user.id)--> completeReferralForFirstBooking()
- completeReferralForFirstBooking (lib/referral/complete-referral.ts) --(CAS on referrals row, then 2x INSERT)--> user_credits (CHF 10 each side, source='referral', 6-mo expiry)
- PayConfirmStep --(POST /api/stripe/booking-pay-intent {booking_id})--> booking-pay-intent
- booking-pay-intent --(getAvailableCreditRappen -> redeem_user_credits RPC)--> user_credits balance decremented, Stripe amount + application_fee reduced by same Rappen
- booking-pay-intent --(resolveMemberDiscount reads current_user_tier on-read -> reserve_member_discount RPC)--> tier_discount_amount on booking, application_fee waived
- loyalty/stamp?token --(POST /api/loyalty/stamp)--> loyalty_stamps row --> surfaces in profile/stamps
- profile hub /[locale]/profile --(Loyalty row href)--> /rewards (Solen Status), NOT /profile/stamps (marked legacy at profile/page.tsx:203-204)
- [HIDDEN] vouchers/create -> vouchers table; voucher spend branch booking-pay-intent:624-663 accepts voucher_code but has no live caller

**Inspo / discovery feed**
- Feed → Look detail: tap any non-salon card → router.push /inspo/[id]; only the look id travels in the URL path (page.tsx:285-292). The detail page re-fetches the full discovery_items row server-side.
- Feed → Salon page: tap a salon-sourced card (item.source/content_type === 'salon') → /salon/[slug] using item.salon_slug (page.tsx:287-290).
- Feed → Login: heart while logged out → handleAuthRequired → /auth/login (page.tsx:328).
- Feed → Saved: header heart button → /inspo/saved (navigation only) (page.tsx:414).
- Feed → Feed (searched): quick-chip tag routed into committed search state; a tag deep-link ?search= also seeds the feed (page.tsx:65-66, 530-552).
- Look detail → Booking wizard (THE bridge): 'Diesen Look buchen' salon row → /${locale}/salon/${slug}/booking?service=<serviceId>&note=<salon_script> (DetailPage.tsx:190-196). The booking page destructures service & note (booking/page.tsx:30), validates serviceParam against the real services list → initialService (booking/page.tsx:69-78), and passes both into BookingProvider as initialService + initialNote (booking/page.tsx:205). So the pre-matched service is preselected AND the AI cut-script pre-fills the customer note.
- Look detail → Category search: 'Alle N Salons' → /${locale}/${categoryRoute} where categoryRoute = DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] (DetailPage.tsx:201, page.tsx:166).
- Look detail → Feed (searched): tags and 'See all' similar → /inspo?search=<tag|style_name> (DetailPage.tsx:334, 202).
- Look detail → Look detail: 'Ähnliche Looks' cards → /inspo/[id] (DetailPage.tsx:444-446); similar list from /api/discovery/similar.
- Look detail → Feed: back button ALWAYS → /inspo (explicitly not router.back, to avoid the detail→similar→detail history loop) (DetailPage.tsx:252).
- Saved → Look detail / Salon: tap → /inspo/[id] or /salon/[slug] (saved/page.tsx:36-42); filled heart → unsave via POST /api/discovery/save.
- Nails → Feed: permanentRedirect → /inspo?category=nails (nails/page.tsx:9).
- Board detail / Saved-collection detail → Look detail: tap → /inspo/[id]; but NEITHER route is linked from any live screen (orphaned).

---

<a name="gaps"></a>
## Gaps, dead ends & fabrications (all flows)

The single most actionable list here: orphaned routes, dead links, dormant/unwired features, and
fabricated/misrepresented data found while mapping. Each is a real thing to fix, hide, or wire.

### Discovery & Search
1. ⚠️ DEAD BOOKING DEEP-LINK: SalonResultCard computes featuredName/featuredDur/featuredSlots/hasMoreSlots/allServicesLabel (SalonResultCard.tsx:223-229) and its own doc says 'each pill links into booking with that service preselected' (221), but these variables are never rendered in ANY card variant. The card only shows a plain-text nextSlot label. Net effect: the search->booking handoff carries only the salon slug; no service/slot/date preselection reaches the PDP or booking flow. (Not fabricated data — just an unwired, dormant feature.)
2. ⚠️ DORMANT DUPLICATE SEARCH UI: SearchBar.tsx still contains a full in-place morphing 'island' composer (segment tabs + SERVICES/CITIES/PERIODS chips + handleSubmit that pushes /search, lines 224-621), but the resting rows now all call openOverlay() instead, so the island and its handleSubmit are unreachable (kept intentionally dormant per the Path C comment at 139-144). Two search implementations live in one file; only SearchOverlay is reachable.
3. ⚠️ STALE DOC (not a functional bug): FilterSheet.tsx:33 header comment claims 'Preis (min_price/max_price read but not applied)'. In reality the price filter IS wired end-to-end now — SearchTemplate.buildUrl forwards min_price/max_price (SearchTemplate.tsx:845-846, 'V3-D384 fix') and /api/salons applies buildPriceTask (route.ts:276-282, 371-376). The comment is outdated.
4. ⚠️ HARDCODED CURATED ID LISTS (benign, flagged for transparency): FEATURED_SALONS (searchFeatured.ts), FORYOU_SALONS, NEARBY_SALON_IDS are hand-maintained id lists; the rendered content (rating/price/address/name) is live from Supabase, so no fabricated values are shown, but which salons appear in those homepage rows is editorially hardcoded, not algorithmic.
5. ⚠️ BOUNDARY DATA LOSS: at the results->PDP boundary the user's chosen date/period/service context is dropped (only the slug transfers), so a customer who filtered by 'tomorrow morning' must re-select date/time on the PDP.

### Salon page (PDP) — /de/salon/[slug] — and its handoff into the booking wizard
6. ⚠️ Gift card / SalonBuy purchase is fully HIDDEN (hasGiftCards=false + commented JSX) in favor of a Solen-wide loyalty card — dead-but-preserved code paths, intentional (SalonSidebar.tsx:101,209; SalonDetailV3.tsx:300-305)
7. ⚠️ SalonLoyalty section is removed from render because it showed identical static copy on every salon with no data behind it — a former fabricated/static surface, correctly deleted rather than faked (SalonDetailV3.tsx:322-323)
8. ⚠️ Portfolio + Loyalty no longer have sticky-nav TAB affordances (Fresha-parity 5-tab reduction) even though the Portfolio SECTION still renders below — minor nav/section mismatch, intentional (SalonDetailV3.tsx:133-136)
9. ⚠️ Retail product purchase and walk-in queue are genuinely separate flows sharing the PDP surface; a reader could mistake them for part of the booking handoff — they are NOT (they never hit /booking) (SalonProducts.tsx:148, SalonDetailV3.tsx:258)
10. ⚠️ No fabricated data found on the main PDP render path — ratings, review counts, reviewer names, services, staff, bundles and products are all wired to real tables/APIs

### Booking flow
11. ⚠️ DEAD FILE: the task-referenced components-legacy/ui/date-picker.tsx (a react-aria DatePicker) has ZERO importers across app/components-legacy/lib. The live date/time UI is app/[locale]/_components/primitives/DateTimePicker.tsx. The brief points at the wrong (unused) picker.
12. ⚠️ gift_card_code is a live field in the booking POST body + accepted by createBookingSchema, but redemption is intentionally NOT wired (gift cards owner-hidden 2026-06-14). The server logs a console.warn and drops it (route.ts:151-158). The wizard never renders a gift-card input today, so it's dormant plumbing, not a user-facing dead control.
13. ⚠️ In-memory-only state: no persistence means an accidental refresh or deep back-nav past step 1 loses the whole cart. Acceptable per design (resetForm on success is deliberate) but a real drop-off risk with no recovery.
14. ⚠️ promoCode / giftCardCode / referralCode fields exist in BookingFormData and are POSTed, but the wizard UI does not expose promo/referral entry in this flow (they arrive pre-seeded or stay empty); the promo path is present in the schema but not surfaced as a control here.
15. ⚠️ No live per-staff next-availability endpoint: StaffStep deliberately omits a 'soonest slot' line rather than fabricate one (correctly flagged in its own code comment) — a known data gap, handled honestly, not a fabrication.

### Checkout & Payment
16. ⚠️ DEAD-END SURFACE (page deleted earlier, commit 523e60a9f): /de/checkout (app/[locale]/checkout/page.tsx) was unreachable, no code builds its required booking_intent query param (grep-confirmed, only /dev mockups mention /checkout), and its Stripe return_url targets /{locale}/checkout/success which is not a route (checkout/page.tsx:72). It also used the older /api/stripe/create-payment-intent (manual-capture deposit hold, deleted on local main 2026-09-08) that no live UI called. Treat as removed legacy, not the checkout entry.
17. ⚠️ POTENTIAL MISREPRESENTATION on /checkout: userCredits is /api/referral total_earned displayed as available credit; the code's own comment concedes it is not the real available balance (checkout/page.tsx:188-197). (Moot while the page is orphaned, but flag if it is ever revived.)
18. ⚠️ STALE DESIGN on /checkout: Stripe Elements colorPrimary #C05038 (warm terracotta) + DM Sans font (checkout/page.tsx:710-713), and warm-brown inline styles throughout, contradict the locked B&W/Inter system the live BookingPaymentForm uses (#0A0A0A + Inter).
19. ⚠️ Voucher spend is unwired from the live booking UI: booking-pay-intent reads voucher_code from the request body but PayConfirmStep only sends {booking_id}, so no FE field reaches it (booking-pay-intent/route.ts:60-62). The wizard collects gift_card_code into /api/bookings but there is no voucher-code input in PayConfirmStep — voucher redemption at booking is effectively dormant from the customer's side (credits auto-apply server-side; promo comes via formData.promoCode).
20. ⚠️ No in-app link from /confirmation to the tip flow: tipping is reachable only via the review-prompt cron email deep-link (cron/review-prompt/route.ts:314); a customer who wants to tip right after confirming has no path from the confirmation screen.
21. ⚠️ onSuccess prop on the /checkout CheckoutForm is a no-op (checkout/page.tsx:721) — success relies entirely on the Stripe return_url redirect to the missing success route.
22. ⚠️ Two parallel Stripe payment-intent code paths historically existed. `booking-pay-intent` is the live full-prepay/deposit destination charge; the manual-capture `create-payment-intent` route was deleted on local main 2026-09-08.

### Confirmation & post-booking
23. ⚠️ DEAD LINK: RefundCaseView + UpchargeApproveView both receive receiptHref = /[locale]/bookings/[id] (refund/page.tsx, upcharge/page.tsx), but there is NO app/[locale]/bookings/[id]/page.tsx — that path falls through to the home shell. The guest-lookup OpenedView already removed its 'View receipt' button for exactly this reason (lookup/page.tsx:639-642); the refund/upcharge receiptHref is the same broken target left wired.
24. ⚠️ GUEST CANNOT CANCEL OR RESCHEDULE FROM THE CONFIRMATION SCREEN: canManage=!isGuest, so both affordances are hidden for a guest (BookingConfirmation.tsx:183). Root cause documented in-code (170-183): the confirmation page verifies the access_token itself and never calls guest-lookup, so NO solen_guest_access cookie is set; reschedule would 401/403 and the cancel route (app/api/bookings/[id]/cancel/route.ts:22-24) is session-only (createServerSupabaseClient().auth.getUser(), no guest/resolveBookingActor path at all). A guest can only cancel/reschedule after re-entering via the lookup token exchange (which sets the cookie) — and even then cancel has no guest branch, so a guest effectively cannot self-cancel anywhere.
25. ⚠️ PHONE-CHANNEL RESEND IS A DELIVERY NO-OP: POST /api/bookings/resend-access rotates the token for a phone match but sends NO SMS — only the email branch dispatches (resend-access/route.ts: 'Phone-only resend has no email channel yet'). The resend-link UI offers a phone tab and shows the same uniform 'sent' state, so a phone-only guest gets a success screen but never receives a link.
26. ⚠️ CONFIRMATION EMAIL HAS NO ACCESS/MANAGE LINK: lib/email bookingConfirmation (sent at app/api/bookings/route.ts:580-594) carries only service/salon/date/time/total. A guest's ONLY durable re-entry link is the copyable card on the /confirmation screen; if they leave without saving it, recovery requires the resend-link flow. The email is not a fallback.
27. ⚠️ Sheet-adapter placeholders (user_id '', slot_id '', average_rating 0, review_count 0) are fed to RescheduleSheet/CancelBookingSheet (BookingConfirmation.tsx:210-242). Verified inert (neither sheet reads them) and never displayed, so not user-facing fabrication — noted only because it is placeholder data living in the render path.
28. ⚠️ reschedule route pulls a second client via getSessionUser() after resolveBookingActor already proved entitlement (reschedule/route.ts) and routes slot writes through the admin client because availability_slots UPDATE is owner-only under RLS — not a bug, but a silent-no-op trap that was already fixed here; worth knowing the customer session client cannot write slots.

### Walk-in & Queue (join → pay → number → track → tip)
29. ⚠️ DEAD ROUTE: /walk-in-join is a server redirect to the homepage (page.tsx:7-10) — orphaned legacy screen, nothing links to it.
30. ⚠️ LEGACY/UNPRODUCED TOKEN BRANCH: /walk-in-pay?token=, /api/bookings/walk-in-verify and /api/walkin/confirm all still fully support an HMAC 'salon-SMS payment link' token, and comments claim it is 'issued by /api/bookings/walk-in (salon-SMS flow)', but the CURRENT /api/bookings/walk-in route is cash-only and generates NO token or SMS (bookings/walk-in/route.ts). No code path was found that produces/sends this walk_in payment-link token — the entire token entry mode appears to be vestigial.
31. ⚠️ NO IN-APP ENTRY TO /walk-in-pay: no router.push/Link/href to /walk-in-pay exists anywhere in app/components (grep confirmed). The pay screen is only reachable via an external QR/link carrying ?salon_id&service_id (or the unproduced ?token). The homepage WalkInBand rail links ONLY to the PDP/barbershop list, so there is no wired button that takes a customer from browsing into the pay screen — a real dead-end in the in-product journey.
32. ⚠️ KNOWN BACKEND GAP (self-documented, not fabricated): QueueStatus.firstName is always null because barber_walkin_queue stores the ticket code as customer_name; the personalized 'Während du wartest, <name>' header therefore never personalizes for the pay-gated path (queue/[token] page.tsx:29,338-340).
33. ⚠️ REVIEW DEDUPE is by walkin_queue_id upsert which is solid, but the file comment (review/route.ts:16-19) still describes an older best-effort same-customer/day dedupe — stale comment vs the actual upsert implementation.
34. ⚠️ DEV-ONLY Connect fallback: when a seed salon has no stripe_account_id, pay-intent creates a PLATFORM charge with no transfer_data/commission split in non-production (pay-intent/route.ts:63-75). Guarded to non-prod, but means local walk-in payments do not route to a salon or split commission.
35. ⚠️ Several localized labels in walk-in-pay (e.g. reassure[], stepPaid/stepNow/stepChair, barberEyebrow) are defined but not rendered on the current pay screen (the in-queue/stepper view was moved to /queue/[token]) — harmless dead copy.

### Reviews & ratings
36. ⚠️ Phantom/unapplied columns: score_ergebnis, score_atmosphaere, score_preis_leistung are declared in supabase/migrations/20260324_review_dimensions.sql but do NOT exist in the live reviews table (42703). They are deliberately dropped from the INSERT (route.ts:60-65); the weighted rating still folds them in. owner_reply, photo_url and score_* are likewise schema-drift, intentionally omitted from the public endpoint select (salon/[salon_id]/route.ts:29-36).
37. ⚠️ Paged reviews lose photos: /api/reviews/salon/[salon_id] does not select review_photos, so review photos only render for the first (server-rendered) page; 'Mehr laden' rows never show photos (SalonReviews.tsx:167-172). Documented, accepted tradeoff.
38. ⚠️ Dead fallback: SalonReviews.tsx:430 reads (rev as any).salon_response, a field the passed data never contains (reviews carry review_replies, not salon_response). Harmless dead branch.
39. ⚠️ Walk-in review dedupe is best-effort only: barber_walkin_queue has no booking_id, so a repeat is only blocked when the same signed-in customer already reviewed that barber today; a reviews.walkin_queue_id unique index is a flagged, unbuilt hardening follow-up (walkin/review/route.ts:13-18).
40. ⚠️ Stale comment: ReviewForm.tsx:66 says amenity labels are 'hardcoded DE, TODO i18n', but the code at line 463 actually resolves them via the searchUi i18n namespace — the comment no longer matches the code.
41. ⚠️ Two components both named SalonReviews (app/[locale]/_components/salon/SalonReviews.tsx = PDP inline; components-legacy/salon/SalonReviews.tsx = full sub-page). Same name, different props/behavior; a maintenance/confusion hazard, not a functional bug.
42. ⚠️ ReviewForm exposes a variant='salon' prop (amenity-focused, no avatar) but the reviews sub-page always instantiates it with the default stylist variant; the salon variant is effectively unused from this entry point.

### Profile & account
43. ⚠️ FABRICATION-ADJACENT / STUB: /de/profile/looks has no backing schema and ALWAYS renders the empty state; a TODO says query the `looks` table 'once it exists' (looks/page.tsx:31-33). The feature is unbuilt, not broken data, but the route is a permanent dead-end for real content.
44. ⚠️ ORPHANED ROUTE: /de/profile/stamps is not linked from the profile hub — the hub's loyalty row points to /rewards instead (profile/page.tsx:204). Stamps is reachable only via MobileMenu (MobileMenu.tsx:283), so most users never see it. The hub also fetches stampCount (profile/page.tsx:92) but never displays it — a dead fetch.
45. ⚠️ HIDDEN-BUT-ROUTED: /de/profile/vouchers and /de/profile/gift-cards are live routes that only redirect to /profile; harmless but they exist as reachable no-op URLs.
46. ⚠️ NOT LINKED FROM HUB: /de/notifications has no entry point on the profile hub at all — only the header NotificationBell reaches it. A user on the profile page has no in-hub path to their notifications.
47. ⚠️ MINOR: hub counts silently coerce query errors to 0 via countOf() (profile/page.tsx:42-54), so a broken bookings/favorites/stamps count would read as 0 with no user-visible error (only a console.error).
48. ⚠️ Intake-forms question labels are raw DB keys with underscores replaced by spaces (intake-forms page q.replace(/_/g,' ')) — not human-localized labels, a rough presentation gap rather than fabricated data.

### Value store (loyalty / vouchers / gift cards / credits / referrals) — how value is earned, stored, and spent across Solen's customer surfaces
49. ⚠️ DEAD-END (referral attribution): app/[locale]/referral/[code]/page.tsx:30 writes the code to localStorage key 'solen_referral_code', but NOTHING in the entire repo reads that key back (verified). booking-context.tsx:23 defaults referralCode='' and it is never set; no client component passes referral_code to POST /api/bookings. Net effect: the customer share-link -> friend-books -> both-get-CHF-10 loop cannot complete through the UI, because the code never propagates from localStorage into the booking payload. The completion code (complete-referral.ts) is fully built and correct, but it only ever receives a null referral_code from the live flow.
50. ⚠️ DORMANT SPEND PATH (voucher): app/api/stripe/booking-pay-intent/route.ts:62,624-663 fully implements applying a voucher_code to a charge, but the real pay step (PayConfirmStep.tsx:296) sends only { booking_id } and no live client passes voucher_code. Combined with all voucher/gift-card customer routes being redirect-only, the voucher spend path is unreachable end-to-end.
51. ⚠️ DEAD-END ROUTE (page deleted earlier, commit 523e60a9f): the entire /[locale]/checkout page (app/[locale]/checkout/page.tsx, ~660 lines), the only surface that visibly showed a 'Guthaben verfügbar' credit banner and a working voucher input, was not linked from any live flow (only /dev/mockups + /dev/checkout-confirm). It also used the older /api/stripe/create-payment-intent (deleted on local main 2026-09-08), not booking-pay-intent, so its promo/voucher discounts were computed client-side and diverged from the real spend path.
52. ⚠️ NO SPEND VISIBILITY IN REAL FLOW: because credit is auto-applied silently in booking-pay-intent and PayConfirmStep shows no credit banner, a user with referral credit gets no in-flow indication that (or how much) credit was applied before paying; the credit_applied figure only comes back in the API response after the intent is built (booking-pay-intent:733).
53. ⚠️ LEGACY/AMBIGUOUS LOYALTY: per-salon stamp cards (/profile/stamps) are fully live but the profile hub now routes 'Loyalty' to /rewards and comments call stamps 'legacy' (profile/page.tsx:203); redemption of a completed stamp card has no wired action/screen (file header notes no is_redeemed column, 'pending v2 schema'), so a full stamp card shows 'Belohnung verfügbar' with no in-app redeem step.
54. ⚠️ PHASE-2 DEFERRED: Solen Status has no stored loyalty_status table or monthly cron yet; tier is recomputed on every read from bookings (lib/loyalty/status.ts header), and the thresholds (gold 3 / platinum 6) are explicitly PLACEHOLDER values to be recalibrated before launch.

### Inspo / discovery feed
55. ⚠️ ORPHANED ROUTES: /inspo/board/[id] and /inspo/saved/[id] both have live pages + working APIs (boards/[id], collections/[id]) but NOTHING in the current UI links to them. The named-collections/boards surface was removed from the feed on 2026-06-23 (saved/page.tsx:12-14), and the plain heart-save toggle never assigns a collection_id, so no collection ever gets populated or linked. These are stranded behind removed navigation.
56. ⚠️ SESSION-ONLY SAVED STATE: the feed's savedIds Set starts empty on every load and is never hydrated from /api/discovery/saves, so a look the user saved previously shows an EMPTY heart on the feed until they interact again (page.tsx:110, 296-326). Not fabrication, but a real state-sync gap between feed and the saved page.
57. ⚠️ DORMANT BOARDS SURFACE: the feed page comment claims 'Alle = the blended For You default (boards + personalized + all looks)' (page.tsx:447-449) but the actual render contains no boards row / ForYouSection — the saves route still carries a 'ForYouSection peek' default of 3 (saves/route.ts:18) for a component the feed no longer mounts. Stale comment vs. shipped UI.
58. ⚠️ AI-DESCRIPTION LATENCY: a freshly imported look with no description_en shows title/tags/image immediately but the Details/description only fill on the NEXT visit (after the after() Gemini call persists), so a first-open detail page can look sparse (detail page.tsx:138-144). Expected by design, but a visible content gap.
59. ⚠️ No fabricated data found in the render path: booking signals, ratings, prices, and availability are all backend-gated (CardSignals.tsx:22-29; DetailPage.tsx:401-409). The only 'invented' content is AI-generated look descriptions, which are persisted to discovery_items, not per-render fakes.
60. ⚠️ Historical silent-no-op (now fixed, noted in comments): increment_discovery_view RPC was a phantom (never existed) and discovery_interactions inserts hit an RLS wall / phantom column 'interaction_type'; both are patched to use the admin client + correct 'action' column (detail page.tsx:151-158; interactions/route.ts:30-38).
