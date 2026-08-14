# OPEN DECISIONS , the questions waiting on you (2026-07-13)

One findable home for every decision only you can make. Each has my recommendation so you can just say yes/no. Sorted highest-value first. (Design-token questions live in `_design-system/QUESTIONS.md`, currently empty; product + meta decisions live here.)

---

## PRODUCT

### D-1. Six feature flags are DEAD switches , wire or delete?
The new feature-flags admin page toggles 19 flags, but 6 flip a DB row that no code reads (proven: `lib/feature-flags.ts` is the only reader). Toggling them does nothing.
- `credits`, `messaging`, `twint` , features that are killed/off per memory. **Rec: delete the rows.**
- `referral`, `last_minute`, `salon_of_month` , features that exist but were never gated. **Rec: either wire the flag into the feature (I do it) or delete the row. Your call which of the three you actually want on/off-able.**
- **What I need from you:** "delete the 3 dead ones, wire the other 3" or per-flag instructions.

### D-2. Enable a second city?
Only Basel is active (20 salons). Zürich/Bern/Luzern/Genève/Lausanne/Neuchâtel are inactive with 0 salons. The toggle works; enabling one just shows an empty city page.
- **Rec: stay Basel-only until a city has real salon inventory.** Flipping one on early = an empty result page for customers. Say the word if you want one on anyway.

---

## META / ENFORCEMENT (from the estate audit, `_plans/ESTATE_AUDIT_2026-07-11.md`)

These 10 items each retire, weaken, or repoint a gate/rule/memory, so the audit's own rule is they need your explicit yes. My recommendation per item:

- **#8 frontend-design plugin** can ship UI bypassing the mockup-first pipeline. **Rec: carve it out for this repo. (yes/no)**
- **#9 coderabbit auto-review** duplicates the council. **Rec: make coderabbit opt-in, council stays canonical. (yes/no)**
- **#10 five stop/defer gates overlap** (this is what kept firing on you). **Rec: yes, extract one shared `_lib` so a fix propagates. Highest-value meta item.**
- **#11 no-black-selected gate exists twice** (global + project). **Rec: retire the global copy. (yes/no)**
- **#12 mockup-english gate duplicates mockup-content.** **Rec: retire the project copy. (yes/no)**
- **#13 delegate-media gate skipped 213x.** **Rec: broaden the rule for this screenshot-heavy repo. (yes/no)**
- **#15 exists/removed gates most-waved-off.** Already partly done (reason now required). **Rec: confirm the reason-required approach. (yes/no)**
- **#17 SECURITY_RULES.md still says use getSession()** , the exact hole we closed. **Rec: yes, rewrite it to getUser(). Safe + important; it currently tells future-me to reintroduce the vuln.**
- **#18 LESSONS_LEARNED stopped being fed 2026-06-05** but the injector only reads that file, so a month of lessons are invisible. **Rec: yes, repoint the injector. Safe.**
- **#19 four docs still assume the Fable-5 model** (this session is Sonnet/Opus). **Rec: yes, refresh the four docs. Safe.**

**Fastest path:** say "do the safe ones" and I apply #10, #15, #17, #18, #19 (pure hardening/doc fixes, no capability loss). #8/#9/#11/#12/#13 change what a gate does, so I will confirm each.

---

## ACTIONS PARKED (not decisions , just need a non-sandboxed session)
- Drift-gate patch (`_plans/DRIFT_GATE_PATCH_2026-07-11.md`) + phantom-string fix in browser-verify-gate.sh: this session's sandbox blocks writing the repo's `.claude/`. Applied from a normal checkout in one pass.
- Live screenshot of the feature-flags admin page: the sandbox blocks the dev server, so no preview link this session. You can click the page, or I verify from a normal session.
