<!-- batch: design-system hardening from the failed rounds (owner 2026-07-20 "fix the gate and principals and systems for all design system") -->
# Design-system hardening , retro of the failed rounds -> gates + principles + missing file entries

Owner 2026-07-20: "fix the gate and principals and systems n stuff for all design system cz we had so many
rounds that failed ... readback and analize our chats and what i said ... maybe stuff in system or design or
taste files its missing."

- [x] ANALYZE: failure ledger compiled (R1-R6 + describe-not-deliver, verbatim quotes) -> _design-system/_diagnosis/SESSION_RETRO_2026-07-19.md.
- [x] GATES:
  - [x] FLAG-SPAM meta-gate built: `~/.claude/hooks/flag-spam-gate.py` , blocks flag loops / 3+ flags per command. Self-test 4/4 AND live-fire proven (it blocked my own test command). Wired global PreToolUse Bash.
  - [x] existing gates confirmed wired + self-tested: mockup-diagnosis (4/4), mockup-fullscreen (4/4), mockup-no-flat (3/3), mockup-verify-before-show (3/3, global).
- [x] PRINCIPLES:
  - [x] TASTE_LOG.md: 2026-07-19/20 section added (section sweep §427, see-all intent split + never-blanket principle, wave rejected, map hover-scale rejected, mockup-format law, reviews open).
  - [x] LOCKFILE §1.5 see-all row rewritten as the intent SPLIT (supersedes blanket ink-chevron; lesson inline).
  - [x] REMOVED.md: team-wave bounce-hello + map hover-scale graveyarded (npm run removed). R1/R2 mockup formats already covered by REMOVED:73/83 (no dupe added).
  - [x] QUESTIONS.md: Q22 (Team §427 vs §428 contradiction), Q23 (map tap + pin), Q24 (reviews direction, A recommended).
  - [x] LESSONS_LEARNED: precedence-inversion class + flag-spam class added (the §427-drift class already existed; describe-not-deliver is covered in the retro ledger).
- [x] SYSTEMS: retro written , _design-system/_diagnosis/SESSION_RETRO_2026-07-19.md (ledger + 3 root causes + what now binds).
- [x] Commit; closed against the owner's original message (gates fixed, principles written, systems analyzed, missing entries added).
