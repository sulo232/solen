# Batch 56 — Commits 0bd3da → e76247

**Date range:** 2026-04-22 08:48 → 2026-04-22 22:40  
**Batch number:** 56 of 56 (FINAL)  
**Commits processed:** 7 of 7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 0bd3da | 2026-04-22 08:48 | feat(salon): wire StaffPortfolio into salon detail page | 3 | +114/-1 | add | NO | YES | NO | Resurrects StaffPortfolio.tsx (98 LOC) from moat commit 7ebf8479; wires Instagram-style portfolio grid below Team section on salon detail page. Graceful no-op for salons without portfolio images; API join added for staff_portfolio_images. |
| 2 | 570ae0 | 2026-04-22 08:57 | docs: add MASTER_ROADMAP.md — 7-phase roadmap | 1 | +382/-0 | docs-only | NO | YES | NO | Introduces 7-phase roadmap from Phase 0 (stabilization) to Phase 7 (EU expansion); purely additive doc artifact in `_tasks/`. No design tokens or components affected. |
| 3 | f3d9d7 | 2026-04-22 09:20 | design: lock 15 questionnaire decisions (Q1-Q15) | 6 | +305/-14 | lock | NO | YES | YES | Major lock commit: 15 user-decided design decisions appended to SOLEN_DESIGN.md §20. Critical changes: Q15 reverts page bg `--bg` from cream `#FAF6EF` to white `#FFFFFF` (globals.css + solen-coral.html), Q11 retires `--sh-xl` token (comment-only in spec, not yet deleted from globals.css), Q5 retires Basel-hyperlocal voice, Q14 fixes bottom nav to 4 tabs, Q4 canonizes 3-segment search bar. Adds ROADMAP_AUDIT.md (+222 LOC). Implementation of several locks (Q3/Q5/Q10/Q13) is deferred. |
| 4 | 4b5979 | 2026-04-22 09:34 | design: doc consistency pass — sync spec + preview with Q1-Q15 locks | 4 | +246/-30 | lock | NO | YES | YES | Propagates all 15 Q-locks into SOLEN_DESIGN.md body sections: removes `--sh-xl` from shadow table, updates card hover spec, extends banned list (cream bg, Basel voice, 4-seg search, --sh-xl). solen-coral.html: title, eyebrow, H1, search bar all updated to match Q5/Q4. Adds GAP_AUDIT.md (+216 LOC) cataloguing 30 remaining gaps. All changes alive at HEAD. |
| 5 | e130c5 | 2026-04-22 22:07 | docs: Claude Design research + plan + gap audit v2 | 3 | +592/-0 | docs-only | NO | YES | NO | Three new `_tasks/` artifacts: CLAUDE_DESIGN_RESEARCH.md (how Claude Design works, quotas, inputs/outputs), GAP_AUDIT_V2.md (17 new/confirmed gaps — 3 critical missed by v1 including aspect-[4/3] still in prod, dark mode classes, bottom nav actually 5 tabs), CLAUDE_DESIGN_PLAN.md (10-section onboarding + session-per-feature workflow). No component or token changes. |
| 6 | b6c322 | 2026-04-22 22:14 | fix: close 5 critical gaps from GAP_AUDIT_V2 before Claude Design onboarding | 10 | +18/-19 | bug-fix | NO | YES | YES | Closes 5 critical Q-lock violations: aspect-[4/3] → aspect-square in SalonCard.tsx, ConfirmationStep.tsx, GalleryManager.tsx (Q1); Basel voice retired in 4 messages/*.json files (Q5); /termine/page.tsx replaced with redirect() to /profile/bookings (Q9); BottomNav.tsx trimmed to 4 consumer tabs (Q14); SOLEN_DESIGN.md §17 voice examples updated (Q5). Build confirmed green. 6 deferred gaps (dark mode cleanup, city migration, Favorit badge, carousel, claim ribbon, TWINT) noted explicitly. |
| 7 | e76247 | 2026-04-22 22:40 | design: Q16 lock — kill decorative gradients across system | 2 | +43/-15 | lock | NO | YES | YES | Q16: user feedback "hate all the glow or gradient". All decorative gradients in solen-coral.html replaced with solid color blocks (partner block → solid plum, hero visual card → solid sand, category tiles → per-category solid colors, slot avatar → solid coral). SOLEN_DESIGN.md: Q16 decision logged in §20, new no-decorative-gradients subsection in §7, banned list extended with --sh-coral/--sh-amber colored glow tokens and all decorative linear/radial-gradients. Functional text-legibility overlays (dark bottom on photos) explicitly preserved. NOTE: --sh-coral/--sh-amber token definitions still present in SOLEN_DESIGN.md §9 button spec table — partial retirement inconsistency. |

---

## Batch 56 Summary

**Date range:** 2026-04-22 08:48 → 2026-04-22 22:40 (single day)

**Defining theme:** Design system crystallization and pre-launch hardening. This batch represents the final locking phase of the Solen design system before Claude Design onboarding. In rapid succession over one day: 16 design decisions locked (Q1-Q16), all major Q-lock violations corrected in production code, and a comprehensive gap audit written.

### Components introduced
- `components/StaffPortfolio.tsx` — 98-LOC salon staff Instagram-style portfolio grid (resurrected from moat commit, now wired into salon detail page)

### Components rewritten
- `components/SalonCard.tsx` — aspect ratio fixed to 1:1 square (Q1 fix)
- `components/booking/ConfirmationStep.tsx` — aspect ratio fixed to 1:1 square (Q1 fix)
- `components/dashboard/GalleryManager.tsx` — aspect ratio fixed to 1:1 square (Q1 fix)
- `components/layout/BottomNav.tsx` — trimmed from 5 tabs to 4 consumer tabs (Q14 fix)

### Components deleted
- `app/[locale]/termine/page.tsx` — effectively deleted (replaced with bare redirect to /profile/bookings per Q9)

### Design tokens added
- None net-new

### Design tokens removed / retired
- `--sh-xl` — retired Q11 (2026-04-22); comment-only in SOLEN_DESIGN.md, was already commented out in globals.css by the time this batch lands
- `--sh-coral` (Q16 retirement, decorative use) — banned list updated; token definition still exists in button spec (partial inconsistency)
- `--sh-amber` (Q16 retirement, decorative use) — same partial inconsistency

### Design tokens changed
- `--bg`: `#FAF6EF` (cream) → `#FFFFFF` (white) in `app/globals.css` + `public/solen-coral.html` per Q15

### Patterns adopted
- Solid-color blocks replacing decorative gradients (Swiss-editorial magazine aesthetic)
- Locked 1:1 square as system-wide image ratio (salon cards, staff portraits, category tiles)
- 3-segment search pill (Was · Wo · Wann) replacing 4-segment
- Swiss-wide dynamic city voice replacing Basel-hyperlocal copy
- 4-tab mobile bottom nav

### Patterns rejected / banned
- Cream page background (`#FAF6EF`)
- Decorative `linear-gradient` and `radial-gradient` fills on UI blocks
- `--sh-xl` token anywhere
- Colored glow shadows (`--sh-coral`, `--sh-amber`) for decorative use
- Hyperlocal "Von Basel. Für Basel." voice
- 4-segment search bar
- Bottom nav with 5 tabs

### New `_tasks/` artifacts created this batch
- `_tasks/MASTER_ROADMAP.md` — 7-phase roadmap
- `_tasks/ROADMAP_AUDIT.md` — roadmap gap analysis
- `_tasks/GAP_AUDIT.md` — 30 post-Q1-Q15-lock implementation gaps
- `_tasks/GAP_AUDIT_V2.md` — 17 additional/confirmed gaps (3 critical missed by v1)
- `_tasks/CLAUDE_DESIGN_PLAN.md` — 10-section Claude Design onboarding plan
- `_tasks/CLAUDE_DESIGN_RESEARCH.md` — Claude Design capability research

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| f3d9d7 | `drill? YES` — touches SOLEN_DESIGN.md + solen-coral.html + globals.css; starts with "design:"; 15 simultaneous locks; Q15 bg revert is a user-override of a previous decision |
| 4b5979 | `drill? YES` — touches SOLEN_DESIGN.md + solen-coral.html; propagates all 15 locks into doc body; introduces GAP_AUDIT.md |
| b6c322 | `drill? YES` — starts with "fix:"; touches components/**/*.tsx; message contains "delete" (redirect replaces page); closes Q1/Q5/Q9/Q14 violations in code |
| e76247 | `drill? YES` — touches SOLEN_DESIGN.md + solen-coral.html; starts with "design:"; Q16 is the most recent lock; introduces partial inconsistency: --sh-coral/--sh-amber still defined in button spec table despite being Q16-banned |

---

## Observations for downstream auditors

1. **--sh-coral / --sh-amber partial retirement:** Q16 bans these tokens, but SOLEN_DESIGN.md §9 button spec table (lines ~354-355) still references them as the shadow for `btn-coral` and `btn-amber`. This is an open inconsistency that was not resolved in this batch.

2. **6 deferred gaps remain:** dark mode class cleanup (40+ files), full Basel→{city} i18n migration, Solen Favorit badge, swipeable card carousel, claim listing ribbon, TWINT integration. All are Phase 1 implementation work, not this batch's scope.

3. **StaffPortfolio admin upload UI deferred:** images currently added only via Supabase dashboard; no admin upload UI exists yet.
