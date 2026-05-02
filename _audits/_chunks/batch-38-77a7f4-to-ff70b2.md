# Batch 38 — Audit Report

**Range:** 77a7f4 → ff70b2  
**Date range:** 2026-03-30 19:32 → 2026-03-30 21:47  
**Branch:** claude/vigorous-spence-0e9aa7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 77a7f4 | 2026-03-30 19:32 | fix: add isolate to main — prevents Framer Motion stacking context overlapping sticky header (N.2) | 1 | +1/-1 | bug-fix | NO | YES | NO | Single-line isolation: adds `isolate` CSS property to root layout to prevent Framer Motion stacking context from bleeding into sticky header z-index. |
| 2 | c68f4c | 2026-03-30 19:34 | fix(footer): Instagram icon inline with legal links, bg updated to #2C2825 per spec 3.3/N.3 | 1 | +13/-14 | bug-fix | NO | YES | NO | Footer background token updated to near-black `#2C2825`; Instagram icon repositioned inline with legal links per spec 3.3. Small structural refactor, no token removal. |
| 3 | 78aaf9 | 2026-03-30 19:35 | fix(tab-bar): icons 24px, border-top rgba(0,0,0,.06) per spec 3.4 | 1 | +2/-2 | bug-fix | NO | YES | NO | Icon size and border correction matching design spec 3.4. Minimal, targeted — no unintended side effects. |
| 4 | 5efb9a | 2026-03-30 20:01 | feat(homepage): spec addendum A.1-A.5 — skeleton cards, search sheet, z-index fixes | 9 | +331/-123 | add | NO | YES | YES | Major homepage feature batch: skeleton shimmer cards, GuidedSearch sheet with step indicators, z-index layering for section bleed. Touches HomePage.tsx, GuidedSearch.tsx, FeaturedSalonCarousel.tsx, globals.css, and all 4 locale JSON files. |
| 5 | 38acc3 | 2026-03-30 20:08 | fix(homepage): complete spec A.4/A.6 gaps — scroll order + search row redesign | 2 | +61/-37 | bug-fix | NO | YES | YES | GuidedSearch category row redesign: icon bg `#F5F0EB`, DM Sans sizing, salon count or ChevronRight, 200ms selection flash before auto-advance. Carousel scroll order moved per A.6. |
| 6 | ca0d65 | 2026-03-30 20:16 | fix(homepage): A.6 scroll order cleanup + A.3/A.4 spec fixes | 3 | +5/-275 | cleanup | YES | YES | YES | Major section removal: Deals, Trending, Near You, Map CTA, Review Carousel, New Salons all stripped from HomePage.tsx (272 lines deleted). Sections removed from product scope — lost if not present at HEAD. |
| 7 | 4431e0 | 2026-03-30 20:49 | fix+polish(homepage): bugs B.1-B.9 + polish P.1,P.3,P.4,P.9,P.10,P.11 | 6 | +89/-76 | bug-fix | NO | YES | YES | Comprehensive bug+polish pass: collapses hero dead space, removes compact pill behavior from GuidedSearch, adds `fadeSlideUp` keyframe, `scroll-fade-right`, `card-tap`, `dotPop` keyframes to globals.css. Header gains scroll-aware glass-frost at 200px threshold. |
| 8 | 1609d8 | 2026-03-30 20:59 | feat(nav): home tab replaces saved in tab bar, saved bookmark in header, fix mobile search scroll glitch | 3 | +42/-12 | add | NO | YES | YES | Tab bar restructure: Home tab replaces Saved tab, Saved bookmark moved to header. GuidedSearch scroll glitch fix on mobile. Navigation pattern shift — first introduction of bookmark icon in header. |
| 9 | 67523b | 2026-03-30 21:07 | fix(header): show S monogram on mobile instead of full logo | 1 | +4/-1 | bug-fix | NO | YES | NO | Mobile header logo swapped to `S` monogram for small screens. Single-concern fix, no design system token changes. |
| 10 | ff70b2 | 2026-03-30 21:47 | feat(homepage): Airbnb-style redesign — search bar, icon category row, per-city carousels, sticky text tabs | 211 | +3131/-504 | pivot | YES | YES | YES | Massive pivot commit: introduces `AirbnbSearchBar.tsx` (208 lines) and `CityCarouselSection.tsx` (193 lines), deletes `CitySelector.tsx` (138 lines). Reorganizes all `_audits/` and `_roadmaps/` folder structures, adds 2 new roadmap docs (search-flow-redesign.md 794 lines, design/search-flow-redesign.md 1129 lines). CLAUDE.md updated. Adds `_rules/UI_RULES.md`. |

---

## Summary

**Date range:** 2026-03-30 19:32 – 2026-03-30 21:47 (single evening session, ~2.25 hours)

**Defining theme:** Rapid homepage spec compliance + Airbnb-style pivot. The batch starts with surgical spec-N micro-fixes (stacking context, footer bg, tab-bar icons) then escalates through four increasingly large homepage spec-addendum commits (A.1–A.6), a comprehensive bug+polish pass, a nav restructure, and finally a landmark pivot that introduces Airbnb-style search UX and per-city carousels in a single 3000+ line commit.

### Components introduced
- `components/ui/AirbnbSearchBar.tsx` — Airbnb-style 3-panel search bar (query / city / date) introduced in commit 10; alive at HEAD.
- `components/ui/CityCarouselSection.tsx` — per-city horizontal carousel section; alive at HEAD.

### Components rewritten
- `components/HomePage.tsx` — substantially rewritten across commits 4–8 and 10; scroll order enforced, sections stripped, Airbnb bar integrated.
- `components/ui/GuidedSearch.tsx` — rewritten across commits 4, 5, 7, 8 (step indicators, category rows, mobile scroll fix, compact pill removed).
- `components/ui/FeaturedSalonCarousel.tsx` — updated in commits 4 and 7.
- `components/layout/BottomTabBar.tsx` — updated in commits 3, 7, 8.
- `components/layout/Header.tsx` — updated in commits 7, 8, 9, 10.

### Components deleted
- `components/ui/CitySelector.tsx` — deleted in commit 10 (replaced by AirbnbSearchBar city picker); LOST.

### Design tokens added
- `#2C2825` footer background (commit 2, spec 3.3)
- `#F5F0EB` category icon background in GuidedSearch rows (commit 5)
- `#8A8178` muted text color for GuidedSearch collapsed labels (commit 6)
- CSS keyframes: `fadeSlideUp`, `dotPop`; utility classes: `.animate-in`, `.scroll-fade-right`, `.card-tap` (commit 7)

### Design tokens removed / patterns abandoned
- Homepage sections: Deals, Trending, Near You, Map CTA, Review Carousel, New Salons — all removed (commit 6)
- GuidedSearch compact pill / scroll-listener behavior — removed (commit 7)
- CategoryStickyRow import from Header — removed (commit 7)
- `CitySelector` component — deleted (commit 10)

### Patterns adopted
- Spec-addendum numbering (A.x, B.x, N.x, P.x) as commit discipline
- Skeleton-first rendering for category cards and carousels
- Scroll-aware glass-frost header (transparent → glass after 200px)
- Airbnb 3-panel search bar pattern
- Per-city carousel sections replacing flat global salon grid

### Patterns rejected
- Breadcrumb on homepage (excluded for all locale variants, commit 4)
- Coral border on search input focus (overridden via `#gs-sheet` selector, commit 7)
- Tab bar "Saved" slot (replaced by Home tab, commit 8)

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 5efb9a | >200 lines changed; touches globals.css, multiple components, all locale JSONs — spec addendum A.1-A.5 |
| 38acc3 | message contains "redesign"; GuidedSearch category row fully redesigned |
| ca0d65 | 275 lines deleted — Deals/Trending/NearYou/MapCTA/ReviewCarousel/NewSalons stripped; verify none reappear |
| 4431e0 | >200 lines; multiple globals.css additions; starts polish pass; message starts with "fix+polish" |
| 1609d8 | Nav structural pivot: tab bar and header bookmark rearrangement |
| ff70b2 | 211 files touched, 3131 insertions; message contains "redesign"; introduces AirbnbSearchBar + CityCarouselSection, deletes CitySelector; reorganizes _audits + _roadmaps; adds UI_RULES.md; updates CLAUDE.md |
