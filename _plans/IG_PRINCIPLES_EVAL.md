# IG principles evaluation (owner 2026-07-16, dictated multi-ask)

Owner verbatim (dictated): "actually analyzed all of them each once ... think of what we should add or not add and also what already exists and doesn't, like, go actually look into the codes and also make mock ups based on these and before and after and stuff so I can actually analyze and, like, tell you if it's approved or not. And another batch is coming ... give me, like, reasoning on to why and not."

Sources (another session's worktree, read-only):
- .claude/worktrees/ig-handoff-plans-a23ce6/_design-system/research/IG_DESIGNPARSER_PRINCIPLES.md (2356 lines)
- .claude/worktrees/ig-handoff-plans-a23ce6/_design-system/research/IG_DESIGNMOTIONHQ_PRINCIPLES.md (1531 lines)

## Boxes

- [ ] Analyze EVERY principle in IG_DESIGNPARSER_PRINCIPLES.md (each one individually, no sampling)
- [ ] Analyze EVERY principle in IG_DESIGNMOTIONHQ_PRINCIPLES.md (each one individually, no sampling)
- [ ] For each principle: check what ALREADY EXISTS in Solen law (RATIONALE/LOCKFILE/TASTE_LOG/MOTION/PSYCHOLOGY/REMOVED graveyard) with citations
- [ ] For each principle: check the actual CODE (does the pattern exist, where, file:line)
- [ ] For each principle: verdict ADD / DON'T ADD / ALREADY EXISTS / CONFLICTS-WITH-LOCK, with first-principles reasoning (why / why not)
- [ ] Dedupe across the two files; ranked ADD list
- [ ] Mockups for the ADD list: before/after on REAL captured surfaces (real-base law), owner approves/rejects per item
- [ ] Deliver as a visual page + plain-English summary, clickable tunnel link
- [ ] STANDING: another batch is coming; keep the pipeline rerunnable

## Same-message side asks
- [x] Font law vs code contradiction , RESOLVED 2026-07-16: live render = Inter Tight (display) + Inter (body) via globals.css:9 Google import + tailwind fontFamily; app/layout.tsx's Hanken/JetBrains next/font load is DEAD (vars unreferenced) and its 2026-05-30 "Inter Tight REMOVED" comment is a fossil superseded by V3-D410 (2026-05-31) + V3-D190 + rule 8 + V3-D470. Law = Inter Tight + Inter. Follow-up box below.
- [x] Font follow-up fix DONE (commit above this line's registration; live proof 72 self-hosted @font-face, zero googleapis refs, tsc 0): self-host Inter Tight + Inter via next/font in app/layout.tsx, delete the dead Hanken + JetBrains loading + fossil comment + the runtime Google import (the comment itself warns runtime fetch falls back to system font on phones)
- [x] Broken hook money-update-cas-warn.py , RESOLVED: the live global settings no longer reference it (only an old backup ~/.claude/settings.json.bak2 does); nothing in main or any worktree wires it; already fixed before this turn, no action needed
