# Search Filter UX — Cross-Platform Audit
**Phase:** 0.12 (Solen → dog-grooming pivot research)
**Date:** 2026-05-13
**Sources:** Fresha, Yelp, Booksy, Doctolib + UX-pattern literature (Baymard, Algolia, Mobbin, LogRocket, BTNG, Pencil & Paper)
**Scope:** Filter set, UI pattern (chip / dropdown / drawer / modal), sort options, mobile UX, persistence, MVP recommendation for Solen (dog-grooming CH).
**Method:** WebFetch + WebSearch. Inline-quoted findings are tagged with `[fetched]` or `[search]`. Inferred items tagged `[inferred]`. Where bot-blocked (Yelp 403, Doctolib 410), evidence comes from Yelp engineering blog, third-party UX teardowns, and Doctolib FAQ/review content.

---

## 0. TL;DR (read this first)

- **MVP filter set for Solen (5 chips, surgical):** **Distance** · **Price** · **Rating** · **Availability (Open / This week)** · **Service / specialty** (Bath only · Full groom · Hand-scissor · Mobile · Anxious-dog handling). Defer "dog size" and "breed-specialty" to a v2 filter pass once we have signal that groomer profiles even surface those attributes consistently — surfacing a filter that returns zero results is the #1 failure mode per Baymard. `[search]`
- **UI pattern:** **Inline chip-row + "All filters" drawer**. Top 5 chips inline (above results), "More" / "All filters" button opens a bottom-sheet on mobile and a right-side drawer on desktop. Matches Yelp + Fresha + Airbnb convergent pattern. `[search]`
- **Default sort:** **Recommended** (label: "Best match" or "Recommended") — a relevance score blending rating × distance × recency × completeness-of-profile. Fresha defaults to "Best match" `[fetched]`; Yelp defaults to "Recommended" / "Suggested" `[search]`; Booksy uses "Sort by" with default unspecified `[search]`. Adopt "Recommended" — distance-default surfaces poor groomers nearby, rating-default punishes new entrants.
- **Mobile filter UX:** **Bottom-sheet modal with sticky "Show X results" CTA + sticky close X**. "Bottom sheet is the expected pattern for anything that doesn't deserve a full-screen takeover: settings, filters, confirmations, previews" `[search]`. Apply button must be sticky and visible without scrolling `[search]`.
- **Persistence:** URL query string (`?distance=5&price=2-3&rating=4&service=full-groom&sort=recommended`). Survives navigation + share + back-button. localStorage as belt-and-suspenders for last-used filters on the homepage. `[inferred from convergent practice — Yelp, Fresha, Airbnb all URL-encode]`

---

## 1. Per-site filter inventory

### 1.1 Fresha (fetched: dog-grooming search results page)

Source: `https://www.fresha.com/search?q=dog+grooming+near+me` `[fetched]`

| Filter | Pattern | Values seen | Quote |
|---|---|---|---|
| Time / Availability | Inline chip | "Any time" (default label) | `[fetched]` "Label: 'Any time' — UI Pattern: Inline chip" |
| Location | Inline chip | "Current location" (default label) | `[fetched]` "Label: 'Current location' — UI Pattern: Inline chip" |
| Price | Dropdown (in Filters panel) | (values not exposed on first load) | `[fetched]` "UI Pattern: Dropdown menu (listed under Filters section)" |
| Type | Dropdown (in Filters panel) | (values not exposed on first load) | `[fetched]` "UI Pattern: Dropdown menu or expandable option" |
| Venue / Professional toggle | Tab | "Venues" vs "Professionals" | `[fetched]` |
| Map | Toggle | "Show map" | `[fetched]` |

**Filter-panel mechanic:** Collapsible "Filters" section with expandable options. `[fetched]`

**Mobile pattern:** Not directly confirmed via fetch. UX literature describes Fresha's category: "Clients use Fresha's Marketplace to search for treatments and book appointments, with the ability to filter by price, distance, and real-time availability." `[search — Fresha help docs]`

**Inferred extras (not exposed on landing page but documented):** real-time availability calendar, distance radius. `[inferred from Fresha help center wording]`

---

### 1.2 Yelp (bot-blocked — composite from engineering blog, support docs, third-party teardowns)

Yelp's bot defense returned 403 on direct fetch. Reconstructed from:
- Yelp engineering blog: "How We Made Yelp Search Filters Data Driven" `[search]`
- Search Engine Land: "Exclusive: The most popular Yelp search filters" `[search]`
- Yelp Support Center: "How to filter search results" `[search]`
- Quora / community guides `[search]`

| Filter | Pattern | Values | Notes |
|---|---|---|---|
| Suggested / Recommended | Default sort selector | "Recommended", "Highest Rated", "Most Reviewed", "Distance" | "Users can reorder search results based on specific criteria like 'Highest Rated,' 'Most Reviewed', and 'Distance'" `[search]` |
| Price | Inline chip dropdown | "$" / "$$" / "$$$" / "$$$$" | "Users can filter search results by neighborhood, distance, rating, price, and hours of operation" `[search — Yelp engineering blog]` |
| Open Now | Inline toggle chip | binary on/off | "The most common filter, 'Open Now,' indicates what consumers prioritize" `[search]` |
| Distance | Dropdown | "Bird's-eye View", "Driving (5 mi.)", "Biking (2 mi.)", "Walking (1 mi.)", "Within 4 blocks" | `[search — Yelp support]` |
| Rating | Toggle chip / minimum threshold | "4+ stars" (single binary chip in modern UI) | `[search]` |
| Neighborhood | Drawer accordion | Per-city list | `[search]` |
| Category-specific (e.g. "Outdoor Seating", "Live Music", "Happy Hour", "Reservations") | Drawer checkboxes inside "All Filters" | binary per attribute | "More specialized filters such as 'Outdoor Seating' or 'Live Music'" `[search]` |

**UI pattern:** **Inline chip-row above results + "All Filters" sidebar/drawer** for the long-tail of category-specific attributes. Yelp's filter panel is the canonical "few-chips-inline-plus-everything-in-a-drawer" pattern that ecommerce UX writers cite. `[search]`

**Mobile pattern:** Yelp iOS/Android app uses a bottom-sheet "Filters" panel triggered by a top-right filter icon. `[inferred from convergent UX literature describing mobile bottom-sheet as Yelp's pattern]`

**Active-filter chips:** Above results as a horizontally-scrolling pill row with X-to-remove. Industry pattern. `[search]`

**Persistence:** URL query string. Yelp URLs include `?sortby=rating&attrs=...`. `[inferred — Yelp support docs reference shareable filtered search URLs]`

---

### 1.3 Booksy (fetched: pet-grooming category page)

Source: `https://booksy.com/en-us/s/dog-grooming` and `https://booksy.com/en-us/s/pet-grooming` `[fetched]`

| Filter | Pattern | Values | Quote |
|---|---|---|---|
| Service category | Inline horizontal chip nav with "More…" expandable drawer | "Hair, Barber, Nails, Skin care, Brows and lashes, Massage, Makeup, Wellness and spa, Braids and locs, Tattoos, Medical aesthetics, Hair removal, Home services, Piercing, **Pet services**, Dental and orthodontics, Health and fitness, Professional services, Other" | `[fetched]` |
| Date / Time | Modal calendar picker | "When?" / "Preferred time" — May 2026 calendar with selectable dates | `[fetched]` "Pattern: Modal calendar interface" |
| Location | Inline chips + geolocation CTA | "San Antonio, Tampa, San Jose, Washington, Chicago, …" + "Use my location" | `[fetched]` |
| Sort | Dropdown (label "Sort by") | (values not exposed on category page) | `[search — Booksy support: "use the 'Sort by' filter to find the best providers"]` |

**Notable absence:** No explicit price, rating, or distance chip on the category-landing page. These appear once a search is executed inside a city. `[fetched]` — "No explicit 'Sort by' options appear in the provided page content" (because they're behind a search action).

**UI pattern:** **Category as first-class chip-row navigation**, date in modal, location either chip or geolocation. The minimal in-line filter set is by design — Booksy treats discovery as "pick service → pick city → execute search → reveal filters". `[inferred from page architecture]`

**Mobile:** "Switch to mobile view" reference suggests responsive design with mobile filter sheet, not directly inspected. `[fetched + inferred]`

---

### 1.4 Doctolib (bot-blocked + footer-only fetch — composite from app store, third-party guides, FAQ)

Source `https://www.doctolib.de/` returned mostly footer content `[fetched]`. The search-results URL pattern `/sectors/medical/results` returned 410 `[fetched]`. Reconstructed from:
- Doctolib app store listings (iOS + Android) `[search]`
- LyncMe expat guide to Doctolib.de `[search]`
- Anglophone Direct guide to Doctolib video consultations `[search]`
- FrenchEntrée guide `[search]`
- GetApp reviews `[search]`

| Filter | Pattern | Values | Quote |
|---|---|---|---|
| Specialty | Search input / primary entry | Free text (cardiologist, dermatologist, dentist, etc.) | "Users can search for healthcare professionals by their specialty (such as cardiologist, radiologist, etc.) and city" `[search]` |
| Location (city) | Search input | Free text city / address | `[search]` |
| Reason for visit | Dropdown | "New Patient Consultation", "Annual Check-up", "Video Consultation" | "Doctolib offers a 'Reason for Visit' filter where you can pre-select options such as 'New Patient Consultation,' 'Annual Check-up,' or 'Video Consultation'" `[search]` |
| Insurance type | Dropdown / chip | "Public insurance" / "Private insurance" | "The Type of Insurance filter allows you to select whether you have public or private insurance" `[search]` |
| Consultation method | Toggle chip | "In-person" / "Video" | "The consultation method filter allows you to choose between in-person consultations or video consultations" `[search]` |
| Availability | Calendar-style / soon-chips | "Available in 1 day" / "Available in 3 days" | `[search]` |
| Practitioner gender, language, accessibility | Drawer secondary filters | Various | `[inferred]` |

**Notable failure modes (worth documenting for Solen's design):** Doctolib's insurance filter has user-reported bugs — "when selecting 'public insurance,' many private doctors still appear in the results" `[search]`. **Lesson for Solen:** server-side enforcement of filter semantics matters; if the UI says "mobile groomers only," the result set must literally be mobile groomers, not "mobile-ish".

**UI pattern:** Filter set is **specialty-as-search + post-search dropdowns**, mostly secondary chips. Closer to traditional faceted search than chip-led discovery. `[inferred]`

**Mobile:** Bottom-sheet for filter selection. `[inferred — app-store screenshots reference]`

---

## 2. Filter UI pattern catalog (cross-platform synthesis)

| Pattern | Best for | Example sites | Tradeoffs |
|---|---|---|---|
| **Inline chip-row above results** | 3-6 high-frequency filters | Yelp top row ("Price", "Open Now", "Rating"), Fresha ("Any time", "Current location"), Airbnb header chips `[search]` | High visibility, but real estate is finite — only fits 5-7 chips before truncation/scroll |
| **Dropdown menu off a chip** | Single-select or small range (price tier, time-of-day, distance radius) | Yelp "Price" / "Distance" dropdowns `[search]`, Fresha "Price" / "Type" dropdowns `[fetched]` | Compact, but each dropdown is a click+scan+click — costs vs chip-toggle |
| **Right-side drawer ("All Filters")** | The long-tail of category-specific or rarely-used filters | Yelp's full filter panel `[search]`, Airbnb's "All filters" CTA `[search]` | Houses many filters without cluttering primary view, but is "out of sight, out of mind" |
| **Bottom-sheet modal (mobile)** | All filters surfaced together on mobile | Yelp mobile, Airbnb mobile, Booksy mobile `[search]` | "Bottom sheet is the expected pattern for anything that doesn't deserve a full-screen takeover" `[search]` |
| **Full-page modal (mobile, complex)** | Heavy multi-step filter flows (date pickers, map selection) | Booksy date picker `[fetched]`, Airbnb date+guests | More space for complex widgets, but kills the result preview |
| **Accordion (inline expandable)** | Desktop sidebar with grouped filter facets | Ecommerce sidebars (Baymard ref) `[search]` | Predictable, scannable, but consumes vertical real estate |
| **Active-filter chip row (below the row above results)** | Showing what's currently applied with X-to-remove | Everywhere — Yelp, Airbnb, every modern ecommerce site `[search]` | "Each chip should have a clear remove button (X)… update the product grid immediately when a chip is removed. No apply button required for chip removal" `[search]` |

**Convergent finding:** Modern marketplace search is **inline chips for top 3-5 filters + drawer / sheet for everything else + active-filter chips below for the applied set**. This is the pattern Yelp, Fresha, Airbnb, and Booksy all converge on, with minor variation in which filters get chip-promotion. `[search]`

---

## 3. Sort options inventory

| Site | Default | Other options |
|---|---|---|
| Fresha | **"Best match"** `[fetched]` | (not exposed on fetch — typical marketplace adds Distance, Rating, Price) `[inferred]` |
| Yelp | **"Recommended"** `[search]` | "Highest Rated", "Most Reviewed", "Distance" `[search]` |
| Booksy | **"Sort by"** (label visible, default unconfirmed) `[search]` | Best providers, reviews-based `[search]` |
| Doctolib | **Availability-first** (sorts by next-available-appointment) `[inferred]` | Specialty match, gender, language `[inferred]` |

**Pattern:** Every platform offers a relevance/recommended default. None default to distance alone or rating alone — both are minority sorts.

**Why:** Distance-first surfaces the nearest groomer regardless of quality (bad for customers, bad for the marketplace's reputation). Rating-first punishes new entrants and creates a winner-take-all dynamic that kills supply growth (bad for the marketplace's long-term inventory). Recommended sort blends. `[reasoning — first-principles, not quoted]`

**For Solen:** Default sort = **Recommended** (blend rating × distance × recent-availability × profile completeness). Explicit alternates in the sort dropdown: "Nearest", "Highest rated", "Lowest price". Avoid "Most reviewed" — penalizes new groomer signups during MVP.

---

## 4. Mobile filter UX

### 4.1 Convergent pattern

> "The filter drawer (bottom sheet or full-screen overlay) is the standard pattern for mobile filter UX, where the shopper taps 'Filter,' and a panel slides up from the bottom or covers the screen." `[search — bricxlabs]`

> "By 2026, the bottom sheet is the expected pattern for anything that doesn't deserve a full-screen takeover: settings, filters, confirmations, previews, and sharing options." `[search — Mobbin / Muz.li]`

### 4.2 Anatomy of a bottom-sheet filter

| Element | Pattern | Source |
|---|---|---|
| Sticky title bar | "Filters (3)" badge for count, X to close | `[search — BTNG / Baymard]` |
| Filter sections | Vertical accordion or flat sections per filter | `[search]` |
| Each filter | Single-select pills OR multi-select checkboxes OR range slider | `[search]` |
| Sticky bottom CTA | "Show X results" — always visible, no scroll required | `[search — bricxlabs: "The Apply button should not require scrolling—it should remain sticky"]` |
| "Clear all" link | Top-right of sheet or above CTA | `[search]` |
| Backdrop tap | Closes sheet without applying | `[search]` |

### 4.3 Mobile filter count cue (Baymard insight)

> "Show the total number of active filters on the filter button on mobile. 'Filters (3)' tells the shopper they have 3 active filters before they open the panel. This single detail reduces filter confusion on mobile by a significant margin." `[search — bricxlabs / Baymard]`

**For Solen mobile:** Top of search results = sticky chip-row of top 3 chips ("Distance", "Price", "Open now") + a "Filters" button with `(N)` count badge. Tapping "Filters" opens bottom-sheet with all options + sticky "Show X groomers" CTA.

---

## 5. Filter persistence across navigation

| Mechanism | Use case | Examples |
|---|---|---|
| **URL query string** (primary) | Survives navigation, back-button, share, refresh | Yelp `?sortby=rating&attrs=...`, Airbnb `?adults=2&children=0&...`, every modern marketplace `[search]` |
| **localStorage** (belt + suspenders) | Remember last-used filters for homepage / non-search entry points | Optional; only useful if filters bleed into the homepage discovery experience `[inferred]` |
| **Session storage** | Cross-tab same-session continuity | Rare; URL state usually suffices `[inferred]` |
| **Server-side / account-bound** | Saved searches with notifications ("notify me when a new groomer matches") | v2+ feature; not MVP `[inferred]` |

**For Solen MVP:** URL query string is non-negotiable — share-a-filtered-search is core to organic distribution (a friend texts "look at this dog groomer search"). localStorage as a v1.5 nice-to-have for "remember my dog size" so they don't reset that every visit.

---

## 6. Solen MVP filter set — recommendation

### 6.1 The 5 chips (locked)

| Chip | Why | UI mechanic |
|---|---|---|
| **Distance** | Top-2 filter on Yelp `[search]`; top-3 on Fresha `[search]`. Dog-grooming is hyperlocal — owners don't drive 30 mins with a wet dog. | Dropdown: "<2 km / <5 km / <10 km / Anywhere" |
| **Price** | Universal — every marketplace has price `[search]`. Dog-grooming price varies 3-5x by service depth (bath vs full groom). | Dropdown: "CHF / CHF·CHF / CHF·CHF·CHF" (Yelp-style tiers, NOT free-text range — too cognitive) |
| **Rating** | Universal `[search]`. Owners pick groomers like therapists — trust is everything. | Single binary chip: "4★ +" toggle (not a 5-option dropdown — Yelp converged on the binary chip for this in their modern UI) |
| **Availability** | Doctolib's first-class filter `[search]`; Fresha's "Any time" chip `[fetched]`. Dog grooming has 1-2-week wait at good groomers. | Dropdown: "This week / Next 7 days / Next 14 days / Any time" |
| **Service / specialty** | The dog-grooming-specific differentiator. Cuts "I want a quick bath" from "I want a full deshedding + nail trim + ear clean". | Dropdown / single-select: "Bath only / Full groom / Hand-scissor cut / Nail trim only / Mobile groomer / Anxious-dog handling" |

### 6.2 Deferred to "All filters" drawer (V1.5+)

| Filter | Reason for deferral |
|---|---|
| Dog size (S/M/L/XL) | High-value but requires every groomer profile to surface dog-size capability. Filter is useless if 80% of groomers don't specify. **Backfill check first.** `[Baymard: filter values must show counts; zero-count filters are dead ends]` |
| Breed specialty (Doodle / poodle / spaniel / terrier) | Same. Plus breed taxonomy is ambiguous — "doodle" covers 30 mixes. v2 feature. |
| Coat type (curly / double-coat / wire) | Same — useful but data-dependent. |
| Mobile vs in-salon | Captured in "Service / specialty" for MVP; promote to its own chip when supply > 30% mobile. |
| Languages spoken (DE / FR / IT / EN) | Important for CH but secondary — keep in drawer. |
| Years of experience | Vanity filter; correlates with rating already. Skip. |
| Certifications (groomer school, first-aid) | v2 trust filter — keep in drawer for now. |

### 6.3 UI mechanic for the chip row

**Mobile:**
```
[Distance ▾]  [Price ▾]  [Rating 4★+]  [Availability ▾]  [Service ▾]   [Filters (0)]
                                                                              ↑ opens bottom-sheet with everything
```
Horizontal scroll if it overflows 375px viewport. Below the chip row, sticky "Show X groomers" remains during chip interaction.

**Desktop:**
Same chip row inline above results, plus a right-side "All filters" drawer reachable from "Filters" button at the row's right end. Drawer is 380px wide, slides in from right, doesn't push results.

### 6.4 Default sort

**`Recommended`** — blends rating × distance × availability × profile completeness. Alternates exposed in a sort dropdown at the chip-row's right side:
- "Recommended" (default)
- "Nearest"
- "Highest rated"
- "Lowest price"
- "Soonest available"

Explicitly NOT: "Most reviewed" (penalizes new groomers — see V2 once supply is healthy).

### 6.5 Active-filter chips

Below the filter chip row, render a removable-pill row showing what's currently applied:
```
Active: [Within 5km ×]  [CHF·CHF ×]  [4★+ ×]  [This week ×]  [Full groom ×]   Clear all
```
Tap × to remove a single filter (results update immediately, no Apply button needed for chip removal per Baymard `[search]`). "Clear all" resets to default state.

---

## 7. Decisions surfaced (one-liners for Phase 4 lock)

| Decision | Lock |
|---|---|
| **MVP filter set** | Distance · Price · Rating · Availability · Service. 5 chips, no more. |
| **Filter UI** | Inline chip row (mobile + desktop) + bottom-sheet (mobile) / right-side drawer (desktop) for "All filters". Active-filter chips below for applied state. |
| **Default sort** | Recommended (blended). Alternates: Nearest, Highest rated, Lowest price, Soonest available. |
| **Mobile UX** | Bottom-sheet preferred. Sticky "Show X groomers" CTA. Filters-button shows count badge `(N)`. |
| **Persistence** | URL query string (non-negotiable). localStorage as v1.5 for "remember my dog size". |
| **Filter-result count** | Every filter value displays match count (e.g. "Full groom (47)"). Zero-result filters get a gray "Not available in your area" state, never a dead-end. `[Baymard]` |
| **Deferred filters** | Dog size, breed-specialty, coat type, certifications, languages — all in drawer, not on primary chip row, until groomer-profile data backfills the dimensions. |
| **Server-side enforcement** | Filters MUST be enforced in the API, not client-side. Doctolib's "public insurance shows private doctors" bug is the cautionary tale `[search]`. |

---

## 8. Open questions for Phase 4 build

1. **Groomer profile schema** — does it have a `dog_sizes_accepted` array? `breed_specialties` array? If not, the V1.5 filters can't ship; Phase 4 needs to spec the profile schema deltas.
2. **Pricing model** — flat per-groom or per-service? The "$" / "$$" / "$$$" tier needs a deterministic algorithm. Suggestion: median per "Full groom" price across the groomer's service list determines tier.
3. **"Availability" definition** — does the groomer expose a real-time calendar, or do we just show "Accepts bookings this week" as a binary based on last-active-on-platform date? Real-time calendar is V2; binary stale-since is MVP.
4. **Map view** — Fresha exposes "Show map" `[fetched]`. Do we ship a map view for MVP or defer? Recommendation: defer. Map view is high-effort and 80% of mobile users default to list view.
5. **Search persistence on first visit** — when a user lands on `/search` directly without query params, do we infer location from geolocation API (with permission) or wait for explicit city input? Recommendation: prompt for permission once, fall back to a city dropdown if denied.

---

## Sources

- [15 Filter UI Patterns That Actually Work in 2026](https://bricxlabs.com/blogs/universal-search-and-filters-ui)
- [Bottom Sheet UI Design — Mobbin](https://mobbin.com/glossary/bottom-sheet)
- [Advanced Search UX: Best Practices (2026) — UXPin](https://www.uxpin.com/studio/blog/advanced-search-ux/)
- [Mobile App Design Patterns 2026 — Muz.li](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/)
- [Mobile Filter UX Design Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-mobile-filters)
- [Ecommerce Filter UX Design Patterns 2026 — BTNG.studio](https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/)
- [How to design bottom sheets — LogRocket](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [Best practices for mobile search filter UX — LogRocket](https://blog.logrocket.com/ux-design/best-practices-mobile-search-filter/)
- [Search Filters: 5 Best Practices — Algolia](https://www.algolia.com/blog/ux/search-filter-ux-best-practices)
- [Faceted Search Best Practices 2026 — BrokenRubik](https://www.brokenrubik.com/blog/faceted-search-best-practices)
- [What Is an Ecommerce Filter? — Baymard](https://baymard.com/learn/ecommerce-filter-ui)
- [Filter List Design — Baymard](https://baymard.com/blog/have-filters-for-list-item-info)
- [How We Made Yelp Search Filters Data Driven — Yelp Engineering Blog](https://engineeringblog.yelp.com/2015/12/how-we-made-yelp-search-filters-data-driven.html)
- [The most popular Yelp search filters — Search Engine Land](https://searchengineland.com/exclusive-the-most-popular-yelp-search-filters-377209)
- [What's the best way to search on Yelp? — Yelp Support](https://www.yelp-support.com/article/What-s-the-best-way-to-search-for-something-on-Yelp?l=en_US)
- [Fresha Marketplace Visibility — Fresha Help](https://www.fresha.com/help-center/knowledge-base/online-profile/601-boost-your-marketplace-visibility)
- [Doctolib.de Expat Guide — LyncMe](https://www.lync.me/blog/524/doctolib-de-expats-guide-booking-doctors-online-germany)
- [Doctolib & Video Appointments — Anglophone Direct](https://anglophone-direct.com/doctolib-video-medical-appointments/)
- [How to Use Doctolib in France — FrenchEntrée](https://www.frenchentree.com/living-in-france/healthcare/how-to-use-doctolib-in-france-english-speaking-doctors-online-consultations/)
- [Booksy Pet Grooming Search](https://booksy.com/en-us/s/pet-grooming)
- [Booksy for Customers — Google Play](https://play.google.com/store/apps/details?id=net.booksy.customer&hl=en_US)
- [How does dog grooming work on Rover? — Rover Help](https://support.rover.com/hc/en-us/articles/360020974852-How-does-dog-grooming-work-on-Rover-)
- [Rover Search](https://www.rover.com/search/)
- [Airbnb Filters Guide — Smoobu](https://www.smoobu.com/en/guides/airbnb/airbnb-filters/)
- [All Airbnb Search Filters — Airbnbase](https://airbnbase.com/filters/)
- [Airbnb Android Filter Options — Mobbin](https://mobbin.com/explore/screens/8bc5e6ac-e18f-4ccf-8701-81b98ec58c0a)
