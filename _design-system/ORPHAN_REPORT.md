# Orphan Component Report

Generated 2026-07-27 by `node scripts/orphan-census.mjs --write` (fe-07). Runs monthly via
`.github/workflows/orphan-sweep.yml`, does not block any PR.

A component below has ZERO mentions of its own basename anywhere under app/, components/,
components-legacy/, or lib/ outside its own file. That does not automatically mean dead,
check for a dynamic import, a barrel re-export under a different name, or a genuine
in-progress build, but a component appearing here on 2 consecutive monthly runs is a
real deletion candidate per _rules/STRUCTURAL_RULES.md Rule 41.

**This run: 25 orphan(s) of 381 total components scanned.**

| Component | File |
|---|---|
| AiMatcherModal | `components-legacy/coiffeur/AiMatcherModal.tsx` |
| AllergyWarning | `components-legacy/nail/AllergyWarning.tsx` |
| AtmosphereGrain | `app/[locale]/_components/homepage/AtmosphereGrain.tsx` |
| BackgroundBlobs | `components/ui/BackgroundBlobs.tsx` |
| BarberIcon | `components-legacy/icons/category/BarberIcon.tsx` |
| beauty-icons | `components-legacy/ui/beauty-icons.tsx` |
| CategoryHeroCarousel | `app/[locale]/_components/search/CategoryHeroCarousel.tsx` |
| CategoryStack | `app/[locale]/_components/homepage/CategoryStack.tsx` |
| CoiffeurIcon | `components-legacy/icons/category/CoiffeurIcon.tsx` |
| EvidenceTable | `app/[locale]/dev/motion/_parts/EvidenceTable.tsx` |
| GlassModal | `components-legacy/ui/GlassModal.tsx` |
| InspoBoard | `components-legacy/nail/InspoBoard.tsx` |
| InspoUploader | `components-legacy/nail/InspoUploader.tsx` |
| MaterialSelector | `components-legacy/nail/MaterialSelector.tsx` |
| MobileViewToggle | `components-legacy/search/MobileViewToggle.tsx` |
| NailsIcon | `components-legacy/icons/category/NailsIcon.tsx` |
| PriceRangeBadge | `components/discovery/PriceRangeBadge.tsx` |
| ScrollableFilterRow | `components-legacy/ui/ScrollableFilterRow.tsx` |
| SearchCriteriaChips | `components-legacy/search/SearchCriteriaChips.tsx` |
| SearchResultGrid | `components-legacy/search/SearchResultGrid.tsx` |
| SectionCarousel | `components-legacy/home/SectionCarousel.tsx` |
| ServiceCategoryFilter | `components-legacy/salon/ServiceCategoryFilter.tsx` |
| ShapeLengthPicker | `components-legacy/nail/ShapeLengthPicker.tsx` |
| SpaIcon | `components-legacy/icons/category/SpaIcon.tsx` |
| SpeedLadder | `app/[locale]/dev/motion/_parts/SpeedLadder.tsx` |

Action: either (a) delete the file plus add a `_design-system/REMOVED.md` line via
`npm run removed -- ...`, or (b) add a one-line `// KEEP: <reason>` comment at the top of
the file naming a concrete reason it stays, before the next monthly run.
