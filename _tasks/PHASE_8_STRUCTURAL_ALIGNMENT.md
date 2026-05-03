# Phase 8 — Structural Alignment Against Reference

**Locked 2026-05-03.** Companion to L8 in `SOLEN_BUILD_LEARNINGS.md`.

## Why this exists

Phases 0–7 corrected **token drift** (colors, classes, typography modifiers).
But the live homepage doesn't *structurally* match `public/solen-coral.html` —
different hero copy, missing sections, different card pattern. Token sweeps
can never close that gap. Phase 8 is page-by-page structural alignment.

Every gap below cites a specific reference line. **No invented gaps.**

---

## Source-of-truth files

- **Reference:** `public/solen-coral.html` (4881 lines, locked design preview)
- **Decisions log:** `_tasks/SOLEN_DESIGN.md` §20 (Q-locks)
- **Live homepage entry:** `app/[locale]/page.tsx` → `components/HomePage.tsx`
- **Live hero:** `components/home/HeroAboveFold.tsx`

---

## Reference homepage section map (lines 686–1130)

| # | Section | Lines | Live equivalent |
|---|---|---|---|
| 1 | NAV | 686-711 | `components/Header.tsx` (?) |
| 2 | HERO | 712-762 | `components/home/HeroAboveFold.tsx` |
| 3 | SEARCH BAR (inline horizontal) | 763-786 | **MISSING** — only stacked button in hero |
| 4 | STATS | 787-800 | `TrustStatsBanner` (rendered later, not here) |
| 5 | CATEGORIES tile grid | 801-821 | **MISSING** — live has only per-category carousels |
| 6 | SALON CARDS ("Top bewertet in Basel") | 822-899 | `FeaturedSalonCarousel` (different pattern) |
| 7 | SLOTS + BOOKING SUMMARY | 900-950 | **MISSING** |
| 8 | LAST MINUTE | 951-994 | `LastMinuteStrip` (conditional, may differ) |
| 9 | REVIEWS | 995-1029 | `TestimonialCarousel` (need diff) |
| 10 | INSTAGRAM TILES | 1030-1060 | **MISSING** |
| 11 | NEIGHBOURHOOD ("Entdecke Basel") | 1061-1083 | `BrowseByCitySection` (different pattern) |
| 12 | PARTNER | 1084-1116 | **MISSING** |
| 13 | TRUST STRIP | 1117-1129 | (subset of `TrustStatsBanner`?) |
| 14 | FOOTER | 1130+ | `components/layout/Footer.tsx` (now correct) |

---

## Tier S — Immediately above-the-fold gaps (highest user-visible impact)

### S1 — Hero copy + 2-tone Anton headline

| | Live | Reference |
|---|---|---|
| Eyebrow | `Schweizer Salons · Direkt buchen` | `Von der Schweiz. Für dich.` |
| Headline | `Finde deinen Salon.` (1 line, solid ink) | `BEAUTY.` / `DIREKT GEBUCHT.` (2 lines, second in amber) |
| Sub-line | "Coiffeur · Barber · ... 30 Sekunden." | (none — chips replace) |

- **Reference cite:** `public/solen-coral.html:719-721`
  ```html
  <span class="hero-eyebrow reveal">Von der Schweiz. Für dich.</span>
  <h1 class="hero-h1 reveal r2">BEAUTY.<br><span class="coral">DIREKT GEBUCHT.</span></h1>
  ```
- **Amber override cite:** `public/solen-coral.html:~750`
  ```css
  .hero-h1 .coral { color: var(--amber) !important; }
  ```
- **Decision needed from user:** keep current marketing copy ("Finde deinen Salon" is more functional) or switch to reference copy ("BEAUTY. / DIREKT GEBUCHT" is the locked brand voice). **Cannot decide unilaterally — copy is brand.**
- **File to touch (after decision):** `components/home/HeroAboveFold.tsx:44-56` + extend `SignatureLockup` to support 2-tone splits OR drop SignatureLockup here for raw `<h1>`.

### S2 — Three promise pills (Sofort buchbar / Ohne Anrufen / Heute frei)

- **Reference cite:** `public/solen-coral.html:722-726`
  ```html
  <span class="hero-chip hero-chip-green">Sofort buchbar</span>
  <span class="hero-chip hero-chip-amber">Ohne Anrufen</span>
  <span class="hero-chip hero-chip-blue">Heute frei</span>
  ```
- **Live state:** Not present in `HeroAboveFold`.
- **Action:** Add 3 promise chips below headline, before CTAs. Tinted bg (sage / amber / blue) + colored dot + label. Component candidate: new `<HeroPromisePills>` primitive or inline.
- **Risk:** Low. Additive. Can ship without removing anything.

### S3 — Hero CTAs (replace stacked search button)

| | Live | Reference |
|---|---|---|
| CTA 1 | 3-row stacked Was/Wo/Wann button → opens GuidedSearch sheet | `Salon finden` btn-coral (icon + label) |
| CTA 2 | Quick-action chips below | `Last Minute →` btn-outline |

- **Reference cite:** `public/solen-coral.html:728-735`
- **Decision needed from user:** the live stacked-button + GuidedSearch sheet IS a deliberate Q49 Fresha-flow pattern (locked per JSDoc comment line 59). Reference uses simpler 2-CTA + side search panel. **These are conflicting design directions** — only user can resolve which one wins.

### S4 — Hero search panel (right-side card vs in-line stacked)

- **Reference:** Hero has a `hero-visual` card on the right with title + amber HEUTE pill + search input + green Suchen + chips. Cite: `public/solen-coral.html:736-762`.
- **Live:** Has the stacked button replacing both CTAs and panel.
- **Conflict with S3** — same Q49 vs reference tension.

---

## Tier A — Below-the-fold structural gaps

### A1 — Inline horizontal SEARCH BAR (Was/Wo/Wann/Suchen)

- **Reference cite:** `public/solen-coral.html:763-786`
  ```html
  <div class="search-bar">
    <div class="seg"><div class="seg-l">Was</div><div class="seg-v">Coiffeur</div></div>
    <div class="seg"><div class="seg-l">Wo</div><div class="seg-v ph">Deine Stadt</div></div>
    <div class="seg"><div class="seg-l">Wann</div><div class="seg-v">Heute</div></div>
    <button class="search-btn">Suchen</button>
  </div>
  ```
- **Live state:** Not present. The only search affordance is the stacked button in hero (S3).
- **Action:** New `<InlineSearchBar>` component below hero. Or — if S3 resolves to "keep stacked", this section is OBSOLETE.
- **Decision needed:** depends on S3.

### A2 — Categories tile grid ("Was suchst du?")

- **Reference cite:** `public/solen-coral.html:801-821`
- 6 tiles, each with solid per-category color + Anton uppercase name + count:
  - COIFFEUR `#D4870A` (amber-deep) · 42 Salons
  - BARBER `#4A1E3C` (plum) · 18 Shops
  - NAILS `#E8624A` (coral) · 24 Studios
  - SPA `#7BA688` (sage) · 11 Anbieter
  - MAKEUP `#C9A96E` (sand) · 8 Studios
  - WAXING `#6BA3C8` (blue) · 15 Salons
- **Live state:** Live has per-category carousels via `FeaturedSalonCarousel` instead of a tile grid.
- **Action:** Add `<CategoriesGrid>` component above the per-category carousels. Both patterns can coexist (grid for navigation, carousels for top-rated samples).
- **Risk:** Low. Additive.

### A3 — Salon cards pattern (HUGE structural difference)

- **Reference cite:** `public/solen-coral.html:847-865`
- Reference card anatomy:
  - `.card-img` filled with **solid category color** (sand/plum/sage/etc.) — NO photo
  - **Salon initials in massive Anton uppercase** rendered AS the visual (e.g. "AMARA", "NORI", "KORU")
  - Heart button + optional "Solen Top Pick" badge overlay
  - `.card-body` below: name, rating, location, **availability chip** ("Heute 14:30 frei" — green tint), price, **2 category tags** (with category color per tag)
- **Live state:** `FeaturedSalonCarousel` cards use real photos from `cover_photo_url`/`gallery_urls`, with a single category badge and no availability chip and no per-card category tags.
- **LOCKED 2026-05-03:** Option **B** — kill photos entirely on cards, full colored-initial only ("we arent even live yet"). No `cover_photo_url` / `gallery_urls` rendering on `.card-img`. Photos may still appear on salon detail page (Phase 9 scope).
- **Files affected:** `components/SalonCard.tsx`, `components/ui/FeaturedSalonCarousel.tsx`, `components/ui/ImageFallback.tsx` (orphaned — delete after sweep).
- **Implementation pattern (cited from `public/solen-coral.html:225-245, 847-865`):**
  - `.card-img`: 1:1 square, solid category bg, Anton 56px white centered, letter-spacing 0.04em
  - Salon name treatment: first word uppercased, common prefix stripped ("Salon X" → "X")
  - Category solid colors: COIFFEUR `#D4870A`, BARBER `#4A1E3C`, NAILS `#E8624A`, SPA `#7BA688`, MAKEUP `#C9A96E`, WAXING `#6BA3C8`

### A4 — Filter row above salon cards

- **Reference cite:** `public/solen-coral.html:838-846`
- Buttons row: `[Heute (coral)] [Morgen] [Diese Woche] | [Online-Zahlung (amber)] [4+ Sterne] [Nebenzeiten]`
- **Live state:** Not present on home (lives only on `/discover`).
- **Action:** Add filter chip strip above the "Top bewertet in Basel" carousel.
- **Risk:** Low if the filter chips are decorative-only initially (no live filtering); MEDIUM if they need to actually filter the data shown below.

---

## Tier B — Sections live is missing entirely

| Tier | Section | Reference cite | Risk to add |
|---|---|---|---|
| B1 | SLOTS + BOOKING SUMMARY ("Wähle deine Zeit") | `:900-950` | HIGH — needs real availability data via API. Could be removed from the homepage and limited to salon detail page. |
| B2 | INSTAGRAM TILES ("Auf Instagram") | `:1030-1060` | LOW — additive grid. Needs salon Instagram data plumbing. |
| B3 | NEIGHBOURHOOD ("Entdecke Basel") | `:1061-1083` | LOW — `BrowseByCitySection` already exists; refit to match reference 2-line heading + structure |
| B4 | PARTNER section | `:1084-1116` | LOW — additive. Marketing block linking to `/partner`. |

---

## Tier C — Live has, reference doesn't (orphans)

| | Live component | Status |
|---|---|---|
| C1 | `RecentlyViewed` | Logged-in personalization. Reference shows logged-out marketing. **Keep — gated to logged-in users.** |
| C2 | `NearbySection` | Geo-personalization. **Keep.** |
| C3 | `DiscoverSection` | Generic discovery card. **Possibly retire** if categories grid (A2) covers it. |
| C4 | Rebook prompt card | Logged-in re-engagement. **Keep — gated.** |
| C5 | `BrowseByCitySection` | Same as B3 — refit, don't retire. |
| C6 | `TestimonialCarousel` | Same intent as REVIEWS section (B). **Refit to match reference style.** |

---

## Sequenced execution plan (after user decisions)

### Phase 8.1 — Above-fold (S1, S2, S3, S4) — **needs user decisions first**
Cannot proceed without user picking:
- (a) Hero copy: keep "Finde deinen Salon" or switch to "BEAUTY. / DIREKT GEBUCHT."
- (b) Hero CTAs: keep Q49 stacked-search-button or switch to reference 2-CTA + side panel

### Phase 8.2 — Inline search bar (A1) — **gated by 8.1**
Only meaningful if S3 keeps the stacked-button hero pattern (then A1 fills the secondary search role).

### Phase 8.3 — Categories tile grid (A2) — **autonomous, low risk**
Build `<CategoriesGrid>` above the existing per-category carousels. Additive.

### Phase 8.4 — Salon card pattern (A3, A4) — **needs user decision**
Photo-only / initials-only / hybrid. Recommend hybrid.

### Phase 8.5 — Missing sections (B1, B2, B3, B4) — **partly autonomous**
- B3 + B4 can ship autonomously (additive marketing blocks).
- B1 needs API data wiring → larger scope.
- B2 needs Instagram plumbing → larger scope.

### Phase 8.6 — Resolve Tier C orphans (C3, C5, C6) — **case by case**
- C3: only retire if A2 supersedes it (gated by 8.3).
- C5: refit to match reference structure.
- C6: refit, don't retire.

---

## Verification checklist (per Guardrail B + C from L8)

For each Phase 8.x fix shipped:

1. Cite the reference line(s) in the commit message.
2. Take both screenshots (live + reference of matching section).
3. Visual diff — do they look like the same design system?
4. Only THEN claim the section is aligned.

NEVER claim a section "matches design system" without:
- Reference line citation
- Side-by-side screenshot comparison

---

## Out of scope for Phase 8

- Subpages (salon detail, booking wizard, profile, dashboard) — Phase 9+
- Backend data plumbing for B1/B2 — separate stream
- Mobile-specific layouts — done within each phase, not a separate phase
- Token drift (handled in Phase 7)
