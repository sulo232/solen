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

- [ ] ig1 password strength bar (register + reset-password), 8-char floor kept, no new dependency
- [ ] ig2 caret preservation in the Swiss phone formatter (PayConfirmStep + GuestBookingForm)
- [ ] ig3 keyset cursor pagination for the discovery feed (route + RPC + /inspo client)
- [ ] ig4 gallery framing hint + center-top object-position on the square grid
- [ ] ig5 one ink S symbol: favicon + PWA icon set + manifest colors
- [ ] ig6 DateTimePicker range variant + VacationTab wiring
- [ ] ig7 68ch measure on SalonAbout, promoted to a shared utility
- [ ] ig8 CategoryHeroCarousel white title 700 to 600
- [ ] ig9 calibrated icon-stroke table applied to FilterSheet chip / ProgressStepper / header menu
- [x] ig10 grid-type classification step into the law , verified: LOCKFILE 'Grid TYPE classification' block + RATIONALE G2 half-closed + fable-frontend step 2.5 (commit 0586d1d4d); dashboard demo stays with the parked operator-home decision (dashboard demo stays with the parked operator-home decision)
- [x] ig11 balance collapse-test step into solen-taste-diagnosis , verified: SKILL.md step 3.5 (collapse test, weighted centroid, negative-space shapes, BentoBusiness calibration case), commit 0586d1d4d
- [ ] ig12 activity signal on the live determinate progress bar (discovery import)
- [ ] Each batch: coder + loop-reviewer to PASS, tsc 0, committed
