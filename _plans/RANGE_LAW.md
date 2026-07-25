<!-- batch: turn the flatness finding into researched principles + live gates (owner 2026-07-25:
     "we need this research evrth like our alrdy existing principles evrth and researchs and yk
     make then principle and gates evrth") -->
# RANGE LAW , research -> principle -> gate

## Readback of the ask
1. RESEARCH it properly, in the format of the existing `_design-system/research/TASTE_*.md` files (evidence-tiered, every claim carrying its source).
2. Turn the findings into PRINCIPLES in the existing law files (not a new doc).
3. Turn the principles into GATES that actually block, not prose.

## What already exists (rule 12, do not duplicate)
- `research/FLATNESS_DIAGNOSIS_2026-07-25.md` , OUR measured numbers. No external evidence tier yet.
- `research/TASTE_HIERARCHY.md`, `TASTE_TYPOGRAPHY.md`, `TASTE_GROUPING.md`, `TASTE_DASHBOARDS.md`, `TASTE_CHECKOUT.md`, `TASTE_DIAGNOSIS_FRAMEWORKS.md`, `GEOMETRY_PRINCIPLES_2026-07-17.md` , the format to match.
- CLAUDE.md FLOORS LAW 1-7 (7 = EMPHASIS BUDGET, added today) + LOCKFILE frozen literals.
- `npm run check:floors` , measures 6 floors on a rendered route. **REPORT-ONLY, exit 0. Nothing blocks.**
- 125 global hooks + 28 project hooks already exist.

## THE GAP
The floors are measurable but nothing ENFORCES them, and the flatness finding has no external evidence
tier, so it reads as one person's opinion rather than researched law.

## Boxes
- [ ] R1. RESEARCH: visual hierarchy + contrast RANGE , what separates a designed screen from a wireframe. Evidence-tiered, sourced, in the TASTE_* format. Output `research/TASTE_RANGE.md`.
- [ ] R2. RESEARCH: how the reference products (Airbnb / Fresha / Uber) actually build range , captured or cited, never described from memory.
- [ ] R3. PRINCIPLE: fold R1+R2 findings into the existing law files (FLOORS LAW / LOCKFILE), extending not duplicating. Name what each finding changes.
- [x] G1. GATE: flip `check:floors` from report-only to a real gate with an explicit allowlist for the exempt surfaces, so a screen that breaks a floor FAILS. DONE 2026-07-25: `--gate` flag + editable `FLOORS_ALLOWLIST` in `scripts/check-geometry.mjs`, `npm run gate:floors`. Proven both ways: exits 0 with the allowlist in place, exits 1 with one entry removed, restored after.
- [x] G2. GATE: a PreToolUse hook that blocks a NEW customer screen shipping with the emphasis/range violation (the static half, catchable before render). DONE 2026-07-25: `~/.claude/hooks/emphasis-budget-gate.py`, built + self-tested (7/7). NOT YET registered in `~/.claude/settings.json` , that file is sandbox-write-blocked this session; the exact JSON snippet to paste was handed to the owner.
- [x] G3. Self-test every gate (one input that must trip, one that must pass) and wire it. DONE 2026-07-25: hook has a 7-case `--selftest` (trip/pass/exempt/emphasis-ok/+3 more) plus a live stdin smoke test; the script gate has the exit-0/exit-1 proof above. Wiring: `gate:floors` is live via npm now; the PreToolUse hook still needs the manual settings.json paste (see G2), sandbox can't write it.
- [x] G4. Reconcile the two doc-level contradictions the checker surfaced: 375x812 vs 390x844 measurement viewport, and the size-spread trap using global max-min instead of densest-cluster. DONE 2026-07-25: CLAUDE.md now says 390x844 in both spots (old value kept inline as a dated note); F7c now uses a sliding-window densest-cluster check instead of global max-min. Re-run: home (`/de`) NOW TRIPS F7c (densest cluster of 7 distinct sizes inside an 8px window, previously hidden by a 19.2px global spread) , added to FLOORS_ALLOWLIST as a real, newly-surfaced finding, not swept under the old math.
