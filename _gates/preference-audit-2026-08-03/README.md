# Preference audit, 2026-08-03 , staged gate changes

Owner ask, verbatim: *"Can you research everything, like, our past chats and everything to actually
analyze my preferences? And based on that, edit gates and also make new gates and make principle
based on that? like, sessions in the past, maybe one weeks, all of them."*

These files are STAGED, not live. The session that produced them ran sandboxed, where
`~/.claude/hooks/`, `~/.claude/settings.json` and both project settings files are write-denied
(measured PermissionError, not assumed). The same copies live at `~/.claude/pending-gates/`.

## Arm them

```
python3 ~/.claude/pending-gates/install.py --dry-run     # prints the plan, writes nothing
python3 ~/.claude/pending-gates/install.py               # applies it
python3 ~/.claude/pending-gates/install.py --revert      # undoes it
```

The installer refuses to install anything whose `--selftest` does not pass, backs up
`settings.json` first, and is idempotent.

## What is in here

| file | what it is | tests |
|---|---|---|
| `reply-repeat-gate.py` | EDIT of a live gate. v3 compared each reply only against the immediately previous one, so a verbatim re-send two replies apart scored 0.02 and passed. v4 compares against every reply still in the turn history. | 11/11 |
| `link-family-aggregator.py` | NEW. Runs the eleven link/preview Stop gates unchanged and returns ONE combined deny instead of up to eleven serial ones. Their registrations collapse into this one; their files stay. | 7/7 |
| `no-plumbing-in-reply-gate.py` | NOT new. Written 2026-07-26, orphan ever since because it shipped without a self-test. A self-test was added and it is armed. It is the gate for "become silent ... I already see the fucking text" (2026-08-03). | 7/7 |
| `owner-correction-ledger.py` | NEW. UserPromptSubmit, inject-only, never blocks. Feeds the durable mistake ledger from the OWNER's corrections, closing the hole IMPROVE_SYSTEM section 6 names: the ladder only ever counted mistakes the assistant admitted. | 9/9 plus a run over the real 218-message corpus |
| `install.py` | the installer above | dry-run verified |
| `mined-preferences.json` | the 81 clustered preferences with verbatim quotes, coverage verdicts and file:line evidence | , |
| `GATE_FIRES.md` | every gate block delivered into the conversation in the window, counted | , |

Net effect on the estate: **157 wired hooks to 150**, back at the ceiling LAW_SYSTEM 6.8 sets,
rather than five past it.

## The principles this produced

- `~/.claude/LAW_SYSTEM.md` 6.2 , the "one aggregator per class" rule now binds the Stop event too,
  with the measured numbers (402 blocked attempts, 76% blocked by 2+ gates, worst was 9 at once).
- `~/.claude/LAW_SYSTEM.md` 6.9 , NEW. A recurring mistake that already has a gate is a BINDING
  failure, not a missing-gate problem. Four ordered questions to answer before authoring anything.
- `~/.claude/REPORT_SYSTEM.md` 4.5 , NEW. The reply after a gate block contains only what changed.
- `~/.claude/PREFERENCES.md` , two new T1 entries (diagnose-the-gate-before-adding-one,
  capture-the-real-page-for-mockups), both verified firing through the live hook.

Report page: `public/_analysis/preference-audit-2026-08-03.html`.
