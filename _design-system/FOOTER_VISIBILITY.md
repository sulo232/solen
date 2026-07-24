<!-- exists-check: net-new vs _design-system/CONTROL_ELEVATION.md (owns CONTROL treatment, not page
     composition , the see-all/CTA ladder was APPENDED there rather than duplicated here),
     _design-system/QUESTIONS.md (open questions, not law), _design-system/LOCKFILE.md (frozen literals,
     has no footer rule), and app/[locale]/_components/layout/FooterGate.tsx (the IMPLEMENTATION, a
     hardcoded 2-route array with no stated principle). `npm run exists footer` surfaced no existing
     footer-visibility doctrine. Net-new because nothing in the system says WHEN the footer may render. -->

# Footer visibility: the footer is a DESTINATION affordance, not page furniture

Owner-requested 2026-07-24: "we need a whole new principle about when to show this bottom footer,
because when we go like a tab, I don't think we should show those footers."

## What exists today (verified this turn, not recalled)
`app/[locale]/_components/layout/FooterGate.tsx:19` , `const EXCLUDED = ["/booking", "/confirmation"]`.
Two routes, hardcoded, no stated rationale. Every other route renders the full marketing footer: brand
blurb, social icons, four link columns, legal bar, language switcher, plus the newsletter block above it.

## The problem
The footer answers one question: *"where else can I go on this site?"* That question is only live once the
user has FINISHED the current job. On a screen that sits one step inside a task, the footer is an exit ramp
in the middle of the road , it competes with the task's own action, inflates page height, and (measured
this session on the PDP) it is what the sticky book bar had to fight for the bottom of the viewport.

## THE RULE
Classify every screen as one of three; the footer follows from the class.

| Class | What it is | Footer |
|---|---|---|
| **Destination** | A place you arrive at and browse from: home, search results, category, PDP, Inspo feed, profile hub, legal/help. | **SHOW** the full footer. |
| **Task step** | One step inside a flow with its own forward action; a picker; a filter view; a tab-like sub-view; or ANY screen whose primary control is pinned to the bottom. Booking steps, checkout, "Select professional", the full reviews/filter view, queue tracker, onboarding. | **HIDE** entirely. |
| **Terminal** | The end of a flow: confirmation, receipt, error/404. | **HIDE** the marketing footer. Show only the legal micro-bar if that screen legally needs a link. |

### Two supporting clauses (both from bugs already hit)
1. **A bottom-pinned control wins the bottom.** If a screen carries a fixed bottom bar (book, pay, join
   queue), it IS a task step by definition, so the footer must not render. This is the structural fix for
   the class of bug where a sticky CTA and the footer fight over the same pixels , which cost two rounds
   on the PDP book bar on 2026-07-24.
2. **A sub-view of a destination inherits "task step".** Tapping "see all" from a PDP section lands on a
   focused list (reviews, team). The parent is a destination; the sub-view is not. This is the owner's
   "when we go like a tab, I don't think we should show those footers."

## How to apply
`FooterGate`'s hardcoded array becomes the implementation of the table above: add the task-step and
terminal prefixes (the full reviews view, team/select pickers, `/queue`, `/onboarding`, `/checkout`,
alongside the existing `/booking`, `/confirmation`). Prefer one exported `isTaskStep(pathname)` helper so a
NEW route opts in by classification rather than by someone remembering to edit an array , the array is why
only two routes were ever covered.

## Status
Principle written 2026-07-24, owner sign-off pending. NOT yet applied: applying it edits `FooterGate`, a
shipped layout component, so it waits for the yes and then goes through the normal loop.
