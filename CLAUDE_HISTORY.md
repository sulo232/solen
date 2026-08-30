# WHY EACH LOCKED ROW SAYS WHAT IT SAYS

Split out of `CLAUDE.md` on 2026-08-24. Nothing here is a live rule. It is the record of what a
row used to say, who reversed it, and when, kept so a reversal stays legible.

**This file is NOT auto-loaded.** That is the point. Measured the same day: the two always-loaded
rulebooks are 94,413 bytes, about 24,000 tokens, and they are re-read on every one of 43,666 API
calls in his history, which makes them roughly 15 percent of the whole bill. 25 percent of the
project rulebook was text that explicitly says it is no longer true.

Two published reasons for moving it rather than keeping it in context:

- Anthropic's memory guidance: "target under 200 lines per CLAUDE.md file. Longer files consume
  more context and reduce adherence", and "if two rules contradict each other, Claude may pick one
  arbitrarily". Their best-practices page adds the diagnostic this estate has been living in: "If
  Claude keeps doing something you don't want despite having a rule against it, the file is
  probably too long and the rule is getting lost."
- OpenAI's GPT-5 prompting guide: a model "expends reasoning tokens searching for a way to
  reconcile the contradictions", and removing them "drastically streamlined and improved"
  performance.

Keeping both sides of every reversal in the always-loaded file is good archive practice and bad
prompt practice. The archive is here; the decision stays there.

---

## focus, the input treatment

CORRECTED 2026-08-17 by the weekly law pass. That row had been printing a decision the owner
superseded on 2026-08-09, and it is the copy always in context, so it was the copy most likely to
be read.

The live decision comes from TASTE_LOG 2026-08-09, owner verbatim: *"make like airbnb but without
the focus line when tapped in"*, which says **Supersedes: the 2026-07-17 input-fill decision** by
name and is carried in LOCKFILE §NAV/input row. The ink focus edge is REMOVED by his instruction.

The soft `box-shadow` halo is dead by name for the third time: killed 2026-07-01, 2026-07-02 and
2026-07-17.

Superseded 2026-07-17 text, kept so the reversal stays legible: *"inputs: ONE ink edge only,
`border-s-ink` (#0A0A0A) + white fill... Input fill itself = filled gray `#F4F4F5` at rest
(LOCKFILE §3.5 depth system)."*

---

## radius, the form and summary card shadow

Corrected 2026-08-17. That row said `shadow-elevation` for months and there is no such class.
Verified against `tailwind.config.js`, whose only boxShadow keys are card, card-hover, surface,
surface-hover, warm-*, pressed, whisper, elevation-1/2/3, float and v5-*. Tailwind resolves a
missing one to NOTHING, silently, so every card built off that row shipped flat. LOCKFILE §12.2
line 558 and §NAV line 2090 both already said `-1`, so the correction restored a value rather than
inventing one.

The individual entity-card rule came from him on 2026-07-19: *"stylists are individual not
groups"*. The input radius was corrected on 2026-07-17.

---

## mockup scope, and which copy of the English gate is armed

Superseded wording, kept so the reversal stays legible: *"a mockup is a preview of the WHOLE real
page (full route chrome, variant-switchable), never an isolated component panel or A/B swatch
board."* That was replaced on 2026-08-15 by his instruction that the mockup's scope matches what is
being decided.

The English rule was reaffirmed by the 2026-07-13 correction. A same-day dictated *"always in
german"* was a mis-transcription and is void.

PATH CORRECTED 2026-08-21. The rulebook line named the PROJECT copy,
`.claude/hooks/mockup-english-gate.py`, which was deliberately deregistered on 2026-08-07
(`4978e9070`) as a weaker duplicate of the global one, with the global copy left armed. So the file
the line pointed at enforces nothing while the rule is still enforced by the other copy. The
project file is still on disk: a dead duplicate, not a missing gate.

---

## blue is sparse, and the citation that was wrong

LOCKED 2026-06-10 as RESTRAINT, superseding the generous-blue v2. Reference = Fresha, measured.

CITATION CORRECTED 2026-07-28. The rule had been justified by Apple and Airbnb, and neither
supports it. Apple's HIG says to "limit the use of your brand's primary color to interactive
elements (buttons, links, switches)", meaning buttons are exactly where the key colour belongs.
Material puts primary colour on prominent buttons. Carbon's `interactive-01` blue IS its
primary-button token. Atlassian's primary button is solid brand blue. Airbnb's Reserve CTA is
Rausch red. Only Fresha matches us, with black pill CTAs and brand purple retired.

So the rule stands, but as a defensible MINORITY position aligned to the one competitor we locked
structurally, not the majority pattern it was written as.

The neutral-filter half came from him on 2026-06-29, reconfirmed 2026-07-01, superseding the
V3-D450 blue filter pill.

---

## no fabricated data, and the day it became an excuse

AMENDED 2026-08-02, owner verbatim: *"the fake data is abt trust bro n sh u keep making dosh sh up,
we are not live bro, we need seeded test sh, edit the rule then."*

The rule is about TRUST, and trust needs a real customer to betray. Solen is pre-launch with no
real customers.

The case that forced the amendment: I cited the no-fabrication rule on the Available-this-week
rail, recommending we leave a real section invisible rather than seed two bookable slots. That is
how a trust rule turned into an excuse for an empty product.
