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

## OPEN, WAITING ON HIM , tracked as boxes so they cannot be lost in prose

These are the only things left in this workstream. Every one needs a decision only he can make,
which is why none of them is done. They stay open until he answers.

- [x] HE SAID YES. Built: `services.length === 1` -> `priceFrom` is a payable total, not a floor, so
      the row drops "ab"/"from" and renders the bare price, with the exact service's name as a
      12px/400 `text-s-ink-2` subline (falls through the row's own `chosen` service, locale ->
      `name_de` -> `name_en`, `name_fr`/`name_it` exist as live columns per `_inventory/_db-columns.json`
      but are not reliably backfilled). Several-service rows are byte-identical to before.
      Files: `app/[locale]/inspo/[id]/page.tsx` (adds `priceExact`/`exactServiceName` to the per-salon
      map, extends the `services!inner()` select to `name_fr, name_it`), `components-legacy/discovery/DetailPage.tsx`
      (extends `SalonLite`, branches the price span at the old `ab CHF {s.priceFrom}` line).
      Mockup built first per the mockup-visual gate: `app/[locale]/dev/decision-inspo-exact-price`
      (real row markup, both treatments stacked full-width at 402px). `verified:` `npx tsc --noEmit`
      clean on both edited files; could not reach `localhost:3000` from this sandbox to screenshot the
      live render (known sandbox network block, not a claim of a render never seen).
      Not touched either way: `app/[locale]/warum-solen/page.tsx` renders four hardcoded prices in
      decorative map pins with no data source, and `MockCompare()` above it invents salon names and
      ratings.
      Also surfaced, his to settle, not mine: `DetailPage.tsx:404` renders the blue `(54)` review
      count, and a gate refuses that citing his 2026-07-13 converged-card decision which dropped the
      count. The shipping code carries a treatment the record calls superseded. Left untouched this
      turn (out of the scope handed to the coder that closed this box).
- [x] The three silently-empty database reads , DONE (commit `1f7f21aee`), he said "2 fix".
      `verified:` checked with `npm run exists` against a CONTROL first (`display_name`, which
      returns three real hits, proving the lookup works) before trusting any negative.
      None of the three needed a schema change, and only one was really absent:
        - `reviews.reply_text` / `reply_at` , SUPERSEDED. Migration 041 moved them to the
          `review_replies` table and 076 carried the data across. `app/api/profile/live-state/route.ts`
          was still reading the old home; it now joins the table the way the same file already joins
          `loyalty_stamps`. `reply_at` exists nowhere at all, so it uses `created_at`.
        - `profiles.first_name` , SUPERSEDED by `display_name`. `app/api/me/route.ts` now reads
          `display_name` and takes the first word, so the route keeps its promise of a first name
          rather than silently returning "Anna Muller" under the same key.
        - `salons.avg_price` , NEVER LANDED, no migration ever created it, and three other places
          compute it from the service prices. `app/api/brand/[slug]/route.ts` now computes it the
          same way instead of asking the database.
      Not request-tested: the coder could not reach the dev server from its sandbox, so this is
      verified against the live schema and against the existing working query in the same file,
      not against a live response.
- [ ] HIS CALL: five files carrying `dark:` styling, inert only while `darkMode` stays out of
      `tailwind.config.js`. Deleting dormant styling from shipped components is a visual change.
- [ ] HIS CALL: arm `evidence-family-aggregator.py`, which restores seven "prove it" checks in one
      entry. It costs him messages, and message count is his standing complaint, so it is his.
- [ ] HIS CALL: `touch-action-scroll-gate.py`, deleted under his 2026-08-08 decision.
      `verified:` its own suite passes 10/10, and it is the ONLY file in all three hook directories
      that mentions `touch-action` at all, so nothing replaced it. `gate-eval` says UNPROVEN, which
      is honest: its corpus is empty, so it has never been shown to fire on anything real.
      Reversing a dated decision of his is his call, not mine.

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

## CORRECTIONS, owner 2026-08-18 (he flagged a repeat)

His words: *"why did you not finish like what did you just say now doing the injection gate ... then
you just stop ... do we even have a principal to how to make it cause like we had so many issues on
the gate that I made ... can you do you even have like an evaluation stage of like gates and I'm
stresse and salvage counsel and all of those stuff so it actually works"*

- [x] CORRECTION 2026-08-18 (commit `fda1610cf`) , he said *"why did you not finish like what did you just say now doing the injection gate ... then you just stop"*. I announced the next gate and stopped instead of doing it. The check for this
      already exists and already fired on me (`finish-autonomously-gate.py`, ANTI-TEE-UP), so it is
      a BINDING failure, not a missing check, and the harden is not another gate.
      What actually changes it: the tee-up fires at Stop, after the message is written, so it can
      only ever produce a second message. The structural fix is the one this session keeps proving,
      and it is now written down in `~/.claude/GATE_LAW.md`: do the next step in the same turn, and
      judge a turn by what closed, not by what there was to say. This turn closed four boxes and
      named none it did not do.
- [x] CORRECTION 2026-08-18 (commit `fda1610cf`) , he said *"do we even have a principal to how to make it cause like we had so many issues on the gate that I made"*. PRINCIPLE written , `~/.claude/GATE_LAW.md`, and routed from the always-loaded
      `~/.claude/CLAUDE.md` rule 12.4, because a law with no route from the file that is always in
      context does not get read. Holds the five failure shapes that recurred today (scope moved,
      grammar not widened, a stand-down too cheap to satisfy, a proxy answering a different
      question, a gate refusing the existing codebase), the eight-step procedure with the adversary
      as step 6, cost as a correctness property, and why a DELETION needs the same proof as a build.
- [x] CORRECTION 2026-08-18 (commit `fda1610cf`) , he said *"can you do you even have like an evaluation stage of like gates and I'm stresse and salvage counsel and all of those stuff so it actually works"*. The evaluation layer now REFUSES to say PASS without an adversary.
      `verified:` a gate passing every internal check reported `UNPROVEN` with nothing recorded;
      after `gate-eval.py attacked <hook> "<note>"` the same gate reported `PASS`; a genuinely
      broken gate still reports `NOT READY` and a missing file still refuses to grade at all.
      Four real adversary passes from today are logged with what they tried.
- [x] Did the injection gate I named, in the same turn I named it (commit `fda1610cf`). See the entry above.

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
- [x] `exists-guard.py` (commit `6d207e9d3`) , CLOSED, after the adversary broke the first attempt two ways.
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
- [x] `information-is-not-action-gate.py` , CLOSED. `verified:` a multi-sentence imperative
      ("Fix the gate. Do not stop until it is done.") with a pure-commentary reply now BLOCKS, and a
      voice-dictated question with no question mark ("whats on the salon card") still passes. Both
      re-driven with the corrected probe, since the earlier readings were taken against the wrong
      copy of the file.
- [x] `say-whats-next-gate.py` , CLOSED. `verified:` "I implemented the new availability filter and
      it discriminates correctly now." now BLOCKS (the missing agentive verbs are in), "Nothing was
      measured this turn, the page never rendered." now passes (an absence is not a work claim), and
      today's known-good "Nothing else is wired to it." still passes. gate-eval reports PASS with an
      adversary recorded.
- [x] `mockup-base-gate.py` (commit `a7f3bb175`) , over-block cut from 98 to 59 of the repo's own 175 dev files, suite 9/9.
      `verified:` all 98 denials were the imagery floor, applied to EVERY dev `.tsx` once the scope
      widened. FLOORS LAW 2 does not say every screen: it says "every customer browse/discovery/PDP
      viewport" and exempts forms, checkout, legal and receipts by name. A motion demo or a
      typography probe is none of those, and demanding a photograph of one asks for the decoration
      the same floor forbids. Imagery is now required where the law puts it: a surface that lists
      content units, or a route whose path names one of the floor's own three surfaces.
      The remaining 59 are PDP/salon/search pages with no photo, which is the floor doing its job.
      Two fixtures had encoded the over-broad rule and were NOT edited to suit the change: the rule
      was widened until it satisfied both the law and the existing suite.
- [x] `mockup-preflight-manifest.py` (commits `6a626ae45`, `20499fee0`) , over-block cut from 99 to 24 of the repo's own 175 dev files,
      suite 8/8. `verified:` a NEW mockup with no citation still BLOCKS (driven against a path that
      does not exist on disk, so the grandfather cannot be reached); an EXISTING file rewritten
      unchanged now passes.
      My first attempt asked "did it have a citation before" and the measured count did not move at
      all, which is how I learned the real cause: most of these files DO carry a citation, it just
      points at a component that has since moved or been renamed. The right question is whether
      THIS EDIT made it worse, so the check now runs against the on-disk content first and stays
      quiet when it was already failing. The other eleven checks in the aggregator still run on
      every file, so this buys the aggregator its survival rather than weakening it.
      THEN asked WHY the citations do not resolve, instead of assuming they were stale. Of the 9
      that fail, 4 are parser junk, 2 are `/dev/...` route references that were never files, and
      the real ones are BARE BASENAMES: `Grounded-in: SalonServices.tsx`, whose component is alive
      at `app/[locale]/_components/salon/SalonServices.tsx`, and `FilterSheet.tsx` at
      `app/[locale]/_components/search/FilterSheet.tsx`. Nothing was missing. The check demanded a
      repo-root-relative path, so a correct citation written the natural way never resolved.
      It now accepts a basename when exactly ONE file in the tree carries that name.
      `verified:` a new mockup citing `SalonServices.tsx` by basename passes; one citing
      `TotallyMadeUpThing.tsx` still blocks; suite 8/8.
- [x] `no-focus-ring-gate.py` (commit `6d207e9d3`) , CLOSED. `verified:` I drove all three adversary payloads myself:
      `focus:shadow-[0px_0px_0px_3px_rgba(255,255,255,0.4)]` -> BLOCK(deny);
      `outline:2px solid var(--s-ink)` -> pass; `outline:solid 2px #276EF1` (reversed order) ->
      BLOCK(deny). Today's four earlier cases still hold.
- [x] `postgrest-filter-injection-gate.py` (commit `fda1610cf`) , CLOSED. `verified:` all three bypasses the adversary
      found now BLOCK (raw searchParams inline into `.ilike`, a one-hop alias from `body`, and
      let-then-assign), and the over-block that inverting the default introduced is gone: a
      zod-validated destructured value passes, while `JSON.parse` still does not count as
      sanitising. Suite 13/13.
      One case left deliberately strict: a `safeParse` result destructured through a second hop
      without checking `.success` still blocks. That value can be undefined on failure, so a taint
      check refusing it is correct, not a defect.
- [x] `no-black-selected-gate.py` , CLOSED, and finding it exposed a bug in my own measuring tool.
      `verified:` all six cases drive correctly , inline `style={{background: sel===x ? "#0A0A0A"}}`
      BLOCKS, the `black` keyword form BLOCKS, a legal grey passes, `bg-neutral-900` BLOCKS, a
      filter pill keyed on `selectedDateFilter` BLOCKS, and the LOCKED booking-slot exception passes
      in a booking file. Suite 9/9, both copies match.
      TWO of my own errors along the way, both worth recording: I first probed the booking case with
      the file path `components/Filters.tsx`, and the word "filter" in the path is exactly what
      disqualifies the picker exemption, so the gate was right and my test was wrong (fourth time
      today). Then the inline-style fix kept reading as "still passing" until I ran the hook
      directly and saw it exit 2. **`hook-probe.py` resolved a RELATIVE hook path against the
      project root because it runs with `cwd=PROJ`, so probing `.claude/hooks/x.py` from a worktree
      ran the REPO copy, not the one being edited.** Same wrong-copy trap as upstream, this time
      inside the instrument, which is the worst place for it: it makes a working fix look broken and
      invites a second wrong fix on top. Now resolved to an absolute path before the run, and it
      refuses outright if the file does not exist.
- [x] `entity-card-gate.py` , CLOSED, and it was already fixed by the parallel run; what I added is
      the proof, taken with the corrected probe.
      `verified:` the locked grouped card passes in BOTH spellings (`rounded-[24px]` and
      `rounded-3xl`, the same 24 pixels); a genuine entity-card violation BLOCKS standalone AND when
      nested next to a legal grouped card, so the character-window leak the adversary found is gone;
      suite 8/8. Worth naming why this needed re-checking at all: every measurement I took before
      `hook-probe.py` was fixed had been reading the repo copy instead of the worktree copy, so a
      "still broken" reading from earlier proves nothing either way.
- [x] `unfinished-batch-gate.py` (commit `d1987f36f`) , CLOSED. `verified:` the `HEAD~3` window is gone; it now reads
      the timestamp of the last real user message from the transcript (`turn_start_epoch`, used at
      line 693), which is an actual turn boundary and works in a repo with two commits. Suite
      11/11.
- [x] `no-verify-commit-gate.py` (commit `6d207e9d3`) , CLOSED. `verified:` a backslash-continued
      `git commit -m "x" \` newline `--no-verify` -> BLOCK(deny), and the read-only
      `grep -n "no-verify-commit-gate" ~/.claude/settings.json` still -> pass.
- [x] `white-only-web-gate.py` (commit `6d207e9d3`) , CLOSED. `verified:` `type P={darkMode:"on"|"off"}` in a .tsx ->
      pass; `module.exports={darkMode:"class"}` in `tailwind.config.js` -> BLOCK(deny). The iOS
      exemption and the CSS `prefers-color-scheme` case were re-checked earlier and hold.
- [x] `mockup-lang-stop-gate.py` (commits `6b9b319f6`, `7ae44f110`) , CLOSED, on the fourth attempt, and the first three all failed the
      same way: each answered "did this turn WRITE the file" with a different proxy. mtime said yes
      for every file in a worktree. `git status` said no the moment you committed, and this project
      commits often. Diffing against HEAD, my own first attempt today, reintroduced the commit bug
      exactly, and its own suite caught me at 5/7.
      The question was never "did I write it", it is **"did I introduce the German"**, and the
      transcript answers that with no proxy at all: every Write and Edit carries the text it wrote.
      German in the file but not in anything I wrote is pre-existing. German I wrote that is no
      longer in the file was reverted. German in both is mine.
      `verified:` suite 7/7 including the two committed cases; the live false positive
      (`public/_mockups/account-messages.html`, whose 8 German words come from a June commit and
      which I touched and reverted) now passes. Both copies match.
- [x] Re-drove all 13 myself (commit `d1987f36f`, harness `scratchpad/redrive13.py`) with the corrected probe, absolute paths, one payload each, the
      expected verdict written down before the run. **13 of 13 behave as claimed.**
      `verified:` plan-first BLOCK, exists-guard BLOCK, information-is-not-action BLOCK,
      say-whats-next BLOCK, mockup-base pass (a motion helper), no-focus-ring BLOCK, postgrest
      BLOCK, no-black-selected BLOCK, entity-card pass, unfinished-batch BLOCK, no-verify-commit
      BLOCK, white-only-web BLOCK, mockup-lang pass.

- [x] `map-style-gate.py` , THIRD hook found with the worktree-blindness defect, fixed and verified
      this turn. `verified:` `EXEMPT` matched `\.claude/` against the raw path, so every product
      file in the running checkout was exempt. Now strips the worktree prefix first: a worktree
      product file is NOT exempt, a real hook file and `_design-system/` still are, selftest OK.
      This is the harden for this turn, and it is FIX THE EXISTING ONE, not a new check.

## FALSE POSITIVE FOUND BY BEING BLOCKED

- [x] `finish-autonomously-gate.py` BATCH-MOCKUP arm , DISPOSED, not fixed, and the reason is
      concrete. It fired twice today and I could not reproduce it once. Driven with his real last
      message ("go fix em all"), with a question-mark form, with a genuine mockup request, and with
      another gate's feedback appended as a later user turn: all four pass. Its arm needs the word
      mockup AND an all-word in his CURRENT message, and none of the real ones had both.
      **Changing a trigger I cannot reproduce is a guess, and this session's whole finding is that
      guessed fixes break things: 12 of 13 came back broken from exactly that.** So it stays as it
      is, with the four negative results written down, and the next person who sees it fire has
      those four cases already eliminated.

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
