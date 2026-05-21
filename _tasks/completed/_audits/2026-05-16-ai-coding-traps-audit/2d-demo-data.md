# Topic 2D — Demo / Mock / Fake Data Shipping in Source

Date: 2026-05-16
Scope: `DEMO_*` / `MOCK_*` / `FAKE_*` / `SAMPLE_*` / `_PLACEHOLDER` / `_STUB` variables, hardcoded inline entity arrays (salons, services, reviews, bookings, stylists), Stripe test IDs, hardcoded test emails, `// TODO: replace with real data` comments adjacent to data structures, lorem ipsum, placeholder image services. Searched `app/`, `lib/`, `components-legacy/`, `src/`. Skipped `node_modules`, `.next`, `_audits`, `_tasks`, `_rules`, `_docs`, `_specs`, `_plans`, `_visual-qa`, `public`, `.claude`.

## Summary

- **Total findings: 23**, grouped by surface below
- **Severity rollup:** CRITICAL: 1 · HIGH: 11 · MEDIUM: 7 · LOW: 4
- **CLAUDE.md call-out validated and expanded.** The 4 homepage feed sections (Coiffeur, LastMinute, Nearby, RecentlyViewed) are correctly flagged in CLAUDE.md, but the actual footprint is **9+ visible-to-customer sections + 1 silently-broken API**. RecentlyViewed alone is the model citizen (env-gated). The others ship to production every page load.
- **Zero hardcoded Stripe test/live IDs** (`price_test_*`, `prod_*`, `sk_test`, `pk_test`, `sk_live`, `pk_live`) anywhere in source. Stripe is wired correctly through `process.env.STRIPE_SECRET_KEY` / `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Zero hardcoded test emails** (no `test@example.com`, `user@test`, `foo@bar`, etc).
- **Zero lorem ipsum / placekitten / picsum.photos / via.placeholder.com / placehold.it / placeimg / loremflickr / pravatar** in source.
- **64+ Unsplash photo URLs** hardcoded across the homepage feed components — used as decorative imagery on the DEMO arrays. They are themselves not the bug (Unsplash images render fine), but every reference to one signals a DEMO array slug that won't resolve to a real salon when clicked.
- One CRITICAL: `app/api/nail/hand-chart/route.ts` uses an in-memory `Map` as the persistence layer for an authenticated dashboard endpoint — every cold start silently destroys user data.

---

## Findings by surface

### Surface 1 — Homepage feed (`app/[locale]/page.tsx` → `_components/homepage/*`)

Every visitor to `/de` lands on a Hero + a stack of feed sections. Currently 6 of those sections render entirely fake content. Click destinations route to slugs like `salon-maria`, `atelier-coiffure`, `boheme`, `nail-loft`, `studio-nord`, `coiffeur-yvette` — none of which exist in DB → effective 404 from the API even when the route handler is fine.

#### HIGH

##### H1. `app/[locale]/_components/homepage/Coiffeur.tsx:57-89` — `DEMO: CoiffeurEntry[]` (15 fake salons)
```ts
const DEMO: CoiffeurEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, service: "Damen-Schnitt", priceFromCHF: 80, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, service: "Balayage", priceFromCHF: 120, freeToday: true, ... },
  ... // 13 more
];
```
- **Line 92:** `const entries = DEMO; // TODO: replace w real query Phase 2` — no env guard, ships every page load.
- **Backing API exists:** `app/api/salons/by-category/route.ts` is implemented but never called.
- **Severity:** HIGH — fake salons rendered as bookable inventory; click → 404 funnel.
- **Fix:** Convert to server component or `useEffect` fetch against `/api/salons/by-category?cat=coiffeur&city={city}&limit=15`. Delete `DEMO` array; keep `ADDRESSES` + `SLOTS_TODAY` / `SLOTS_LATER` only until backend ships real slots.

##### H2. `app/[locale]/_components/homepage/LastMinute.tsx:39-71` — `DEMO: LastMinuteEntry[]` (15 fake discount slots)
- 15 entries with fabricated discount percentages (10–30%), times, and `priceFromCHF`. Line 82: `const entries = DEMO; // TODO: replace w real query Phase 2`.
- **Severity:** HIGH — commercial promises ("30% off today") attached to fake salon names. Misleads users → click → 404.
- **Fix:** Build `/api/salons/last-minute` (or call `/api/salons?sort=last_minute_discount_percent&limit=15`). Delete `DEMO`.

##### H3. `app/[locale]/_components/homepage/Nearby.tsx:40-72` — `DEMO: NearbyEntry[]` (15 fake geo-results)
- 15 entries with hardcoded `distance: "200 m"`, `"450 m"`, … `"4.1 km"` and `nextSlot.bold` labels (`"In 15 Min frei"`, `"Mo. 09:00"`, etc). Renders without ever requesting geolocation. Line 97: `const entries = DEMO; // TODO: replace w real geo query Phase 2`.
- **Backing API exists:** `app/api/salons/nearby/route.ts`.
- **Severity:** HIGH — claims geographic proximity that doesn't exist; section title "In der Nähe" is a marketing lie until wired.
- **Fix:** Call `navigator.geolocation.getCurrentPosition` → fetch `/api/salons/nearby?lat=X&lng=Y&limit=15`. Hide section on permission denial.

##### H4. `app/[locale]/_components/homepage/Reviews.tsx:39-112` — `REVIEWS: Review[]` (8 fabricated testimonials)
```ts
const REVIEWS: Review[] = [
  { stars: 5, text: "Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Salon Maria war wie immer top, aber die Buchung über Solen war diesmal einfach besser.",
    initials: "LK", name: "Lara K.", meta: "Basel · vor 2 Wochen", salonName: "Salon Maria", salonSlug: "salon-maria" },
  ... // 7 more — Marc H., Sara R., Anna M., Tobias W., Eva S., Niklas B., Sophie L.
];
```
- JSDoc lines 24–27 explicitly state the backend contract: `/api/reviews/featured?limit=10` (Phase 2).
- **Severity:** HIGH — fabricated customer testimonials with named individuals on a public marketing surface. Even under Switzerland's relatively permissive marketing rules, this is UWG (unfair competition) territory if a competitor decides to report it. Slugs route to non-existent salon pages.
- **Fix:** Wire `/api/reviews/featured`. Until reviews exist in production, **remove the section entirely** — empty is better than fake.

##### H5. `app/[locale]/_components/homepage/FeaturedStylists.tsx:37-44` — `DEMO: Stylist[]` (6 fabricated named stylists)
```ts
const DEMO: Stylist[] = [
  { slug: "elena-rossi",   name: "Elena Rossi",    specialty: "Coiffeur",    city: "Basel",  rating: 4.9, ... },
  { slug: "marcus-chen",   name: "Marcus Chen",    specialty: "Barbershop",  city: "Zürich", rating: 5.0, ... },
  { slug: "sophie-dubois", name: "Sophie Dubois",  specialty: "Nails",       city: "Bern",   rating: 4.8, ... },
  { slug: "luca-bernasco", name: "Luca Bernasco",  specialty: "Spa",         city: "Lugano", rating: 4.9, ... },
  { slug: "anna-keller",   name: "Anna Keller",    specialty: "Coiffeur",    city: "Luzern", rating: 4.7, ... },
  { slug: "tobias-mueller",name: "Tobias Müller",  specialty: "Barbershop",  city: "St. Gallen", rating: 4.8, ... },
];
```
- JSDoc line 23: `Demo data inline; replace with /api/stylists/featured query in Phase 2`. Each card links to `/stylist/${s.slug}` which 404s.
- **Severity:** HIGH — same fabricated-named-individuals risk as Reviews (H4). Six named people presented as platform stylists, none of whom exist.
- **Fix:** Wire `/api/stylists/featured` (route `app/api/staff/featured/` exists). Hide section until seeded.

#### MEDIUM

##### M1. `app/[locale]/_components/homepage/Entdecken.tsx:43-51` — `DEMO: Look[]` (7 fake style trends)
- 7 hardcoded entries: Voluminous Layers, Cool Hair for Life, Textured Shag, Layered Butterfly, Curtain Bangs, Wolf Cut, Soft Balayage. Each entry has a `bgGradient` placeholder (not photos). Links to `/entdecken/${slug}` which likely 404s.
- JSDoc line 38–40 explicitly: "V3-palette gradient stand-in until real TikTok thumbnails ship from `/api/discovery/feed` (Phase 2)".
- **Severity:** MEDIUM — abstract style names, lower fabrication risk than fabricated humans. But broken-link risk on click + section title "Finde deine Inspiration." sets a content expectation the gradients don't deliver.
- **Fix:** Wire `/api/discovery/feed?limit=7` (route exists, used by `components-legacy/ui/DiscoverCarousel.tsx:60`). Drop gradients.

##### M2. `app/[locale]/_components/homepage/WhySolen.tsx:47-86, 131, 138, 200-203` — fake `CALENDAR` mockup + fabricated "1'200 Salons" / "4.9/5" claims + fabricated floating "Salon Maria 5.0 · 247 Bewertungen" card
- Lines 47–86: `CALENDAR` array, 5 fake days × 2-3 fake bookings each with named customers (Lara K., Marc H., Anna M., Sara R., Tobias W., Eva S., Niklas B., Sophie L., David K., Lena F., Mira L., Tim O.) and services. This renders as a CSS dashboard mockup inside the B2B section ("Solen für dein Geschäft.").
- Line 131: `<span>Bewertet 4.9 / 5</span>` — hardcoded average rating.
- Line 138: `<p>Über 1&apos;200 Salons buchen schon mit Solen</p>` — hardcoded B2B trust claim.
- Lines 200–204: Floating card `<div>Salon Maria</div> <span>5.0 · 247 Bewertungen</span> <div>2.0 km · Kleinbasel</div>` — fully fabricated featured salon.
- **Severity:** MEDIUM — the calendar grid is clearly a decoration (small, CSS-built, in a "what your dashboard looks like" mockup). The "1'200 Salons" and "4.9/5" claims are NOT clearly decorative — they appear as marketing trust signals on a B2B acquisition page.
- **Fix:** Keep calendar grid as decoration. Back "1'200 Salons" and "4.9/5" with real queries (`count(*) from salons where is_active`, `avg(average_rating) from salons where review_count > 0`) OR remove the claims until real metrics ship. Floating salon card can stay as decoration if styled with a clear `Beispiel` badge.

##### M3. `app/[locale]/_components/homepage/searchFeatured.ts:28-56` — `FEATURED_SALONS` (3 orphan fake salons)
- 3 entries: Coiffure Yvette, Atelier Coiffure, Studio Bel, all with `id: "demo-1"…"demo-3"` and badges `"Neu"`/`"Top 10"`/`null`. JSDoc spells out the replacement query.
- **Consumer check:** NOT imported anywhere per `grep -rn "searchFeatured\|FEATURED_SALONS"` against `app/` and `components-legacy/`.
- **Severity:** MEDIUM if wired; LOW currently (orphan).
- **Fix:** Replace with a server fetch before any consumer wires it. Or delete the file.

##### M4. `app/[locale]/_components/homepage/searchTrending.ts:29-34` — `TRENDING` (4 orphan trending services)
- 4 entries: Balayage `"127 Buchungen heute"`, Buzz Cut `"↑ 42% diese Woche"`, Gel-Maniküre `"Top in Basel"`, Hot Stone Massage `"★ 4.9 Durchschnitt"`.
- **Consumer check:** NOT imported anywhere.
- **Severity:** MEDIUM — `"127 Buchungen heute"` is a fabricated activity metric; if any consumer wires this file before the API exists, it ships a lie.
- **Fix:** Build `/api/search/trending` first (JSDoc provides the SQL). Delete this file or pre-wire to the real route.

##### M5. `app/[locale]/_components/homepage/searchCategories.ts:35-64` — `CATEGORIES.count` hardcoded values
- 4 categories with hardcoded counts `"42 Salons"`, `"18 Salons"`, `"31 Salons"`, `"14 Salons"`. Comment line 13: `count: string; // hardcoded count for v1 per plan D9 — refresh quarterly`.
- **Consumer check:** NOT imported anywhere.
- **Severity:** MEDIUM (commercial inventory claim if wired); LOW (currently orphan).
- **Fix:** Replace `count` with a server-side query (`select unnest(categories) as cat, count(*) from salons where is_active group by cat`) before any consumer wires it.

#### LOW

##### L1. `app/[locale]/_components/homepage/RecentlyViewed.tsx:44-53` — `DEMO_SALONS: RecentEntry[]` (4 entries) — **the correct pattern**
- 4 fake salons (Atelier Coiffure, Studio Nord, Nail Loft, Rhein Spa) used **only** when `entries.length === 0 && process.env.NODE_ENV !== "production"` (line 122–124).
- **Severity:** LOW — properly gated. Hidden in production. JSDoc lines 36–40 explain the gate.
- **Fix:** None required. Use this as the reference pattern for fixing every other DEMO array.

##### L2. Three TODO comments in homepage feed bodies — `// TODO: replace w real query Phase 2`
- `Coiffeur.tsx:92`, `LastMinute.tsx:82`, `Nearby.tsx:97`. Plus `Hero.tsx:18` (i18n TODO) and `HeartButton.tsx:45` (`// TODO: backend mutate via /api/favorites/toggle`).
- **Severity:** LOW (these are IOUs, not data). They correspond to H1/H2/H3 above.
- **Fix:** Each fix above resolves its TODO.

---

### Surface 2 — Category pages (`/nails`, `/barbershop`, `/coiffeur`)

The `app/[locale]/{nail|barbershop|coiffeur}/page.tsx` routes import legacy section components from `components-legacy/{cat}/*Sections.tsx`. These files still ship hardcoded entity arrays.

#### HIGH

##### H6. `components-legacy/nail/NailsSections.tsx:66-73` — `INSPO_PLACEHOLDERS` (6 inspo tiles)
```ts
const INSPO_PLACEHOLDERS = [
  { color: "from-s-coral/20 to-s-coral-subtle", label: t("style_nail_art") },
  { color: "from-s-blue/20 to-s-blue-subtle", label: t("style_french") },
  { color: "from-s-amber/20 to-s-amber-subtle", label: t("style_ombre") },
  { color: "from-s-plum/15 to-s-plum-subtle", label: t("style_minimal") },
  { color: "from-s-sage/20 to-s-sage-subtle", label: t("material_natural") },
  { color: "from-s-sand/30 to-s-sand-subtle", label: t("style_glitter") },
];
```
- **Live consumer:** `app/[locale]/nails/page.tsx:3` via `NailsBelowGrid`.
- Variable name literally signals incompleteness (`PLACEHOLDERS`).
- **Bonus issue:** Gradients use retired V1 tokens (`s-coral`, `s-blue`, `s-amber`, `s-plum`, `s-sage`, `s-sand`) per CLAUDE.md retired-list — these render with broken/missing colors against V3.
- **Severity:** HIGH — live consumer, broken tokens, placeholder-named structure.
- **Fix:** Replace with `/api/discovery/feed?category=nails&limit=6`. Migrate to V3 tokens. Or hide section until real inspo seeded.

##### H7. `components-legacy/barber/BarbershopSections.tsx:131-136` — `FEATURED_BARBERS` (4 fake barbers)
```ts
const FEATURED_BARBERS = [
  { id: "1", name: "Marco B.", speciality: "Skin Fade", styles: ["Urban", "Klassisch"], initials: "MB" },
  { id: "2", name: "Yannick R.", speciality: "Afro Cuts", styles: ["Modern", "Urban"], initials: "YR" },
  { id: "3", name: "Davide S.", speciality: "Bart-Design", styles: ["Klassisch"], initials: "DS" },
  { id: "4", name: "Kevin L.", speciality: "High Fade", styles: ["Modern"], initials: "KL" },
];
```
- **Live consumer:** `app/[locale]/barbershop/page.tsx:4` via `BarbershopBelowGrid`.
- Same fabricated-named-individuals problem as homepage Reviews / FeaturedStylists.
- **Severity:** HIGH.
- **Fix:** Wire `/api/staff/featured?category=barbershop&limit=4` (route exists). Hide section if empty.

#### LOW

##### L3. `components-legacy/coiffeur/CoiffeurSections.tsx:27-32` — `TRENDING_STYLES` (4 style chips)
```ts
const TRENDING_STYLES = [
  { label: "Curtain Bang", tag: "trending", color: "from-s-coral/20 to-s-coral/5", q: "Curtain Bang" },
  { label: "Wolf Cut",     tag: "popular",  color: "from-s-blue/20 to-s-blue/5",   q: "Wolf Cut"     },
  { label: "Shag Haircut", tag: "new",      color: "from-s-amber/20 to-s-amber/5", q: "Shag Haircut" },
  { label: "Blunt Bob",    tag: "classic",  color: "from-s-sage/20 to-s-sage/5",   q: "Blunt Bob"    },
];
```
- **Live consumer:** `app/[locale]/coiffeur/page.tsx:4` via `CoiffeurBelowGrid`.
- **Severity:** LOW — editorial labels, legit as curated copy. BUT `tag: "trending"`/`"popular"`/`"new"` is hand-assigned, not a real activity metric; and `color` uses retired V1 tokens.
- **Fix:** Either drop the `tag` field or surface real aggregation. Migrate `color` to V3 tokens.

---

### Surface 3 — Salon detail page (`app/[locale]/salon/[slug]/*`)

#### MEDIUM

##### M6. `components-legacy/salon/StaffSection.tsx:101-105` — hardcoded "next slot" inside staff cards
```tsx
{/* Next slot mock - in prod this would fetch from an API */}
<div className="text-right">
  <p className="text-[9px] font-heading uppercase tracking-wider text-[#9F8A7E]">Nächster Termin</p>
  <p className="text-[12px] font-medium text-[#16A34A]">Morgen, 10:00</p>
</div>
```
- Every staff card on every salon page shows the same `"Morgen, 10:00"` as the next available slot, in green.
- **Severity:** MEDIUM — directly contradicts whatever real availability the booking page would surface for the same staff member; misleads users into thinking the slot is bookable.
- **Fix:** Fetch real `next_available_slot` per staff via `/api/staff/[id]/availability` (route may need to be built). Hide the row if unknown.

---

### Surface 4 — "Warum Solen" landing (`app/[locale]/warum-solen/page.tsx`)

#### MEDIUM

##### M7. `app/[locale]/warum-solen/page.tsx:62-138, 143-172` — `MockChat` + `MockCompare` + `MockMap` inline mockups
- **Line 62-101 `MockChat`:** decorative chat-bubble UI with copy from i18n keys + the salon name `"Studio Bella"` hardcoded inline. **Decorative — fine.**
- **Line 106-138 `MockCompare`:** 3 hardcoded salons (`Studio Bella` 4.8★ CHF 85, `Hair Lounge` 4.5★ CHF 95, `Coiffeur Basel` 4.2★ CHF 75). Used in a "find the best price" pitch section.
- **Line 143-173 `MockMap`:** 4 hardcoded map pins with fake `"ab CHF 45"`, `"ab CHF 65"`, etc.
- **Severity:** MEDIUM — comparison table with fabricated salons named after their function (`Hair Lounge`, `Coiffeur Basel`) reads as inventory promise. Lower fabrication risk than the homepage Reviews (no fake humans), but still commercial.
- **Bonus issue:** Uses retired V1 tokens (`bg-s-coral`, `bg-s-amber`, `#1B4D1B`, `#F2C144`) per CLAUDE.md.
- **Fix:** Either replace with a server fetch from a real "salon comparison" surface (or pick 3 real published salons that opted in), or annotate the section as obviously editorial (style with a "Beispiel" / "example" badge). Migrate colors to V3 tokens.

---

### Surface 5 — Legacy carousels (`components-legacy/ui/*`)

#### HIGH

##### H8. `lib/demo-data.ts:13-101` — `DEMO_SALONS` (5 fake salons) + `DEMO_DISCOVER_ITEMS` (5 fake discover items)
```ts
export const DEMO_SALONS: SalonCard[] = [
  { id: "demo-1", slug: "demo-1", name: "Atelier Lumière", quartier: "Altstadt", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&q=80",
    average_rating: 4.9, review_count: 87, min_price: 65, categories: ["coiffeur"], ... } as unknown as SalonCard,
  ... // Nails & Grace, The Barber Society, Serenity Spa Basel, Glam Studio
];
export const DEMO_DISCOVER_ITEMS: DemoDiscoverItem[] = [
  { id: "dd-1", media_type: "photo", image_url: "https://images.unsplash.com/...",
    label: "Coiffeur", title: "Moderner Haarschnitt", category: "coiffeur", author_name: "[TEST] Atelier Lumière", ... },
  ... // 4 more
];
```
- **Consumers:**
  - `components-legacy/ui/FeaturedSalonCarousel.tsx:9, 27` (`useReal ? salonsWithPhotos.slice(0, 8) : DEMO_SALONS`)
  - `components-legacy/ui/DiscoverCarousel.tsx:13, 114` (`items.length === 0 ? DEMO_DISCOVER_ITEMS.map(...)`)
- **Currently orphan:** No live imports of these two carousels from `app/` per `grep -rn "FeaturedSalonCarousel\|DiscoverCarousel" app/`. Still in the bundle.
- **Severity:** HIGH (latent). The `as unknown as SalonCard` cast on each entry suppresses TypeScript shape-drift errors — any future consumer who reads `salon.id` will see `"demo-1"` and the slug `demo-1` will 404 against `/api/salons/by-slug/demo-1`.
- **Fix:** Delete `lib/demo-data.ts` along with the orphaned legacy carousels. If a fallback is needed when an API returns empty, render an empty-state component, not seed data.

---

### Surface 6 — Dashboard / authenticated salon-owner surfaces

#### HIGH

##### H9. `app/api/dashboard/barber-leaderboard/route.ts:63-68` — Fabricated analytics percentages shown to salon owners
```ts
// Derived or mocked percentages since they require complex/historical queries
// Usually avg_tip and retention come from a reviews/tips table and a historical client recurrence check.
const retentionPct        = bookingsCount > 0 ? Math.min(100, 60 + (bookingsCount % 30)) : 0;
const walkinConversionPct = walkinCount  > 0 ? Math.min(100, 40 + (walkinCount * 2))    : 0;
const avgTip              = bookingsCount > 0 ? 3 + (bookingsCount % 5)                  : 0;
const chairUtilizationPct = bookingsCount > 0 ? Math.min(100, 50 + (bookingsCount * 1.5)) : 0;
```
- Four KPI values returned from an authenticated dashboard endpoint, surfaced to salon owners as their staff performance analytics.
- The comment on line 63 admits the numbers are fabricated.
- **Severity:** HIGH — acting on fake retention/tip/utilization data could cause real business decisions (firing a profitable barber, mis-allocating chairs). Worse than missing data — it looks real.
- **Fix:** Return `null` (or omit the fields) for each KPI that can't be computed yet, and have the dashboard render an empty-state ("Not enough data — needs `tips` table + 90-day client recurrence"). Or remove these columns from the response/UI entirely.

#### MEDIUM

##### M8. `components-legacy/TrustStatsBanner.tsx:154, 201` — hardcoded `4.8` "Bewertung" stat
- Line 154 comment: `// Always show rating (hardcoded 4.8 for now, like hero)`.
- Line 200–202: `<span>4.8</span>` rendered next to an amber star, labeled "Bewertung".
- **Severity:** MEDIUM — appears as a platform-level "we have a 4.8★ average" trust signal; mismatched with whatever the real DB average is. Banner is wired into legacy home pages.
- **Fix:** Compute `select avg(average_rating) from salons where is_active and review_count > 0` server-side. Hide if no reviews.

---

### Surface 7 — Admin / test-only surfaces (intentionally fake — for reference)

#### LOW

##### L4. Admin-only seed routes — intentional, correctly scoped
- `app/api/admin/test-salon/route.ts:10-22` — `FAKE_NAMES` (9), `FAKE_ADDRESSES` (4), `CATEGORIES_OPTIONS` (8), `SERVICES_TEMPLATES` (12), `STAFF_TEMPLATES` (3).
- `app/api/admin/test-salon/seed/route.ts:9-13` — `FAKE_CUSTOMER_NAMES` (8), `FAKE_PHONES` (3).
- `app/api/admin/seed-test-salons/route.ts:44-115` — `TEMPLATES` (5 templates × 3 cities = 15 spawnable test salons).
- All routes require `profile.role === "admin"`, all rows tagged `is_test: true`, all names prefixed `[TEST]`. Multiple queries already filter `.eq("is_test", false)` in production code (e.g. `app/api/salons/route.ts:43`, `app/api/profile/favorites/route.ts:32`, `app/[locale]/[city]/[category]/page.tsx:101`).
- **Severity:** LOW — intentional, correctly scoped, route-locked, DB-tagged.
- **Fix:** None required. This IS the right pattern.

Bonus reference: `src/modules/booking.js:172, 226` carries an `isDemo` heuristic (`typeof bmState.store?.id === 'string' && bmState.store.id.startsWith('d')`) that nulls out `salon_id` / `store_id` before DB writes when the store ID looks demo-shaped. Module is legacy `src/` glue (not user-facing) — should be deleted along with the unused legacy paths if `src/` is no longer mounted. LOW.

---

### Surface 8 — In-memory "mock DB" used as a real persistence layer

#### CRITICAL

##### C1. `app/api/nail/hand-chart/route.ts:1-31` — Live API endpoint backed by in-memory `Map`
```ts
// Temporary in-memory store to mock the `hand_chart_notes` Supabase table
const mockDb = new Map<string, any>();

// GET /api/nail/hand-chart?clientId=X
export async function GET(...) {
  const notes = mockDb.get(clientId) || {};
  return NextResponse.json({ notes });
}

// POST /api/nail/hand-chart  body: { clientId, notes }
export async function POST(...) {
  const existing = mockDb.get(clientId) || {};
  mockDb.set(clientId, { ...existing, ...notes });
  return NextResponse.json({ success: true, notes: mockDb.get(clientId) });
}
```
- Authenticated manicurist endpoint (`/api/nail/hand-chart`) writes nail-care notes about clients into a module-scope `Map`. Every cold start of the Next.js / Netlify function instance wipes every note. On Netlify each invocation may land on a different worker — writes silently disappear within a single session.
- Comment line 3 explicitly admits: "Temporary in-memory store to mock the `hand_chart_notes` Supabase table" — the migration was never completed.
- **Severity:** CRITICAL — silently destroys user data; salon owner believes the note was saved when in fact it lives ~minutes.
- **Fix:** Create the `hand_chart_notes` table in Supabase (RLS-guarded by `client_id` ownership), replace the `Map` with `supabase.from("hand_chart_notes").select/.upsert`. Until then, return `503 Service Unavailable` so the frontend can't pretend the write succeeded.

---

## Wire-up gap matrix — sorted by customer visibility

What a visitor to `/de` (production homepage) and adjacent pages sees as fake right now:

| # | Section / Surface | What's fake | Backing API | Status |
|---|---|---|---|---|
| 1 | Homepage `Coiffeur.tsx` | 15 fake salons | `/api/salons/by-category` | EXISTS — not called (H1) |
| 2 | Homepage `LastMinute.tsx` | 15 fake discount slots | `/api/salons/last-minute` (or sort param) | NEEDED (H2) |
| 3 | Homepage `Nearby.tsx` | 15 fake geo-results | `/api/salons/nearby` | EXISTS — not called, no geo prompt (H3) |
| 4 | Homepage `Reviews.tsx` | 8 fabricated testimonials w/ named individuals | `/api/reviews/featured` | NEEDED (H4) |
| 5 | Homepage `FeaturedStylists.tsx` | 6 fabricated named stylists | `/api/staff/featured` | EXISTS — not called (H5) |
| 6 | Homepage `Entdecken.tsx` | 7 gradient-only style cards | `/api/discovery/feed` | EXISTS — not called (M1) |
| 7 | Homepage `WhySolen.tsx` | "1'200 Salons" + "4.9/5" + floating "Salon Maria" card | `count(*)` / `avg()` from `salons` | NEEDED (M2) |
| 8 | `/nails` category | 6 placeholder inspo tiles | `/api/discovery/feed?category=nails` | EXISTS — not called (H6) |
| 9 | `/barbershop` category | 4 fabricated named barbers | `/api/staff/featured?category=barbershop` | EXISTS — not called (H7) |
| 10 | `/salon/[slug]` staff cards | Every staff "Morgen, 10:00" hardcoded | needs `/api/staff/[id]/availability` | NEW (M6) |
| 11 | `/warum-solen` MockCompare + MockMap | 3 fabricated salons + 4 fake price pins | needs real published-salon picks | NEW (M7) |
| 12 | Dashboard barber leaderboard | 4 fabricated KPI percentages | needs `tips` table + recurrence query | NEEDED (H9) |
| 13 | `TrustStatsBanner` (legacy home) | hardcoded `4.8` rating | `avg(average_rating)` from `salons` | NEEDED (M8) |
| 14 | `/api/nail/hand-chart` | every note write silently dies | needs `hand_chart_notes` Supabase table | CRITICAL (C1) |

CLAUDE.md identifies sections 1–3 + 6 (`RecentlyViewed`) correctly. Sections 4, 5, 6, 7 + the legacy category pages + the dashboard analytics + the nail-chart route were not in the call-out. Total visible-to-user fake-data surfaces: **9 sections + 1 data-loss API**. The "beautiful lobby that opens onto a legacy hotel" framing from the V3 wire-up audit still holds, but the lobby itself isn't yet honest either.

---

## Notes

- **No `picsum.photos`, `via.placeholder.com`, `placehold.it`, `placeimg`, `loremflickr`, `pravatar`, `placekitten`, `loremipsum` URLs in source.** Zero starter-template residue.
- **No hardcoded test emails** (`test@example.com`, `user@test`, `foo@bar`, `admin@admin`, `demo@demo`, `hello@hello`, etc).
- **No hardcoded Stripe IDs.** All Stripe instantiations go through `process.env.STRIPE_SECRET_KEY` / `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. No `prod_*` / `price_*` / `price_test_*` / `sk_test` / `pk_test` in source.
- **No `lorem ipsum`** anywhere.
- **64 Unsplash photo URLs** hardcoded across `Coiffeur.tsx` (15), `LastMinute.tsx` (15), `Nearby.tsx` (15), `RecentlyViewed.tsx` (4), `lib/demo-data.ts` (10), `app/api/admin/seed-test-salons/route.ts` (5). Each one is paired with a DEMO array entry — same fix removes both.
- **Pattern to copy:** `RecentlyViewed.tsx`'s `entries.length === 0 && process.env.NODE_ENV !== "production" ? DEMO_SALONS : entries` is the right minimum bar. Apply it to every other DEMO array until the real APIs ship — at least production stops shipping fake inventory.
- **`searchFeatured.ts` / `searchTrending.ts` / `searchCategories.ts`** are three orphan demo-data files (no consumers per grep) with explicit Phase 2 wire-up comments. Either build the consumer + API, or delete them. Living-but-orphan demo data is the trap the next agent walks into.
- **The `lib/demo-data.ts` + legacy carousels** are similarly orphan from `app/` but still shipped. Best move: delete `lib/demo-data.ts`, delete `components-legacy/ui/FeaturedSalonCarousel.tsx` + `components-legacy/ui/DiscoverCarousel.tsx` if nothing in `app/` ever imports them.

---

## Total: 23 findings (1 CRITICAL · 11 HIGH · 7 MEDIUM · 4 LOW) across 14 distinct files.
