# Airbnb comparison loop across every customer screen (2026-08-12)

Owner: "ok on ui compare to air nb yk as a loop and find me tons of improvements we can make on othr
screens yk all everywhere except dashboard and then make me tons of mockup ask me all questions and
principles u need to edcecute this loop"

## Readback

1. Compare our UI to Airbnb, run as a LOOP rather than one pass.
2. Find lots of improvements on the OTHER screens, everywhere, dashboard excluded.
3. Then make lots of mockups.
4. First, ask him every question and every principle I need in order to run it.

## What I measured before asking anything, so the questions are few and sharp

- **94 customer screens** in scope. `find app/[locale] -name page.tsx`, minus `/dev/` and minus
  dashboard. The big clusters: profile 19, salon 6, inspo 6, auth 4, bookings 3, and a long tail of
  one-page legal/marketing routes.
- **Airbnb work already on disk, so this does not start from zero and must not duplicate it:**
  `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` (their live token layer next to our account
  screen, plus SEVEN named conflicts with our own locks), `airbnb--profile-list.md`,
  `airbnb--profile-1to1-diff.md`, `airbnb--category-switch.md`, `airbnb--home-search-chrome.md`,
  `airbnb--animated-icons.md`, `airbnb--fonts-vs-ours.md`, `airbnb--icons-vs-ours.md`,
  `AIRBNB_PROFILE_PRINCIPLES.md`.
- **The method is already settled by him**, so it is not a question: *"dont only research the
  refference like go acc into the airbnb website and in mobile view acc analyze"*. Live site in
  mobile view is primary, stills are secondary, and `Skill(reference-lock)` is the binary trigger
  for any named brand reference.
- **The mockup format is already settled too**, `_plans/MOCKUP_QUEUE.md` v2: both panes are live
  iframes of the SAME real route, the After pane is the change INJECTED and then measured, with a
  diagnosis manifest of measured / violates / target. 44 built that way, 10 still open in that
  older queue.

## The one thing I will not decide for him

**CLAUDE.md line 130 calls this THE most important rule:** *"DUAL-AXIS: STRUCTURE = Fresha
source-of-truth. AESTHETIC = Uber via LOCKFILE. Both axes apply to every change."* Airbnb is
neither. And the graveyard records that the last thing copied from Airbnb by name, a pill border,
was killed by him on 2026-07-31, which `AIRBNB_SYSTEM_VS_OURS.md` logs as CONFLICT 7.

So "compare to Airbnb" collides with a locked rule, and per the precedence chain a live ask
outranks it, but silently overriding a lock is exactly what the chain forbids. Surfaced as
question 1 rather than resolved behind his back.

## Boxes

- [x] Q0. Scope measured and the existing Airbnb work found rather than duplicated (rule 12).
- [x] Q1. ANSWERED: "airbnb te is source of truth", and "no apply mockups i told u". Airbnb
      replaces Fresha-for-structure AND Uber-for-aesthetic. Landed in `CLAUDE.md` with the old rule
      quoted inside the new one, and in `_design-system/TASTE_LOG.md` dated. What did not move,
      because he did not move it: the statutory tier, the FLOORS LAW minimums, no dark mode, no
      fabricated data, and his own dated decisions. Collisions get surfaced, not applied.
- [x] Q2. ANSWERED: "all". Every one of the 94, dashboard excluded.
- [x] Q3. ANSWERED: screens with no Airbnb counterpart are graded against our own floors.
- [x] Q4. ANSWERED: "one screen at a time", plus a fifth ask he added unprompted, below.
- [x] Q5. ADDED BY HIM in the same answer: "i wanna improve design taste and principle etc that has
      to do w design n ui". The principles and taste documents are in scope for improvement too,
      not only the screens. That is a second output per screen: what the screen taught us that
      belongs in the law.
- [ ] Q6. CARRIED from the colour workstream and still his: two of the four 2D category icons do
      not exist as files (no barbershop, no spa; nails is `nails-test.svg`). Code cannot draw them.
- [ ] L1. THE LOOP, one screen at a time: capture Airbnb live in mobile view, measure both sides at
      the same width, diagnose, mock in the v2 format, hand it over, take his answer, and write
      what it taught back into the principles. Screen 1 is the home page.

## The principles I will run it under, so he can veto any of them now instead of after

1. **Capture, never recall.** Every Airbnb claim comes from the live site in mobile view or a
   capture on disk, with the number and where it came from. No "Airbnb does X" from memory.
2. **Measure both sides.** Every finding is a pair: their number and ours, taken the same day at
   the same width, or it does not go in the list.
3. **Their structure is a candidate, our floors are law.** WCAG, the no-dark-mode rule, the
   no-fabrication rule and the trust floor cannot be traded for a resemblance.
4. **Mockup before code, always**, in the v2 format that already exists.
5. **One entity, one component.** An improvement that would give a salon a second card
   implementation is rejected however good it looks (FLOORS LAW 8 and 9).
6. **Every proposal carries its cost** in his language, next to its upside.
7. **Nothing is applied without his pick.**
