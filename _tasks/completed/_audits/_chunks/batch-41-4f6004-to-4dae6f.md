# Batch 41 Audit — 4f6004e to 4dae6fe

Date range: 2026-03-31 09:47 – 10:45 (+0200)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 4f6004e | 2026-03-31 09:47 | fix: resolve TS error in coming-soon page — use description map instead of dynamic t() key | app/[locale]/coming-soon/page.tsx | +9/-1 | bug-fix | NO | YES | NO | Replaces dynamic i18n key lookup (not supported by TypeScript) with a static description map; no visual change, purely type-safety fix. |
| 2 | b5943e1 | 2026-03-31 09:48 | docs: log lesson — /api/waitlist is booking-only, not generic email capture | _rules/LESSONS_LEARNED.md | +11/-0 | docs-only | NO | YES | NO | Records that /api/waitlist only accepts bookings, preventing future misuse as a generic email API; no code changes. |
| 3 | 8d601f1 | 2026-03-31 09:51 | docs: log lessons — pre-existing feature detection + Windows build quirk | _rules/LESSONS_LEARNED.md | +20/-0 | docs-only | NO | YES | NO | Two lessons added: check for existing features before adding, and Windows EOL quirk; no code changes. |
| 4 | 4e4b6c6 | 2026-03-31 09:52 | feat: i18n migration of warum-solen marketing page | app/[locale]/warum-solen/page.tsx + messages/de,en,fr,it.json | +201/-38 | add | NO | YES | NO | Migrates hardcoded German strings to next-intl with 40 new keys per locale; page now fully internationalised across 4 locales. |
| 5 | 3c9af10 | 2026-03-31 10:05 | fix: add missing guestFavorite/topRated/newOnSolen i18n keys + remove unsupported fallback option | components/SalonCard.tsx + messages (4 files) | +13/-2 | bug-fix | NO | YES | NO | Removes `{ fallback: '...' }` from t() calls (next-intl does not support it) and adds missing keys; fixes raw key paths rendering on screen. |
| 6 | cb0045a | 2026-03-31 10:05 | docs: log lesson — next-intl does not support t() fallback option | _rules/LESSONS_LEARNED.md | +11/-0 | docs-only | NO | YES | NO | Documents the next-intl fallback API incompatibility immediately after the bug-fix; complements commit 5. |
| 7 | bb18d2e | 2026-03-31 10:11 | fix: remove breadcrumb from homepage — improve locale-root detection | components/ui/Breadcrumb.tsx | +7/-8 | bug-fix | NO | YES | NO | Replaces multi-condition isHomepage check with a single normalised-path regex, preventing "Home > en" appearing on locale root pages. |
| 8 | 3f21c85 | 2026-03-31 10:14 | design: shrink section headers from 42px extrabold to 18px semibold — Airbnb style | components/ui/CityCarouselSection.tsx | +5/-9 | pivot | NO | YES | YES | Removes the large clamp(24–42px) extrabold heading in favour of a flat 18px semibold, explicitly adopting Airbnb-style restraint; significant visual pivot on section titles — previous large heading style lost at HEAD. |
| 9 | 65b4636 | 2026-03-31 10:17 | design: tighten homepage vertical spacing — reduce dead space between search and carousels | components/HomePage.tsx | +3/-3 | cleanup | NO | YES | YES | Reduces padding/pt values (pt-5→pt-3, pt-4→pt-2, pt-6→pt-3) across search bar, category strip, and carousel section; minor but intentional density increase. |
| 10 | 4dae6fe | 2026-03-31 10:45 | design: card & carousel micro-interactions (roadmap-card-interactions phases 1-5) | components/SalonCard.tsx, CityCarouselSection.tsx, lib/basel-neighborhoods.ts | +65/-13 | add | NO | YES | YES | Introduces img-hover-zoom class, chevron arrows on hover, scrollContainerRef refactor, and a new basel-neighborhoods lookup replacing raw postal_code in card subtitle; adds lib/basel-neighborhoods.ts (new file). |

---

## Summary

**Date range:** 2026-03-31 09:47–10:45 (one morning sprint)

**Defining theme:** i18n consolidation + homepage design density / Airbnb-style refinement. The batch completes a localisation sweep (warum-solen page, missing SalonCard keys, next-intl fallback fix) then pivots immediately into visual polish: shrinking oversized section headers, tightening vertical rhythm, and adding card micro-interactions.

### Components introduced
- `lib/basel-neighborhoods.ts` — new utility mapping postal codes to Basel neighbourhood names, consumed by SalonCard subtitle

### Components rewritten / significantly changed
- `components/SalonCard.tsx` — two separate changes: i18n key fix (commit 5) then micro-interaction additions with chevron arrows, img-hover-zoom, scrollContainerRef, and neighbourhood lookup (commit 10)
- `components/ui/CityCarouselSection.tsx` — section heading pivot: clamp(24–42px) extrabold → flat 18px semibold (commit 8), then further padding tightening (commit 10)
- `components/HomePage.tsx` — vertical spacing compression (commit 9)
- `components/ui/Breadcrumb.tsx` — locale-root detection logic rewrite (commit 7)
- `app/[locale]/warum-solen/page.tsx` — full i18n migration (commit 4)

### Components deleted
None.

### Design tokens added
None (spacing changes use Tailwind utility classes, not new CSS variables).

### Design tokens removed
- `clamp(24px, 3.5vw, 42px)` inline style + `font-extrabold` removed from CityCarouselSection section headers (not a CSS token, but a visual constant now gone)

### Patterns adopted
- Airbnb-style restrained 18px semibold section headings (replacing large clamp display headings)
- Basel neighbourhood name lookup instead of raw postal code in card subtitles
- `scrollContainerRef` ref-based scroll control (replacing fragile DOM traversal)
- Chevron arrow UI pattern for desktop carousel navigation (opacity-0 → group-hover reveal)
- Immediate lesson logging paired with each bug-fix commit (commits 2, 3, 6)

### Patterns rejected
- `{ fallback: '...' }` option in next-intl `t()` calls — documented as unsupported
- Dynamic `t(dynamicKey)` patterns in TypeScript — resolved via static map

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 3f21c85 | design pivot: large clamp section headers → 18px flat; affects visual hierarchy across all carousel sections |
| 65b4636 | vertical spacing compression on homepage; interacts with search bar and category strip layout |
| 4dae6fe | >200-line component (SalonCard.tsx, 400+ lines); introduces new lib file; multiple interaction phases; subtitle logic change (postal_code replaced) |
