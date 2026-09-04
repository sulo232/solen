# The 11 old branches: is anything on them worth merging? (2026-09-04)

Your question, in your words: *"do we even need to merge? because isn't that just old stuff? ...
look into it. If it's important, then merge this stuff. If it's, like, in design direction changes
and tell me about it."*

**Short answer: one branch has something real, four are design you have to look at before anything
happens, and six have nothing left.**

Read-only pass. Nothing was merged, moved, or deleted to write this. All 11 archive tags were
checked and every one points at its branch tip, so any of these can be brought back with one
command whatever you decide.

Measured against `main` at `c3171dac9`. Another session was committing into this same working
folder while this ran (six commits and ten changed files appeared during it, the email-or-SMS
reminder work). None of it is mine, and I re-checked every finding below against that newer state
as well: all of them still hold.

---

## The three piles

| bucket | how many | which ones |
|---|---|---|
| **IMPORTANT AND MISSING** | 1 | `context-compact-architecture-5d1ace` |
| **DESIGN DIRECTION** (report only, never merge) | 4 | `bold-hellman-b31513`, `crazy-bose-57e405`, `happy-jackson-514459`, `sad-austin-a99451` |
| **NOTHING LEFT** | 6 | `backend-analysis-improvements-77f02b`, `bold-jepsen-6019eb`, `clever-mirzakhani-1af8ef`, `cranky-bose-5621bf`, `nice-hugle-c0b706`, `quirky-ellis-ef5559` |

**The single fact that decides most of this:** every rescue commit from the 14 August branch
campaign is already on main. I checked all 21 of them by id (`git merge-base --is-ancestor`), and
all 21 came back ON MAIN, including the 62 stranded database files, the discount overcharge fix, the
broken client photos, the staff door, and the eight security migrations. The work was lifted a
month ago. What is left on these branches is the part that was deliberately not lifted.

---

## IMPORTANT AND MISSING

### `claude/context-compact-architecture-5d1ace` · 2026-07-10 · 74 commits ahead

**You approved how a pop-up sheet should feel when you flick it away, and only the written rule
landed. The code never did.** Today, when a customer drags a sheet down (cancel a booking, change
a time, sort reviews, switch language), the app measures one thing: did the finger travel more than
90 pixels. Flick it fast and short and it snaps back; drag it slow and far and it closes. That is
backwards from every phone app, and on release the sheet jumps to a fixed animation instead of
carrying the speed of your finger, which is the seam your own rule names as the exact thing it
exists to remove. The branch has the finished version: it reads how fast you flicked, springs from
where your finger let go, resists when you pull it above its resting place, and can be grabbed again
mid-flight.

This is felt, not seen in a screenshot, so it still wants a before-and-after on your phone before it
goes in. But the decision itself is already yours and dated, so this is not a new design question,
it is a finished decision that never got built.

**Evidence.** The rule is on main at
`/Users/sulo/Documents/solen/_design-system/LOCKFILE.md` section 16.5, headed "Gesture-release
physics (owner-approved 2026-07-10)". The code on main is
`/Users/sulo/Documents/solen/app/[locale]/_components/primitives/Sheet.tsx`, 379 lines, and its own
comment says section 16.1 only, with the release rule written as `if (dragDy.current > 90)` and the
transform cleared on release. I grepped main's entire app, components and lib for `velocity` and it
appears in only two files, neither of them this one. The branch's copy of the same file is 579 lines
and carries sections 16.5.1 through 16.5.6 by name. Six files import this sheet on main, four of
them customer-facing: `CancelBookingSheet.tsx`, `RescheduleSheet.tsx`, `SalonReviews.tsx`,
`LanguageSwitcher.tsx`.

Checked before calling it missing: not in `_design-system/REMOVED.md`, not reversed in
`_design-system/TASTE_LOG.md`, and `npm run exists` finds no other sheet primitive doing this job.

---

## DESIGN DIRECTION (report only, do not merge)

### `claude/bold-hellman-b31513` · 2026-06-30 · 32 commits ahead

**This is the Aurora dashboard skin, and you already binned it by name on 25 August.** It would
repaint the whole salon dashboard with glows, tinted input fields and raised category tools. It also
predates your 12 August call making Airbnb the reference, so it competes with a look you have since
locked. Nothing here should be merged.

One piece on it you never actually judged: a stack of "recommended next steps" cards for the
dashboard home. That matters because of something I found while checking it, below.

**Evidence.** `/Users/sulo/Documents/solen/_design-system/REMOVED.md` line 139 names this branch by
its id and records your decision. The onboarding questions it also carries (how did you hear about
us, team size, goals) are already on main at
`/Users/sulo/Documents/solen/app/[locale]/onboarding/salon/page.tsx`.

### `claude/crazy-bose-57e405` · 2026-06-28 · 170 commits ahead

**The oldest and biggest of the pile, and it is mostly a folder of dashboard drawings.** It carries
about 25 mockup pages for dashboard homes, onboarding and setup cards, plus the first version of
that same Aurora look you binned. Its one behaviour piece you have not seen is "coachmarks", little
pointing hints that pop up over the dashboard the first time a salon uses something. Nothing on main
has those.

Its other work is superseded: main now has a far bigger set of per-category dashboard tools than
this branch built, under different names.

**Evidence.** 25 mockup folders under `public/_mockups/` exist only on this branch. I grepped main's
whole app, lib and components folders for "coachmark" and got zero hits. Main's per-category tools
live under `/Users/sulo/Documents/solen/app/api/dashboard/`, which has 24 routes today against this
branch's 7.

### `claude/happy-jackson-514459` · 2026-07-10 · 114 commits ahead

**A motion and consistency study: eighteen practice screens plus a card lab, built to compare how
things move.** They were never meant to ship, they are workbench pages. The security half of this
branch is already on main through other work.

**Evidence.** Its unique files are 14 mockup pages under `public/_mockups/` and four dev pages under
`app/[locale]/dev/` (card-lab, motion-demo, motion-screens, onboarding-glyphs), none of which exist
on main. The orphan `/checkout` page it wanted removed is already gone from main.

### `claude/sad-austin-a99451` · 2026-07-06 · 80 commits ahead

**A design-polish sweep: 216 small look inconsistencies fixed by hand in July, plus nine motion
mockup pages.** Main has since replaced the hand sweep with automatic checkers that catch the same
class of problem every time instead of once, so the sweep itself is not worth reviving.

One genuinely small thing it has that main does not: a loading skeleton for city pages. Main has
skeletons for ten routes and none for the city page, so that one shows nothing while it loads.

**Evidence.** Nine files under `public/_mockups/design-polish/` exist only here. The checkers on
main are `/Users/sulo/Documents/solen/scripts/consistency-check.mjs` and
`detect-type-scale-outliers.mjs`. Main has `loading.tsx` for barbershop, coiffeur, dashboard, inspo,
nails, profile, salon, search, spa and the home page, but not for `app/[locale]/[city]/`.

---

## NOTHING LEFT

### `claude/backend-analysis-improvements-77f02b` · 2026-07-16 · 145 commits ahead

**The one reason this branch was being kept alive is closed.** In August the worry was that a
confirm-or-cancel link in a booking email could be clicked over and over with nothing stopping it.
That protection is now live and the code reads it.

Everything else on it is planning documents and three harness checks that were never wired.

**Evidence.** `bookings.consumed_at` is in the live column list
(`/Users/sulo/Documents/solen/_inventory/_db-columns.json`) and main reads it at
`/Users/sulo/Documents/solen/app/api/bookings/[id]/quick-action/route.ts`. Worth knowing: the
"MISSING THINGS" block in CLAUDE.md still says this link "has no replay protection at all". That
sentence is now out of date and should be corrected.

### `claude/bold-jepsen-6019eb` · 2026-07-06 · 45 commits ahead

**Every fix on it already exists on main, built separately.** The double-booking race guards, the
phone code verification it parked as unsafe, the money constants, the button press feedback: all
five things I checked are on main under different names.

**Evidence.** Its `lib/safe-fetch.ts` is answered by `/Users/sulo/Documents/solen/lib/security/ssrf-guard.ts`
on main. One real difference is named in the "found while looking" list below.

### `claude/clever-mirzakhani-1af8ef` · 2026-07-06 · 200 commits ahead

**Its two big threads both have a finished version on main.** The security hardening was
independently done, and the personalisation picker went through six rejected rounds here without
ever settling, while main shipped a different one that works.

**Evidence.** All 21 of its database changes are already live. Its ten exploration pages under
`app/[locale]/dev/dna-*` are drawings, not product. Its referral admin and credit balance endpoints
are absent from main, but main has four other referral endpoints and its own credits module at
`/Users/sulo/Documents/solen/lib/credits/redeem.ts`.

### `claude/cranky-bose-5621bf` · 2026-07-08 · 77 commits ahead

**Its headline fix, deleting a duplicate treatments page, is already done on main, and main's own
graveyard says it got there independently.** Its second piece, a nightly job to clear out dead
appointment slots, is also handled: the database runs that clean-up itself every Sunday, so the web
job it wrote is not needed.

**Evidence.** `/Users/sulo/Documents/solen/supabase/migrations/20260711161352_backend_loop_schedule_slot_purge.sql`
schedules `purge_past_available_slots` inside Postgres for Sunday 04:15.
`/Users/sulo/Documents/solen/_design-system/REMOVED.md` line 136 records the treatments page kill.

### `claude/nice-hugle-c0b706` · 2026-05-31 · 17 commits ahead

**The oldest branch, and merging it would go backwards.** Main's own booking code opens with a
comment naming this branch and explaining why its approach was rejected: it wrote an appointment
that analytics, reminders and no-show tracking could never see. The staff permissions it built are
superseded by the eight-area model you approved, and the client record book is on main with notes,
tags and allergies.

Two things on it are genuinely not on main. Both are covered in the section below, and neither is a
merge.

**Evidence.** `/Users/sulo/Documents/solen/app/api/bookings/salon/route.ts` line 20 names commit
`8bab79b80` on this branch and says why. The eight-area permissions are live at
`/Users/sulo/Documents/solen/app/[locale]/dashboard/staff/page.tsx` around line 324.

### `claude/quirky-ellis-ef5559` · 2026-07-24 · 224 commits ahead

**Everything it was kept for is on main.** The four security database changes the August audit
called genuinely missing are all live: the violation reporting table, the hashed walk-in ticket, and
both admin payment-mode columns.

The only file left that exists nowhere else is a small helper that rewrites the shape of error
messages across 163 routes. That was looked at in August and deliberately left, because it changes
no behaviour and main has moved on since July, so taking it would undo later work for nothing.

**Evidence.** `csp_violation_reports`, `barber_walkin_queue.tracking_token_hash`,
`salons.payment_mode_admin` and `salons.payment_mode_enforced` are all in
`/Users/sulo/Documents/solen/_inventory/_db-columns.json`. The helper is `lib/api-error.ts`, on this
branch only.

---

## Not one of the eleven

`claude/harness-everth-research-bfee1b` (today, 185 commits ahead) is the branch you said "don't
worry, still working on it" about. Untouched, nothing done to it. It is tooling and research, not
product.

---

## Found while looking, and none of it is a merge

These are real, they are small, and every one is a fix on today's code rather than a reason to bring
an old branch across.

1. **Two links in the stylist menu go to pages that do not exist.** A stylist you invite sees four
   menu items; two of them, "my breaks" and "my portfolio", point at pages that have never existed
   in this repo on any branch. That menu became reachable in August when the staff login door was
   fixed, so this is newly live. Evidence: `components-legacy/dashboard/DashboardLayout.tsx` lines
   108 and 109; neither `app/[locale]/dashboard/my-breaks/` nor `my-portfolio/` exists on main or on
   any of the 19 branches.

2. **You ask every new salon three questions and never use the answers.** Onboarding collects how
   they heard about you, their team size and their goals, saves all three, and nothing anywhere
   reads them back. Evidence: `onboarding_goals` and `team_size` appear only in the form that writes
   them and the endpoint that saves them (`app/api/salons/route.ts` lines 693 and 759), nowhere
   else. The card stack that was meant to consume them is the unbuilt piece on `bold-hellman`.

3. **A calendar setting exists in the database that no screen can set.** `salons.calendar_color_by`
   and `category_colors` are live columns and nothing on main reads or writes either. Main's
   calendar hard-codes both colouring modes instead. The settings tab for it is on `nice-hugle`.

4. **The consistency dashboard is on main and the command to run it is not.** The file's own header
   says "Run: npm run consistency" and `package.json` has no such script. One line. Evidence:
   `scripts/consistency-check.mjs` header versus `package.json` scripts.

5. **Four places fetch a link after checking it, then follow redirects without re-checking.** The
   guard proves an address is safe, then the fetch is allowed to be bounced somewhere else. One
   file on main already does this correctly with `redirect: "manual"`; four do not. I did not try to
   exploit it, so this is a hardening gap, not a proven hole. Evidence: `lib/security/ssrf-guard.ts`
   has no redirect handling; `lib/ai-vision.ts` lines 229 and 267 do it right; the four call sites
   in `app/api/admin/discovery/backfill`, `app/api/admin/discovery/staging`,
   `app/api/admin/nail/generate` and `app/api/discovery/thumb/[id]` do not.

6. **Two screens exist on `nice-hugle` that main does not have, and both need your word before
   anyone builds them.** A weekly rota planner so a salon can lay out who works when (main has the
   data and the permission area called "Schedule", but no screen), and an in-salon till screen for
   ringing up a walk-in with cash. On the till: the outside review you ordered on 14 August came
   back "post-launch at best", one voice said never, and TWINT is still switched off, so it cannot
   be done properly today anyway. Both would be built fresh, not merged.

7. **One correction to that till review.** It states as verified that
   `POST /api/bookings/[id]/checkout` is "live and working" on main. It is not, and never has been:
   no checkout endpoint exists anywhere under `app/api` on main, and `git log` shows that path has
   no history on main at all. It lives only on `crazy-bose`. Recording it because a later decision
   could otherwise be built on it.

---

## What I could not prove either way

- Whether the **coachmark hints** and the **city loading skeleton** are wanted. Both are genuinely
  absent from main and neither is in the graveyard, so nobody has ruled on them. What would settle
  it: your word, since neither is a bug.
- Whether the security items on `bold-jepsen`, `happy-jackson`, `clever-mirzakhani` and `sad-austin`
  were each closed on main **line for line**. I checked the headline item on each and every one was
  covered. I did not walk all four branches route by route. What would settle it: a targeted sweep
  of the specific routes each branch names, which is a day of work and, on the evidence so far,
  would very likely find nothing.

---

## Recommendation

**Take one thing, look at four, delete nothing yet.**

1. Bring the sheet release physics across from `context-compact-architecture-5d1ace`, after you feel
   a before-and-after on your phone. It is a decision you already made that never got built.
2. Leave the four design branches alone unless you want to look at coachmarks or the next-steps
   cards. Nothing there should be merged.
3. The other six can be deleted whenever you say so. All 11 archive tags are verified pointing at
   their tips, so `git checkout -b <name> <tag>` brings any of them back.

The named cost of deleting: the two screens in item 6 and the design mockup piles go out of easy
reach. The tags keep them recoverable, but a tag is harder to browse than a branch, and in practice
nobody opens a tag they have forgotten exists.
