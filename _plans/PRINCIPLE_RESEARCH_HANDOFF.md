<!-- exists-check: net-new vs PRINCIPLES_GAP_RESEARCH.md, PRINCIPLES_IMPLEMENTATION.md,
     PRINCIPLES_LOOP.md and BACKEND_LAW.md. Those four are about principles we were MISSING and
     then built. This is the opposite direction: deep-researching the principles we ALREADY HAVE,
     one at a time, to test whether each survives contact with external evidence. Different verb,
     different input, different output. -->

# RUNBOOK , deep-research every principle we already have (BACKEND and the rest)

**STATUS: READY TO RUN. This file is the whole brief.** Rewritten 2026-07-28 on the owner's
instruction: *"I want to run the other research handoff document, you know, like other session
towels with this, so make it, like, really, like, in writing that it's also running. You know
everything, all the details that the auto agent needs to know."*

You are picking this up in a **fresh session with no memory of the design pass**. Everything you
need is in this file or in the two files section 1 tells you to open. Do not ask the owner to
re-explain the task. Do not wait for approval to begin. Start at section 3 and work down.

---

## 0. The one-paragraph version

Solen has accumulated a large body of self-written engineering and product law: backend rules,
security rules, a silent-no-op doctrine, behavioural psychology laws, i18n rules, motion rules. Most
of it was written from internal reasoning, not external evidence. A design pass on 2026-07-28 tested
the DESIGN half of that body and found real defects, including rules that cited sources saying the
opposite and numbers presented as law that were invented in-house. **Your job is to do the same
thing to everything that is not design.** The output is a verdict per principle, committed
separately, with evidence.

---

## 1. Read these two first. They are the method, not background.

1. **`_design-system/RESEARCH_METHOD.md`** , ten rules (R1 to R10) for how research is conducted and
   judged in this estate. **Do not start without it.** Short version: at least three genuinely
   DIFFERENT lenses, never three copies of one question; tier every claim (a) peer-reviewed or
   primary source, (b) named practitioner, (c) your own inference; "could not verify" is a real
   answer you deliver rather than paper over; hunt the disconfirming case on purpose; debunk numbers
   with no traceable source; and independently verify anything load-bearing, because a subagent's
   finding is a lead, not a fact.
2. **`~/.claude/hooks/runnable-claim-gate.py`** , armed and blocking. It refuses a closing message
   that states what a runnable thing does, costs, or enforces unless that turn actually ran or read
   it. Do not fight it. It exists because three such claims in one session were all wrong.

---

## 2. Ground rules that will save you a rejected turn

- **Never `git push`, and never mention pushing or deploying.** The owner does that manually. This
  is absolute.
- **Never `supabase db push` or `db reset`.** Additive idempotent `apply_migration` only.
- **Solen is PRE-LAUNCH.** No real customers, all data is seed. Frame every defect as "would break
  once live", never "did break for customers". There is a gate on this.
- **Commit often**, one verdict per commit, so the trail is readable.
- **Register the workstream** in `_plans/ACTIVE.md` as ACTIVE when you start and PAUSED when you
  stop. An unregistered workstream is wiped at compaction.
- **Do NOT touch design principles.** That pass belongs to the originating session and duplicating
  it is exactly the failure this estate keeps paying for.
- **Deliverables are a served visual page plus plain English in the same turn**, never a markdown
  file handed over on its own. If you produce a page, end the turn with a clickable cloudflare
  tunnel link, never a LAN IP.
- The dev server runs from `/Users/sulo/Documents/solen`, NOT from a worktree. A page written only
  into a worktree's `public/` will 404 or redirect. Write it to the main checkout too.

---

## 3. What "deep-research a principle" means concretely

For each principle, produce a VERDICT, not an essay:

| verdict | meaning |
|---|---|
| **KEEP** | external evidence supports it. Cite the evidence. |
| **KEEP, SHARPEN** | right but vague or unnumbered. Give it a number traced to two independent agreeing sources. |
| **REVISE** | evidence contradicts part of it. Say which part, with the source. |
| **DROP** | it is folklore. A real and expected outcome. |
| **OWNER DECISION** | credible systems genuinely disagree. Name the options and your lean; never silently pick. |

Every verdict names the principle's current home as `file:line` so the edit is unambiguous.

---

## 4. The queue, in priority order

### 4.1 BACKEND LAW , `_plans/BACKEND_LAW.md` plus `_rules/*`
The owner's stated next target, so start here. Fifteen topics were researched and audited when it
was written; this pass tests them against EXTERNAL evidence rather than internal reasoning. Lenses
that will pay: (a) published engineering standards and RFCs, (b) the actual Postgres, Supabase and
Stripe documentation for the specific guarantee each rule claims, (c) incident write-ups from
companies with the same shape of problem. **Prioritise anything asserting a race-condition or
money-safety property**, since those are checkable against vendor docs rather than debatable.

### 4.2 SECURITY , the `_rules/` security file plus the S1 pass in the fable-backend skill
Test against OWASP ASVS and the Supabase security docs specifically. **Live precedent to build on:**
on 2026-07-28 a view granted to anon bypassed row-level security and exposed 833 booked slots with
staff IDs. It was found by looking, not by a rule, which is itself evidence about the rules'
coverage. The fix is committed (`60f3621aa`) and proven by discriminate test: anon `booked` went
833 to 0 while `available` stayed at 1281. **Ask what else has that shape**, meaning any view or
function reachable by anon that was never checked for `security_invoker`.

### 4.3 The SILENT NO-OP doctrine , `CLAUDE.md` pinned block plus `_rules/LESSONS_LEARNED.md`
This estate's self-declared number-one failure mode: a control that renders but does not
discriminate. Research question: is "prove behaviour, not existence" supported by anything external,
and does any other team have a name and a tooling answer for it? **A negative finding is a real
result here.** The design pass found the analogous frontend gap, that nobody has built rendered
design-floor assertions, and recording that as "closer to novel infrastructure" was more useful than
another week of searching.

### 4.4 PSYCHOLOGY , `_design-system/PSYCHOLOGY.md`
Fifteen evidence-tiered behavioural laws plus a myth table. Already tiered, so this is
re-verification: do the fifteen still hold, have any cited studies failed to replicate, and does the
myth table need new entries. **Two new candidates from the design pass**, both already debunked as
untraceable: the "white space increases perceived value by up to 300%" claim, and the "5 to 10% of a
page should be bold" rule.

### 4.5 I18N and COPY , `_rules/I18N_ROUTING.md` plus the copy-economy block
Partly done, so read this carefully before repeating work. Findings already established and
committed:
- **Register is an OWNER DECISION, already surfaced with a mockup.** Measured: 411 informal German
  strings against 15 formal, and the 15 formal are exactly the legal surfaces. Treatwell.ch plus
  three independent Swiss beauty businesses all use the formal register.
- **Roughly 28% of those strings look dead.** Scanning 1,219 source files, 115 of the 411 have no
  reference anywhere in code. Crude heuristic, since a dynamically assembled key would look dead, so
  it needs a manual pass. **Do that pass**, it changes the size of every copy job.
- **The 15 to 35% expansion figure is wrong for short strings.** W3C's data is length-dependent:
  under 10 characters averages 200 to 300%. Verify against a real corpus.
- **The em-dash ban should carve out the en-dash for DE, FR and IT.** Measured 218 em-dashes and 30
  en-dashes already live in the four locale files, and the spaced en-dash is legitimate German.

### 4.6 MOTION , `_design-system/MOTION.md` and MOTION_LAW.md
Enforcement is already proven: the motion gate is wired to CI and caught 8 `animate-spin` plus 25
`animate-pulse` loops that a manual audit missed sixfold. So do not re-test the enforcement. Test
the DURATIONS and easing against published guidance, where Material has real numbers and Apple has
real guidance, and against WCAG 2.2.2.

### 4.7 Everything else in `_rules/`
Sweep last. Lowest value per unit of effort.

---

## 5. What the DESIGN pass already produced, so you do not redo it

Findings from 2026-07-28, all sourced, usable as precedent for the method:

- **Convergent across four independent systems:** an 8px spacing base (Material `space100 = 8dp`,
  Carbon, Primer, Atlassian, each stating it independently). Treat as law.
- **Convergent across two:** a list row's label reuses the ordinary body-text token, with no bespoke
  "list text" size (Material's list label IS Body Large; Carbon's IS body-01).
- **Genuinely divergent, therefore taste:** trailing chevron size. Material makes it identical to the
  leading icon (24dp = 24dp); Atlassian makes it explicitly one step smaller (12px against 16px) and
  says why. Two maintained systems in direct disagreement.
- **Apple has moved AWAY from fixed numbers.** The current HIG publishes no standard layout margin
  and no list row height; `UITableView.rowHeight` defaults to `automaticDimension`. A philosophical
  split from Material, not a documentation gap.
- **Debunked, never cite:** the 300% whitespace claim, the 5-to-10% bold rule, "misalignment is
  detected in X milliseconds".
- **Our own invented numbers, now labelled as such:** the 30% weight-600 ceiling has no source, and
  the 1.8x anchor ratio is just our 28px heading over our 16px body.
- **Three of our rules cited sources that contradict them.** "Never blue on a big CTA" cited Apple,
  whose HIG says to limit brand colour TO interactive elements including buttons; Airbnb's Reserve
  button is red. Only Fresha matches us. **Check every citation you meet**, this was not a one-off.
- **Live contrast defects, measured twice independently and matching to 2dp**, against white then
  the sunken tray: star `#FFC32B` 1.60 / 1.46, warning `#F1AE27` 1.94 / 1.77, success `#16A34A`
  3.30 / 3.00, heart `#FF3366` 3.55 / 3.23, accent `#276EF1` 4.58 / 4.17, error `#DC2626`
  4.83 / 4.39. Measured occurrence: 72 sites use green as text, 7 elements carry blue on sunken.
  **None of this is fixed.** WCAG AA is tier 2 statutory in the precedence chain, above taste.
- **Strongest evidence for the consistency hypothesis:** processing fluency (Reber, Schwarz and
  Winkielman 2004), a CHI 2023 finding that controlling for fluency drops the aesthetics-usability
  correlation from r=0.79 to r=0.34, and Miniukovich and De Angeli's measurement that computable
  structural metrics including alignment regularity explain roughly a third of perceived-quality
  variance. Note honestly: I did not open these papers myself, so treat them as leads to verify.

---

## 6. Gates you will meet, and what they actually want

These will interrupt you. None is a bug; each encodes a real past failure. Reaching for a skip flag
should be rare, and the health check already flags flags that are being over-used.

- **`npm run exists <keyword>`** must run in the SAME turn, immediately before, any new page, route,
  migration or mockup write. Not earlier in the session. Immediately before.
- **Mockup preflight** wants, all at once: a `Grounded-in:` line naming a real path that shares a
  word with the mockup's own title, a `Depicts:` line per drawn surface each ending in a real path
  or `NET-NEW: <why>`, an `Exists-check:` note, an `Owner-scope: confirmed: "<owner's words>"` line,
  and a fresh measurement plus `touch ~/.claude/ss-measured.flag`.
- **Mockups must be in ENGLISH**, enforced by three separate gates. If the German IS the subject, the
  markers are `english-ok`, `lang-ok`, and per-line `german-ok`. A fourth gate now accepts a
  `locale-copy-mockup: <de|fr|it> <reason>` marker; the reason must sit inside the comment.
- **Contract-hue** rejects any saturated hex outside the locked palette.
- **Resurrection gate** blocks owner-rejected treatments. Known false positive worth knowing: a
  `toFixed` call with a single-digit argument matches its `\(\d{1,4}\)` signature and reads as a
  resurrected `(54)` review count.
- **No decorative separator dots** between metadata. If two bits differ by colour or weight, that
  contrast IS the separator.
- **No dark mode in any web file, ever.** iOS keeps dark mode; web never.
- **Bash cannot write to `~/.claude/` or to the main checkout, but the Write tool can.** A Bash
  permission error is NOT proof the estate is blocked. This exact confusion has cost two sessions;
  there are now two gates requiring a second instrument before you may blame the environment.

---

## 7. Definition of done

The queue is done when every principle in section 4 carries a verdict from section 3, each verdict
is committed separately with its evidence, every load-bearing claim was verified by you rather than
by a subagent alone, gaps are named as gaps, debunks are stated plainly, convergence is separated
from divergence, and every divergence is put to the owner as a decision with a named lean rather
than silently resolved.

Research is NOT done when it has produced a confident narrative. A confident narrative with no
tiering is the exact failure the method file exists to prevent.
