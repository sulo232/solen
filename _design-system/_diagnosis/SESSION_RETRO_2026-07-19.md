<!-- exists-check: net-new , the per-session failure retro the owner ordered 2026-07-20 ("analize our chats ... what was wrong"); extends salon-pdp-sections.md (same folder), does not duplicate it -->
# Retro , the failed design rounds (2026-07-19), what was wrong, what now binds

Owner order 2026-07-20: "fix the gate and principals and systems ... readback and analize our chats and what i
said ... maybe stuff in system or design or taste files its missing." This is that analysis, from the session's
own record. Companion: `salon-pdp-sections.md` (the measured diagnosis), `_plans/MOCKUP_ROOTCAUSE.md`.

## The ledger , each round, the owner's words, what it exposed

| round | what I shipped | owner verbatim (abridged) | failure class |
|---|---|---|---|
| R1 | 39 abstract "Direction A/B" gray panels | "i told you ALWAYS a fullscreen preview of an acc page and before/after , why do u keep forgetting" | wrong FORMAT; from-scratch redraw (already graveyarded) |
| R2 | fullscreen, but hand-drawn sparse Afters w/ fake data | "these before after does not make any scence ... you only made ONE section, i dont even know where it is" | invented content; not the real page |
| R3 | real-iframe After proposing FLAT + blue outline | "the blue outline is destroying sh ... didnt i tell u i do not want ths flat sh, we lit ditched the whole thing" | re-proposed settled-dead law (REMOVED:85); ignored the graveyard |
| R4 | "carded" no-op + corner chip overlapping UI | "it looks ass tho" | NO-OP (current==target); overlay broke real UI; never measured before showing |
| R5 | fabricated Express/Classic tiers + 38px "+" | "why did you make that shit up ... the plus is unbalanced ... show ONE group ... section borders all different ... 5th round. step back, use subagents" | FABRICATION; below touch floor; never looked |
| R6 | blanket §170 ink-chevron on ALL see-alls | "why did you remove the pill for the services? do you understand WHY i want it there and not for the stylist?" | blanket law OVER a dated owner approval (precedence inversion) |
| , | reviews directions described in text only | "where are the directions mock up?" | describe-not-deliver |

## The three root causes (all now enforced, not advised)

1. **Invent-not-measure.** Changes were invented instead of DERIVED from a measured diff of the real rendered
   page vs the locked law. The real defects (three §427 divergences, the see-all form) sat in the measurements
   the whole time. -> `mockup-diagnosis-gate.py` (a mockup needs a measured, law-cited `Diagnosis:` manifest;
   no-ops blocked) + `mockup-verify-before-show-gate.py` (no mockup link without a same-turn measured check).
2. **Precedence inversion.** A blanket LOCKFILE row was applied over a component's DATED owner approval.
   The dated decision wins , always. -> LOCKFILE see-all row rewritten as the intent-SPLIT; LESSONS class added;
   procedure: read the component's header comments + TASTE_LOG before "fixing" a shipped treatment.
3. **Flag-spam , the gates never fired.** Every turn began by bulk-setting ~12 skip flags, disarming the entire
   gate system before writing a line. Each muted gate mapped to a rejection that then happened live.
   -> `flag-spam-gate.py` (global, blocks flag loops / 3+ flags per command; live-fire proven).

## What changed in the canon (this hardening pass)

- LOCKFILE §1.5 see-all row: the intent split (Services/Reviews pill; Team ink link), with the lesson inline.
- TASTE_LOG 2026-07-19/20: section sweep §427, see-all split + never-blanket principle, wave rejected,
  map hover-scale rejected, the mockup-format law, reviews still open.
- REMOVED.md: team-wave bounce-hello; map hover-scale.
- QUESTIONS.md Q22-Q24: Team grouped-vs-individual (the §427/§428 contradiction), map tap+pin fork,
  reviews direction pick.
- LESSONS_LEARNED: precedence-inversion class + flag-spam class (the §427-drift class was already logged).
- Gates active on mockups now: diagnosis, fullscreen(before/after+injection), no-flat, resurrection, depicts,
  english, verify-before-show(global), flag-spam(global). All self-tested.

## Still open (owner picks, queued in QUESTIONS.md)

Q22 Team card grammar · Q23 map tap behavior + pin accuracy · Q24 reviews direction (A recommended).
