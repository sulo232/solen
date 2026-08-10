# <one-line title: what broke, for whom>

<!-- Copy to _plans/POSTMORTEMS/YYYY-MM-DD-<slug>.md. Written within 48h of the incident.
     Every field is one to three lines. This is not an essay, and it is not a confession.
     The rule that makes it work: BLAMELESS. Contributing causes are plural, and each one
     explains what made the wrong thing look reasonable at the time. A postmortem that names
     a person instead of a system stops being written after the second one.
     When to write one: _plans/OPS_RUNBOOK.md, "Incident response". -->

- **Date:**
- **Severity:** SEV1 | SEV2 | SEV3
- **Duration:** started HH:MM , mitigated HH:MM , resolved HH:MM
- **Author:**

## Summary

One paragraph. What broke, who it affected, what fixed it.

## Impact

Who, how many, for how long, and CHF if any money moved or failed to move. If the number is
unknown, write "unknown" and say what you would need to find it, not a guess.

## Detection

How did you find out, and how long after it started? If a human told you rather than the
digest, a red Actions run, or an alert email, say so plainly. **That gap is usually the most
valuable line in the whole document**, because it is the one that generalises.

## Timeline

Paste the scratch file from step 1 of the ladder. Raw is fine. Times matter more than prose.

```
HH:MM  what you saw / what you did
```

## Contributing causes

Plural, always. Not "the root cause". For each, answer: what made this look reasonable at the
time? A cause that only says "I forgot" has not been dug into yet.

-
-

## What went well

Real answers only. A rollback that took 40 seconds, a flag that worked, an idempotent handler
that made a replay safe. This is not filler: it tells you which defences to keep paying for.

## Where I got lucky

The near-miss. What would have made this much worse if it had been slightly different, and did
not happen to be. This is the section that finds the next incident before it happens.

## Action items

Each one has an owner and a date, or it is not an action item. Tag `[MITIGATIVE]` (makes the
next one hurt less) or `[PREVENTATIVE]` (stops the next one). A list with neither tag tends to
be all mitigative, which is how the same incident recurs.

| # | Action | Owner | Due | Tag |
|---|---|---|---|---|
| 1 |  |  |  | [PREVENTATIVE] |
