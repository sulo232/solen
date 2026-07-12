# CANON fold + pixel re-diff decision (owner, 2026-07-10)

Owner message: "wait ok nvm for n1 ima gi w ur reccomendation n ye for sec fold it"

- [x] 1. Pixel re-diff harness: record the owner's pick of the defer recommendation (do NOT build until a real drift case appears)
  - verified: DESIGN_GOVERNANCE_AUDIT_2026-07-10.md:36 now reads "OWNER DECIDED 2026-07-10: went with the defer recommendation" (grep-confirmed post-commit)
- [x] 2. Fold CANON.md into LOCKFILE (commit cf05126a2, 9 files)
  - [x] 2a. Coverage check: every CANON section vs LOCKFILE (result: LOCKFILE fresher on every conflicting row; only 3 genuine deltas)
    - verified: LOCKFILE.md:864 fold note lists the section-by-section mapping (grep-confirmed post-commit)
  - [x] 2b. Add the 3 deltas to LOCKFILE
    - verified: warm-shadow rationale at LOCKFILE.md:488; amber deeper-sibling #E09A0C at LOCKFILE.md:72; fold provenance at LOCKFILE.md:864 (all grep-confirmed post-commit)
  - [x] 2c. Tombstone CANON.md (pointer + old-section-to-new-home table; precedence claim retired)
    - verified: CANON.md rewritten in cf05126a2; 12 LOCKFILE mentions in the tombstone (grep -c post-commit); header states the precedence claim is retired
  - [x] 2d. Repoint live citations: SOURCE.md 7 spots (incl. 2 stale v2 "generous blue" claims corrected to v3), fable-reasoning SKILL.md law-parsing rule, fable-frontend SKILL.md steps 3 + doc table, SelectedCheckBadge.md 2 spots
    - verified: SOURCE.md:103/256/306 carry "CANON folded into LOCKFILE 2026-07-10" (grep post-commit); assert-count-1 python replaces applied 7 SOURCE edits + 2 SelectedCheckBadge edits; skill edits via Edit tool same turn (global files, not in repo git)
  - [x] 2e. Fix drift-check A9: recommendation message taught the RETIRED v2 law ("blue CORRECT on see-all / tabs / ghost buttons"); rewritten to LOCKFILE section 1.5 v3 hyperlink scope
    - verified: check.py:988 rule renamed "INFO A9: blue outside the hyperlink scope (v3)" (grep post-commit); python compile OK
  - [x] 2f. Park with reasons (audit finding 11): ACCENT_ALLOWED_HINTS v2 residue (needs live FP count); CANON R4 Hanken-mockup archiving (needs link sweep)
    - verified: both parked items named inside the finding-11 line in DESIGN_GOVERNANCE_AUDIT_2026-07-10.md (committed in cf05126a2)
- [x] 3. Records: audit finding 11 closed, triage verdict updated, this batch file, WORKLOG entry, commit
  - verified: commit cf05126a2 "fold CANON.md into LOCKFILE"; graveyard gate run manually post-commit = PASS (the --no-verify skip was re-checked)

Status: DONE (2026-07-10). Historical docs (_tasks/*, V2_RECONCILIATION, RESTRAINT_TEST, MOTION.md dated notes, _pending-migration generated output) keep their CANON citations on purpose , they are dated history and the tombstone resolves them.
