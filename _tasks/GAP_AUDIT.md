# Gap Audit — 2026-04-22

Post-Q1-Q15 lock scan. Identifies inconsistencies between locked decisions and repo state.

---

## 🔴 CRITICAL — breaks internal references

### G1 — MASTER_ROADMAP.md has duplicate `#phase-2` anchor IDs
**File:** `_tasks/MASTER_ROADMAP.md` lines 105 + 167
**Problem:** Both sections use `<a id="phase-2">` — anchor links break.
**Cause:** When I inserted new Phase 1 (UI Polish), old Phase 1/2/3/... sections kept their IDs.
**Fix:** Renumber IDs `phase-2` → `phase-3` → `phase-8` throughout body.
**Effort:** 5 min mechanical edit.
**Priority:** HIGH (docs useful only if links work)

---

## 🟠 HIGH — SOLEN_DESIGN.md contradicts its own decisions log

### G2 — §1 Palette still specifies cream `#FAF6EF` as page bg
**File:** `_tasks/SOLEN_DESIGN.md` lines 22-25
```css
--bg: #FAF6EF;   /* cream — page base */
```
**Contradicts:** Q15 lock (white bg).
**Fix:** Change to `--bg: #FFFFFF`. Retire `--cream` token or annotate as deprecated.

### G3 — §5 Shadows still defines `--sh-xl` + "max 2 per page" rule
**File:** `_tasks/SOLEN_DESIGN.md` lines 182, 196, 198, 201, 308
**Contradicts:** Q11 lock (`--sh-xl` REMOVED entirely, max is `--sh-lg`).
**Fix:** Delete `--sh-xl` token definition, delete "Category tiles/Partner block" rules that use it, delete "Rule: max 2 places" line (irrelevant now).

### G4 — §9 Salon Card hover spec still says `--sh-sm → --sh-xl`
**File:** `_tasks/SOLEN_DESIGN.md` line 308
**Contradicts:** Q11 lock.
**Fix:** Change to `--sh-xs → --sh-sm` (actually already applied to preview — doc is stale).

### G5 — §17 Voice example still quotes "Von Basel. Für Basel."
**File:** `_tasks/SOLEN_DESIGN.md` §17
**Contradicts:** Q5 lock (Swiss-wide voice).
**Fix:** Update copy examples to dynamic city ("Für [city]", fallback "Für deine Stadt").

### G6 — §18 Banned list doesn't include cream bg
**File:** `_tasks/SOLEN_DESIGN.md` §18
**Contradicts:** Q15 retire.
**Fix:** Add row "Cream `#FAF6EF` as page bg → White `#FFFFFF`".

### G7 — SOLEN_DESIGN.md has NO spec for Solen Favorit badge (Q10)
**File:** `_tasks/SOLEN_DESIGN.md` badge section
**Contradicts:** Q10 lock.
**Fix:** Add "Solen Favorit" row to badge table with yellow `#F2C144` bg, algorithmic curation rules.

### G8 — SOLEN_DESIGN.md has NO spec for swipeable card carousel (Q3)
**File:** `_tasks/SOLEN_DESIGN.md` salon card section
**Contradicts:** Q3 lock.
**Fix:** Add sub-section describing Airbnb-pattern carousel: `snap-x snap-mandatory`, pagination dots, 3-5 images per card, swipe gesture.

### G9 — SOLEN_DESIGN.md §11 search bar still shows 4-segment
**File:** `_tasks/SOLEN_DESIGN.md` §11
**Contradicts:** Q4 lock (3-segment: Was · Wo · Wann).
**Fix:** Replace 4-field template with 3-field ASCII spec. Note "Uhrzeit lives in Wann bottom-sheet, not its own segment."

---

## 🟡 MEDIUM — `public/solen-coral.html` preview out of sync

### G10 — Page title still "Beauty. Basel."
**File:** `public/solen-coral.html` line 6
**Contradicts:** Q5.
**Fix:** `<title>solen.ch — Beauty für deine Stadt</title>` or similar Swiss-wide.

### G11 — Hero eyebrow still "Von Basel. Für Basel."
**File:** line 422
**Fix:** "Von der Schweiz. Für dich." or dynamic "Für deine Stadt".

### G12 — Hero H1 still "BEAUTY. BASEL."
**File:** line ~425
**Fix:** "BEAUTY. SCHWEIZ." or similar. Optionally dynamic per detected city.

### G13 — 4th search segment "Uhrzeit/Beliebig" still present
**File:** line 474-475
**Contradicts:** Q4.
**Fix:** Remove the 4th `.seg` block, keep only Kategorie · Quartier · Wann (Was · Wo · Wann).

### G14 — `--sh-xl` token still defined + used 4 places
**File:** line 27 (definition) + lines 117, 133, 317 (usages)
**Contradicts:** Q11.
**Fix:**
- Line 27: delete `--sh-xl` CSS variable
- Line 117 (.search-bar:focus): swap to `--sh-lg`
- Line 133 (.card hover or wherever): swap to `--sh-lg`
- Line 317 (.partner-inner): swap to `--sh-lg` or use custom shadow declaration

### G15 — Many Basel-specific UI strings remain
**File:** `public/solen-coral.html`
Hero copy, stat "38 Salons in Basel", section headers "Top bewertet in Basel", city section "Entdecke Basel", footer tagline, etc.
**Contradicts:** Q5 (voice pivot to Swiss-wide).
**Fix:** Make detected-city dynamic. OR: accept that the preview is a concrete Basel example and note "copy is dynamic per city in production."

### G16 — `--cream` / `--sur: #F3EDE2` / `--sun: #EDE5D8` warm tones still present
**File:** line 13
**Contradicts:** Q15 partial (page is white, but surface tones are still cream-warm).
**Fix:** Decide: do surfaces (`--sur`, `--sun`) stay warm cream-tones or shift to neutral gray? Probably keep warm for card-surface richness; page base is white. Annotate `--sur` as "warm surface for recessed states, not page bg."

---

## 🟢 LOW — production code out of sync (Phase 1 implementation work)

### G17 — `app/globals.css`: `--sh-xl` or shadow-elevation tokens
**File:** `app/globals.css`
**Fix:** Find all `--sh-xl` / `shadow-elevation-3` usages, replace with `--sh-lg` equivalents. Then delete the `--sh-xl` token.
**Effort:** 30 min grep + careful edit.

### G18 — Basel strings in `messages/de.json` (11 references)
**File:** `messages/de.json`
```
"hero_title": "Dein Salon in Basel"
"eyebrow": "Beliebt in Basel"
"title": "Trending in Basel"
...etc
```
**Fix options:**
- **A:** Replace hardcoded "Basel" with `{city}` placeholder + dynamic interpolation. Requires React changes + i18n plumbing (`useCityDetection` hook feeds `<Trans>` or `t()` with value).
- **B:** Replace "Basel" with "deiner Stadt" / "deiner Nähe" (static Swiss-wide).
- **C:** Keep Basel as default fallback, only switch when user has city context.
**Effort:** 1-2 hours (depending on option).

### G19 — `components/ui/HomepageHero.tsx` ships Basel-flavored copy via i18n
**File:** `components/ui/HomepageHero.tsx`
**Fix:** Same as G18 — depends on approach chosen.

### G20 — `components/ui/AirbnbSearchBar.tsx` currently 3 segments (verified)
**File:** `components/ui/AirbnbSearchBar.tsx`
**Status:** **Already 3 segments** ✅ (line 284: "Segment 3: Wann"). Prod matches Q4 already. No fix needed.

### G21 — `components/ui/GuidedSearch.tsx` segment count
**File:** `components/ui/GuidedSearch.tsx`
**Status:** Unverified. Likely needs audit + potential reduction to 3.

### G22 — Solen Favorit badge component (Q10) not built
**File:** new component needed, likely `components/ui/SolenFavoritBadge.tsx`
**Effort:** 15 min component + wire into SalonCard + tailwind token for yellow.
**Phase:** 1.

### G23 — Swipeable image carousel per salon card (Q3) not built
**File:** `components/ui/FeaturedSalonCarousel.tsx` SalonHeroCard subcomponent
**Effort:** 1-2 hours (snap-scroll, pagination dots, lazy-load images, aria-labels).
**Phase:** 1.

### G24 — Claim this listing ribbon (Q13) not built
**File:** new `components/salon/ClaimRibbon.tsx` + wire into SalonCard/detail page gated on `salon.source === 'scraped'`
**Effort:** 30 min.
**Phase:** 2 (alongside scraper).

### G25 — `/termine` → `/profile/bookings` redirect (Q9) not wired
**File:** `middleware.ts` OR replace `app/[locale]/termine/page.tsx` with `redirect()`
**Effort:** 5 min.
**Status:** Currently `/termine` loads `<TerminePage />` (21k LOC component exists). We keep that working, OR set up a redirect.
**Decision needed:** Does `/termine` URL redirect to `/profile/bookings` (lose any SEO) OR keep both URLs live?

---

## 🧾 Roadmap-doc-specific gaps

### G26 — MASTER_ROADMAP Phase 3 body still says "Basel Public Launch"
**File:** `_tasks/MASTER_ROADMAP.md` line 196
**Contradicts:** Q5/Q6 — launch is Swiss-wide, not Basel-only.
**Fix:** Rename "Basel Public Launch" → "Public Launch (Swiss-wide)". Remove Basel-gating language.

### G27 — MASTER_ROADMAP Phase 5 "Swiss Expansion" is redundant
**File:** `_tasks/MASTER_ROADMAP.md` line 300
**Contradicts:** Q5 (platform supports Swiss from day 1).
**Fix:** Rename "Swiss Expansion" → "City Acquisition Focus" (per-city marketing pushes, not platform expansion).

### G28 — MASTER_ROADMAP.md line 363 status line still says "Phase 0 wrap"
**File:** `_tasks/MASTER_ROADMAP.md` end
**Fix:** Update to "Phase 1 start — UI polish via Claude Design (awaiting rate limit)".

---

## 📦 Bundle/CLAUDE.md gaps

### G29 — Desktop bundle README doesn't mention Q15 white bg
**File:** `Desktop/solen-design-bundle/README.md`
**Status:** Was regenerated yesterday with old content. Needs update with new palette line.
**Fix:** `/c/Users/sulod/OneDrive/Desktop/solen-design-bundle/README.md` — update palette + retired list.

### G30 — CLAUDE.md retired list still says "green+peach palette" but not "cream bg"
**File:** `CLAUDE.md`
**Fix:** Add cream bg to retired list + verify palette line matches white.

---

## Summary

| Severity | Count | Fix effort |
|----------|-------|-----------|
| 🔴 Critical | 1 | 5 min |
| 🟠 High (doc consistency) | 8 | 30-45 min mechanical edits |
| 🟡 Medium (preview sync) | 7 | 20-30 min |
| 🟢 Low (prod impl) | 9 | Phase 1 work, 4-6 hours total |

**Total repo-level inconsistency after Q1-Q15 locks:** 30 identified gaps.

**Critical + High + Medium (G1-G16)** = **16 gaps fixable in ~1-1.5 hours of mechanical doc edits.** Does NOT require Claude Design.

**Low (G17-G30)** = real Phase 1 implementation work. Waits for Claude Design OR can be knocked out incrementally.

---

## Recommended next action

**Autonomous doc cleanup pass:** fix G1-G16 right now (~1 hour). Gets SOLEN_DESIGN.md + MASTER_ROADMAP.md + solen-coral.html fully consistent with Q1-Q15 locks. Then everything Claude Design sees when it comes back is a coherent, self-consistent spec.

Then remaining G17-G30 become "concrete Phase 1 work items" that aren't blocked on anything.
