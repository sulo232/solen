# Plain words, not jargon (2026-08-25)

## The ask
Owner, verbatim, this turn: **"pls fix this jageron"**. The fifth time he has called the output
jargon. Prior attempts all rewrote the GUIDANCE. None ever measured the WORDS, which is why none
of them held.

## What he settled before this started (asked, so it is not guessed)
| question | his answer |
|---|---|
| a number or proof that plain English would drop | **keep it, and say what it means for him in the same breath** |
| work on my own checks and tools | **silent unless it changes something he can see** |
| normal reply length | **one phone screen**, longer only for depth he asked for |

## Method
Not another principle. A concrete table: the phrase I write, and the sentence to write instead.
Derived from real data, not from imagination:
- 997 replies I actually sent this session, and the 114 messages he actually typed
- four lenses find, each finding is adversarially refuted, survivors get merged and ranked

## The measurement that already killed the obvious approach
Set difference is NOT the signal. I use 1,901 words 3+ times that he has never typed once, and
they are mostly ordinary English ("above", "accept", "absence"). A banned-word list would fire on
all of them. The test has to be **could he act on it, or see it on his own screen**, which is
judgment, so it needs readers rather than a regex.

Recorded because the first extraction was BROKEN and its control caught it: compaction summaries
are stored under the user role, so 21,984-character blocks of my own prose were counting as HIS
vocabulary. Uncaught, that would have reported near-zero jargon.

## Branches, both arms decided now
**PLAN A** , the table comes back with 10 to 18 usable rows. It goes into the output style, which
is the channel that actually reaches the model before a reply is written. Then the reply he called
jargon gets rewritten from the table, in front of him, as the proof.

**PLAN B** , the table comes back thin (under 6 rows) or the rows are vague. Do NOT ship a vague
table and do NOT stop. Fall back to the narrowest thing that is certainly true: take the ONE reply
he just called jargon, rewrite it line by line, and diff the two. Every phrase that changed in that
rewrite becomes a row. A table of 6 rows grounded in the message he actually rejected beats 18
speculative ones.

**PLAN C** , the workflow itself fails or returns nothing. Do the Plan B rewrite by hand. It needs
no agents; the rejected message is right there.

## Close condition
His own last reply, rewritten, with every row of the table applied, and no sentence in it that
fails the could-he-act-on-it test. Not "the table exists".


## Still open, tracked as boxes so they are not just narrated

- [ ] **A. Italian still calls a salon a "store", 25 places** (12 in the shared Italian text, 13 in
      pages that carry their own text). NOT a bug and NOT guessable: unlike French, "store" is a
      genuinely borrowed word in Italian commerce, so this is a branding call that needs either his
      word or the same market research the German decision got.
      PLAN A , he says switch it: replace with "salone" throughout, same scoped method as the
      French pass (commit `07efec6f4`), one command, verified by re-scan and key parity.
      PLAN B , he says leave it: close this box, and add a line to the German decision file saying
      Italian deliberately keeps the borrowed word, so no future sweep re-opens it.
      PLAN C , he does not answer: leave it alone. Italian reads acceptably today; it is the one
      language where the word is not wrong, only inconsistent with the other three.

- [ ] **B. One of the three council models is logged out.** Verified by asking all three the same
      one-word question: Gemini and Grok answer, the third returns "OAuth session expired and could
      not be refreshed". Only he can fix it, because signing in needs his password.
      The exact line, read off the tool's own help rather than guessed (`claude auth --help`,
      version 2.1.219): `claude auth login`
      PLAN A , he runs it: nothing else needed, the third model rejoins on its own.
      PLAN B , he does not: the council keeps running at two of three, which is why every consult
      this session has been two opinions. Not a blocker for anything else.
