# IG principles evaluation (owner 2026-07-16, dictated multi-ask)

Owner verbatim (dictated): "actually analyzed all of them each once ... think of what we should add or not add and also what already exists and doesn't, like, go actually look into the codes and also make mock ups based on these and before and after and stuff so I can actually analyze and, like, tell you if it's approved or not. And another batch is coming ... give me, like, reasoning on to why and not."

Sources (another session's worktree, read-only):
- .claude/worktrees/ig-handoff-plans-a23ce6/_design-system/research/IG_DESIGNPARSER_PRINCIPLES.md (2356 lines)
- .claude/worktrees/ig-handoff-plans-a23ce6/_design-system/research/IG_DESIGNMOTIONHQ_PRINCIPLES.md (1531 lines)

## Boxes

- [x] Analyze EVERY principle in IG_DESIGNPARSER_PRINCIPLES.md (each one individually, no sampling) , verified: 47-agent workflow, extractor read the full file
- [x] Analyze EVERY principle in IG_DESIGNMOTIONHQ_PRINCIPLES.md (each one individually, no sampling) , verified: second extractor, full file
- [x] For each principle: check what ALREADY EXISTS in Solen law (RATIONALE/LOCKFILE/TASTE_LOG/MOTION/PSYCHOLOGY/REMOVED graveyard) with citations , verified: every verdict carries lawEvidence (RATIONALE/LOCKFILE/TASTE_LOG/MOTION/PSYCHOLOGY/REMOVED citations)
- [x] For each principle: check the actual CODE (does the pattern exist, where, file:line) , verified: every verdict carries codeEvidence file:line or absence proof
- [x] For each principle: verdict ADD / DON'T ADD / ALREADY EXISTS / CONFLICTS-WITH-LOCK, with first-principles reasoning (why / why not) , verified: 217/217 verdicts: 12 ADD, 143 ALREADY_EXISTS, 35 CONFLICTS_WITH_LOCK, 27 DONT_ADD
- [x] Dedupe across the two files; ranked ADD list , verified: synthesis section of the verdict record
- [x] Mockups for the ADD list: before/after on REAL captured surfaces (real-base law), owner approves/rejects per item , verified: public/_mockups/ig-principles/index.html (12ccbbc76), 7 visual pairs + 5 honest behavior cards, browser-verified
- [x] Deliver as a visual page + plain-English summary, clickable tunnel link , verified: committed + tunnel-linked in the closing report
- [x] STANDING: another batch is coming; keep the pipeline rerunnable , verified: workflow script ig-principles-eval is rerunnable (resumeFromRunId or fresh args)

## Same-message side asks
- [x] Font law vs code contradiction , RESOLVED 2026-07-16: live render = Inter Tight (display) + Inter (body) via globals.css:9 Google import + tailwind fontFamily; app/layout.tsx's Hanken/JetBrains next/font load is DEAD (vars unreferenced) and its 2026-05-30 "Inter Tight REMOVED" comment is a fossil superseded by V3-D410 (2026-05-31) + V3-D190 + rule 8 + V3-D470. Law = Inter Tight + Inter. Follow-up box below.
- [x] Font follow-up fix DONE (commit above this line's registration; live proof 72 self-hosted @font-face, zero googleapis refs, tsc 0): self-host Inter Tight + Inter via next/font in app/layout.tsx, delete the dead Hanken + JetBrains loading + fossil comment + the runtime Google import (the comment itself warns runtime fetch falls back to system font on phones)
- [x] Broken hook money-update-cas-warn.py , RESOLVED: the live global settings no longer reference it (only an old backup ~/.claude/settings.json.bak2 does); nothing in main or any worktree wires it; already fixed before this turn, no action needed

- Full record: _design-system/research/IG_PRINCIPLES_VERDICTS_2026-07-16.md (54a846862); mockup page 12ccbbc76 (browser-verified).

## Build round (owner "all approves", 2026-07-16), atomic boxes

- [x] ig1 password strength bar , verified: commit 1b9a6cf99, reviewer PASS 7/7, lib/password-strength.ts local scorer (no new dep), both auth pages gate on length>=8 + score, /de/auth/register 200
- [x] ig2 caret preservation , verified: commit 21f686383, one shared helper in lib/format-phone.ts used by both call sites (reviewer OK), paste + deletion handled
- [x] ig3 keyset cursor pagination , verified: commit 21f686383 + migration APPLIED live (discovery_feed_keyset_cursor); chained pages returned 0 duplicate ids through SQL AND through /api/discovery/feed; plain first page 200 total=1070; /de/inspo 200
- [x] ig4 gallery framing hint , verified: commit 1e24b4678, hint line + 4 locales, square grid object-top (reviewer OK)
- [x] ig5 one ink S symbol , verified: commit be0ba874f, favicon.svg + 8 PWA sizes regenerated (sampled 85% white / 14% ink, zero maroon-cream), manifest ink-on-white, both assets serve 200. NOTE: no independent reviewer round (the workflow was killed mid-batch); orchestrator-verified by pixel sample + HTTP
- [x] ig6 DateTimePicker range variant , verified: commit 1b9a6cf99, reviewer PASS (two months, shaded span, result pill, VacationTab save contract unchanged), doc updated
- [x] ig7 68ch measure , verified: commit 1e24b4678, .prose-measure in globals.css used by SalonAbout (reviewer OK)
- [x] ig8 CategoryHeroCarousel white title , verified: commit 1e24b4678, single-hunk 700->600 on the white h3 only (reviewer OK)
- [x] ig9 calibrated icon-stroke table , verified: commit 1e24b4678, lib/icon-stroke.ts monotonic 1.6@14 to 2.4@24 at exactly 3 call sites (reviewer OK after round-2 punch fixed an inverted table)
- [x] ig10 grid-type classification step into the law , verified: LOCKFILE 'Grid TYPE classification' block + RATIONALE G2 half-closed + fable-frontend step 2.5 (commit 0586d1d4d); dashboard demo stays with the parked operator-home decision (dashboard demo stays with the parked operator-home decision)
- [x] ig11 balance collapse-test step into solen-taste-diagnosis , verified: SKILL.md step 3.5 (collapse test, weighted centroid, negative-space shapes, BentoBusiness calibration case), commit 0586d1d4d
- [x] ig12 activity signal , verified: commit 1b9a6cf99, shimmer gated on advancing progress, stops on stall, prefers-reduced-motion honored (reviewer OK)
- [x] Each batch: coder + loop-reviewer , verified: batch1 round-2 clean, batch2 PASS 7/7, batch3 caret OK + ig3 blocker (unapplied migration) closed by the orchestrator with live proof, batch4 (ig5) had no reviewer round (workflow killed by the session limit), orchestrator-verified instead; tsc 0 at HEAD; /de, /de/auth/register, /de/inspo, /de/salon/old-town-barbers all 200
