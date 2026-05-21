# Batch 54 Audit — a662d9 to 1f81b5

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | a662d9 | 2026-04-06 | fix: design spec token alignment — colors, fonts, spacing, animations | 5 | +46/-22 | bug-fix | NO | YES | YES | Incremental token alignment: footer bg #2C2420, coral text link switched to accessible #B84A35, HomepageHero gains stagger entrance animations per spec §02. All 5 files are homepage surface components. |
| 2 | 85d4b3 | 2026-04-06 | fix: full design spec compliance — colors, card structure, animations | 7 | +51/-27 | bug-fix | NO | PARTIAL | YES | Major accessibility fix: all coral-on-light text changed #E8735A→#B84A35 (7 instances, WCAG AA). Salon card image switched from aspect-[4/5] to fixed 200px height — later superseded by 1:1 aspect-square lock. FloatingNavPill gets entrance animation. |
| 3 | 2732dc | 2026-04-08 | fix: restore mobile category strip in header | 1 | +42/-7 | bug-fix | NO | YES | NO | Targeted regression fix — a prior commit had accidentally deleted the md:hidden mobile pill strip from Header.tsx. Single-file surgical restore of mobile navigation. |
| 4 | f07a3c | 2026-04-08 | fix: design token compliance — white backgrounds, correct coral, Syne titles | 11 | +60/-59 | bug-fix | NO | YES | YES | Large token pass across 11 components: bg reverted to #FFFFFF, coral normalised to spec #E8624A, footer ink to #1A1209, section titles forced to font-heading (Syne 24px 700). Also i18n fix on BrowseByCitySection. Most changes alive at HEAD. |
| 5 | 688347 | 2026-04-08 | fix: polish pass — spacing, typography, hero sizing, testimonial cleanup | 4 | +31/-43 | cleanup | NO | YES | YES | Net line reduction (-12). Hero headline switched to clamp(56px,7.5vw,88px) line-height 0.9, spring bounce removed. TestimonialCarousel dropped eyebrow, solid white cards with ink border. Section spacing 32→48px throughout. |
| 6 | f7ed0a | 2026-04-13 | session: coral sweep + card 4:3 + CSS vars + SSR timeout + color alignments (pre-fresha-overhaul) | 169 | +9093/-600 | pivot | YES | PARTIAL | YES | Massive session dump (~9K lines added): adds .agents skills, brainstorm HTML variants, screenshots, roadmap, new _rules/ docs, new e2e tests, tailwind.config.js shadow system overhaul (warm-tinted rgba(50,47,44) scheme), globals.css token additions. Introduces DESIGN_SPEC as authority. Coral briefly mutated to #E8735A in several places. Some design tokens (shadow levels, card radius 16px) survive at HEAD; the brainstorm HTML/agent skill files are structural noise. |
| 7 | 40387d | 2026-04-21 | design: consolidate system + lock salon cards to 1:1 | 5 | +359/-7 | lock | YES | PARTIAL | YES | Introduces DESIGN_SYSTEM.md (352 lines, Q1-Q18 answers) as new single source of truth — but this file does NOT exist at HEAD (superseded by _tasks/SOLEN_DESIGN.md). Critically locks SalonCard/SalonCardSkeleton/Skeleton to aspect-square (1:1). 1:1 lock is alive at HEAD. Drops Syne from font stack (later re-added by SOLEN_DESIGN.md which restores Syne for headings). |
| 8 | 0de858 | 2026-04-21 | design: enforce system-wide — active:scale, motion tokens, coral lock | 138 | +243/-217 | cleanup | NO | YES | YES | Largest coordination commit in batch: migrates 203 occurrences of active:scale variants to canonical active:scale-[0.97] across 135 files. globals.css gains --ease-out token (easeOutExpo) and strengthened prefers-reduced-motion block. CLAUDE.md + UI_RULES.md updated to fix #E8735A→#E8624A coral. --ease-out token NOT present at HEAD (appears to have been removed in later pass). |
| 9 | 8fbc24 | 2026-04-21 | design: add /design-system visual reference route (Q18) | 1 | +289/-0 | add | YES | NO | YES | Adds app/[locale]/design-system/page.tsx (289 lines) as a live visual reference. File does NOT exist at HEAD — the route was removed or the file path was deleted in a later cleanup. Lost work flagged for drill-down. |
| 10 | 1f81b5 | 2026-04-21 | design: add canonical interaction utility classes (Q15) | 1 | +115/-0 | add | YES | NO | YES | Adds .btn-primary, .btn-ghost, .link-inline, .filter-pill, .interactive-card utility classes to globals.css. None of these classes are present in globals.css at HEAD — they were removed (likely overwritten) in a subsequent session. Significant lost work: one-place-update pattern abandoned. |

---

## Summary

**Date range:** 2026-04-06 to 2026-04-21 (15 days)

**Defining theme:** Iterative design token convergence — this batch represents the turbulent stabilisation arc from scattered hex overrides toward a single canonical system. The period opens with rapid bug-fix passes fixing color accessibility (coral text #B84A35, WCAG AA compliance) and closes with system-wide enforcement sweeps and utility class infrastructure.

### Components introduced / rewritten / deleted
- **Introduced:** DESIGN_SYSTEM.md (commit 7, later superseded/removed), app/[locale]/design-system/page.tsx (commit 9, deleted at HEAD), five .figma.tsx companion files (commit 6)
- **Rewritten:** HomepageHero.tsx (multiple passes), FeaturedSalonCarousel.tsx (card structure), SalonCard.tsx (1:1 aspect lock), TestimonialCarousel.tsx (glass→solid white)
- **Deleted/lost at HEAD:** DESIGN_SYSTEM.md, design-system route, all utility classes from commit 10

### Design tokens added / removed
- **Added:** Shadow CSS vars (--shadow-rest/hover/floating), --radius-card 16px, --radius-input 16px, warm-tinted box shadows (rgba(50,47,44) base), --ease-out canonical easeOutExpo (added in C8, not present at HEAD)
- **Removed/overridden:** #E8735A coral variant (multiple attempts to eliminate), aspect-[4/5] card images, spring bounce on hero, beige section dividers, glass on testimonial cards, Syne font (dropped in C7, later restored)
- **Coral mutation path in this batch:** #E8624A → #B84A35 (accessible text) → #E8735A (regression in C6) → #E8624A (corrected in C8 sweep) — reflecting ongoing instability

### Patterns adopted / rejected
- **Adopted:** active:scale-[0.97] as sole interactive scale value (mass-migrated in C8); solid white backgrounds over beige/cream; 1:1 aspect-square for all salon card images; card lift-only hover (no img zoom overlay)
- **Rejected:** Spring bounce animations on hero coral word; glass blur on testimonials; 3:2 card aspect ratio; fixed-pixel card image height (200px) replaced by CSS aspect-ratio; eyebrow labels in testimonial/featured sections

### Commits flagged for drill-down
1. **f7ed0a (C6)** — 169 files, 9,700 lines delta. Massive session dump with globals.css+tailwind structural overhaul, new agent skills, brainstorm HTML variants. Shadow system pivot from warm-ink rgba(26,18,9) to neutral-warm rgba(50,47,44). Needs cross-check: does the current HEAD shadow system match this commit or a further revision?
2. **40387d (C7)** — Introduced DESIGN_SYSTEM.md as Q1-Q18 canonical doc but file is LOST at HEAD. The content of this doc vs. current _tasks/SOLEN_DESIGN.md needs diffing to verify no locked decisions were silently dropped when the authority file changed.
3. **8fbc24 (C9)** — /design-system route (289 lines) added then deleted at HEAD. Whether the deletion was intentional or accidental is unclear.
4. **1f81b5 (C10)** — 115 lines of canonical interaction utility classes added to globals.css, none present at HEAD. High-value pattern (one-place updates) was silently lost — likely overwritten by a later session's globals.css rewrite.
