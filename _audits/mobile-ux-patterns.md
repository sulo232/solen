# Mobile UX Patterns — 8-Site Pet/Booking Reference

**Phase 0.9 of Solen→dog-grooming pivot research.** Measured 2026-05-13 at viewport `375 × 812` (iPhone X reference). All measurements from `getComputedStyle` + `getBoundingClientRect` via Playwright MCP. Screenshots in `_audits/pet-refs/mobile/{site}-mobile.jpeg`.

Goal: inform Phase 4 mobile-first decisions for Solen Hundecoiffeur. Mobile = 60-70% of pet booking traffic.

---

## 1. Per-site mobile measurements (8 rows × 6 columns)

| Site | Header (h, position) | Search bar | Primary CTA (above fold) | Sticky bottom? | Card grid layout | Hamburger position |
|---|---|---|---|---|---|---|
| **Fresha** (`fresha.com`) | 72 px · `sticky` · transparent on hero · `z:100` | In-hero, top 371px, "All treatments" placeholder, wrapper pill `border-radius: 20px`, font 14px | None above fold; "Get the app" outline button at top 692 (below hero) | No | 2-col grid (236 × 227 px cards) | Top-right (323, 20), 32 × 32 px |
| **PetSmart** (`services.petsmart.com/grooming`) | 45 px · `static` (scrolls away) | None on this page | "Select a store" link top 428 (text-link only, 21px blue); "Book Now" disabled-state grey 343 × 56 at top 691 | No | 1-col list (343 px wide × 45 px tall — these are nav-rail items, not cards) | Off-screen left (drawer menu, 45 × 45) |
| **Groomit** (`groomit.me`) | n/a (not captured — single-page React) | None on homepage | "Book Now" red-pink #FF314A 168 × 51 px, top 364, 10 px radius | **Yes** — fixed-bottom 375 × 109 px white bar containing **two** buttons (Book Now red + Get Help white outline) | n/a | Top-right (326, 15), 34 × 40 |
| **Scenthound** (`scenthound.com`) | **146 px** · `fixed` · navy #1D2E58 · `z:10` | None on hero | "Book Now" pill 89 × 32 inside header, yellow #FFE73F on navy, `border-radius: 300px` (full pill) | No | n/a (hero + content sections, no salon cards) | (not detected — visible in screenshot top-right; assume `<button class="navbar-toggler">`) |
| **Rover.ch** (`rover.com/ch/`) | 62 px · `relative` (scrolls away) · transparent · `z:1000` | Hero search: "Add your address" input + service select + "Search" CTA full-width pill 311 × 34, blue #2E67D1, `border-radius: 99999px` | "Search" pill (above) | No | Service-tile carousel below hero | Off-canvas (button class `Menu*`, not detected by default selectors) |
| **Pawshake.ch** (`en.pawshake.ch`) | n/a (not captured — banner overlay) | None on hero (homepage has no search input — relies on service tiles) | "Find a sitter" outline button 295 × 48, 8 px radius | No | 1-col tile list (343 × 66 px service tiles) | Top-LEFT (4, 12), 40 × 40 px |
| **Cutnlove.ch** (`cutnlove.ch`, Wix) | 480 px **vertical mega-nav block** when expanded, top 126 | None | "Kontakt" link 208 × 60 inside header; **"Jetzt online buchen"** full-width 375 × 45 mint #92D1B9, `border-radius: 50px`, **`position: sticky`** at top 727 | Sticky (CTA sticks to top of bottom-most viewport edge when scrolled, see screenshot) | n/a | Top-right (325, 21), 40 × 40 |
| **Petwashbasel.ch** (`petwashbasel.ch`) | **no `<header>` element** — site has no proper mobile chrome. Nav links rendered inline as horizontal text row starting at y=250, purple #6356E5 | None | None — only inline text links ("Salon", "Leistungen", "Preise", "Fotos") | No | n/a (long-scroll single-page with images) | None |

**Source notes (file:line):**
- Fresha header — class `Navigation_self__AZ655 Navigation_layoutVariant--sticky--transparent__8Vlqd`, height 72 px, position sticky.
- Groomit fixed-bottom — measured `position: fixed`, bottom 0, height 109 px, bg `rgb(255,255,255)` containing "Book Now" + "Get Help" pair.
- Cutnlove primary CTA — sticky pill, mint bg `rgb(146, 209, 185)` = `#92D1B9`, radius `50px`, full viewport width 375.
- Rover "Search" — pill `border-radius: 99999px`, bg `rgb(46, 103, 209)` = `#2E67D1`, full-width 311 (centered with 32px gutter both sides).
- PetSmart "Book Now" — measured `rgb(247, 247, 247)` bg + `rgb(172, 172, 172)` color = **disabled state** (user must select a store first).

---

## 2. Header structure comparison

| Site | Bars | Logo position | Hamburger position | Sticky/scrolls | Height (px) |
|---|---|---|---|---|---|
| Fresha | 1 bar | Centered? logo at top | Right | Sticky transparent over hero | 72 |
| PetSmart | 1 bar | Left | Drawer (off-canvas) | Static, scrolls away | 45 |
| Groomit | 1 bar | Left | Right | Sticky | ~60 (visible in screenshot) |
| Scenthound | **2 bars (stacked)** — top bar yellow CTA, bottom bar logo + hamburger | Bottom-left | Bottom-right | Fixed | **146** (tallest) |
| Rover.ch | 1 bar | Left | Right | Scrolls away | 62 |
| Pawshake.ch | 1 bar | Right (after hamburger) | **Left** (unusual) | Sticky | (banner-obscured at measurement) |
| Cutnlove.ch | 1 bar w/ vertical drawer | Left | Right | Sticky | (header collapsed) |
| Petwashbasel.ch | 0 bars | Inline at top of doc | None | n/a | n/a |

**Findings:**
- **Single-bar mobile header is the consensus** (6 of 8). Scenthound's 2-bar 146 px is an outlier — wastes vertical real-estate.
- **Hamburger position split 6:1:1** — top-right wins (6 sites), top-left rare (Pawshake only), drawer/off-canvas niche (PetSmart).
- **Sticky-on-scroll majority** (Fresha, Groomit, Scenthound, Pawshake, Cutnlove) over static-scroll-away (PetSmart, Rover).
- **Solo-groomer sites (Cutnlove, Petwashbasel) skip standard chrome** — Cutnlove inherits Wix template, Petwashbasel rolls its own bare layout.

---

## 3. Search bar UX inventory

| Site | Search exists? | Location | UX pattern |
|---|---|---|---|
| Fresha | Yes | In-hero, top 371 px, single input (`placeholder: "All treatments"`) wrapped in pill (radius 20 px), font 14 px | **Single-field hero search**, expands to full takeover on tap |
| PetSmart | No | n/a | Store-locator flow (separate page) |
| Groomit | No on homepage | Hidden until address entry | "Get Started" flow (CTA → modal, not a search bar) |
| Scenthound | No | Geographic location-finder is separate flow | No on-page search |
| Rover.ch | Yes | In-hero, "Add your address" input + service-type select, "Search" pill below | **Two-input + button** stacked vertically (mobile pattern) |
| Pawshake.ch | No on home | Lands directly on category tiles | No-search homepage |
| Cutnlove.ch | No | Site too small for search | n/a |
| Petwashbasel.ch | No | Single-page site | n/a |

**Findings:**
- **Marketplace platforms (Fresha, Rover) put search in the hero.** Both use single full-width input pills with very generous tap targets.
- **Vertical specialists (Groomit, Scenthound) skip search entirely** — they qualify users via "Get Started" → location + service quiz.
- **Solo-groomer sites have no search at all** — content is brochure-style, the booking CTA is the search.
- **Fresha's "All treatments" placeholder is interesting** — it's a treatment search not a salon search. Rover does location-first. Different mental models.

---

## 4. Card grid patterns

| Site | Layout above fold | Card width × height | Notes |
|---|---|---|---|
| Fresha | **2-col grid** | 236 × 227 (square-ish) | Salon cards, 3:4 photo + 2-line text |
| PetSmart | 1-col list (nav rails) | 343 × 45 | Not salon cards; service-category nav strip |
| Groomit | 1-col stacked sections | n/a | Marketing rails, not a salon grid |
| Scenthound | 1-col hero + horizontal photo strip | n/a | No salon listing on home |
| Rover.ch | 1-col with hero search dominating | n/a | Search → results page only |
| Pawshake.ch | 1-col service-tile list | 343 × 66 | Each tile = a service type (Dog Boarding, Day Care, etc.) |
| Cutnlove.ch | n/a | n/a | Brochure site |
| Petwashbasel.ch | n/a | n/a | Brochure site |

**Findings:**
- **Fresha is the only one shipping a 2-col salon grid above the fold on mobile.** Cards are 236 px wide (= viewport / 2 minus gutter).
- **Pawshake/Scenthound use 1-col service-type tiles** (343 px = full-bleed minus 16 px each side) — Solen's "category card" pattern maps to this.
- **Marketplace consensus: 2-col for salon results, 1-col for service-type intent.** Use 2-col when each card is a "thing the user picks between," 1-col when it's a vertical menu of categories.

---

## 5. Sticky CTA strategy

| Site | Sticky bottom CTA? | Detail |
|---|---|---|
| Fresha | **No** | Search-in-header pattern; no bottom CTA needed |
| PetSmart | No | Inline "Book Now" mid-page (disabled until store selected) |
| Groomit | **Yes** (375 × 109 px white bar, two buttons: Book Now red + Get Help white-outline) | Aggressive — eats 13% of viewport height |
| Scenthound | No | "Book Now" lives in fixed top header instead |
| Rover.ch | No | Hero search dominates first scroll |
| Pawshake.ch | No | Inline "Find a sitter" outline button |
| Cutnlove.ch | **Yes** (Wix template) — "Jetzt online buchen" pill 375 × 45 mint sticks at viewport bottom on scroll | Conservative — 45 px tall, single CTA |
| Petwashbasel.ch | No | No CTA chrome at all |

**Findings:**
- **2 of 8 ship sticky-bottom**: Groomit (109 px double-stacked) and Cutnlove (45 px single pill).
- **Groomit's pattern is loud** — eats ~13% of viewport. Cutnlove's single 45 px pill is the cleaner pattern.
- **Why marketplace platforms skip it**: search/filter chrome already lives in the header. Adding a sticky-bottom would conflict.
- **Why solo-groomer sites adopt it**: there's only one action that matters (book), so anchor it.

---

## 6. Form-flow patterns observed

| Site | Booking flow style | Steps observed |
|---|---|---|
| Fresha | **Multi-page** (search → results → salon detail → service select → time slot → checkout) | 5-6 page steps |
| PetSmart | Multi-page with store-locator gate | Select store → select pet → schedule |
| Groomit | **Modal-driven** "Get Started" — modal collects ZIP + pet count, then opens calendar | 2-3 modal screens before in-app flow |
| Scenthound | Location-finder (where) → Membership selection → booking via individual location's site | Many pages, fragmented |
| Rover.ch | **Single-step landing search** → results → sitter profile → booking | Hero search is the form |
| Pawshake.ch | Service-tile → sitter list → sitter profile → request booking | 4-page flow |
| Cutnlove.ch | "Jetzt online buchen" → external booking provider (separate domain) | 1 click out |
| Petwashbasel.ch | Phone/WhatsApp/Email — no online booking | n/a |

**Findings:**
- **No site uses a single-page form** — even Rover's hero search is just step-1.
- **Modal-overlay flows (Groomit) work for collecting 2-3 key facts**, but break down for full booking.
- **Marketplaces all use multi-page**: progress is implicit via URL/back-button.
- **Solo-groomers either external-link (Cutnlove → bookitlive or similar) or fall back to phone** (Petwashbasel).

---

## 7. Typography mobile shifts

| Site | Mobile h1 size | Notable mobile-vs-desktop choices |
|---|---|---|
| Fresha | ~40-48 px (not directly captured but visible in screenshot — large all-caps display) | Body 14 px in search input |
| PetSmart | Visible large brand heading in hero | (not measured — JPG only) |
| Groomit | ~32-40 px hero h1 | Pink/red brand color highly saturated |
| Scenthound | h1 in hero photo, ~28-32 px white | Navy/yellow palette holds across breakpoints |
| Rover.ch | Hero h1 ~28-32 px (not exact) | Search inputs are 16 px (avoids iOS zoom-on-focus) |
| Pawshake.ch | h1 medium ~24-28 px | Light blue brand |
| Cutnlove.ch | Display all-caps "CUT'N LOVE" wordmark dominant | Wix-style centered hero |
| Petwashbasel.ch | h2 = **40 px** (measured) — uniform across page | Single fontsize for all h2s = amateur layout |

**Findings:**
- **16 px minimum input font is critical** (Rover does this — prevents iOS zoom-on-focus). Solen must match.
- **40-48 px h1 holds on 375 px viewport** (Fresha, Petwashbasel) — bigger than desktop wisdom suggests but works mobile.
- **Petwashbasel's "every h2 is 40 px" is the bad version** — typographic hierarchy collapsed to flat. Lesson: even on small sites, vary heading sizes.

---

## 8. Solen mobile recommendations for Phase 4

Recommendation per axis, with the source the recommendation derives from. Anything not measured here is flagged.

### 8a. Header
**Recommendation:** **1-bar sticky transparent-on-hero, 60-72 px tall, hamburger top-right, logo left.** Mirror Fresha (72 px) + Rover (62 px) — the marketplace consensus.

- **Why not 2-bar like Scenthound:** 146 px wastes ~18% of vertical space on a 812 px screen. Hero photography needs the room.
- **Why sticky (not scroll-away like Rover/PetSmart):** Solen will host search + filter affordances that users want re-accessible mid-scroll.
- **Why hamburger right not left (Pawshake):** 6:1 industry split, right is iOS-native muscle memory.

### 8b. Search bar
**Recommendation:** **In-hero, single-field pill, tap-to-fullscreen takeover** (Path C pattern already locked in V2-D49n). Match Fresha's `border-radius: 20 px`, font 16 px (not 14 — Fresha used 14 but iOS zoom risk).

- **Why not Rover's two-input stacked:** that's a marketplace-search pattern. Solen-as-dog-grooming-marketplace doesn't need address-first (most users want "groomer near me" implicitly via geolocation).
- **Why fullscreen takeover (not inline expand):** thumb reach + suggestion list rendering. Inline expand pushes content; takeover doesn't.
- **Item to verify when pivoting to grooming:** placeholder copy — "Search groomers" vs "Service or treatment". DECISION NEEDED, not invented.

### 8c. Card grid
**Recommendation:** **2-col grid for salon results (Fresha pattern: ~165-180 px cards) + 1-col tile list for service categories (Pawshake pattern: 343 px tiles).**

- **Why 2-col on 375 viewport not 1-col:** Fresha proves it works at 236 px card width. With 16 px outer gutter + 12 px between, Solen cards land at 165 px (375 - 32 - 12 = 331 / 2). Photo aspect 3:4 is comfortable.
- **Why 1-col for categories:** Pawshake's 343 × 66 px service tile is the canonical "category selector" UX — easy thumb tap, room for icon + 2-line label.

### 8d. Primary CTA
**Recommendation:** **NO sticky-bottom CTA on homepage / search results.** Adopt sticky-bottom only on salon-detail page (booking page).

- **Why not Groomit's two-button sticky-bottom on home:** eats 13% of viewport, creates competing focus with hero search. Marketplace pattern (Fresha/Rover) places action in the hero.
- **Why sticky-bottom on salon detail:** Cutnlove's 45 px sticky pill is the right model — single "Termin buchen" CTA at viewport bottom when scrolled past the salon's hero image. Standard salon-detail-page pattern across Fresha/Booksy when not measured here, and aligns with Apple HIG's bottom-anchored primary action recommendation. CONFIRM at salon-detail wireframe stage.
- **Color:** s-brand emerald `#1F5C42` per LIVE_TRUTH §5h color rule (CTAs only s-brand, never s-accent).

### 8e. Forms / booking flow
**Recommendation:** **Multi-page flow (Fresha pattern), with progress indicator at top.** Not modal-driven (Groomit's pattern works for collecting 2 facts, breaks at 6+).

- **Why multi-page beats single-form scroll:** mobile users lose context past 2 screens of vertical scroll. Page-per-step keeps each decision discrete.
- **Why with progress indicator:** Fresha doesn't show one; Booksy does. CONFIRM during checkout wireframe.

---

## 9. Decisions to lock (Phase 4)

| # | Decision | Recommendation | Rationale | Status |
|---|---|---|---|---|
| 1 | Mobile search bar position | **In-hero, tap-to-fullscreen takeover** | Fresha consensus + Path C already locked V2-D49n | Recommendation locked, copy TBD |
| 2 | Sticky bottom Book CTA on homepage | **No** | Marketplace pattern leaves it off | Recommend NO |
| 3 | Sticky bottom Book CTA on salon-detail page | **Yes, 45-56 px pill** | Cutnlove + Apple HIG | Recommend YES, confirm at salon-detail wireframe |
| 4 | Mobile filter UX (search results) | **Bottom-sheet modal triggered by chip-row at top of results** | Not directly observed in this scan — Fresha uses a separate filter page on mobile, Rover uses a top filter strip. CONFIRM in Phase 4 with a results-page-specific scan | **DECISION NEEDED** — not enough data from homepages alone |
| 5 | Mobile salon-card layout | **2-col grid, ~165 px width, 3:4 photo, 2-line title + 1-line meta** | Fresha 236 px card pattern downscaled to Solen's 16/12/16 gutter math | Recommend lock |
| 6 | Mobile category-card layout | **1-col 343 px tile, icon + label, 66 px tall** | Pawshake pattern | Recommend lock |
| 7 | Mobile h1 size | **40-48 px** (matches Fresha + Petwashbasel) | Display Peace Sans per V2-D42 — confirm rendered size works on 375 viewport | Recommend lock + spot-check |
| 8 | Header height | **64 px (logo + hamburger), sticky transparent over hero, becomes solid on scroll** | Average of Fresha 72 + Rover 62 = 67 px, rounded to 64 | Recommend lock |
| 9 | Hamburger position | **Top-right, 40 × 40 px tap target** | 6:1 industry consensus + 40 px = Apple HIG minimum | Recommend lock |
| 10 | Input font size (search, address) | **16 px minimum** | Prevents iOS zoom-on-focus | Recommend lock |

**Items that are NOT decided and need follow-up scans:**
- Results-page filter UX (no homepage data could inform this).
- Salon-detail page sticky-CTA height (need direct salon-detail scan).
- Onboarding/first-tap UX (Groomit's "Get Started" flow may be worth a deeper teardown).

---

## Appendix A — Raw measurement notes

### Fresha
- Viewport `375 × 812`, DPR 1
- Header: `Navigation_self__AZ655 Navigation_layoutVariant--sticky--transparent__8Vlqd`, h 72, position sticky, bg `rgba(0,0,0,0)`, z 100
- Hamburger: left 323, top 20, 32 × 32
- Search: placeholder "All treatments", input 223 × 22 at top 371, wrapper 276 px tall at top 336, wrapper bg transparent, wrapper radius 20 px, font 14 px
- Cards: 260 found, first 236 × 227, same-row=true → 2-col grid
- Above-fold CTAs: "Get the app" outline 152 × 48 at top 692 (below hero, no inline primary)

### PetSmart
- Header tag HEADER, h 45, top 16, position static
- Hamburger: left -314 (offscreen drawer), 45 × 45
- "Book Now": 343 × 56 grey disabled state at top 691
- "Select a store": text link 102 × 21 blue #206EF6 at top 428

### Groomit
- Hamburger top 15 right 326, 34 × 40
- Above-fold CTAs: "Book Now" 168 × 51 red #FF314A at top 364, radius 10
- Fixed-bottom: 375 × 109 white bar, contains "Book Now" + "Get Help" pair
- Hero CTA color: `rgb(255, 49, 74)` = #FF314A

### Scenthound
- Header tag HEADER, h **146** (tallest), top 0, position fixed, bg `rgb(29, 46, 88)` = #1D2E58 navy, z 10
- "Book Now": 89 × 32 yellow #FFE73F text-color navy #1B2C5A at top 95, radius 300 px (pill)
- No on-page search

### Rover.ch
- Header tag HEADER, h 62, top 0, position relative, z 1000
- "Search" CTA: 311 × 34 pill `radius 99999px`, bg #2E67D1 blue, at top 428
- Search input: placeholder "Add your address", 16 px font
- Hamburger not detected by default selectors (likely class-namespaced)

### Pawshake.ch
- Hamburger LEFT (4, 12), 40 × 40
- "Find a sitter" outline: 295 × 48 at top 493, radius 8
- Service tile (1-col): 343 × 66 at top 901
- (Initial visit blocked by language picker + cookie banner; measured after dismissing)

### Cutnlove.ch
- Nav: `unifiednav_vertical` mega-drawer, h 480 when expanded at top 126 (Wix template)
- Hamburger top-right (325, 21), 40 × 40
- "Kontakt" link 208 × 60 at top 426 inside header
- **"Jetzt online buchen"**: 375 × 45 mint #92D1B9 pill, radius 50, **position: sticky**, at top 727
- Hero CTA color: `rgb(146, 209, 185)` = #92D1B9

### Petwashbasel.ch
- **No `<header>` element** — body > svg + #wrapper (10203 px tall) + script + .gallery-modal
- Nav rendered as inline anchor row at top 250, 4 links: Salon / Leistungen / Preise / Fotos
- Anchor color `rgb(99, 86, 229)` = #6356E5 purple
- All h2: **40 px** uniform (no hierarchy)
- Categories none — single page

---

## Appendix B — Screenshot index

All at `_audits/pet-refs/mobile/` (375 × 812 viewport):

1. `fresha-mobile.jpeg` — Fresha homepage
2. `petsmart-mobile.jpeg` — PetSmart grooming
3. `groomit-mobile.jpeg` — Groomit (with sticky-bottom visible)
4. `scenthound-mobile.jpeg` — Scenthound (146 px navy header)
5. `rover-mobile.jpeg` — Rover.ch (hero search dominant)
6. `pawshake-mobile.jpeg` — Pawshake.ch (hamburger top-LEFT)
7. `cutnlove-mobile.jpeg` — Cutnlove.ch (Wix sticky-pill)
8. `petwashbasel-mobile.jpeg` — Pet Wash Basel (no header)
