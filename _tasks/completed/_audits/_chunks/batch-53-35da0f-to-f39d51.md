# Batch 53 — Audit Report

**SHAs:** `35da0f2` → `f39d512`  
**Date range:** 2026-04-04 16:27 → 2026-04-06 08:32  
**Branch:** claude/vigorous-spence-0e9aa7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 35da0f2 | 2026-04-04 16:27 | feat(R7-1): add HomepageHero — headline + AirbnbSearchBar + category chips + micro-trust | 5 | +153/-12 | add | NO | YES | YES | New HomepageHero component (113 lines) introduced: Bebas Neue headline, AirbnbSearchBar integration, frosted-glass category chips; i18n keys added to all 4 locales. Component exists at HEAD. |
| 2 | a4b7e6f | 2026-04-04 16:28 | feat(R7-2): add LastMinuteStrip — real slot data, discount badges, category labels | 1 | +109/-0 | add | NO | YES | YES | New 109-line LastMinuteStrip component: real-time slot consumption, coral discount badge pill, per-category labels. Component still present at HEAD though significantly revised in later commits. |
| 3 | 6fe332e | 2026-04-04 16:29 | feat(R7-3): wire HomepageHero + LastMinuteStrip into homepage, add hero-cinematic bg | 1 | +15/-2 | add | NO | YES | NO | Small wiring commit — imports HomepageHero and LastMinuteStrip into HomePage.tsx, adds hero-cinematic background class. Low-risk integration. |
| 4 | 68a823f | 2026-04-04 16:31 | feat(R7-4): redesign TrustStatsBanner — S2 card pills with icon badges, skeleton loading | 1 | +49/-27 | rewrite | NO | YES (evolved) | YES | TrustStatsBanner rewritten to S2 pill-card layout with Lucide icon badges and Skeleton loading; previous inline stat style replaced. Component further revised in R7-8 and V5 rebuilds. |
| 5 | 8d83f1b | 2026-04-04 16:32 | feat(R7-5): redesign BrowseByCitySection — full-bleed dark #100602, Bebas 76px city list, hover interactions | 1 | +125/-86 | rewrite | YES (partial) | YES (evolved) | YES | Full-bleed dark section: `#100602` bg (near-black, slightly off from `#1A1209` ink token), Bebas Neue 76px city typography, hover scale interactions. Later V5 rebuild changed to dark-glass variant with coral borders. The exact #100602 token is non-standard. |
| 6 | 45fa17b | 2026-04-04 16:35 | feat(R7-6): redesign TestimonialCarousel to 3-col static grid with SVG stars | 1 | +71/-66 | rewrite | YES (carousel→grid) | YES (evolved) | YES | Carousel replaced with 3-col static grid; custom SVG stars introduced (non-lucide). V5 rebuild (commit 8) later reverted back to horizontal carousel with coral avatars, making the grid approach short-lived. |
| 7 | 32049ae | 2026-04-04 22:50 | feat(R7-8): homepage redesign — glass header, inline trust stats, testimonial cleanup, design specs | 36 | +3073/-609 | rewrite | YES (roadmap docs deleted by HEAD) | YES (core changes) | YES | Major multi-file rewrite: glass header (rgba 0.82 + blur 20px), DB query optimization (SALON_COLS_LEAN, removes full-table category-counts scan), animation variant cleanup, Footer warm dark `#2C2825`. Also adds 7 roadmap .md files and docs/design-specs/COMPONENT_SPECS.md — roadmap files are absent at HEAD (deleted). Core component changes persist. |
| 8 | 5e80927 | 2026-04-06 08:22 | Homepage component map V5 rebuild | 12 | +793/-472 | pivot | YES (Partner CTA section removed) | YES | Significant design pivot: homepage bg changed to `#F5F0EB` (cream), Partner CTA moved off homepage to /fuer-salons, FloatingNavPill introduced (new frost-glass mobile nav, 4 icons), TestimonialCarousel reverted to horizontal carousel (overriding commit 6's grid), TrustStatsBanner redesigned again to horizontal compact with Bebas 28px counts; BrowseByCitySection shifts to dark-glass with coral border. New `/api/reviews/homepage` route. |
| 9 | f39d512 | 2026-04-06 08:32 | fix: complete Component Map V2 audit fixes | 7 | +198/-21 | add | NO | YES | YES | Adds HowItWorks.tsx (88-line 3-step onboarding component: Finde/Buche/Geniesse), wires into HomePage, updates FeaturedSalonCarousel (DM Sans 28px/700 title, object-position center top), adds i18n keys for all 4 locales. All components exist at HEAD. |

---

## Summary

**Date range:** 2026-04-04 16:27 → 2026-04-06 08:32 (2 days)

**Defining theme:** Rapid R7 homepage redesign sprint — 8 sequential component adds/rewrites building toward a cohesive coral/glass consumer marketplace homepage, culminating in a V5 spec pivot that course-corrected several earlier decisions (static grid → carousel, Partner CTA removal, cream bg, FloatingNavPill introduction).

### Components Introduced
- `components/ui/HomepageHero.tsx` — coral hero with Bebas headline + AirbnbSearchBar + category chips
- `components/ui/LastMinuteStrip.tsx` — real-time slot strip with discount badges
- `components/layout/FloatingNavPill.tsx` — frost-glass mobile-only bottom nav pill (4 icons)
- `components/ui/HowItWorks.tsx` — 3-step onboarding section
- `app/api/reviews/homepage/route.ts` — real testimonial DB endpoint
- `docs/design-specs/COMPONENT_SPECS.md` — 570-line component specification (persists at HEAD)

### Components Rewritten
- `components/TrustStatsBanner.tsx` — rewritten twice (pill-cards → inline stats → horizontal compact)
- `components/BrowseByCitySection.tsx` — rewritten from list to full-bleed dark, then again to dark-glass
- `components/TestimonialCarousel.tsx` — carousel → static grid → back to carousel
- `components/layout/Header.tsx` — glass blur applied (`rgba 0.82`, backdrop-filter 20px)
- `components/layout/Footer.tsx` — warm dark bg `#2C2825`, then nDSG/social icons removed
- `components/ui/HomepageHero.tsx` — headline centering changed to left-aligned in V5
- `components/HomePage.tsx` — Partner CTA removed, animation variants stripped

### Components Deleted (from homepage)
- Partner CTA section moved off-homepage to `/fuer-salons` (commit 8)

### Design Tokens Added/Used
- `#100602` — non-standard near-black (commit 5; later superseded by dark-glass approach)
- `#2C2825` — footer warm dark (commit 7)
- `#F5F0EB` — cream homepage bg (commit 8 V5; note: CLAUDE.md states page bg reverted to white per Q15 lock 2026-04-22, so this may be superseded at HEAD)
- `rgba(255,255,255,0.78)` + `blur(18px)` — FloatingNavPill glass recipe
- `rgba(255,255,255,0.82)` + `blur(20px)` — Header glass recipe
- Bebas Neue 76px (city list), 28px (stats), Syne 24px/32px applied across components
- `#E8735A` coral (active nav icon) — note: slightly different from system `#E8624A` coral

### Patterns Adopted
- Glass/frosted-blur for header, nav pill, category pills — now systemic
- Real DB data over static mock data (testimonials via `/api/reviews/homepage`)
- SALON_COLS_LEAN optimization (removes services join for category carousels)
- Frosted category pills with horizontal scroll on mobile
- FloatingNavPill as mobile navigation primitive

### Patterns Rejected/Reversed
- Static 3-col testimonial grid (commit 6) → reverted to carousel in V5 (commit 8)
- Stagger animation variants in HomePage removed as dead weight
- Full-table category-counts DB scan eliminated

### Design Drift / Concerns
- `#E8735A` used in FloatingNavPill vs system `#E8624A` — 1-digit coral discrepancy, potential token drift
- `#100602` (commit 5) is non-standard, not in defined palette; superseded but worth noting
- Cream bg `#F5F0EB` introduced in commit 8 conflicts with CLAUDE.md Q15 lock (white bg); HEAD state should be verified

---

## Commits Flagged for Drill-Down

| sha | reason |
|-----|--------|
| **35da0f2** | New HomepageHero component >100 lines, message has "add", touches components/ |
| **a4b7e6f** | New LastMinuteStrip component 109 lines |
| **68a823f** | TrustStatsBanner rewrite, redesign keyword |
| **8d83f1b** | BrowseByCitySection rewrite with non-standard `#100602` token |
| **45fa17b** | TestimonialCarousel redesign — approach immediately reversed in V5 |
| **32049ae** | Largest commit: 36 files, 3073 insertions, multiple component rewrites + docs dump; roadmap files deleted at HEAD |
| **5e80927** | V5 pivot commit: 793 insertions, introduces FloatingNavPill, removes Partner CTA, cream bg — design pivot keyword |
| **f39d512** | New HowItWorks component, message contains "audit fixes" |
