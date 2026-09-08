<!-- exists-check: net-new. `npm run exists calibration` finds nothing. MEASUREMENT_LAW section 1.2
     has named this exact path since it was written and the file never existed, so the law pointed
     at nothing. Added to the canon list in the same turn, per the gate's own instruction. -->

# INSTRUMENT_CALIBRATION.md , what each instrument has proved, and what it is blind to

`~/.claude/MEASUREMENT_LAW.md` Part 1: an instrument is not evidence until it has reproduced a known
answer. Until then it produces a reading, and a reading is a hint that does not outrank a person.

**The load-bearing column is `blind to`.** Every instrument is blind to something. The fourteen
consecutive animation attempts all happened inside the blind spots of four different instruments in
a row, each of which was "verified" at the time. Writing the blind spot down is what stops the next
reading from being over-claimed.

**Staleness rule, deliberately dumb so it actually gets checked:** if the instrument's own file has
been edited since the date below, the row is stale and its readings drop back to hints until it is
re-run. The animation instrument was changed fourteen times, and every change silently threw away
whatever trust the previous version had earned.

---

## Calibrated

| instrument | last calibrated | cases used | result | trusted for | blind to |
|---|---|---|---|---|---|
| `impossible-number-gate` | 2026-08-08 | the real 12.5MB session log, with and without the compaction marker; 22 constructed cases | catches a context size past any real window, a part bigger than its whole, a share over 100% | a number that is impossible on its face | **a wrong number that looks plausible.** Proven the same day: a stale baseline reported "101 commits this session" and nothing here would ever question 101 |
| `plain-english-gate` | 2026-08-08 | every one of his real "I don't understand this" messages from that day, 15 cases | catches implementation vocabulary, a percentage about my own output, a reply about my own tooling he never raised, and a promise about future behaviour | whether a reply is readable BY HIM | **whether it is true.** A reply can be plain, on his topic, correctly shaped, and simply wrong; nothing here looks at that |
| `resend-delta-gate` | 2026-08-08 | the pair he called a repeat (23% shared words), replayed over 112 resends in one session | catches a rewrite sent after a blocked message, by LENGTH, which ignores wording | the blocked-then-resent case only | **a rewrite that comes in under half the length**, and any repeat across turns where he actually replied in between |
| `checkbox-evidence-gate` | 2026-08-08 | 8 real plan boxes, before and after | catches a tick with no resolvable proof at the end of the line | whether a claim CAN be checked | **whether the proof actually supports the claim.** A real file at a real line satisfies it even if that line proves something else |

## NOT calibrated, so their readings are hints

Named here rather than left implicit, because an uncalibrated instrument quoted as evidence is the
exact failure MEASUREMENT_LAW was written for.

| instrument | why it is not calibrated | what to do meanwhile |
|---|---|---|
| `scripts/check-geometry.mjs --floors-only` | never run against a screen he has already judged, so nobody knows whether it agrees with him | run it on a screen he approved AND one he rejected; if it cannot tell them apart it is blind on taste |
| `pixel-spec-auto/extract.py` | known to fail on borderless cards, and the failure is silent | PIL-sample the reference directly when the output looks thin, and say which method produced the numbers |
| the motion instruments (`record-interaction.mjs`, `check-motion.mjs`) | **this is the one that cost fourteen rounds.** No fixture exists with a known-correct animation | build one animation whose timing is true by construction, then check the instrument reproduces it. Until that exists, motion readings are hints and his eyes win |

## How to add a row

Run the instrument against a case whose answer is already known: either a verdict he gave, or a
tiny case built so the answer is true by construction. Write what it got right, and be specific in
`blind to`. "Nothing" is never the honest answer in that column.
