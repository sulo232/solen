# Design-system consolidation , 2026-07-12

<!-- exists-check: builds on CONTRADICTIONS.md (2026-06-08, executed), CONSISTENCY_AUDIT.md (2026-06-07), DESIGN_GOVERNANCE_AUDIT_2026-07-10.md (revived), V2_RECONCILIATION.md. This is the 2026-07-12 full-estate consolidation record: doc-vs-doc, doc-vs-code, gate-vs-law, web-vs-mobile. Not a parallel canon: every resolution was applied INTO LOCKFILE/SOURCE/CLAUDE.md/registry; this file is the audit trail. -->

Owner ask: solidify the design system (web first, then app), decisive calls, find every inconsistency.
Workstream: _plans/DESIGN_CONSOLIDATION.md (#19). Audit evidence: _plans/design-consolidation/{A1_DOC_CONTRA,A3_REGISTRY,A4_CODE_DRIFT,C1_MOBILE}.md.

## 0 , TL;DR

- **A whole day of owner-sanctioned design law (2026-07-10) was stranded on an unmerged branch** (`claude/context-compact-architecture-5d1ace`): the CANON-into-LOCKFILE fold, a 3-part design-governance audit, TASTE_LOG supersession fixes, the check.py A9 v3 blue-law rewrite. Revived onto this branch (commit 80691b351) instead of re-deriving it.
- 17 doc-vs-doc contradictions found (A1), all 17 resolved with the dated winning decision cited (commits 80691b351 + 43b4f7a99). 7 leads checked clean.
- The drift GATE disagreed with the LAW in 5 places (self-audit claims verified): 2 already fixed 2026-07-11, 3 fixed now + self-tested (block proof exit 2, pass proof exit 0).
- Code census (A4): 2 drift classes genuinely swept clean since June (secondary text, stars); **6 classes REGRESSED after being marked fixed 2026-06-08** (hairline 69, sunken 93, radius 413, press-scale 170, disabled-opacity 96, dead-hover ~20). Queued as chips, not silently patched (mockup-first).
- Mobile (C1): no consolidated canon existed (the promised MOBILE_LOCKFILE was never written); 4 internal contradictions; 13 web-vs-app divergences (7 deliberate, 4 accidental). THEMING.md canonized as the mobile lockfile.
- 3 decisions only the owner can make are listed in §5; everything else was decided and applied.

## 1 , Stranded-law revival (commit 80691b351)

`git log --all` showed the 2026-07-10 design-governance work never reached main OR this branch. Ported via 3-way from the merge base (files clean on this side taken wholesale; REMOVED.md hand-merged; check.py applied via editor because the bash sandbox cannot write `.claude/skills/`):

- CANON.md -> tombstone with section-to-section map (owner: "fold it", 2026-07-10). Kills the stale "CANON > LOCKFILE" precedence claim (A1 C13).
- DESIGN_GOVERNANCE_AUDIT_2026-07-10.md (3 parts: docs / design-hooks / process) + its executed FIX-wave doc edits (TASTE_LOG Round-3 B1 supersession, registry StatusPill/ProgressStepper corrections, SOURCE H2 + empty-star fixes, CONSISTENCY_AUDIT hairline hex, MOTION self-claim).
- check.py A9 rewritten from the retired v2 "generous blue" law to LOCKFILE §1.5 v3 (hyperlink scope).
- SeeAllButton.md, MOTION_MODERNIZATION research, SUGGESTIONS.md, 2 REMOVED.md graveyard lines, CANON_FOLD + APPLE_MOTION_ADOPT plan records.

NOT ported (out of scope, still stranded on that branch): the focus-sweep code batch (79 files), Sheet 16.5 gesture-physics build work, hook-estate fixes (those belong to workstream #18). Flagged in §6.

## 2 , Doc contradictions resolved (A1: C1-C17)

Every resolution applies the LATEST DATED owner decision; no locked row was reopened. Full evidence table: _plans/design-consolidation/A1_DOC_CONTRA.md.

| id | topic | decisive resolution | where fixed |
|---|---|---|---|
| C1 | code font | Inter Tight tabular (V3-D470 2026-06-10; JetBrains Mono retired, owner: "the W-047 font is different") | CLAUDE.md rule 8 |
| C2 | blue scope | hyperlink-reading text ONLY (LOCKFILE §1.5 v3 2026-06-11, reaffirmed by the 2026-07-10 fold); "small buttons / chips" carve-out removed | CLAUDE.md rule 3 + contract link row |
| C3 | LOCKFILE §1 heading still said v2 "generous" | heading rewritten to v3 sparse | LOCKFILE:55 |
| C4 | input radius 12 vs 16 | **12px** (owner 2026-06-08 "kept shipped 12 over 16"; three docs never got the memo) | SOURCE, CLAUDE.md contract radius row, styleguide.html |
| C5 | s-pop retired? | UN-RETIRED (V3-D424) , note added to SOURCE retired-table row | SOURCE:244 |
| C6/C7 | filter-pill selected blue-border | gray-sunken fill (owner 2026-06-29; V3-D450 dead) , TASTE_LOG fixed by revive; CONTRADICTIONS.md §1 line struck | TASTE_LOG, CONTRADICTIONS.md |
| C8 | tab active blue-underline (dead v2 citation) | gray TabPill fill per the 2026-06-29 law; TopNavTab recorded as NOT built , a future blue top-nav tab needs its own dated owner call | LOCKFILE §2.5 tab row |
| C9-C11 | styleguide stale hexes | --border #E4E4E7, --sunken #F4F4F5, --ink3 #6B6B6B | public/solen-styleguide.html |
| C12 | error vs closed reds | **FLIPPED by code-verify: ONE red system.** Live tailwind.config.js:178 = `s-error #DC2626` ("V3-D421 consolidated , error == closed"); the styleguide was RIGHT and LOCKFILE/SOURCE were stale. Docs corrected to #DC2626/#FEE2E2 everywhere (LOCKFILE §1 + charts row + notification rows, SOURCE x4, QUESTIONS.md) | LOCKFILE, SOURCE, QUESTIONS |
| C13/C14 | CANON precedence claim | tombstone (revive) + V2_RECONCILIATION precedence line struck | CANON.md, V2_RECONCILIATION:8 |
| C15 | warning.text #906309 | #B45309 (V3-D424) , CANON row gone with the fold; CLAUDE.md rule 5 example annotated | CLAUDE.md rule 5 |
| C16 | s-urgency #9A3412 vs #C2410C | **#C2410C** , settled by code-verify (tailwind:186 + SalonBadge/SalonWalkInPanel hardcodes). Swept: LOCKFILE §11, SOURCE x4, CLAUDE.md rule 5, QUESTIONS.md, AGENT_BRIEF_TEMPLATE x2 | 6 docs |
| C17 | accent.deep | #1E54B7 (DS-6 2026-06-11 re-activation) | SOURCE:166, LOCKFILE §12 |

Stale-authority banners (A1 §2): V2_RECONCILIATION.md (historical-record banner + rule-1 supersession), MOTION.md (two supersession chains completed to v3), CONTRADICTIONS.md (drift note: its §1 recommendation superseded + 6 classes regressed), SOURCE.md (4 "GENEROUSLY" passages inline-retired). CANON/TASTE_LOG/CONSISTENCY_AUDIT handled by the revive.

Clean checks (no action, recorded so nobody re-litigates): success green #16A34A everywhere; ink-3 collapse; hairline #E4E4E7 in canonical docs; font retirements; warm-palette retirement; UBER_TYPE_SPEC correctly framed as proposal.

## 3 , Gate-vs-law reconciliation (check.py)

| claim (SELF_AUDIT_2026-07-11) | verdict | action |
|---|---|---|
| s-pop in RETIRED_TOKENS | STALE , fixed 2026-07-11 (50abcd060) | none |
| #F5F5F4 transposition in ALLOWED_HEX | STALE , fixed 2026-07-11; **live fallout found: SalonCard.tsx:48-51 writes the transposed hex** | code fix in W2 |
| 100ms allowed but not in LOCKFILE §4 | CONFIRMED , the "V3-D450" citation was confabulated (no duration decision exists) | **decisive call: 100ms REGISTERED in LOCKFILE §4** , code-derived (10 live usages incl. primitives Switch.tsx:98, Sheet.tsx:47, booking CTAs); dropping it would flag shipped, reviewed primitives. Revert path noted in §5 |
| #15803D allowlisted (deep green, reverted 2026-06-10) | CONFIRMED | dropped from ALLOWED_HEX (no raw usage, grep-verified) |
| #9A3412 allowlisted (no such token) | CONFIRMED (+ LOCKFILE §11 internal inconsistency) | dropped from ALLOWED_HEX; §11 corrected to #C2410C |

Also fixed: A9 recommendation text (v2 -> v3 law, via the fold), hairline recommendation hex (#E7E5E4 -> #E4E4E7), #E7E5E4 allowlist comment (it is the Avatar palette step, not the hairline).
Self-test: retired-hex probe -> `DRIFT GATE: blocked ... exit 2`; locked-values + duration-100 + text-s-urgency probe -> exit 0.

## 4 , Code-drift census (A4) , what regressed vs what held

Swept CLEAN since 2026-06-08 (verified, no action): secondary-text tokens (5 hits left), star tokens (0).
REGRESSED after being marked fixed (audit-cited lines byte-unchanged a month later): hairline 69 · sunken-surface 93 · radius 413 across 18 values · press-scale 170 across 10 values · disabled-opacity 96 across 3 values · dead-hover ~20. Plus new-to-census: type-size drift on locked slots , **the shared CardName primitive does not enforce the locked 14px, so SalonResultCard (busiest surface) renders 15px names**.
Drift-checker info scope 6,021 -> 10,986 (+82%) since 2026-06-12, mostly NEW pages never swept, not decay.

These are CODE fixes on visible UI: queued as chips (§6), not applied here (mockup-first law; and #13 full-estate audit owns surface fixes). Exception applied directly in W2: SalonCard transposed hex (restores the locked literal, imperceptible).

**Correction to A4's own top recommendation:** A4 ranked "fix TextInput/Select/Textarea radius 12 -> 16" as the #1 leverage fix. That direction is WRONG , the owner kept 12 over 16 on 2026-06-08 (LOCKFILE radius table); the docs saying 16 were the stale side (fixed as C4). The primitives are correct as shipped. Do not "fix" them.

## 5 , Owner questions (the only forks not decided here)

1. **BackButton is 40px; the locked touch floor is 44px** (contract row). Registry+doc+code all agree on 40. Bump to 44 (one-line + visual nudge), or record 40 as a deliberate exception for the frosted over-photo circle? , flagged in BackButton.md, not changed.
2. **Disabled opacity: locked contract row says `opacity-50`; the shipped primitives (Switch/Checkbox/Radio/PillToggle) use 40** (96 call-sites split 30/40/50). Sweep code to 50, or re-lock the row to 40 (the de-facto primitive standard)? Needs your name on it either way (locked row).
3. **Mobile selected-state**: web law (2026-06-29) = gray-sunken fill; shipped mobile = ink-fill (and PLAN.md D14 said pale-tint , 3-way). THEMING.md now documents code reality + the open fork; new mobile surfaces use the web gray recipe meanwhile. Align shipped mobile screens? (visual change, mockup-first).
4. (transparency, decisive call already made) 100ms motion duration was REGISTERED into LOCKFILE §4 from code reality; if you want the stricter 6-duration canon instead, the revert is: remove 100 from LOCKFILE §4 + check.py CANONICAL_DURATIONS_MS, then sweep the 10 call-sites.
5. (standing, unchanged) Notification-count badge red vs ink , QUESTIONS.md Q-stepper-1, still open; hex in the question corrected to #DC2626.

## 6 , Handoffs

- **Chips emitted (D2)**: see the chip list in the workstream close report (token-sweep regressions; radius consolidation; CardName 14px; SearchOverlay -> DateTimePicker per V3-D445; shadow tokens; mobile ErrorState build; mobile selected-state alignment decision).
- **Workstream #13** (full-estate frontend audit) owns surface-by-surface fixes; this census feeds it.
- **Workstream #18** (estate audit): the design-HOOK fixes from the revived governance audit (mockup-preflight aggregator, gemini message, TASTE_LOG injection, no-black-selected merge) remain open there , they are enforcement work, not design law.
- **Still stranded on `claude/context-compact-architecture-5d1ace`** (deliberately not ported): focus-sweep code batch (79 files), Sheet 16.5 gesture-physics build, apple-motion build half. If wanted, cherry-pick separately.

## 7 , Registry + component docs (W2) , DONE (commits f0f322c29 round 1 + 91ca978c5 round 2; reviewer round 2 PASS 7/7)

- Toast.md rewritten from the retired dark-pill recipe to shipped V3-D462 (white pill, 26px circle-badge, bottom dock, 4s, max 3) , 8 literals verified against Toast.tsx.
- FilterSheet.md selected-state rewritten to the gray-sunken law, citing BOTH the 2026-06-29 owner law and the 2026-07-02 FilterSheet-specific mockup approval.
- StatusPill tombstoned (deleted 2026-06-30 -> StatusInline); StatusInline.md written (was completely undocumented); SearchOverlay's false "uses DateTimePicker" claim corrected in 3 places and its V3-D445 violation recorded (refactor chipped); DateTimePicker got its missing registry row; Avatar/PriceFrom stale "not yet migrated" statuses corrected with verified call-site lists; BackButton 40px-vs-44 floor flagged as owner question.
- 16 registry rows added for undocumented primitives + 5 new component docs (Modal, Switch, Sheet, StatusInline, FieldLabel), every literal cited from component code.
- SalonCard.tsx:46-53 transposed sunken hex restored to the locked #F4F4F5 (hex-only diff, reviewer-verified).
- **Round-1 reviewer caught the coder fabricating call-sites** (Modal's 8 dashboard "call-sites" were all hand-rolled local modals; Sheet/Switch/PillToggle/Checkbox rows similar) + 45 banned em-dashes. Round 2 re-grepped every claim from real import lines: Modal 2 real call-sites + 8 hand-rolled dashboard modals recorded as consolidation debt; Sheet 5 importers; Switch 4; PillToggle/Checkbox/Radio/Select/Textarea/FieldHelper 0 external (PillToggle flagged retirement-candidate, owner call); SkipLink confirmed a real unmet WCAG 2.4.1 gap (not mounted in the root layout). Em-dashes now zero. Convergence: 5 fails -> 0.
- New consolidation debt surfaced (not chipped yet, listed for #13): 8 dashboard hand-rolled modals; hand-rolled Avatar in profile/page.tsx:235; PriceFrom leftovers in DetailPage.tsx:409; SkipLink not mounted.

## 8 , Mobile canon (W3) , DONE (solen-mobile commit fd6fa2d)

**THEMING.md is now THE mobile canon** (the promised MOBILE_LOCKFILE, fulfilled without a duplicate file; PLAN.md:47 pointer). Reviewer: 10/11 first-round PASS; the 2 punch items (press-state list composition, haptics off-by-ones) + 4 notes fixed and committed.

- Token tables (26 rows, light + dark) verified line-for-line against src/lib/theme.ts, 10 previously undocumented tokens added.
- 4 internal contradictions resolved: selected-fill = ink documented AS SHIPPED with the OPEN flag (web gray law + PLAN D14 disagree , owner question, new surfaces use gray meanwhile); see-all D17 grey-arrow wins over D8 (superseded inline in PLAN.md, registry row corrected); 5 registry rows flipped live (code-verified), 4 kept draft , the audit's claim they were live was WRONG, they are gallery-only (Chip, SlotChip, RatingRow, ServiceRow); semantic dark-mode pairs corrected (success #16A34A->#2BD17E, error #DC2626->#FF5A5A, save #FF3366->#FF4D7E).
- Web-vs-mobile parity table: 7 deliberate divergences (each with a dated source), 4 ACCIDENTAL-OPEN (selected ink-fill; pre-V3-D138 3-tier ink scale; successBg/errorBg pale mismatches).
- 7 gap rules, each with derivation: 44pt touch floor; ErrorState pattern (component to build, chipped); toast inherits web V3-D462; safe-area = useSafeAreaInsets (59 files, 0 SafeAreaView); press states = opacity dominant (51 files), spring-scale reserved for flagship surfaces (8 files, per-file values recorded, web 0.97/0.98 law noted as the reconcile target); haptics OPEN (24 wrapper vs 19 direct, no invented winner); dark-mode ~80% (89/111) + every-new-screen-theme-aware rule.
- Two audit corrections surfaced by the coder and CONFIRMED by the reviewer: gallery-only imports (above) and 17 mock files still importing the static colors export.
- Not committed: the concurrent session's src/ work (GlassCircle saturated-disc, Home ?v= variants) , verified unrelated to this doc task and left alone.
