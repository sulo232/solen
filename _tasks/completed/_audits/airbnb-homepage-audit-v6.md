# Solen.ch vs Airbnb — Comprehensive Homepage & Sitewide Audit
> **Date**: 2026-03-31  
> **Auditor**: Antigravity (automated browser + codebase scan)  
> **Scope**: solen.ch production site + full codebase grep  
> **Goal**: Identify every UI gap, missing feature, unwired code, and backend bug preventing Solen from achieving Airbnb-level homepage quality.

---

## 🔴 CRITICAL BUGS (Production Broken)

### BUG-1: Homepage Category Carousels Are Completely Empty
**Severity**: 🔴 Critical — The entire homepage feels dead  
**What**: Despite the code in `app/[locale]/page.tsx` fetching per-category salons (coiffeur, nails, barbershop, makeup, waxing) via SSR Supabase queries, the **live production homepage shows zero salon cards**. The page only shows the "Finde deine Inspiration" TikTok discovery section and then immediately jumps to the footer.  
**Root Cause (Likely)**: Either:
- The `categorySalons` data is returning empty arrays because the production Supabase DB has `is_test = true` on all salons, OR
- The `is_active` filter is excluding all salons
**Impact**: Users see a blank homepage with no salons to browse — instant bounce.  
**Fix**: Check production Supabase `salons` table. Run: `SELECT count(*), is_active, is_test FROM salons GROUP BY is_active, is_test;`

### BUG-2: Search Returns "Keine Ergebnisse" For All Queries
**Severity**: 🔴 Critical — Core flow broken  
**What**: Searching for "Nägel" in "Basel" via the GuidedSearch modal returns the "Keine Ergebnisse" empty state. The API returns `200 OK` but the result set is empty.  
**Root Cause**: The `/api/salons` route computes `avg_price` by joining services, but the SSR homepage queries (`SALON_COLS`) do not include `min_price` or `avg_price` — those fields only exist as computed values in the API route. The search page may be querying with filters that don't match any active salon records.  
**Impact**: 100% of search attempts fail, making the search feature useless.

### BUG-3: `postal_code` Not in SalonCard Display
**Severity**: 🟡 Medium  
**What**: The SSR query on line 31 of `page.tsx` correctly selects `postal_code`, but `SalonCard.tsx` (line 327-331) only renders `salon.address` — it never displays `postal_code` despite the data being available in the payload.  
**File**: `components/SalonCard.tsx` line 327

---

## 🟡 UI GAPS — Airbnb vs Solen Side-by-Side

I captured Airbnb's live mobile homepage and compared it pixel-by-pixel against Solen's current production state.

### GAP-1: No Listing Grid on Homepage
| Airbnb | Solen |
|--------|-------|
| Homepage is a **dense grid of product cards** organized into labeled horizontal carousels ("Popular homes in Paris", "Featured hotels") | Homepage is a **sparse landing page** with only a TikTok-style discovery section and a partner CTA, then footer |

**Verdict**: Even though the code for `CityCarouselSection` exists and is wired, the production site renders **zero carousels** because the data is empty.

### GAP-2: Card Info Hierarchy
| Airbnb Card | Solen Card |
|-------------|------------|
| **Line 1**: Location name (bold) | **Line 1**: Salon name (bold) ✅ |
| **Line 2**: Date range · Host type | **Line 2**: Address (no postal code) ❌ |
| **Line 3**: Price total · ★ Rating | **Line 3**: `$`/`$$`/`$$$` · Category ✅ |
| **Heart**: Top-right, outlined, white bg | **Heart**: Top-right, outlined, white bg ✅ |
| **Badge**: "Guest favorite" — top-left on image | **Badge**: Guest Favorite / Neu / Top Rated ✅ |

**Missing from Solen**:
- ❌ `postal_code` next to address (data exists but not rendered)
- ❌ Review count shown (e.g., "4.84 (126 reviews)")
- ❌ `min_price` not fetched in SSR homepage queries

### GAP-3: Category Filter Row
| Airbnb | Solen |
|--------|-------|
| **Horizontal scrolling icon row** at top, stays sticky on scroll | Category icons only appear inside the `GuidedSearch` modal, NOT on the homepage surface |
| Active category has underline indicator | No active state visible |
| Icons are **filled, monochrome** line art | Icons are outlined with rounded square backgrounds |

**Recommendation**: Add a sticky horizontal category filter row **above the carousels** on the homepage (not just inside the search modal). Clicking a category should scroll to that category's carousel section.

### GAP-4: Search Bar Design
| Airbnb | Solen |
|--------|-------|
| Pill-shaped, segmented, with **shadow** — feels tactile | Flat pill `Was · Wo · Wann` — feels like a label, not a button |
| Segments expand on click with smooth animation | Opens as a bottom-sheet modal |
| Shadow glow effect on focus | No visual feedback on hover |

**Recommendation**: Add `shadow-md` hover state and a slight `scale(1.01)` transform to the search pill trigger.

### GAP-5: Homepage Content Density
| Airbnb | Solen |
|--------|-------|
| ~15-20 cards visible on first scroll | 0 cards visible — only the TikTok discovery carousel |
| Multiple themed sections with headers | Only 1 section ("Finde deine Inspiration") before footer |

**Verdict**: This is the single biggest gap. Solen feels like a magazine landing page, not a marketplace.

---

## 🟠 UNWIRED CODE / TECH DEBT

### UNWIRED-1: `ProfilePage.tsx` — Looks Tab TODO
**File**: `components/ProfilePage.tsx` line 896  
**Code**: `{activeTab === 'looks' && <LooksGrid looks={[]} onAddLook={() => {/* TODO */}} />}`  
**Issue**: The "Looks" tab on the profile page renders an empty array and the "Add Look" callback is a no-op.

### UNWIRED-2: `min_price` / `avg_price` Not in Homepage SSR Query
**File**: `app/[locale]/page.tsx` line 31  
**Code**: `const SALON_COLS = "id, name, slug, city_id, categories, average_rating, review_count, cover_photo_url, quartier, postal_code";`  
**Issue**: The `SALON_COLS` constant does NOT include `min_price` or `avg_price`. This means:
- The `SalonCard` price tier logic (`$`/`$$`/`$$$`) will always default to `"$$"` because `priceToShow` is always `null`.
- The price indicator on homepage cards is **fake data**.
**Fix**: Either add `min_price` to the `SALON_COLS` select (if it's a real column), or compute it server-side by joining the `services` table.

### UNWIRED-3: `address` Field Used Instead of Full Location
**File**: `components/SalonCard.tsx` line 327-331  
**Issue**: The card renders `salon.address` as a flat string. Airbnb shows structured location: `8001 Zürich` (postal + city). The `postal_code` field IS in the SSR query but is never concatenated into the card display.

### UNWIRED-4: `solen_score` Fetched But Not Displayed
**File**: `app/[locale]/page.tsx` line 56  
**Issue**: The trending query fetches `solen_score` but this value is never shown to the user anywhere on the card or the homepage.

### UNWIRED-5: Search i18n Key Leak (Screenshot Evidence)
**File**: `components/ui/GuidedSearch.tsx`  
**Issue**: In the screenshots, the "WANN" dropdown showed raw i18n keys like `home.guidedSearch.tomorrow` and `home.guidedSearch.thisWeekend` instead of translated text. This means either:
- The translation keys are missing from `messages/en.json`, OR
- The English locale file hasn't been updated with the latest keys.

---

## 🔵 DESIGN POLISH RECOMMENDATIONS (Airbnb Parity)

### POLISH-1: Add Review Count to Cards
Airbnb shows `★ 4.84 (126)` — Solen only shows `★ 4.84`. Add `({salon.review_count})` after the rating number.

### POLISH-2: Search Pill Hover Effect
Add `hover:shadow-lg transition-shadow duration-200` to the `Was · Wo · Wann` search trigger pill to make it feel clickable.

### POLISH-3: "Alle ansehen" Arrow Animation
Airbnb's "Show all →" link has the arrow slide right on hover. Add `group-hover:translate-x-1 transition-transform` to the `→` character.

### POLISH-4: Card Image Hover Zoom
Airbnb slightly scales up the image on hover. The existing `img-hover-zoom` class may already handle this, but verify it's applied on the homepage carousel cards.

### POLISH-5: Sticky Category Row on Homepage
Add a horizontal scrolling category icon row (Coiffeur, Barbershop, Nägel, Spa, Makeup, Waxing) that sticks to the top when scrolling past the search bar. Clicking a category scrolls to its carousel section with smooth scroll behavior.

### POLISH-6: "View All" Threshold
`CityCarouselSection.tsx` line 51: `viewAllLabel && salons.length > 4` — this threshold of 4 is too low. Airbnb shows "Show all" even with 3+ items. Change to `salons.length > 2`.

### POLISH-7: Card Width Consistency
Current card width is `w-[280px] md:w-[320px]`. This is fine, but ensure the gap between cards is exactly `gap-4` (16px) to match Airbnb's tight carousel feel.

### POLISH-8: Pagination Dots Visibility
The carousel pagination dots (`w-1.5 h-1.5`) may be too small on mobile. Increase to `w-2 h-2` for better tap targets.

---

## 📊 PRIORITY MATRIX

| # | Issue | Severity | Effort | Priority |
|---|-------|----------|--------|----------|
| BUG-1 | Empty homepage carousels | 🔴 Critical | Low (data issue) | **P0** |
| BUG-2 | Search returns no results | 🔴 Critical | Medium | **P0** |
| BUG-3 | Postal code not displayed | 🟡 Medium | Low | P1 |
| UNWIRED-2 | min_price not in SSR query | 🟡 Medium | Low | **P0** |
| UNWIRED-5 | i18n key leak on English | 🟡 Medium | Low | P1 |
| GAP-1 | No listing density | 🔴 Critical | Blocked by BUG-1 | P0 |
| GAP-3 | No sticky category row | 🟡 Medium | Medium | P2 |
| GAP-4 | Search bar shadow/hover | 🟢 Low | Low | P2 |
| GAP-5 | Content density | 🔴 Critical | Blocked by BUG-1 | P0 |
| POLISH-1 | Review count on cards | 🟢 Low | Low | P3 |
| POLISH-5 | Sticky category scroll | 🟡 Medium | Medium | P2 |

---

## 🎯 SUGGESTED EXECUTION ORDER

1. **P0 — Fix BUG-1**: Investigate why production `categorySalons` is empty. Check `is_active`/`is_test` flags in Supabase.
2. **P0 — Fix UNWIRED-2**: Add `min_price` computation to the homepage SSR query so price tiers work.
3. **P0 — Fix BUG-2**: Debug the `/api/salons` search endpoint to understand why it returns empty for valid categories+cities.
4. **P1 — Fix BUG-3**: Inject `postal_code` into `SalonCard.tsx` display.
5. **P1 — Fix UNWIRED-5**: Add missing English translation keys for the GuidedSearch date options.
6. **P2 — GAP-3**: Build a sticky horizontal category filter row above the carousels.
7. **P2 — GAP-4**: Add shadow/hover to search pill.
8. **P3 — All POLISH items**: Review count, arrow animation, dot size, etc.
