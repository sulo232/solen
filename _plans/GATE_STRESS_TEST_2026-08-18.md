# GATE + HOOK + PRINCIPLE STRESS TEST , 2026-08-18

Owner ask: *"look into the gates, hooks, and all the restrictions that you have, and the principles.
Stress test every one. Use the subagents council. Actually evaluate and stress test each one. Before
you even think of removing, actually stress test it."*

The one rule: **nothing is removed, added, or edited on a hunch.** A verdict is earned by DRIVING the
thing with real input.

Page for him: `public/_reports/gates-2026-08-18/index.html`

## Census, measured (the handoff's numbers were counted over one directory of three)

| | handoff said | actually | after this pass |
|---|---|---|---|
| hook files on disk | 236 | **305** (`~/.claude/hooks` 249, `.claude/hooks` 38, `scripts/hooks` 20) | 305 |
| wired | 176 | **215** | **211** |
| unwired | 60 | **90** | 94 |
| armed + no selftest + no corpus | 103 | **133** | **112** |
| Stop-hook wall clock per turn end | not measured | **18.6s** | **2.7s** |
| bytes injected per ordinary prompt | not measured | **4,250** | **3,913** |
| hooks carrying a `--selftest` | not measured | **128** | **144** |
| bytes injected at session start | not measured | **16,317** | **16,126** (192 bytes, not a win, see below) |

## Boxes

- [x] Census across ALL THREE hook directories (the handoff missed two)
- [x] Universal drive: all 215 armed hooks fed real benign payloads, exit code + verdict + timing recorded
      , 0 hang, 0 real crash, 2 blocking a plain answer, 1 costing 14.3s on every turn
- [x] Built `~/.claude/hook-probe.py`: drives one hook with one payload, counts all four refusal
      shapes (the existing evaluator only counted two, which is why working gates scored dead)
- [x] Batch A council: security / backend / money PreToolUse (20) , 9 FIX, 11 KEEP, 0 DELETE
- [x] Batch B council: mockup / design PreToolUse (32) , 20 FIX, 12 KEEP. 8 of 32 reach `app/**/dev/**`
- [x] Batch C council: process / workflow PreToolUse (25) , 15 FIX, 1 DELETE, 9 KEEP
- [x] Batch D council: Stop (22) , 18 FIX, 1 DELETE, 3 KEEP. 9 of 22 are shape-only and could move earlier
- [x] Batch E council: injectors (34) , 2 DELETE, 3 TIGHTEN, 2 FOLD, 27 KEEP
- [x] Batch F council: the 90 unwired , 52 DELETE, 15 HELPER, 10 LIVE-VIA-AGGREGATOR, 12 KEEP-DORMANT, 1 ARM
- [x] Sweep the `/dev/` blindness family , **7 hooks confirmed** refusing a violation in `_mockups/*.html`
      and passing the identical violation in `app/[locale]/dev/**/*.tsx`
- [x] `mockup-type-budget-gate.py` , **handoff claim is STALE.** It reads Tailwind `text-[Npx]` and the
      named weights correctly today. Blocked a 5-size/4-weight `.tsx` on the first probe.
- [x] `use-the-registered-component-gate.py` , **handoff claim is STALE.** V2 (2026-08-15) fixed both the
      `/dev/` exemption and the one-import stand-down. Real remaining gap: a hand-drawn ROW (radius +
      border, no `bg-white`) still passes, which is the shape the owner actually complained about.
- [x] Every Stop hook classified SHAPE-ONLY vs EVIDENCE-BASED (9 of 22 could fire before the message exists)
- [x] Round 1 fixes landed: no-focus-ring (Tailwind grammar), checkbox-evidence (memo), say-whats-next
      (agentive subject), information-is-not-action (question shape, not a literal `?`)
- [x] Retired 4, added 0: `audit-status.py`, `gemini-auto-fire.py`, `tunnel-kill-relink-gate.py --pre`,
      `plan-active-prompt.py`
- [x] `mockup-grounding-gate.sh` exempts `public/_reports/` (it was passing report pages by accident,
      via a citation regex that also matches the `Exists-check:` line)
- [x] Deliver: a page he can open on a phone, count before and after
- [x] Round 2 fixes (8) , commit `9cc9f6f15`. `verified:` I re-drove four myself after the agent
      reported: the Fresha clause now names Airbnb (`user-prompt-binary-triggers.sh:61`);
      `checkbox-evidence-gate.py` 14.32s -> 0.73s on the same payload; `postgrest-filter-injection`
      blocks the real `.ilike` shape from `app/api/directory/route.ts:49` and passes a zod-validated
      call; `no-verify-commit` passes a read-only grep of its own name and still blocks
      `git commit --no-verify`. All eight self-tests pass; five had none before.
- [x] Round 3 fixes (6) , `verified:` re-driven by me, 8 of 9 reproduced. `no-focus-ring-gate.py`
      passes the kept ink outline and still blocks a blue ring, the CSS halo and the Tailwind halo
      (4 cases); `white-only-web-gate.py` blocks `darkMode` in `tailwind.config.js`, passes a config
      edit without it, passes the same line under `solen-mobile` (3 cases);
      `entity-card-gate.py` passes the locked grouped list-card; `no-black-selected-gate.py` passes
      `selectedSlot === t` and blocks `bg-black`; `mockup-base-gate.py` blocks the real
      `app/[locale]/dev/pdp/portfolio/page.tsx` with its live Unsplash URLs at lines 54-56;
      `pre-component-edit-pixel-spec.sh:130` exit 1 -> exit 2. Nine self-tests pass.
      **NOT reproduced by me:** the Tailwind-grammar half of `mockup-width-calibration-gate.py`.
      Its scope now reaches dev routes, but I could not construct a payload where it blocks on
      Tailwind sizes, so that half is the agent's claim, not mine.
- [x] 15 of 17 false enforcement claims corrected. `verified:` spot-checked four myself, each
      naming a hook I then confirmed is in `settings.json`: `REPLY_LAW.md:437` now names
      `reply-shape-preflight.py`; `MEASUREMENT_LAW.md:440` names
      `second-instrument-before-blocked-gate.py`; `_rules/LESSONS_LEARNED.md:546` names
      `migration-fabricated-data-gate.py`; `memory/project_consistency_system.md:16` now reads
      "all four detectors are REPORT-ONLY" with the old GATED claim struck through.
      2 could not be edited: `canon-archive-gate.py` blocks writes to both files, and the icon one
      is GENERATED by `scripts/detect-icon-system-mismatch.mjs:163`, so an edit would be overwritten
      on the next `npm run icon-check`. Both recorded in the memory file instead.

## FOR THE OWNER , decisions and live product bugs, none of them fixed by me

1. ~~**The banned focus halo is LIVE** on the homepage~~ , **CORRECTED 2026-08-18, and this was my
   error.** The halo is in `app/[locale]/_components/homepage/BentoBusiness.tsx` lines 616, 623, 630,
   637, inside `JoinUsCard`. `verified:` `JoinUsCard` and `BentoBusiness` have **0 real (non-comment)
   references** anywhere in `app/**` or `components/**` , every mention in `app/[locale]/page.tsx` is
   inside a `/* */` doc comment, and `<JoinUsCard` appears nowhere. Rendered `/de` and counted: 1
   input on the page, 0 carrying the halo class. So it is DEAD CODE, not shipping, and there is
   nothing for him to approve. It still mattered as a gate finding, because the gate could not see
   the Tailwind spelling at all and would have missed it the moment anyone wired the component up.
   Memory `feedback_source_code_is_not_render_truth` is exactly this trap and I walked into it.
2. **Three phantom columns in shipping routes**: `salons.avg_price`, `profiles.first_name`,
   `reviews.reply_at` / `reply_text`. PostgREST returns null rather than erroring, so these are silent.
3. **PBV total-price violations** (statutory tier, above taste): `messages/de.json` 248, 507, 4651;
   `messages/fr.json` 507; `app/[locale]/warum-solen/page.tsx` 152-153.
4. **Five files carry dormant `dark:` classes**; inert only because `darkMode` is absent from
   `tailwind.config.js`. The gate could not see that file until today.
5. **`evidence-family-aggregator.py` is the one ARM candidate** found in 90 unwired hooks: seven
   "prove it" Stop gates were unregistered on 2026-08-07 in favour of a bundle that was never wired.
   Arming it restores seven checks in one entry. His call, since arming costs him messages.
6. **`touch-action-scroll-gate.py`**: deletable under his 2026-08-08 decision, but it is the one named
   uncovered loss , `touch-action` is readable only by touch input, so no other instrument can see the
   bug, and it cost him three complaints in a row. Reversing that decision is his call.

- [x] `mockup-lang-stop-gate.py` , two fixes, both measured. (a) Its dev patterns began with a bare
      `**`, so each walked the whole repo including node_modules: 3.62s to find the same 175 files an
      anchored glob finds in 0.07s. (b) It decided "did you touch this file" by mtime, and git writes
      every file in a worktree at checkout, so in a worktree that is true for the entire repo. It
      named six mockups from June, July and 15 August as touched this session; `git status` on all
      six is empty. It now asks git. `verified:` untouched files pass, a genuinely modified German
      mockup still blocks (exit 2).

## ROUND 2 RESULT, and it is the finding of the session

13 fixes were made, then each was re-attacked by an agent that did not write it.
**12 of 13 came back BROKEN.** Two of those reports say the new defects were INTRODUCED BY THE FIX
("three defects reproduced, all introduced by this fix"). One holds on its named defect and is
broken on the premise underneath it.

The lesson is not that the fixers were careless. It is that **fixing a gate without an adversary
produces new defects at roughly the rate it removes them**, and every previous round in this
estate's history graded itself. That is why 133 armed checks had never been tested.

These stay OPEN. Ticking them would be the exact failure this whole session documents.

## IN FLIGHT , real boxes so this is tracked, not narrated

Adversarial re-break of today's fixes found 5 BROKEN and 8 PARTIAL. Each is a box. Each is being
fixed AND re-attacked by an agent that did not write the fix (run `wf_3859ceaf-770`).

- [x] `plan-first-gate.py` , FIXED and the "still broken" reading was MY TEST, not the gate.
      `verified:` three real defects were found and fixed: `is_substantive()` excluded every product
      file in a worktree; `path_keywords()` had the same bug separately and still yielded
      {claude, gates, nonsense, stress, worktrees, zzqqxx}; and the strip pattern demanded a leading
      slash that is gone by the time the root is removed, so it matched nothing. Keywords are now
      {nonsense, zzqqxx}, identical at both paths. The remaining difference is the gate's own
      documented allow path: `plan_touched_since()` is True in the worktree because I edited
      `_plans/GATE_STRESS_TEST_2026-08-18.md` this turn, and False in main. Proved by calling it
      directly with the same 10-minute stamp against both roots. Selftest 10/10.
- [x] `exists-guard.py` , CLOSED, after the adversary broke the first attempt two ways.
      `verified:` all four of its escapes now BLOCK end to end (`skipped, ship it`,
      `assumed net-new`, `probably fine`, `I will look at this later`) and all three real forms
      still pass (the documented marker, the markdown bullet, `extends SalonCard.tsx`).
      Selftest 16/16, including the bullet case that the first attempt broke.
      What changed, and it is the lesson: the first attempt enumerated the words for "I did not
      look" and lost, because English has unlimited ways to say it. This version asks two
      STRUCTURAL questions instead. POSITION: a real claim is a header, so only the opening 15
      lines count, which kills a document that merely quotes the protocol in its body.
      REFERENT: the claim must name something checkable, a quoted term, a path, a filename, an
      identifier, or a stated act of checking. The one wordlist left is the hedge set
      (assumed / probably / skipped / will look later), which is closed and already banned
      estate-wide by global rule 15.
- [ ] `information-is-not-action-gate.py` , a multi-sentence imperative escapes, because only the last sentence is read
- [ ] `say-whats-next-gate.py` , misses implemented/updated/refactored/created/wrote; blocks "nothing was measured"
- [ ] `mockup-base-gate.py` + `mockup-preflight-manifest.py` , deny 158 and 149 of the repo's OWN 175 dev files
- [x] `no-focus-ring-gate.py` , CLOSED. `verified:` I drove all three adversary payloads myself:
      `focus:shadow-[0px_0px_0px_3px_rgba(255,255,255,0.4)]` -> BLOCK(deny);
      `outline:2px solid var(--s-ink)` -> pass; `outline:solid 2px #276EF1` (reversed order) ->
      BLOCK(deny). Today's four earlier cases still hold.
- [ ] `postgrest-filter-injection-gate.py` , `expr_is_safe()` defaults to ALLOW, wrong default for a taint check
- [ ] `no-black-selected-gate.py` , inline `style={{background:'#0A0A0A'}}` passes; filter pills wrongly exempted
- [ ] `entity-card-gate.py` , `rounded-3xl` (same 24px) still blocks; 400-char exemption window leaks
- [ ] `unfinished-batch-gate.py` , a `HEAD~3` window cannot mean "this turn"
- [x] `no-verify-commit-gate.py` , CLOSED. `verified:` a backslash-continued
      `git commit -m "x" \` newline `--no-verify` -> BLOCK(deny), and the read-only
      `grep -n "no-verify-commit-gate" ~/.claude/settings.json` still -> pass.
- [x] `white-only-web-gate.py` , CLOSED. `verified:` `type P={darkMode:"on"|"off"}` in a .tsx ->
      pass; `module.exports={darkMode:"class"}` in `tailwind.config.js` -> BLOCK(deny). The iOS
      exemption and the CSS `prefers-color-scheme` case were re-checked earlier and hold.
- [ ] `mockup-lang-stop-gate.py` , committing your work disarms it, and the rule is commit often
- [ ] Re-drive all 13 myself after the run lands (the fixer is never the grader)

- [x] `map-style-gate.py` , THIRD hook found with the worktree-blindness defect, fixed and verified
      this turn. `verified:` `EXEMPT` matched `\.claude/` against the raw path, so every product
      file in the running checkout was exempt. Now strips the worktree prefix first: a worktree
      product file is NOT exempt, a real hook file and `_design-system/` still are, selftest OK.
      This is the harden for this turn, and it is FIX THE EXISTING ONE, not a new check.

## FALSE POSITIVE FOUND BY BEING BLOCKED

- [ ] `finish-autonomously-gate.py` BATCH-MOCKUP arm fired on this turn and **I could not reproduce
      it**, so the diagnosis I first wrote here was wrong and is retracted. What I actually know:
      this session built ZERO mockups (`git log --since` over `public/_mockups` and
      `app/[locale]/dev` is empty), and `_plans/MOCKUP_QUEUE.md` is dated 10 August. What I
      GUESSED and then disproved: that it keys off the stale queue file (it does not read that file
      at all), and that it was reading another gate's feedback as the owner's message (driven both
      ways, both pass). Its arm needs "mockup" AND an all-word in his CURRENT message, and his was
      "go fix em all". Trigger still unidentified. NOT fixed, and not to be "fixed" until it is
      reproduced, because a change to a trigger I cannot reproduce is a guess.

## OPEN VERIFICATION, carried forward rather than claimed

- `no-invented-ui-gate.py` , its suite passes 5/5 and case 1 blocks a `font-heading font-semibold`
  card name, but my own payload carrying that name PLUS a `fill-s-star` rating still passes. Either
  my payload trips an exemption I have not isolated, or the fixture and the live path diverge. NOT
  claimed as fixed until that is resolved. My first two probes of `card-radius-gate.py` were also
  too thin and I called them failures before re-testing with the real grouped-card grammar, which
  blocks correctly, so the same caution applies here.

## Unplanned additions

- `mockup-grounding-gate.sh` false-positives on report pages (fixed this turn, exempted by name).
- `no-blind-sweep-gate.py` blocked a read-only analysis script because the script's own text named
   several file paths. Not fixed, logged here: it fires on a Bash command that WRITES a script
   mentioning paths, not on a command that writes source files.
