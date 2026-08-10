<!-- exists-check: net-new vs PRINCIPLE_RESEARCH_HANDOFF.md (that file covers BACKEND and the rest,
     explicitly excluding design, which the owner scoped to this session) and vs
     PRINCIPLES_GAP_RESEARCH.md / PRINCIPLES_IMPLEMENTATION.md (those are about principles we were
     MISSING; this tests the ones we ALREADY HAVE against external evidence). Method:
     _design-system/RESEARCH_METHOD.md. -->

# DESIGN PRINCIPLE DEEP-RESEARCH , testing the rules we already have

**Owner, 2026-07-28:** *"we need to research all the principle that we're having and everything and improve it. First the design."* Scope: design HERE, backend and the rest via `PRINCIPLE_RESEARCH_HANDOFF.md`.

Status: **IN PROGRESS.** Four lenses dispatched, one per principle block. Findings I verified myself are below and do not depend on them.

---

## The corpus under test

| block | where | what it holds |
|---|---|---|
| 10 taste rules | `CLAUDE.md` pinned | the rules broken most often |
| NEVER-AGAIN floors + FLOORS LAW | `CLAUDE.md` pinned | 13 numeric minimums |
| Locked design contract | `CLAUDE.md` pinned | ~25 frozen single values |
| Copy economy + i18n | `CLAUDE.md` + `_rules/I18N_ROUTING.md` | word economy, register, four locales |

Backing docs: `SOURCE.md` (1495 lines), `LOCKFILE.md` (2004), `RATIONALE.md` (870), `MOTION.md` (245), `PSYCHOLOGY.md` (107).

Each rule returns one verdict: **KEEP / KEEP-SHARPEN / REVISE / DROP / OWNER DECISION.** Dropping is expected; the earlier pass already dropped three widely-cited numbers as untraceable.

---

## VERIFIED MYSELF, not waiting on an agent

### F1. Our own contrast claims are correct. Confirmed, not assumed.

FLOORS LAW 6 bans `#9CA3AF` for text citing "2.54:1 on white / 2.31:1 on `s-bg-sunken`", and sanctions `#6B6B6B` citing "5.33:1 / 4.85:1". I recomputed all four from the sRGB relative-luminance formula.

**All four are exactly right.** Whoever wrote that rule computed it rather than estimating. That is worth recording, because the rest of this pass is about finding what is invented, and this one is not.

### F2. NEW DEFECT, the accent blue fails AA on our own sunken surface.

| token | on white | on `#F4F4F5` sunken |
|---|---|---|
| `#276EF1` accent | **4.58:1** PASS AA body | **4.17:1** FAILS AA body (needs 4.5) |

The contract says selected states use a sunken fill AND that links are accent blue. That combination is below AA for body text. **Measured occurrence: 7 elements carry both classes directly**, plus a wider set of files where a sunken container holds a blue descendant (brand page, and seven dashboard routes including bookings, calendar, clients, refunds).

Per the estate's own precedence chain, WCAG AA is a **statutory floor at tier 2**, above taste at tier 5. So this is not a preference question.

### F3. NEW DEFECT, semantic green as text is below AA body.

| token | on white | verdict |
|---|---|---|
| `#16A34A` success | **3.30:1** | large text only, FAILS AA body |
| `#EA580C` surcharge | **3.56:1** | large text only, FAILS AA body |

**Measured: 72 sites use green as text.** Taste rule 4 mandates keeping these hues for semantic meaning, which is right, but the rule never states that they are legal as ICON or LARGE-TEXT colours and illegal as body-text colours. That distinction is the missing half of the rule.

### F4. The star, an honest ambiguity rather than a clean defect.

`#FFC32B` is **1.60:1** on white, below even the 3:1 non-text threshold. But a yellow rating star on white is near-universal (Amazon, Google, Airbnb all ship it). This is a case where convention and the letter of the guideline diverge. Recording it as a question for the owner rather than declaring the star a bug, because "everyone does it" is not a defence but it is evidence about user expectation.

---

## Dispatched, awaiting results

- **Lens 1, the 10 taste rules.** Pressure-testing the invented-looking ones: the "80 / 17" surfaces-to-ink ratio, the ban on blue for large CTAs against what Material/Apple/Polaris/Carbon actually do with a primary action colour, and whether Stripe and Vercel really do what taste rule 6 claims they do.
- **Lens 2, the floors.** Hunting a source for the two most specific claims in the estate: the **1.8x anchor ratio** and the **30% weight-600 ceiling**. My prior is that both are invented. The instruction is to say so plainly and then propose a defensible version.
- **Lens 3, the locked contract.** Highest stakes rows: a **14px body** against Material 16, Apple 17, Carbon 14, Atlassian 14; the seven-value radius set; and the **focus treatment**, which matters most because focus rings were killed three times on looks while WCAG 2.4.7 Focus Visible is level AA.
- **Lens 4, copy and i18n.** Two questions that can cost real money: whether **icon-only actions** survive the icon-comprehension literature, which I expect is largely negative, and whether informal **"du" is actually right for a Swiss beauty marketplace**, tested against what Swiss services actually ship rather than a general rule about German.

## Not yet started

The backing docs themselves (`SOURCE.md`, `LOCKFILE.md`, `RATIONALE.md`) are 4,300 lines and are NOT covered by this pass. They are the next tranche once the four lenses land and their verdicts are applied.

---

## LENS RESULTS, three of four in

### Lens: LOCKED CONTRACT , commit `7c6c66b29`
- **CORRECTED:** `globals.css` claimed the ink focus edge was "~5.8:1" on white. Recomputed: **19.80:1**. Matched nothing, not s-ink, not the retired teal (13.67:1). Sat there since 2026-05-26.
- **SURFACED, not changed:** `outline: none` on all chrome for both `:focus` and `:focus-visible`, with the code's own comment admitting "this drops the WCAG 2.4.7 keyboard focus indicator on chrome, owner call". Yesterday's D1 ink-edge fix is scoped `(hover:hover)(pointer:fine)`, desktop only, and self-labelled a proposal. **The precise gap:** killing plain `:focus` is what stops the tap-fired ring; iOS fires `:focus` WITHOUT `:focus-visible` on tap, so the touch carve-out on `:focus-visible` removes nothing a tap would show. It only removes the cue for an external keyboard or switch device on a phone. Loss with no taste benefit.
- **REVISE, sourced:** our single `body: 14` collapses a role split every major system draws. 14 is right for dense UI rows (Carbon-productive, Atlassian default). For reading content Material defaults to 16, Apple floors at 17, and Carbon and Atlassian both explicitly escalate to 16. Reviews and salon descriptions are reading content.
- **KEEP, convergent:** radius set (Atlassian ships 8 values to our 6), 44px targets (clears WCAG 24px, matches Apple 44pt exactly).

### Lens: FLOORS , commit `890a632ad`
- **The uncomfortable one.** RESEARCH_METHOD R5 debunks "5 to 10% bold" as unsourced. FLOORS LAW then minted a different unsourced number, **30%**, for the same claim, and it is a live gate. Relabelled as a house number; gate kept, false authority removed.
- **1.8x ratio** is not independent law, it is 28/16 restated. But **28px IS convergent**: Apple Title 1 = 28pt, Material Headline Medium = 28sp.
- **Contrast claims verified twice independently**, mine and the lens's: 2.54 / 2.31 / 5.33 / 4.85, all exact.
- **1/3 imagery is not universal.** Measured: Fresha 22-31%, Airbnb 25-40%, **Booking.com 6-9%**. It is the convention of the browse category we chose, contradicted by the comparison-shopping category we did not. Right floor, wrong justification.

### Lens: COPY and I18N , the highest-stakes finding of the pass
- **REGISTER, OWNER DECISION.** Our German is **411 informal strings against 15 formal**, measured. The 15 formal are exactly the legal surfaces (TOS, GDPR, confidentiality), so an instinctive split already exists. But the lens fetched **Treatwell.ch, our exact competitor in our exact market**, plus three independent Swiss beauty businesses: **all four use Sie** for booking and transactional copy. YouGov Switzerland (n=1533, 2023) finds Sie preferred in professional and consultation contexts, with the 50-70 cohort reading unsolicited Du as disrespectful. The counter-case matters: Swiss social life is MORE du than Germany, yet Swiss COMMERCIAL Sie is stickier, so "Switzerland is casual, du is safe" runs backwards for vendor-to-customer. My earlier du conclusion most plausibly drew on those brands' `.de` copy rather than Swiss beauty-category usage.
- **ICON-ONLY, REVISE.** NN/g names only three icons safe without a label: home, print, search. Copy, flag and share are not on it. Peer-reviewed work (McDougall et al.) shows comprehension is driven by measurable properties explaining up to 69% of variance, so "unambiguous" is not assessable by inspection. Replace the subjective trigger with a 5-user test before any icon ships label-free.
- **EXPANSION FIGURE, REVISE.** Our contract cites 15-35%. W3C's actual data is length-dependent: strings under 10 chars average **200-300%**, 11-20 chars 180-200%, and only past 70 chars does it settle near 130%. The cited number understates the risk precisely where it is largest, on short button labels, which is the exact `h-11` failure mode we already flag.
- **EM-DASH BAN, REVISE.** Measured live: **218 em-dashes and 30 en-dashes** across the four locale files, so the rule is already widely violated in shipped copy. Worse, Duden confirms the spaced **en-dash IS the German Gedankenstrich**, a legitimate native construction. Banning both characters strips correct German from the primary market. Keep the em-dash ban; carve out the en-dash for DE/FR/IT.
- **LANGUAGE TAGS, scope clarification.** The checkout-scoped ban is right. It must not generalize to discovery or profile, where over a quarter of Swiss residents are foreign nationals and "speaks X" is decision-relevant for an intimate service involving allergy and treatment notes.

### Still running
Lens: the 10 TASTE RULES.
