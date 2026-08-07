<!-- The fifteen answers. Dated owner law. Do not re-litigate any row. -->
# SYSTEM DECISIONS, owner answers to question round 2 (2026-08-07)

Elicited via `public/_mockups/system-overhaul-questions/index.html`, answered in shorthand:
`1a 2a 3a 4d 5a 6b 7a 8a 9(own) 10(same as 9) 11a 12(answered on follow-up) 13a 14(own) 15a`.
Verbatim additions are quoted, because several answers carry more than the letter.

| # | Decision | Carries |
|---|---|---|
| 1 | **Freeze new gates.** A gate is legal only for something objective and cheap to check. Judgment-shaped failures go to the reasoning layer. | This retires the reflex that produced 241 hook files. |
| 2 | **Bury all 18 armed-nowhere gates.** | Anything genuinely needed comes back through rule 1. |
| 3 | **Mockup-first is OVER-ENFORCED.** Fix the 300s timer and the filename heuristic, collapse the family into one check. | Answers a question escalated in three consecutive weekly audits and never answered. |
| 4 | **A set is all three shapes** (a flow, N directions of one screen, a page family), each with its own pipeline. | *"i think 4 needs a big mockup n allat session"* , this gets its own dedicated session, not a paragraph. |
| 5 | **Yes, an instrument must reproduce a verdict he already gave before it is trusted.** | |
| 6 | **NOT my recommendation. He picked B: show him both readings and let him decide which is wrong.** | I proposed "your eyes win automatically". He does not want that. He wants to be shown the measurement AND his own report side by side, and he makes the call. |
| 7 | **Two failed attempts. The third must change the method, or come to him.** | |
| 8 | **One canon file per concern**, everything else a pointer, dated reports archived. | *"but make it so it acc gets archived and evrth like acc gate for that so it forces"* , archiving is not a cleanup pass, it needs a real gate that forces it. |
| 9 | **The reply itself is the problem.** Verbatim: *"you just tell me a lot of before and after numbers, block names for untouched file three out of three, passes three out of the... I don't understand any of that. Also, like, which files you touched? I don't care at all. You know, those unnecessary stuff. There's, like, a lot of text and unorganized texting. It's, like, visually, it's, like, unpleasing. So research that."* | Three separate bans: **no self-test scores**, **no file lists**, **no gate jargon**. Plus: the text is UNORGANIZED and VISUALLY UNPLEASING, and the fix is to **research how to write it**, not to guess. |
| 10 | *"Yeah. That's what just said."* Same complaint as 9. Length was never the real axis. | |
| 11 | **One page per substantial task, plus a standing page of every open decision.** | *"not more than one file because it's just so annoying. I don't care about how many files it told."* |
| 12 | **ANSWERED on the follow-up: ask only when I would otherwise be GUESSING.** Not scope-based, not time-based. | He rejected my recommendation (more than one file, or anything visual). The bar is whether a wrong assumption would waste the work. Named risk, and it is mine to manage: I often do not notice I am guessing, which is exactly what rule 5 (validate the instrument) and rule 7 (two attempts) are there to catch. |
| 13 | **Park it, keep going, surface it at the end.** | *"but actually added to the plan. You know? And we will serve, like, a plan gate... don't forget about those."* , a parked item must be WRITTEN INTO THE PLAN, and a gate must enforce that. |
| 14 | **I ORCHESTRATE design, I do not build it.** Verbatim: *"you're the [one] to orchestrate. You tell us specifically what to do instead of you actually doing it, because for design, for mockup, it's important that you say it because you have more visual context. But the problem is that it takes too long because you only drop like one subagent. That's what I do not want."* | Two rules: (a) I write precise briefs and dispatch, I do not hand-build mockups; (b) **fan out MANY design subagents in parallel, never one at a time.** |
| 15 | **Fix each instance first, then attack the shared cause.** | |

## What decision 14 supersedes

`feedback_no_parallel_agents_frontend` (owner 2026-06-14, "parallel agents = backend/audit/research
only, never frontend/UI") is **superseded for design work by this dated decision**. He has now said
the opposite in his own words, and the newest dated owner decision wins. The old rule's concern was
mushy design-by-committee; the new shape answers it differently: one orchestrator holds the visual
context and writes each brief, the subagents execute in parallel rather than deciding.

## What decision 6 corrects in my own reasoning

I recommended that his eyes automatically beat the measurement. He rejected that and chose to be
shown both. That is a better rule than mine: it keeps the measurement as evidence rather than
discarding it, and it puts the judgment where it belongs. Recorded because I got it wrong.


## Follow-up answers, same day

- **Order of the phase-2 work:** *"its a loop"*. No prioritising. Everything runs, and it keeps
  running. Nine builders dispatched in parallel, which is decision 14 in use on its first day.
- **The sets session:** *start it now, in parallel*, not later. So Q4 is in the same fan-out as
  everything else rather than parked.


## Decision 16, added 2026-08-07 after four turns of prose questions

**Owner verbatim:** *"lets do this if you stop cz u need my answer make an abc or yk like clear sh
add it to the plan to create ths too"*

**The rule.** If a turn stops because I need his answer, the question is delivered as LETTERED
OPTIONS, never as prose. A, B, C. One line each. My pick marked. He replies with a letter.

This is not a style preference, it is the difference between a decision he can make in three
seconds on a phone and one that costs him a turn of typing. He already answers this way and has
for months: *"1a 2 your pick 3b 4 b 5 no dark mode"* (TASTE_LOG 2026-07-15). The failure was mine,
writing questions as paragraphs he had to parse and then compose an answer to.

**What counts as an option.** A real fork with a real consequence, not "should I keep going". If I
cannot write three distinct lettered outcomes, the thing is not a decision and I should not be
stopping for it.

**Where it binds.** Everywhere a turn ends on an unanswered question: in chat, in a plan file, and
on any served question page. The Taste-Lab page format already does this correctly; chat replies
were the gap.


## Decision 17, the biggest one of the day: mockups become REAL PAGES

**Answer: A.** Mockups are real pages inside the app, not standalone HTML files.

He also said: *"you see im expecting these answer from you"*, confirming decision 16. The lettered
format is what he wants every time I stop.

### What this changes

- **The 253 standalone files in `public/_mockups/` are legacy.** They still exist and still render,
  but they are no longer how a new mockup gets made.
- **New mockups are routes under `app/[locale]/dev/`.** They drive the real components, so they
  click, they animate, and they cannot drift from the product because they ARE the product.
- **`_plans/FLOW_HARNESS.md` is no longer a side project, it is the road.** He asked for exactly
  this on 2026-07-08 in his own words: *"I want each FLOW... click and see all the animations, go
  back and stuff. And test out everything on the front end, see if it works right now, over
  Cloudflare."* It has one flow wired and eleven listed as not started. That is the thing to
  finish.
- **`public/_mockups/_BASE.md` narrows.** Its phone-geometry law (402 width, no drawn phone, word-
  width fonts, real photos, no remote assets) still governs anything static. It stops being the
  law for new work.
- **The whole mockup gate family gets re-pointed.** Most of it (Base, Scale, Grounded-in, Depicts,
  floors) was written to police a static HTML file. Q3 was already going to fix that family; this
  decision changes what it should be checking, so Q3's draft needs re-reading against it.

### The cost, stated plainly because he should hear it

A real page needs the dev server running to be seen at all, and when a component is broken the
mockup breaks with it. A standalone file never breaks and needs nothing. He accepted that trade
knowingly: he does not want to look at pictures, he wants to tap the thing.
