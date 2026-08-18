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

## Unplanned additions

- `mockup-grounding-gate.sh` false-positives on report pages (fixed this turn, exempted by name).
- `no-blind-sweep-gate.py` blocked a read-only analysis script because the script's own text named
   several file paths. Not fixed, logged here: it fires on a Bash command that WRITES a script
   mentioning paths, not on a command that writes source files.
