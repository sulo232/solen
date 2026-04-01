# Roadmap 01 — Search & Filters

> **Scope**: Fresha-style multi-field search, sub-category chips, recent searches, filter system
> **DB Status**: `salons`, `services`, `availability_slots` tables exist. `opening_hours` JSONB exists and is already rendered in salon detail pages.
> **Effort**: 🟡 Medium (~30 audit points)

---

## Phase 1: Upgrade Search Bar to Fresha-Style (Desktop)

### 1.1 Replace search panels with Fresha-style "Was · Wo · Wann" fields

**WHY**: Solen's current search mimics Airbnb's "Where / Check in / Check out / Who" which is designed for _lodging_. Fresha uses "Treatment or venue / Location / Any date" which directly maps to _beauty/salon booking_. Users searching for a salon have a fundamentally different mental model: they want a specific _service_ (not a place to stay), in a _city_ (not a neighborhood), on a _date_ (not a date range). Matching the search fields to the user's intent reduces cognitive load and increases search-to-booking conversion.

**BENCHMARK**: 
- **Fresha**: 3-field search — "Treatment or venue" (free text + autocomplete for services AND salon names), "Location" (city autocomplete), "Any date" (single-day calendar picker). Each field is a separate clickable panel in a rounded pill.
- **Airbnb**: 3-field search — "Where" (location), "Check in / Check out" (date range), "Who" (guest count). Not applicable to salon bookings.

**HOW**:
- **File**: `components/ui/AirbnbSearchBar.tsx`
- Restructure the 3 panels:
  - Panel 1: **"Was"** → Service/Category picker dropdown. Shows the 6 categories (Coiffeur, Nails, Barbershop, Spa, Makeup, Waxing) as primary options, plus a free-text input that autocompletes against service names from the `services` table. User can type "Balayage" and see matching services.
  - Panel 2: **"Wo"** → Hardcoded Swiss city picker. Shows: Basel (default, since Solen launched here), Zürich, Bern. Uses `getPersistedCity()` to auto-detect returning users' preferred city. No Google Places needed yet — hardcoded list is sufficient for 3 cities.
  - Panel 3: **"Wann"** → Date picker (reuse existing calendar component) + optional time-of-day selector (Morgens 08-12 / Nachmittags 12-17 / Abends 17-21). Single date, not range.
- Pill reads "Was · Wo · Wann" as placeholder text when collapsed

**IMPACT**: Users immediately understand what to search for. Reduces bounce rate on homepage. Aligns with Swiss German user expectations for appointment-based searches.

---

### 1.2 Add service auto-suggest in "Was" field

**WHY**: Users often search for a specific treatment (e.g. "Balayage", "Gel Nägel") rather than browsing categories. Auto-suggest bridges the gap between what the user types and what the system understands, dramatically increasing search success rate. Fresha's #1 search pattern is treatment name → results.

**BENCHMARK**:
- **Fresha**: Typing "Bal" instantly shows "Balayage" with service count. Also suggests salon names matching the query.
- **Airbnb**: Shows destination suggestions with photos. Not directly comparable, but the pattern of instant suggestions is identical.

**HOW**:
- **File**: New `components/ui/ServiceAutosuggest.tsx`
- **Data query**: `SELECT DISTINCT name_de, category FROM services WHERE is_active = true AND name_de ILIKE '%{query}%' ORDER BY name_de LIMIT 8`
- Falls back to showing all 6 categories as large tappable cards if input is empty
- Shows results grouped: "Services" section (matching treatments) + "Salons" section (matching salon names)
- Each suggestion shows: service name, category chip, approximate price range
- On select: navigates to category page with sub-filter applied, e.g. `/de/coiffeur?service=balayage`

**IMPACT**: Users who know what they want can find it in 2 keystrokes instead of browsing through categories > salons > service lists. Expected to increase search completion rate by 30-50%.

---

### 1.3 Update search placeholder text

**WHY**: The current placeholder "Salon suchen..." is vague and doesn't communicate the breadth of what's searchable. A descriptive placeholder educates users about the search capabilities and increases engagement with the search bar.

**BENCHMARK**:
- **Fresha**: "Treatment or venue" — tells users they can search by either service or salon name
- **Airbnb**: "Search destinations" — clear about what to type

**HOW**:
- **File**: `components/ui/AirbnbSearchBar.tsx` + `components/layout/Header.tsx`
- Change placeholder from `"Salon suchen..."` to `"Service, Salon oder Ort suchen..."`
- Mobile search pill text: `"Was suchst du?"` (conversational, inviting)

**IMPACT**: Small change, big signal. Users understand they can search for services, not just salons.

---

### 1.4 Compact pill should expand inline (not scroll to top)

**WHY**: Currently, clicking the compact search pill in the sticky header calls `window.scrollTo({ top: 0 })`, which yanks the user back to the page top. This is jarring and breaks the flow — the user was browsing, saw something interesting, and wanted to refine their search. They shouldn't lose their scroll position. Airbnb keeps the user in place and expands the search inline.

**BENCHMARK**:
- **Airbnb**: Clicking the compact pill in the sticky header → the pill morphs/expands to the full search bar with a smooth scale animation. The page content dims slightly behind it. The user never loses their scroll position.
- **Fresha**: No compact-to-expanded transition (search always stays at top of page)

**HOW**:
- **File**: `components/layout/Header.tsx` (currently around lines 224-234)
- Remove the `window.scrollTo({ top: 0 })` call
- Add state: `const [searchExpanded, setSearchExpanded] = useState(false)`
- When compact pill is clicked: set `searchExpanded = true` → render the full `AirbnbSearchBar` in an overlay below the header
- Use `AnimatePresence` + Framer Motion: pill scales from compact size (200px) to full width with `layoutId` shared animation
- Add a semi-transparent backdrop (`bg-black/20`) behind the expanded search to focus attention
- Click backdrop or press Escape → collapses back to pill

**IMPACT**: Users can refine their search from anywhere on the page without losing context. Feels native and premium. This is one of the most satisfying micro-interactions in Airbnb's UX.

---

## Phase 2: Mobile Search Enhancements

### 2.1 Add recent searches to GuidedSearch sheet

**WHY**: 60-80% of beauty bookings are repeat visits. Users search for the same salon or service repeatedly. Showing recent searches eliminates friction for returning users — they tap once instead of re-typing their last search. This is standard UX for any search-heavy app.

**BENCHMARK**:
- **Fresha**: Shows "Recent searches" immediately when tapping the search bar, with salon names and service types
- **Airbnb**: Shows "Recent searches" with destination thumbnails and date ranges

**HOW**:
- **File**: `components/ui/GuidedSearch.tsx`
- **Storage**: `localStorage` key `solen_recent_searches`
- **Data shape**: `Array<{ query: string, category?: string, city: string, timestamp: number }>` — max 5 entries
- **Save trigger**: On successful search submission (not on every keystroke)
- **Display**: Show on sheet open, before any other content. Each entry is a tappable chip with small clock icon. Format: "Balayage · Basel" or "Joliz Zentrum"
- **"Alle löschen"** link: Top-right, muted text, clears localStorage key

**IMPACT**: Returning users save 5-10 seconds per search. Reduces friction for loyal customers, which is exactly the audience that generates the most revenue.

---

### 2.2 Add trending/popular categories

**WHY**: New users don't know what to search for. Showing what's popular gives them a starting point and creates social proof ("other people are searching for this, so it must be good"). This also helps Solen educate users about available services.

**BENCHMARK**:
- **Fresha**: Shows "Popular treatments" section with category icons
- **Airbnb**: Shows "Popular destinations" with trending searches

**HOW**:
- **File**: `components/ui/GuidedSearch.tsx`
- **Data**: Hardcoded initially (cheaper than querying, and we control the narrative):
  ```
  ["Balayage", "Gel Nägel", "Herrenschnitt", "Wimpernverlängerung", "Hot Stone Massage"]
  ```
- **Future**: Migration `078_trending_aggregation.sql` already exists in the codebase, which creates a materialized view for trending data. When we have enough booking volume, switch to real data.
- **Display**: Section below recent searches: "Beliebt in Basel 🔥" with horizontally scrollable tappable chips
- **On tap**: Navigate to category page with sub-filter

**IMPACT**: Reduces the "blank page problem" for new users. Drives traffic to high-converting service categories.

---

## Phase 3: Category Page Sub-Filters

### 3.1 Add sub-category chip strip on category pages

**WHY**: When a user lands on `/coiffeur`, they see ALL coiffeur salons. But they might specifically want a "Balayage" salon. Sub-category chips let users narrow down without opening a full filter modal. This is Fresha's most powerful discovery pattern — chip filters above the results grid.

**BENCHMARK**:
- **Fresha**: On the "Hair Salon" category page, shows chips like "Haircut", "Hair Color", "Balayage", "Extensions", "Blowdry", "Highlights". Clicking a chip filters the results instantly. Multiple chips can be active.
- **Airbnb**: Category strip at top (Icons row), but no sub-filters within a category.

**HOW**:
- **File**: New `components/ui/SubCategoryChips.tsx`
- **Data per category** (hardcoded, derived from common `services.name_de` values in the DB):
  - Coiffeur: `["Haarschnitt", "Balayage", "Färben", "Strähnchen", "Föhnen", "Extensions"]`
  - Nails: `["Gel Nägel", "Maniküre", "Pediküre", "Nail Art", "Acryl"]`
  - Barbershop: `["Herrenschnitt", "Bartpflege", "Rasur", "Fade"]`
  - Spa: `["Massage", "Gesichtsbehandlung", "Hot Stone", "Sauna"]`
  - Makeup: `["Braut-Makeup", "Abend-Makeup", "Permanent Makeup"]`
  - Waxing: `["Ganzkörper", "Beine", "Bikini", "Gesicht", "Achseln"]`
- **Placement**: Rendered below `CategoryStickyRow.tsx` (the file user currently has open), horizontally scrollable with `overflow-x-auto scrollbar-hide`
- **Filter logic**: Click chip → query: `SELECT DISTINCT salon_id FROM services WHERE name_de ILIKE '%{chip}%' AND category = '{category}'` → filter salon list to only those salons
- **Style**: `rounded-full px-4 py-2 text-sm font-medium border border-[#EBEBEB]` — active state: `bg-[#222] text-white border-transparent`

**IMPACT**: Users can find exactly what they want in one tap. This is the #1 feature request pattern from Fresha's UX — it bridges the gap between category browsing and service-specific search.

---

### 3.2 Add sort dropdown on category pages

**WHY**: Without sorting, results appear in whatever order the database returns them (currently by `solen_score`). Users have different priorities — some want the highest-rated salon, others want the cheapest, and location-conscious users want the nearest. Sorting gives users control and increases trust. Every marketplace has this.

**BENCHMARK**:
- **Fresha**: Sort by "Recommended" (default), "Top Rated", "Nearest"
- **Airbnb**: Sort by "Price (low to high)", "Price (high to low)", "Top rated"

**HOW**:
- **File**: New `components/ui/SortDropdown.tsx`
- **Options** (matching both benchmarks):
  1. **Empfohlen** (default) — sort by `solen_score` or compound ranking
  2. **Bewertung** — `ORDER BY average_rating DESC NULLS LAST`
  3. **Distanz** — `ORDER BY ST_Distance(...)` (only when GPS is available, otherwise grayed out with tooltip "Standort aktivieren")
  4. **Preis** — `ORDER BY min_service_price ASC` (requires `salon_min_prices` materialized view from DB migration)
- **Position**: Right-aligned, same line as section title "Coiffeure in Basel"
- **State management**: Store in URL query param `?sort=rating` so links are shareable and Back button works
- **Style**: Small dropdown trigger: "Sortieren: Empfohlen ▼" in `text-sm text-[#222] underline`

**IMPACT**: Users who know what they want (cheapest, nearest, best-rated) can find it immediately. This is table-stakes for any marketplace — not having it makes Solen feel incomplete.

---

### 3.3 Add filter bar on category/search pages

**WHY**: Filters are the core of any marketplace discovery experience. Without them, users must scroll through every salon to find one that fits their needs. This is the single biggest gap between Solen and Fresha/Airbnb. Airbnb's filter system is one of the most studied UX patterns in tech — it directly correlates with booking conversion.

**BENCHMARK**:
- **Fresha**: Basic category filters only (Hair, Nails, etc.). Limited filter options.
- **Airbnb**: Extremely sophisticated: price range slider with histogram, type toggles, amenity checkboxes, "Instant Book" toggle, 60+ filters in modal. Active filter count shown as badge.

**HOW**:
- **File**: New `components/ui/FilterBar.tsx` + `components/ui/FilterModal.tsx`
- **Quick filter chips** (always visible, horizontal strip):
  - **"Jetzt geöffnet"** → Uses `isOpenNow()` utility (see 4.1) to filter salons by comparing current time against `opening_hours` JSONB. Only shows salons currently accepting customers.
  - **"Sofort buchbar"** → Filters to salons that have at least one `availability_slots` record with `status='available'` within the next 48 hours. This requires a JOIN or subquery.
  - **"Angebot"** → Filters `salons.last_minute_discount_percent > 0`. Shows salons with active deals.
  - **"Walk-in"** → Filters `salons.walk_in_available = true`. Only relevant for barbershops and some nail studios — NOT coiffeur salons (per your instruction).
- **"Alle Filter" button** opens `FilterModal.tsx` (full-screen on mobile, centered modal on desktop):
  - **Price range**: Dual-handle slider. Min = `0`, Max = `300` (CHF). Data from `salon_min_prices` view. Coral track color.
  - **Rating**: Toggle buttons: "4★ und besser" / "3★ und besser" / "Alle"
  - **Distance**: Radio buttons: 1km / 3km / 5km / 10km / Überall (requires GPS — show "Standort aktivieren" if not granted)
  - **Language**: DE ☐ / EN ☐ / FR ☐ checkboxes (Basel is multilingual — this matters for expats)
- **Active filter count badge**: Small coral circle on "Alle Filter" button showing `(3)` when 3 filters are active
- **"Alle löschen"** button: Resets all filters, visible only when filters are active
- **Results count**: Shows "42 Ergebnisse" below filter bar

**IMPACT**: This is potentially the highest-impact feature in the entire roadmap. Users who can filter get to their ideal salon 3-5× faster. Expected to increase category-page-to-salon-detail conversion by 40%+.

---

### 3.4 Persist filters in URL query params

**WHY**: If a user sets filters and then clicks a salon, reads about it, and hits Back — their filters should still be there. Without URL persistence, filters reset on navigation, which is infuriating. URL params also make filtered results shareable — "here's all 4.5★+ nail salons in Basel under CHF 50" as a link.

**BENCHMARK**:
- **Airbnb**: Full URL persistence: `airbnb.com/s/Basel/homes?price_min=50&price_max=200&min_bedrooms=2`. Every filter change updates the URL in real-time.
- **Fresha**: Limited URL persistence — mostly category-based.

**HOW**:
- Use Next.js `useSearchParams()` and `router.push()` with shallow routing
- Example URL: `/de/coiffeur?sort=rating&open=true&price_min=20&price_max=100&rating=4`
- On page load, parse URL params and pre-populate filter state
- On filter change, update URL params without full page reload

**IMPACT**: Filters survive navigation. Links are shareable. SEO benefit for filtered pages. Professional UX that users expect from any modern marketplace.

---

## Phase 4: "Open Now" Calculation

### 4.1 Create `isOpenNow()` utility

**WHY**: Knowing if a salon is currently open is critical for walk-in potential and creates urgency ("open now, closes in 2 hours"). It's used across multiple features: the "Jetzt geöffnet" filter chip, the salon card badge, and the salon detail page status. Building it as a shared utility ensures consistency.

**BENCHMARK**:
- **Fresha**: Shows "Open" with a green dot on salon detail pages and in search results
- **Airbnb**: Not applicable (lodging doesn't have "open hours")

**HOW**:
- **File**: New `lib/salon-hours.ts`
- **Input**: `opening_hours` JSONB from the salon record. Current format (verified from codebase): `{ "monday": { "open": "09:00", "close": "19:00" }, "tuesday": null, ... }` — `null` means closed that day.
- **Timezone**: All calculations in `Europe/Zurich` (critical — Basel is UTC+1/+2 depending on DST)
- **Returns**: `{ isOpen: boolean, closesAt: string | null, opensAt: string | null, todayHours: { open: string, close: string } | null }`
- **Edge cases**: Handle salons with no `opening_hours` data (return `{ isOpen: false, ... }` with special "Keine Öffnungszeiten" state)
- **Usage points**: FilterBar "Jetzt geöffnet" chip, SalonCard badge, salon detail page status, QuickPreviewSheet (already uses `todayHours` at line 50)

**IMPACT**: Shared utility eliminates duplicated time-parsing logic across 5+ components. Enables the "Jetzt geöffnet" filter and badges.

---

## DB Migrations Needed

### M1: Add `walk_in_available` column

**WHY**: Walk-in availability is a key differentiator for barbershops. Users searching for a quick haircut need to know if they can just show up. This column needs to exist so the filter chip has data to filter on. Per your instruction: only barbershops and some other categories, NOT coiffeur salons.

```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS walk_in_available BOOLEAN DEFAULT false;
-- Pre-populate: barbershops default to walk-in
UPDATE salons SET walk_in_available = true WHERE 'barbershop' = ANY(categories);
```

### M2: Add `salon_min_prices` materialized view

**WHY**: Displaying "ab CHF 35" on salon cards requires knowing each salon's cheapest service. Calculating `MIN(price)` on every card render would be expensive (N+1 query per card). A materialized view pre-computes this and refreshes periodically. Also used by the price filter slider.

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS salon_min_prices AS
SELECT salon_id, MIN(price) as min_price, COUNT(*) as service_count
FROM services WHERE is_active = true
GROUP BY salon_id;

-- Refresh daily or on service price change
CREATE OR REPLACE FUNCTION refresh_salon_min_prices()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY salon_min_prices;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```
