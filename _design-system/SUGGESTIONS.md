# SUGGESTIONS.md , live design-improvement suggestions (design-suggest contract)

<!-- exists-check: net-new file created by the design-suggest system 2026-07-10 (its SKILL.md names this path as its output); extends, not duplicates, FRONTEND_AUDIT_2026-07-08.md (that = found DEBT vs current law; this = forward DIRECTIONS + the owner's new lenses). Max ~7 live entries; approved/rejected entries move to the log at the bottom. -->

> How this works: each entry is a suggestion, not a decision. Approve by clicking its chip (or
> saying its number). [mockup] = you see it before it ships; [behavior] = interaction change;
> [code] = already covered by locked law, no taste question. LOCK flags mean approving also
> unlocks a frozen row , called out explicitly.

## S1. Motion modernization sweep , [code], the recipe is already law | effort L | TOP PICK
94 of 135 animated sites still run single-property animations (opacity-only / slide-only) from
two pre-recipe sources; only booking uses the locked blur+scale+opacity recipe. The booking
CONFIRMATION (the peak-end moment) and every homepage row are legacy; route transitions are dead
code. Plan + full file:line inventory: research/MOTION_MODERNIZATION_2026-07-10.md , demo of 3
surfaces first (video), then 2 systemic fixes cover most of the 94.

## S3. Chrome subtraction bundle , [behavior][mockup] | effort M-L | LOCK flags
(a) Header hides on scroll-down / reveals on scroll-up (unlocks LOCKFILE section 7 sticky row);
(b) CityTopBar folds into the Header as an inline location pill (removes a 52px band, unlocks
its section 7 row); (c) sticky book bar condenses to a pill past the hero, re-expands on
scroll-up (no lock). Net effect: up to 131px of permanent chrome becomes content space , the
single most "modern app" move available. One mockup shows all three together.

## S4. Booking step-swap gains direction , [behavior] | effort S | LOCK flag (MOTION.md values)
Forward slides content 24px left, back mirrors , wayfinding the graveyarded progress-stepper
used to provide, done by motion instead of chrome.

## S5. Skeleton-to-content uses the enter recipe , [behavior] | effort S | no lock
Loaded content mounts via blur+scale+opacity instead of the hard cut. Fills the one gap in the
locked loading law (shimmer is specified, the handoff is not).

## S6. Subtraction pair , [code][remove] | effort S | no lock
(a) category chip off cards on single-category pages (the URL/H1 already says it, taste rule 4);
(b) finish the border+shadow double-chrome sweep (ProgressiveFilter, DiscoveryEmptyState still
pair hairline + elevation , the exact "dated tell" LOCKFILE names).

## S7. Homepage sections cascade on scroll-into-view , [mockup] | effort M | no lock
The existing stagger recipe fires per-section via IntersectionObserver (once), not just on mount
, sections below the fold currently appear inert.

---
Parked (not suggested , owner rejected the shape before or lock says no): eyebrow-drop-default
(narrows a deliberate carve-out , resurface only if S3 lands), radius-token collapse (L effort,
low visible payoff , resurface with the next tailwind.config touch).

## Log
- 2026-07-10 scroll-pill (owner-confirmed element from the X ref) PARKED after seeing the checkout mockup: "meh idk abt putting ths in booking but maybe in store pages but acc think but park ths for now". Mockup stays at public/_mockups/checkout-scroll-pill.html for reference; candidate surface when revisited: salon/store pages. Nothing builds until the owner reopens it.
- 2026-07-10 S2 (Go-with card adaptation) REJECTED by owner: 'not at all what i mentioned'. Mockup deleted + graveyarded. The reference interest is being re-scoped by direct owner question (which element of x-scrollpill-ref.mp4 they actually liked); nothing rebuilds until that answer exists (ask-first gate added same day).
(approvals/rejections land here with dates)

---

## Appendix: 2026-07-11 weekly self-audit aggregate (merged 2026-07-16 during the branch salvage; the two versions of this file were concatenated by an unresolved conflict, now resolved keep-both with the design-suggest contract as the canonical head)

<!-- exists-check: net-new vs SOURCE.md/DRIFT_LEDGER.md/_drift-report.md because this is the design-suggest skill's own record file (skill section 2 names _design-system/SUGGESTIONS.md); it aggregates deltas FROM those files into rankable suggestions, none of them hold suggestions. -->
# Design suggestions (design-suggest channel)

> Refreshed 2026-07-11 by the weekly self-audit (gather+record only, chips deferred per skill cadence).
> Every file:line below was verified against the working tree on 2026-07-11, not copied from an audit doc.
> Rules that bind any build: mockup-first on the REAL page, treatment-only, design-verifier PASS, tunnel link.

## Live suggestions (max 7)

### 1. Strip tracked-uppercase eyebrows from the partner landing page
- what: 9 instances of `uppercase tracking-[0.16em]` eyebrow labels on a rebuilt customer surface.
- where: `app/[locale]/partner/page.tsx:47` (plus 59, 96, 128, 161, 249, 284, 401, 483)
- why: banned pattern (copy-economy rule 5: normal-case 13px semibold); drift-report A21 hard finding.
- effort: S
- source: drift-report

### 2. Replace opacity hairlines in the booking pay step with the border token
- what: 4 dividers use `border-s-ink/[0.06]`-style opacity hairlines instead of `border-s-border` (#E4E4E7).
- where: `components-legacy/booking/PayConfirmStep.tsx:284, 300, 317, 361` (drift code A17)
- why: design contract hairline row: one token (`s-border #E4E4E7`) for every divider.
- effort: S
- source: drift-report

### 3. "Mehr lesen" review expander should be blue, not ink
- what: the truncated-review expand button renders `text-s-ink`; the locked pattern is inline `text-s-accent`.
- where: `app/[locale]/_components/salon/SalonReviews.tsx:212-214`
- why: copy-economy rule 2 names this exact pattern ("blue Mehr lesen"); LOCKFILE link row (`s-accent #276EF1`).
- effort: S
- source: PSYCH_AUDIT / LOCKFILE divergence

### 4. Lift 36px touch targets on search controls to the 44px floor
- what: map-toggle and filter/clear buttons are `h-9 w-9` (36px), under the locked >=44px floor.
- where: `app/[locale]/_components/search/SearchTemplate.tsx:1295, 1326`
- why: design contract touch-target row (>=44px / `h-11`); PSYCH_AUDIT high item. Note: line 1295 carries a V3-D421d comment ("map icon stays full size when pinned"), so check that decision before changing the pinned state.
- effort: S
- source: PSYCH_AUDIT

### 5. Give the booking-action magic-link page a recovery action
- what: the page has ZERO tappable elements (verified: 0 button/Link/a tags) in all terminal states; email arrivals hit a dead end.
- where: `app/[locale]/booking-action/page.tsx`
- why: PSYCHOLOGY law K (every terminal/empty state gets one computed recovery action); peak-end law G.
- effort: S
- source: PSYCH_AUDIT

### 6. Wire haptics on key mobile commit taps
- what: the one open `[ ]` item in MOTION.md: `navigator.vibrate` on Buchen/confirm taps where the platform supports it (Android; iOS web limited, never fake it).
- where: `_design-system/MOTION.md:79`; entry points `components-legacy/booking/PayConfirmStep.tsx` (pay CTA), `BookingWizard.tsx` (final confirm)
- why: MOTION.md principle line 54; the only owner-flagged open motion debt.
- effort: S
- source: MOTION.md

## Dropped this pass (do not resurface without re-check)
- Pay-step star-rating gating: STALE. `PayConfirmStep.tsx:347-354` already gates on rating AND count together and renders the count. The PSYCH_AUDIT item is fixed.
- Booking stepper progress-bar: graveyard hit (REMOVED.md), killed by owner.

## Source counts (2026-07-11 gather)
- drift-report (2026-07-06): 30 hard findings, ~21 on rebuilt/live routes (9 partner A21, 4 PayConfirm A17, 3 vouchers A21, 4 single A21s, 1 A1 not-found hex, 1 A19 gift-card sub-12px, 1 B5 BookingWizard).
- MOTION.md: 1 open leftover (haptics).
- PSYCH_AUDIT_2026-07-07: ~13 still-open [mockup]/[code] items after kill-list drops; top 3 carried above.

---

## 2026-07-18 weekly self-audit refresh (gather+record only, no chips)

Verified sources: _drift-report.md (no rerun this pass, 2026-06-12 report still current), MOTION.md, TASTE_LOG.md through 2026-07-17.

Prior 6 live items (2026-07-11): none surfaced as "resolved" in TASTE_LOG or in recent commits touching the cited files, so all 6 remain open. Owner should approve or drop rather than re-list; no chips fired.

New deltas since 2026-07-11:
- **TASTE_LOG 2026-07-17 input law**: input radius corrected from 16 to 12; input fill = filled gray #F4F4F5. CLAUDE.md updated. Not a suggestion (it is a settled call already applied via the type-targeted base rule); flagged here so no future suggestion re-litigates it.
- **TASTE_LOG 2026-07-16 IG-principles round 1**: 12 ADD candidates owner-approved; deliverables tracked in workstream #30 (IG_PRINCIPLES_EVAL.md), not in this file.
- **TASTE_LOG 2026-07-15 dark mode**: DECLINED, graveyarded. No suggestion.
- **Drift-gate literal gaps surfaced by 2026-07-18 audit (DOC-VS-GATE reconciliation)**: 10 LOCKFILE §1 hexes are missing from `ALLOWED_HEX` in `.claude/skills/solen-drift-check/scripts/check.py` (#E4E4E7 s-border, #F1AE27 s-warning, #C2410C s-urgency, #EA580C s-surcharge, #C03001 s-pop, #DC2626 s-error/s-closed, #1F8900 s-open, #B45309 s-warning.text, #EAEFFE s-accent.pale, #9CA3AF s-chart-2). Legitimate inline SVG fills for those tokens currently fire A1 false-positive drift. Parked here (fix belongs to the checker, out of write scope for this audit; see _plans/SELF_AUDIT_2026-07-18.md).
- **Drift-gate RETIRED_TOKENS gaps**: `s-amber`, `s-love*`, `s-cat-*-text`, and 5 of the `s-atm-*` family are named RETIRED in LOCKFILE §1 but missing from the checker's `RETIRED_TOKENS` set; net-new use would not be flagged. Same parking as above.

---

## 2026-07-25 weekly self-audit refresh (gather+record only, no chips)

Verified sources: `_drift-report.md` (2026-06-12 report, not rerun , logger only), `MOTION.md`,
`TASTE_LOG.md` through 2026-07-24, `REMOVED.md`, and a live `--gate-stdin` probe of the drift gate.

**Prior live items:** the 6 from 2026-07-11 (carried at 2026-07-18) are all still open , nothing in
TASTE_LOG or recent commits resolved the cited files. Still awaiting an owner approve-or-drop; no
chips fired this pass either. Not re-listed here to avoid a third duplicate block.

**MOTION.md:** still exactly 1 open leftover (`MOTION.md:80` haptics). No new motion debt.

### CORRECTION to the 2026-07-18 DOC-VS-GATE numbers (this audit under-counted itself)

Last pass reported "10 missing hexes" and "4 missing `RETIRED_TOKENS`" from a text grep of
`.claude/skills/solen-drift-check/scripts/check.py`. That grep read COMMENTED-OUT and prose hexes as
live set members, so both counts were wrong. This pass parsed the sets via AST (ground truth) and then
PROVED each gap by piping a real payload through `check.py --gate-stdin` and reading the exit code.

**Measured: 25 LOCKFILE §1-3 hexes are absent from `ALLOWED_HEX`; all 25 block (rc=2, rule A1).**
Split by whether the block is CORRECT:

- **16 are LIVE locked token values , these are FALSE POSITIVES** (a legitimate inline SVG `fill=` /
  `style={{}}` / `tailwind.config.js` definition of the token is refused):
  `#E4E4E7` s-border · `#1F8900` s-open · `#F1AE27` s-warning · `#FDF6E7` s-warning.bg ·
  `#B45309` s-warning.text · `#C2410C` s-urgency · `#C03001` s-pop (UN-RETIRED V3-D424) ·
  `#C5C8C4` s-ink-disabled · `#9CA3AF` s-chart-2 (reinstated 2026-07-21) · `#D1D5DB` s-chart-3 ·
  `#DC2626` s-error/s-closed · `#FEE2E2` s-error.bg · `#E8F5E9` s-success.bg ·
  `#EA580C` s-surcharge · `#FFEDD5` s-surcharge.bg · `#EAEFFE` s-accent.pale
- **9 blocks are CORRECT** (superseded or conditional, the gate is right to refuse them):
  `#15803D` (tokenized s-brand.mid only, removed 2026-07-12) · `#185CE0` (old accent-deep, current is
  `#1E54B7`) · `#906309` (de-muddied V3-D424) · `#D32F2F` + `#FFEBEE` (consolidated onto `#DC2626`
  / `#FEE2E2`) · `#E0DDDB` + `#E8E4DF` + `#F8F5F2` (warm chrome, reversed by v2 rule 4) ·
  `#E09A0C` (sanctioned deeper amber sibling, needs an owner pick first)

**Severity is MEDIUM, not high:** the gate blocks a RAW HEX and points at the Tailwind token, which is
the correct authoring form on a component. The real false-positive surface is narrow , the
single-point definition files (`app/globals.css`, `tailwind.config.js`, both measured BLOCK) and
inline SVG fills. `drift-ok: <reason>` clears it, so nothing is actually wedged.

**`RETIRED_TOKENS`: 7 gaps** (LOCKFILE §1 names them retired, the gate would not flag net-new use):
`s-amber` (PERMANENTLY KILLED V3-D320) · `s-love` family · and 5 of the `s-atm-*` family the gate
misses because it lists only warm/cool/base , `s-atm-cream`, `s-atm-terra`, `s-atm-sage`,
`s-atm-bone`, `s-atm-butter`. (The bare `s-sage`/`s-butter` entries do NOT prefix-match the
`s-atm-` forms.) The `s-cat-*-text` variants ARE covered: `retired_token_re` ends on `\b`, which
matches before the `-text` suffix , verified.

Both fixes live in `.claude/skills/solen-drift-check/scripts/check.py`, which is PRODUCT code and
outside the self-audit's write scope. Parked for an owner-approved edit; full detail and the exact
literal lists are in `_plans/SELF_AUDIT_2026-07-25.md`.

### Not suggestions (recorded so no future pass re-litigates them)
- Phantom-gate sweep of `_design-system/**` + `REMOVED.md`: **0 real phantoms.** All 20 raw regex hits
  are English prose ("a hard gate", "the ship gate", "an owner gate") or truncation artifacts of the
  matcher itself, not hook filenames. `mockup-depicts-gate` and `no-black-selected-gate.py`, the two
  hits that DO look like filenames, both exist on disk. Same verdict as 2026-07-18.

---

## 2026-08-01 weekly self-audit refresh (gather+record only, no chips)

Verified sources: the drift checker **re-run this pass** (first rerun since 2026-06-12; written to a
temp path, the committed `_drift-report.md` was left alone since this audit is read-only on product
files), `MOTION.md`, `TASTE_LOG.md`, `REMOVED.md`, and a direct grep sweep for half-built animation.

**Prior live items:** the 6 from 2026-07-11 are open for the FOURTH consecutive pass, and S1/S3-S7
above are unchanged. Not re-listed a fourth time. They need an owner approve-or-drop, not another
restatement , a suggestion that has sat unanswered for three weeks is not a backlog, it is noise in
the channel this file exists to keep clean.

**Drift, re-measured (the number moved, and it is the first real delta this file has had):**

| | 2026-06-12 report | 2026-08-01 rerun | delta |
|---|---|---|---|
| files scanned (strict) | 93 | 92 | -1 |
| HARD findings (A1-A6 / B1-B5) | 30 | **36** | **+6** |
| phase-1 INFO (A7-A11) | 1272 | **2123** | **+851** |

The hard total is dominated by two rules, and neither is a taste question:
- **A21 tracked-uppercase eyebrow x18.** Banned by copy-economy rule 5 (owner 2026-06-11). Nine of the
  18 are on ONE file, `app/[locale]/partner/page.tsx` (lines 45, 59, 96, 128, 161, 249, 284, 401, 496);
  the rest are `business/page.tsx:191`, `privacy/components/PrivacySidebar.tsx:97`,
  `terms/components/TermsSidebar.tsx:109`, `components-legacy/CityPage.tsx:114`, and 5 on the
  `dev/new-primitives` scratch route (not a customer surface, safe to ignore or delete).
- **C2 hardcoded solen.ch URL x13.**
- Plus A20 middle-dot separator x2, A1 hardcoded hex x1, A19 sub-12px text x1, B5 category branch x1.

The **+851 INFO** jump is the finding worth an owner decision: the A7-A11 typography-migration backlog
nearly doubled in seven weeks while the file count fell. New code is being written against the old type
conventions faster than the phase-2 sweep retires them. That is a trend, not a defect list.

**Suggestion (new, one only , the channel stays quiet while 6 items are unanswered):**

### 7. De-uppercase the partner landing page , [code] | effort S | no lock
`app/[locale]/partner/page.tsx` carries **9 of the 18** live tracked-uppercase eyebrows, the single
densest violation of a rule the owner set by name in 2026-06-11 copy-economy. One file, one mechanical
treatment (normal-case 13px semibold per the mockup banned-list), no taste question, and it removes
half the estate's A21 count. Supersedes live item 1 from 2026-07-11 ("Strip tracked-uppercase eyebrows
from the partner landing page"), which named the same file before the count was measured , fold the
two, do not carry both.

**MOTION.md:** still exactly 1 open leftover (`MOTION.md:92`, haptics). Confirmed still unbuilt:
`navigator.vibrate` has **0** occurrences across `app/`, `components/`, `components-legacy/`, `lib/`.

**Animation-leftover sweep , 0 real findings, and the raw greps LIE.** Scanning for the three leftover
shapes the owner named (a `transition` with no trigger, a framer import never rendered, `initial=`
without `animate=`) returns 7 and 10 file hits respectively, and **every one is a false positive**:
`components-legacy/ui/ExpandableTabs.tsx` matches on the comment "CSS transitions only , no
framer-motion", and all `/profile/settings/*` + `/profile/edit` hits are `SettingsForm`'s plain
`initial={{...}}` DATA prop, already annotated `mockup-ok: not framer-motion` at the callsite.
Recorded so the next pass does not re-find them and file six phantom suggestions.
