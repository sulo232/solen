# Audit Batch 55 — f8af51 to 633fb6

**Date range:** 2026-04-21 07:56 UTC → 2026-04-22 08:42 +0200  
**Processed:** 10/10 commits

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | f8af51 | 2026-04-21 | feat: add `<PageState>` canonical loading/empty/error wrapper (Q19) | 2 | +110/0 | add | NO | YES | YES | Introduces `components/ui/PageState.tsx` (109 lines): single component for loading/empty/error states; uses coral design tokens (`bg-s-coral/10`, `text-s-coral`), `font-heading` (Fraunces), lucide icons. Enforces design system consistency by eliminating per-page skeleton reimplementation. Zone prop still references zone 1-4 language (flagged retired in CLAUDE.md). |
| 2 | 014e38 | 2026-04-21 | docs: illustration prompt as guideline — lock constants, vary subject (Q22) | 1 | +5/0 | docs-only | NO | YES | NO | Adds 5 lines to `_rules/GENERATION_TOOLS.md` splitting AI illustration prompt into invariant constants (coral, 2px stroke, cream bg) and variable subject/accent. No visual changes. |
| 3 | 25d04c | 2026-04-21 | design: consolidate to single coral source of truth | 41 | +2222/−11658 | pivot | YES | YES | YES | Massive design system consolidation: deletes 30+ scattered design docs, skill dirs, all V5-era roadmaps and V2 green+peach artifacts. Creates `_tasks/SOLEN_DESIGN.md` (505 lines) as single source of truth and `public/solen-coral.html` (888 lines) as living preview. Locks Bebas Neue + Fraunces + DM Sans (note: later batch commits show Fraunces eventually replaced by Syne per Q16). Also rewrites CLAUDE.md from 1903→194 lines pointing to SOLEN_DESIGN.md. Many deleted files are gone permanently. |
| 4 | feff9e | 2026-04-21 | design: Option C — port coral+Fraunces+cream+no-box to production | 10 | +15612/−30 | rewrite | NO | PARTIAL | YES | 4 surgical production edits: swaps Syne→Fraunces in `app/globals.css`+`tailwind.config.js`+`app/layout.tsx`; page bg `#FFFFFF→#FAF6EF` (cream); `FeaturedSalonCarousel` cards 4:3→1:1 square with no box/shadow wrapper; buttons in preview switch to semantic shadow tokens (sh-sm/sh-md) instead of bespoke glow values. Also adds large audit artifacts (14,612-line home-archive.html). NOTE: cream bg (#FAF6EF) was later reverted to white per Q15 lock (2026-04-22 per CLAUDE.md); Fraunces later replaced by Syne per Q16 lock. |
| 5 | 32ec08 | 2026-04-21 | fix: build — exclude .figma.tsx from tsc, plumb locale to HomepageHero, narrow Skeleton variant | 4 | +8/−4 | bug-fix | NO | YES | NO | Fixes three build errors introduced by prior commits: tsconfig excludes `*.figma.tsx`/`.figma.ts` files, HomepageHero accepts + passes locale prop, PageState maps `skeletonVariant='row'` → Skeleton `variant='text'` (corrects non-existent variant name). Minimal surgical changes. |
| 6 | 043986 | 2026-04-21 | design: shadow/glow cleanup pass 2 (Items 4-8) | 2 | +223/−13 | cleanup | NO | YES | YES | Preview-only cleanup on `solen-coral.html`: drops sh-lg/sh-xl hover shadows from last-minute cards, review cards, Instagram tiles; replaces with border-color transitions + saturate filters. Reduces hero blobs from 3→2 and lowers opacity ~40%. Enforces blob ban in stats/cats/cards/slots/reviews sections via CSS. Also adds `_tasks/DESIGN_AUDIT_MASTER.md` (209 lines). Design philosophy shift: colour/filter over shadow-as-depth. |
| 7 | c94379 | 2026-04-21 | docs: overnight autonomous work log | 1 | +118/0 | docs-only | NO | YES | NO | Creates `_tasks/OVERNIGHT_LOG.md` documenting completed tasks (build fix, shadow cleanup), cherry-pick conflicts, and skipped items (reply badges, StaffPortfolio, dispute flow). No code changes. |
| 8 | 947aaf | 2026-04-22 | docs: correct moat audit — more is on main than claimed | 1 | +29/0 | docs-only | NO | YES | NO | Appends correction to OVERNIGHT_LOG.md noting more features already exist on main than the prior moat audit indicated. No code changes. |
| 9 | 9ce9a1 | 2026-04-22 | chore: delete orphan components/StaffPortfolio.tsx (unused, discovery variant is the wired one) | 1 | 0/−132 | cleanup | YES | NO* | NO | Deletes `components/StaffPortfolio.tsx` (132 lines) as orphan. **However**, a later commit (`0bd3daf feat(salon): wire StaffPortfolio into salon detail page`) re-adds/re-wires the component — `git ls-files` confirms StaffPortfolio.tsx is present at HEAD. The deletion was therefore transient; alive=YES at HEAD via re-add. |
| 10 | 633fb6 | 2026-04-22 | feat(reviews): add "Salon hat geantwortet" reply badge | 1 | +7/0 | add | NO | YES | NO | Adds 7 lines to `components/salon/SalonReviews.tsx`: coral pill badge ("Salon hat geantwortet") shown when `review_replies` exists and `is_public`. Reuses existing i18n key `t("salonReplied")`. Re-implementation of moat/session3 concept without cherry-pick. Small, targeted feature addition. |

---

## Summary

**Date range:** 2026-04-21 to 2026-04-22 (~30 hours)

**Defining theme:** Design system unification and preview polish. Commit 3 (25d04c) is the architectural pivot of this batch — eliminating 11,658 lines of scattered, conflicting design docs in favour of a single `SOLEN_DESIGN.md` source of truth and `solen-coral.html` living preview. Subsequent commits immediately port that new spec to production (Fraunces, cream bg, square cards) and clean up shadow/blob overuse in the preview.

**Components introduced:**
- `components/ui/PageState.tsx` — canonical loading/empty/error wrapper (alive at HEAD)

**Components rewritten:**
- `components/ui/FeaturedSalonCarousel.tsx` — card aspect ratio 4:3→1:1 square, removed box wrapper

**Components deleted:**
- `components/StaffPortfolio.tsx` — deleted in commit 9, but re-added by later commit `0bd3daf`; alive at HEAD

**Design tokens added/changed:**
- Heading font: Syne → Fraunces (variable serif opsz 9–144) in `app/globals.css` + `tailwind.config.js` (NOTE: Fraunces was later replaced by Syne per Q16 lock — CLAUDE.md current spec lists Syne, not Fraunces)
- Page bg: `#FFFFFF → #FAF6EF` (cream) in `app/globals.css` (NOTE: reverted back to white per Q15 lock per CLAUDE.md)
- Buttons in preview: bespoke glow shadows → semantic token `var(--sh-sm)` / `var(--sh-md)`

**Patterns adopted:**
- Border-color hover transitions replacing shadow-xl explosions
- `filter: saturate()` for interactive feedback without layout shift
- Blob restriction enforcement via CSS selector targeting banned sections
- Single design source of truth (SOLEN_DESIGN.md) replacing 30+ scattered files

**Patterns rejected/deleted:**
- V2 green+peach palette artifacts
- V5 zone language (Zone 1/2/3/4) — though zone prop still appears in PageState.tsx
- Glass-everywhere rules
- Shadow-xl as primary hover affordance
- 3:2/4:3 card aspect ratios

**Docs/artifacts added:**
- `_tasks/SOLEN_DESIGN.md` (505 lines, design source of truth)
- `public/solen-coral.html` (888 lines, living preview)
- `_tasks/REDESIGN_INVENTORY.md` (532 lines)
- `_tasks/BACKEND_NEEDS_UI.md` (98 lines)
- `_tasks/DESIGN_AUDIT.md`, `_tasks/INVENTORY_FULL.md`, `_tasks/DESIGN_AUDIT_MASTER.md`
- `_tasks/OVERNIGHT_LOG.md`
- `public/home-archive.html` (14,612 lines — Vite-era reference archive)
- `public/variations.html` (366 lines)

**Large deletions (potentially lost):**
- 30+ design/rules docs (UI_RULES.md 1018 lines, DESIGN_SPEC.md 432 lines, FIGMA.md 356 lines, FIGMA_CODE_SYNC.md 294 lines, SOLEN_DESIGN_SYSTEM.md 348 lines, etc.)
- 11 roadmap-R* task files
- `.agents/skills/` Solen-specific skill directories (679 lines SKILL.md for emil-design-eng)
- SOLEN_HANDOFF.md (553 lines)

**Token state discrepancy:** Commits 3-4 lock Fraunces as heading font and cream (#FAF6EF) as page bg. CLAUDE.md at HEAD specifies Syne for headings and white (#FFFFFF) for page bg. These were later reverted — the batch represents a transient state that was subsequently corrected by Q15/Q16 locks.

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 25d04c | Massive pivot (−11,658 lines, 41 files); source-of-truth consolidation; permanent deletion of all V5/V2 artifacts |
| feff9e | Production font + bg token changes (Fraunces/cream) since reverted; FeaturedSalonCarousel rewrite; 14K-line archive artifact |
| 04398605 | Shadow/blob cleanup pass; CSS architecture changes in solen-coral.html; DESIGN_AUDIT_MASTER.md added |
| f8af51 | PageState component (109 lines) uses zone 1-4 language flagged as retired — may need audit |
