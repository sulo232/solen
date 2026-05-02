# Batch 39 — Audit Report
**Commits:** 2efc24 → 8195fc  
**Date range:** 2026-03-30 22:09 → 2026-03-31 00:11  
**Branch:** claude/vigorous-spence-0e9aa7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 2efc24 | 2026-03-30 22:09 | fix(homepage): restore salon cards (remove invalid minimum_price column), re-add GuidedSearch for mobile, search icon always visible in header | 5 | +18/-6 | bug-fix | NO | YES | NO | Removed invalid `minimum_price` column ref from CityCarouselSection; restored GuidedSearch for mobile and pinned search icon in header. Small surgical fix. |
| 2 | 426531 | 2026-03-30 22:14 | docs: add LESSONS_LEARNED.md + mandatory update rule in CLAUDE.md | 2 | +149/-0 | docs-only | NO | YES | NO | Introduced `_rules/LESSONS_LEARNED.md` (129 lines) with documented bugs/fixes and mandate to update it after each incident. Alive at HEAD. |
| 3 | 9f6e55 | 2026-03-30 22:17 | feat(mobile): replace S+search icon with search bar pill on homepage, card-style category icons, logo hidden on mobile | 2 | +37/-20 | add | NO | PARTIAL | YES | Mobile header redesign: search pill replaces old icon; logo hidden on mobile; card-style category icons introduced. Later commits further reworked these components. drill=YES for design scope. |
| 4 | e8bdb7 | 2026-03-30 22:38 | feat(homepage): Airbnb-style category photo cards + city selector on category pages | 2 | +292/-127 | rewrite | YES | PARTIAL | YES | Major HomePage rewrite (~495-line diff): Airbnb-style photo cards (155×200px) with gradient, localStorage recent-visit bubble-up, coral dot indicator. Also added city selector pills on CategoryPage. The exact photo-card pattern was later replaced by real salon carousels. City selector may survive. drill=YES for size+rewrite. |
| 5 | 7c004c | 2026-03-30 22:46 | feat(homepage): per-category salon carousels replace abstract photo cards | 3 | +73/-75 | pivot | YES | YES | YES | Reverted Airbnb abstract photo-card section from e8bdb7 in favor of real SSR-queried CityCarouselSection per category (coiffeur/nails/barbershop/makeup/waxing). `viewAllHref` + `onViewAll` props added to CityCarouselSection. Pivoted quickly — photo cards were dead-on-arrival. |
| 6 | 8e03de | 2026-03-30 22:53 | feat(header): permanent mobile search pill in header + roadmap | 3 | +117/-36 | add | YES | YES | YES | Removed scroll-gated search pill from HomePage; made it always-visible in Header. Added `_roadmaps/roadmap-homepage-v6-rebuild.md` (103 lines) tracking V6 phases. Roadmap doc is key design artifact. |
| 7 | 430aa6 | 2026-03-30 23:43 | feat(homepage): execute V6 rebuild roadmap — Airbnb cards, Entdecken carousel, category validation | 17 | +589/-468 | rewrite | YES | PARTIAL | YES | Largest commit in batch (~1057-line diff). SalonCard image ratio changed from `aspect-[3/2]` to `aspect-[20/19]` mobile + `md:aspect-square` desktop with native swipe carousel. GuidedSearch category validation added. New `CategorySkeleton`, `useRecentVisits` hook, `category-icons.tsx`, 5 spec docs added. aspect-[20/19] later superseded by `aspect-square` at HEAD. |
| 8 | 1b29df | 2026-03-31 00:03 | feat(homepage): V6 V2 spec — postal_code, carousel heading typography, skeleton parity | 6 | +44/-32 | add | NO | YES | YES | Added `postal_code` column via migration + typed in `lib/types.ts`; SalonCard renders postal code. CityCarouselSection heading upgraded to large Syne clamp typography (clickable link). CategorySkeleton CLS fixes to match aspect ratio. Design-significant heading typography change. |
| 9 | b81454 | 2026-03-31 00:07 | docs: add lesson — verify component renders correct child before marking roadmap phase done | 1 | +9/-0 | docs-only | NO | YES | NO | Single 9-line append to LESSONS_LEARNED.md documenting component verification lesson. No design impact. |
| 10 | 8195fc | 2026-03-31 00:11 | fix(homepage): P3 R1 + P1 R3 — CityCarouselSection uses real SalonCard, heading font fixed | 2 | +19/-141 | cleanup | YES | YES | YES | Replaced inline AirbnbSalonCard clone inside CityCarouselSection (~141 lines removed) with real SalonCard component. GuidedSearch category font corrected from inline CSS to design-token className. Large net-negative diff — good deduplication. |

---

## Summary

**Date range:** 2026-03-30 22:09 → 2026-03-31 00:11 (single evening session)

**Defining theme:** Homepage V6 rebuild — rapid iteration from broken state to Airbnb-inspired salon card carousel architecture. The session started with a bug fix (invalid DB column), escalated through two competing homepage paradigms (abstract photo cards vs. real salon carousels), landed on per-category SSR carousels with a permanent mobile search pill, then closed with cleanup that removed a duplicated inline card component.

### Components introduced
- `hooks/useRecentVisits.ts` — persists recently visited categories in localStorage (alive at HEAD)
- `components/ui/CategorySkeleton.tsx` — skeleton with aspect-ratio parity (alive at HEAD)
- `components/ui/category-icons.tsx` — category icon mapping (alive at HEAD)
- `_rules/LESSONS_LEARNED.md` — agent knowledge doc (alive at HEAD)
- `_roadmaps/roadmap-homepage-v6-rebuild.md` — V6 roadmap tracking doc
- 5 spec docs under `_tasks/specs/` (airbnb card rules, image ratio, micro-interactions, pagination dots, skeleton loaders)

### Components rewritten
- `components/HomePage.tsx` — multiple rewrites across commits 3, 4, 5, 7; abstract photo-card section introduced and abandoned within same session
- `components/SalonCard.tsx` — card image changed from `aspect-[3/2]` → `aspect-[20/19]`+`md:aspect-square` in commit 7; at HEAD reverted further to plain `aspect-square` (1:1 square, matching Q lock)
- `components/ui/CityCarouselSection.tsx` — props extended, inline AirbnbSalonCard clone introduced then deleted (commits 7→10)

### Components deleted (within session)
- Inline `AirbnbSalonCard` (never committed as its own file; added and removed within CityCarouselSection in the same evening)

### Design tokens added/removed
- `postal_code` field added to Salon type and rendered in SalonCard address line
- Heading typography in CityCarouselSection upgraded to `font-heading font-extrabold clamp(24px,3.5vw,42px) tracking-[-0.02em]`
- SalonCard image aspect ratio oscillated: `3/2` → `20/19`+square → plain `aspect-square` (final = 1:1 square, matches Q lock)
- Airbnb-style badges (Guest Favorite, Top Rated, Neu) introduced in commit 7; status at HEAD requires verification
- `text-s-coral` className used for icon color instead of inline `style` prop (TypeScript fix in commit 10)

### Patterns adopted
- SSR per-category salon queries (5 categories × 8 salons) on homepage
- Real SalonCard reuse inside CityCarouselSection (replacing one-off clones)
- Category validation in GuidedSearch before form submit
- Mandatory LESSONS_LEARNED.md updates after AI-caused regressions

### Patterns rejected
- Abstract Airbnb-style photo cards with gradient backgrounds (introduced commit 4, superseded commit 5)
- Scroll-gated mobile search pill (replaced by always-visible pill)
- `minimum_price` column reference (not in DB schema)

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 430aa6 | Largest commit (+589/-468, 17 files). SalonCard aspect ratio changed; 5 spec docs added; useRecentVisits hook introduced. Badge logic (Guest Favorite / Top Rated thresholds) may persist into current SalonCard — verify. |
| e8bdb7 | +292/-127, large rewrite of HomePage with localStorage category bubble-up and city selector on CategoryPage. City selector routing may still be alive in CategoryPage. |
| 8195fc | +19/-141, CityCarouselSection stripped from ~170 lines to ~30. Verify real SalonCard is correctly wired (animated=false, snap behavior). |
| 1b29df | CityCarouselSection heading typography uses raw clamp() — verify this aligns with current SOLEN_DESIGN.md token spec. |
| 9f6e55 | Mobile logo-hidden pattern introduced here; verify it survived later Header rewrites. |
