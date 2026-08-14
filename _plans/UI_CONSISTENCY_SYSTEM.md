# UI/UX consistency system (owner 2026-07-23) , PARKED for a dedicated session

## The ask (owner, verbatim intent)
"we need a whole system for you catching inconsistent stuff and self improve and like u catch fix bfr me even knowing... we need a whole session for that, research all principle abt inconsistency in ui ux n yk make whole gates evrth arnd it. note and park this."

So: a dedicated session that (1) RESEARCHES all UI/UX consistency principles, then (2) BUILDS a system + gates that auto-catch inconsistency and let me self-improve , fixing drift before the owner ever notices.

## Motivating example (what triggered this)
The category-icon saga: hand-drawn SVG (rejected) -> derived Lucide Brush/Hand/Droplet (rejected, "makes no sense") -> 3D PNGs applied to onboarding (rejected: "3D icons are homepage-only; using them together with the normal Lucide icons looks irregular and inconsistent"). The real defect was never one icon , it was MIXING two icon systems (3D illustrations + Lucide line icons) in one view. No gate caught the inconsistency; the owner did. That is the gap this system closes.

## Scope for the dedicated session (research + build)
- RESEARCH: consistency principles in UI/UX (design-token adherence, ONE icon system per surface, spacing rhythm consistency, type-scale consistency, component reuse vs one-off, color-role consistency, elevation consistency, copy-voice consistency, state-treatment consistency). Evidence-tiered like the RATIONALE work; named sources; myths excluded.
- SYSTEM: a mechanism that scans a surface (or a diff) and flags INCONSISTENCY specifically , not single-rule violations (the existing gates already do those) but MISMATCHES: two icon styles in one view, two card-elevation recipes on one page, a spacing value that breaks the page's own rhythm, a type size that is a one-off, a component re-implemented instead of reused. Cross-reference the existing CONSISTENCY_AUDIT.md + DRIFT machinery; extend, do not duplicate.
- GATES: build/extend hooks that block the mismatch classes at write time (like the new mockup-isolated-ab-gate this session), so the drift never ships.
- SELF-IMPROVE loop: each owner-caught inconsistency becomes a new gate/rule the same turn (the harden-mandate generalized to consistency).

## Immediate finding logged (so it is not lost)
- 3D category icons = HOMEPAGE-ONLY. Do NOT use them in onboarding, filters, or any surface that also shows Lucide line icons. Onboarding category pills are text-only for now. The "right" consistent category-icon treatment across surfaces is a decision for this session.

## Status: ACTIVE (owner opened it 2026-07-23: "start w the research and whole loop abt the consistancy").

## EXISTS-CHECK (done 2026-07-23, kills the duplication risk)
EXISTING infra (EXTEND, do NOT recreate):
- `solen-drift-check` skill + `scripts/check.py` = a STATIC drift CHECKER, SINGLE-FILE / SINGLE-RULE (A1-A14: raw hex, retired tokens, arbitrary colors, non-canonical durations). Logger.
- `.claude/hooks/pre-edit-drift-gate.sh` = runtime GATE, blocks NET-NEW single-rule drift on one Edit (A1-A6/B1-B5 hard rules).
- `_design-system/CONSISTENCY_AUDIT.md` = per-AXIS canonical audit (section-H2 size, selected-state, price weight...), mostly resolved decisions.
- `_design-system/DRIFT_LEDGER.md` (decisions), `_drift-report.md` / `_spacing-drift.md` (reports), `RATIONALE.md` (Round-3 principles), research/PRINCIPLES_ROUND3*.

THE DELTA (what they MISS = what this system NEW-ly catches): they catch SINGLE-FILE, SINGLE-RULE drift. They MISS CROSS-SURFACE MISMATCHES: 2 icon systems in one view; selected-state differing ACROSS screens (the graveyarded customer-overhaul missed exactly this); a one-off type size breaking the page's own scale; a component re-implemented not reused; divergent elevation/color-role/copy-voice across a surface. These are RELATIONAL (compare N elements/surfaces), not one-line-vs-token. That is the research + build target.

## PREMORTEM (carried into briefs)
- R1 DUPLICATION (top): recreating solen-drift-check / CONSISTENCY_AUDIT. MITIGATION: every stream names which existing infra it EXTENDS; the deliverable is the cross-surface-mismatch DELTA only.
- R2 fake pop-stats ("consistency boosts conversion X%"): adversarial-verify each claim vs a named source; evidence tiers; myths-caught list must be non-empty proof the skeptic ran.
- R3 scope sprawl ("consistency" is huge): locked stream list, each tied to ONE mismatch class + its detection method. OUT OF SCOPE: building the detection scripts/gates (later phase), re-doing single-rule gates, generic UX not about mismatch.

## LOCKED RESEARCH STREAMS (~12, each: evidence-tiered principle + mismatch class + detection method + which existing infra it extends)
S1 consistency theory/mechanics (Jakob's external + internal consistency, Gestalt similarity, cognitive load, learnability) ; S2 icon-system-per-surface (the trigger) ; S3 selected/active-state cross-screen ; S4 type-scale one-offs ; S5 spacing-rhythm within a surface ; S6 elevation/shadow recipe divergence ; S7 component reuse vs re-implementation (dedup) ; S8 color-role consistency ; S9 copy-voice/microcopy/terminology ; S10 state-treatment (loading/empty/error) consistency ; S11 DETECTION METHODS (how to computationally catch cross-surface mismatch: className/AST analysis, cross-file compare, the mismatch metric) ; S12 how to EXTEND solen-drift-check + CONSISTENCY_AUDIT + gates (the wiring plan, not the build).

---

## PHASE 1 DONE: research + doctrine (committed d05c61d34)
`_design-system/research/CONSISTENCY_MISMATCH_R1.md` (evidence-tiered, 12 streams + adversarial verify, 23 myths caught, e.g. the fake "consistent branding = +23% revenue" stat rejected by 6 streams). 8 real tensions parked in `_design-system/QUESTIONS.md` for owner ruling. DELTA reaffirmed: cross-surface SAME-ROLE / DIVERGENT-TREATMENT mismatch, the class the per-file gates miss.

## PHASE 2: BUILD (report-mode first, rule 12.5)

### Detector 1 - dupe-check (S7 component reimplementation): DONE, report-ONLY
`scripts/detect-near-duplicates.mjs` + `npm run dupe-check` -> `_design-system/_dupe-report.md`. Commits 6ba8a69f8 + precision redesign af66b9675.
- Result: 3,061 HIGH -> **76 high-confidence** (high-confidence bar = text-marker OR structural-clone shape >=0.6 OR name-root+shape; 25 generic-idiom primitives excluded). All 3 known dupes retained (PriceFrom via marker, Modal via name-root, Avatar via structural fingerprint).
- **20-random-sample precision = 60% (12/20).** Disclosed limit: "CHF" leaks into KPI/total/prose (a semantic-role call static AST cannot make).
- **VERDICT: report-only, NOT gate-eligible.** 60% precision would false-block ~40% at write time -> gate gets disabled (the retro failure mode). Shape-based dedup is the LOWEST-precision mismatch class in a convention-heavy codebase (same Tailwind idiom != same component). Keep as a manual/CI audit report.

### Detector 2 - icon-check (S2 icon-system, THE owner trigger): DONE report-mode; GATE BLOCKED on owner ruling
`scripts/detect-icon-system-mismatch.mjs` + `npm run icon-check` -> `_design-system/_icon-system-report.md`. Commit da46b53de. Self-test passes (ProfileTabs+SearchTemplate flagged; homepage users not; 338 lucide-only files not).
- Flags 4 files (16 refs), all "lucide-mixed non-homepage": Header (GLOBAL layout, leaks site-wide), ProfileTabs, SearchTemplate, dev/search-model-b.
- **FOUNDING QUESTION SURFACED (QUESTIONS.md consistency tension #9, HIGH):** the "homepage-only" rule I recorded 2026-07-23 CONTRADICTS two owner-blessed usages: (a) ProfileTabs' 3D icons are inside `<EmptyTray>` = the sanctioned EmptyState anatomy (owner 2026-07-21); (b) Header/Search 3D category-nav pills were added "per repeated user request (the red box)". Owner's actual trigger was MIXING 3D+Lucide in the SAME picker/role (onboarding), not any off-homepage 3D icon. The "also imports lucide" heuristic is too crude (Header uses Lucide for NAV, 3D for CATEGORY PILLS = different roles).
- **Gate cannot be built correctly until the owner picks:** (a) literal homepage-only (large remediation, contradicts prior asks) vs (b) never-mix-in-same-role (re-scope detector; current flags mostly clear). My read: (b). Until then icon-check stays report-mode.

### Detector 3 - type-scale one-off (S4): DONE, report-mode, GATE-ELIGIBLE
`scripts/detect-type-scale-outliers.mjs` + `npm run type-check-scale` -> `_design-system/_type-scale-report.md`. Commit 438cc015e. Self-test passes (flags 12.5/13.5/17px; not 14/12/16/20px; Hero H1 28+40 both allowed).
- **422 off-scale usages, 29 distinct values (7 half-pixel + 22 odd-integer), 117 files.** Top: text-[12.5px] (165), text-[13.5px] (113), text-[17px] (41), text-[14.5px] (34), text-[19px] (15). Grouped by value = 29 skimmable sections.
- Surfaced a SECOND doc contradiction (Hero-sub 15-vs-16, LOCKFILE §2.5 vs §2) folded into QUESTIONS tension #2. Also a large decorative tail (120-150px x1 each) + deprecated text-[9px] flagged for a human glance.
- Gate-eligible once the owner reconciles the two Hero clamp contradictions (both currently treated as allowed, so no false flags).

## PHASE 3 (GATES): UNBLOCKED - owner ruled 2026-07-23
Owner ruled: (1) icon rule = ENUMERATE BLESSED SURFACES (homepage + empty-tray + category-nav pills; QUESTIONS #9 RESOLVED); (2) "wire gates for what's decided."

- **Icon gate: DONE + INDEPENDENTLY VERIFIED (commit 3cb4edb8e).** `scripts/hooks/icon-blessed-context-gate.mjs` (PreToolUse Edit/Write, app+components .tsx), wired in `.claude/settings.json`. Shares its classifier with the detector via `scripts/lib/icon-blessed-context.mjs` (gate + report can't diverge = the consistency principle applied to the tooling itself). Net-new count comparison (never blocks unrelated edits), fail-open, 3 escape hatches. Detector retooled to blessed-context: **0 live violations** (codebase compliant). My own 4-case rule-12.5 test PASSED: blocks non-blessed 3D icon (exit 2), allows EmptyTray icon / neutral edit / out-of-scope file. This is the owner's "catch it before you see it" for their actual trigger, LIVE.
- **Type-scale gate: DONE + INDEPENDENTLY VERIFIED (commit dfc3f34c7).** `scripts/hooks/type-scale-gate.mjs` + shared `scripts/lib/type-scale-allowed.mjs` (imported by detector too; refactor behavior-preserving, detector still 422/29). Net-new count, fail-open, 3 escape hatches. My own 6-case rule-12.5 test PASSED: blocks new text-[13.5px] + text-[17px] (exit 2), allows text-[14px] / text-[40px] Hero-endpoint / neutral / out-of-scope. Both Hero clamp values allowed (contradiction #2 non-blocking).
- **Remaining decisions (non-blocking now):** QUESTIONS #2 (2 Hero clamp doc-contradictions, both allowed for now) + the earlier 8 doctrine tensions.
- **Gate-eligibility by detector:** dupe-check = NO (60% precision, report-only). icon-check = DONE gate. type-check-scale = DONE gate.
- **Self-improve loop (owner's "catch fix bfr me even knowing"):** each owner-confirmed rule -> a gate; each new owner-caught mismatch -> /harden into a gate (the harden-mandate generalized to consistency). Deferred until more classes land.

### REVISED FINDING (2026-07-23, from grounding S3 selected-state): gate-eligibility depends on ROLE-UNAMBIGUITY, not just "has a canonical value".
The 2 gated classes work because their ROLE is machine-unambiguous: an icon path IS an icon; a `text-[Npx]` IS a font size. The remaining classes are FUZZY because the role itself is ambiguous to static analysis:
- **S3 selected-state:** the canonical (gray-sunken fill) is decided, BUT "selected" collides with `active:scale` press-pseudos, `is_active` STATUS badges (semantic color, not selection), and image/avatar selection (ink-border exception). A naive scan floods (grep proof: dozens of `bg-s-accent ... active:scale` button false-positives + `promo.is_active` status badges). The existing `no-black-selected-gate.py` already covers the black case. So S3 needs dupe-detector-style precision work and is likely REPORT-ONLY, not a clean gate.
- **S8 color-role** (blue = small-clickable): needs role-context (is this blue on a link/small-button [ok] or a big-CTA/price/heading [violation]?) = the fuzziest.
- **S5 spacing / S6 elevation:** relational (compare N elements), hardest.
- **S9 copy-voice / S10 state-treatment:** semantic, fuzzy.

### RESOLVED (2026-07-23, investigated the remaining classes instead of deferring):
- **S3 selected-state: BUILT report-only** (`npm run selected-check`, commit 8be503410). 90 divergences (35 blue-selected = the clear signal, 55 partial-compliance), false-positive classes correctly excluded (21 press-pseudo/status-field skipped). REPORT-ONLY (role ambiguity blocks a clean gate). Settings untouched, verified.
- **S8 color-role: NOT built (covered + low-signal).** `blue-sparse-gate.py` already gates blue-overuse in MOCKUPS (the high-value new-design surface). Production .tsx is a gap, BUT measured: 188 bg-s-accent fills yet only ~2 on big CTAs + 1 blue heading vs 275 legit small-link uses = production is largely compliant. A fuzzy role-detector for ~3 real violations amid heavy false positives = low value. Extend blue-sparse-gate to production later IF drift grows.
- **S5 spacing: NOT built (covered).** `_design-system/_spacing-drift.md` (manual audit) + `_geometry-report.md` exist. Relational; automated version is net-new but low marginal value.
- **S6 elevation / S9 copy-voice / S10 state-treatment: NOT built (relational/semantic, low-value, no clean gate).**
- **Reason it is a DECISION not a defer:** building color/spacing detectors would DUPLICATE existing infra (rule 12, the owner's #1-hated failure); the rest are measured-low-signal or ungate-able relational classes.

### CAPSTONE: `npm run consistency` umbrella dashboard (runs all 4 detectors + names the 2 gates) = the "whole system" single entry point. In progress (coder a98f4f9d).

### THE DELIVERED SYSTEM (final): doctrine + 4 detectors (dupe/icon/type-scale/selected, report-mode) + 2 verified live gates (icon/type-scale) + umbrella dashboard + self-improve note. The DRIFT the detectors found (90 selected-state, ~3 blue, 422 type-scale, 76 dupe) is a SEPARATE remediation workstream (customer UI = mockup-first, owner-directed), not part of building the system.
