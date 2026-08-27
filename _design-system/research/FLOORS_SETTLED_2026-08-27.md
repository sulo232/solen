<!-- exists-check: net-new vs FLOORS_LIVE_2026-08-27.md and FLOORS_WARM_2026-08-27.md because
     those two are raw pre-fix sweeps (one cold, one warm) run on the OLD checker, which had no
     settle-wait and no --auth. This file is the sweep on the FIXED checker (waits for settle,
     can sign in, marks redirects), the record this task was asked to produce, and it also
     carries the requested diff against the numbers the owner was already given. -->

# The floors checker, re-run properly

Short version: the checker used to read the page before it finished loading. That is fixed now.
Ran it again, on all fifteen customer pages, twice, once as a visitor and once logged in. Every
number below is measured just now against the running site, not estimated.

## The table

Route: which page. The six columns are the six floors the checker measures. Every cell is
PASS or FAIL, with the actual number next to it.

| Route | Imagery (need ≥33%) | Anchor size (need ≥28px) | Bold text share (need ≤30%) | Size ratio (need ≥1.8x) | Size spread | Elevation (need ≥2) |
|---|---|---|---|---|---|---|
| /de | 28.56% FAIL | 18px FAIL | 37.14% FAIL | 1.5x FAIL | 3 sizes, PASS | 7, PASS |
| /de/coiffeur | 41.75% PASS | 18px FAIL | 28.13% PASS | 1.5x FAIL | 4 sizes, PASS | 7, PASS |
| /de/nails | 41.75% PASS | 18px FAIL | 30.3% FAIL | 1.5x FAIL | 4 sizes, PASS | 7, PASS |
| /de/spa | 41.75% PASS | 18px FAIL | 28.13% PASS | 1.5x FAIL | 4 sizes, PASS | 7, PASS |
| /de/barbershop | 21.59% FAIL | 20px FAIL | 45.24% FAIL | 1.67x FAIL | 5 sizes bunched, FAIL | 7, PASS |
| /de/basel | 43.18% PASS | 25px FAIL | 43.75% FAIL | 1.79x FAIL | 4 sizes, PASS | 4, PASS |
| /de/basel/coiffeur | 41.03% PASS | 18px FAIL | 28.57% PASS | 1.5x FAIL | 4 sizes, PASS | 5, PASS |
| /de/inspo | 65.43% PASS* | 14px FAIL | 8.7% PASS | 1.17x FAIL | 2 sizes, PASS | 8, PASS |
| /de/salon/cuts-and-culture | 34.66% PASS | 30px PASS | 30% PASS | 2.14x PASS | 5 sizes, PASS | 3, PASS |
| /de/salon/cuts-and-culture/reviews | 0% FAIL | 30px PASS | 43.48% FAIL | 2.31x PASS | 7 sizes bunched, FAIL | 2, PASS |
| /de/profile (logged in) | 0% FAIL | 28px PASS | 33.33% FAIL | 2.15x PASS | 7 sizes bunched, FAIL | 2, PASS |
| /de/profile/settings (logged in) | 0% FAIL | 24px FAIL | 34.78% FAIL | 1.6x FAIL | 9 sizes bunched, FAIL | 2, PASS |
| /de/notifications (logged in) | 0% FAIL | 20px FAIL | 14.29% PASS | 1.67x FAIL | 4 sizes, PASS | 2, PASS |
| /de/help | 0% FAIL | 30px PASS | 10% PASS | 2.5x PASS | 3 sizes, PASS | 2, PASS |
| /de/warum-solen | 0% FAIL | 27.3px FAIL | 25% PASS | 2.1x PASS | 7 sizes bunched, FAIL | 2, PASS |

Only one page passes everything: the salon page for Cuts and Culture.

*/de/inspo: this number is for a visitor who is not logged in. A logged-in visitor sees a very
different number on that same page, explained below, it is not a mistake in the table.

## The three pages that needed a login to be measured honestly

Profile, Profile Settings, and Notifications all require an account. As a visitor with no
account, all three send you straight to the login page instead of showing you the page you asked
for. Signed out, here is what a visitor actually sees at those addresses, which is the login
page, not the real page:

- imagery 0%, anchor size 28px, bold text 28.57%, size ratio 1.87x, only 1 elevation level (fails
  the elevation floor)
- this same login-page reading showed up for all three addresses, because they all bounce to the
  same login page

That is why the real numbers for those three pages, in the table above, only exist for the
logged-in run. There was no other way to measure them.

## Pages that did not fully settle

One reading came back flagged as not fully settled: the very first attempt to measure Profile
while signed out, which is really just the login page it bounced to. It is not one of the fifteen
real pages, so it does not affect anything in the table above. Every other page, in both runs,
settled cleanly within the wait window.

One thing worth knowing separately: partway through the logged-in run, the local dev server
itself crashed and had to come back up before the rest of the pages could be measured. That is a
tooling hiccup, not a page problem. Once the server was back, the whole logged-in run was
repeated clean from the start, and every number above is from that clean repeat.

## What changed from the numbers you were already given

You were told a set of numbers before this fix. Here is what changed and what did not, page by
page. Where a number did not move, that is stated too, so nothing gets left out.

**/de**: nothing changed. Every number is identical to what you were told (imagery 28.56%,
anchor 18px, bold text 37.14%, ratio 1.5x, all still failing).

**/de/coiffeur, /de/nails, /de/spa**: big change. You were told imagery was basically zero
(0.71%) and the anchor text was only 14px. The real, settled picture is much better on imagery,
around 41.75% now, which actually passes the floor. The anchor is still small, but it is 18px,
not 14px. These pages load their data after the first paint, and the old checker read them too
early, before that data arrived.

**/de/barbershop**: nothing changed. Every number matches exactly what you were told, this page's
problems are real, not a timing artifact.

**/de/basel**: imagery jumped from 0% to 43.18%, now passing. The bold text share came down
some, from 54.55% to 43.75%, still failing, but less badly than reported. Anchor size and ratio
did not move.

**/de/basel/coiffeur**: same pattern as coiffeur, nails and spa above. Imagery went from 0% to
41.03%, now passing. Anchor moved from 14px to 18px.

**/de/inspo**: imagery for a visitor went from 0.71% to 65.43%, a big jump, now passing. But this
is where the logged-in run matters: logged in, imagery reads 0.71%, matching the old broken
number almost exactly. So a real signed-in user is seeing what the old broken checker measured,
and a signed-out visitor is not. This needs its own look, it is not explained by the timing fix,
it is a real difference between what a guest sees on that page and what a logged-in user sees.

**/de/salon/cuts-and-culture**: still passing everything, no change.

**/de/salon/cuts-and-culture/reviews**: nothing changed. Imagery, bold text share, and the bunched
sizes all match what you were told.

**/de/profile**: could not be honestly compared before, because the old checker had no way to log
in, so whatever number you were given for this page was almost certainly measuring the login
page, not Profile itself. Measured properly now while logged in: anchor size is 28px (passes),
the size ratio is 2.15x (passes). Bold text share improved some, 40% down to 33.33%, but still
fails.

**/de/profile/settings**: same caveat, the old number likely wasn't this page either. Now measured
logged in: elevation went from failing (1 level) to passing (2 levels). Imagery is still 0%,
still failing.

**/de/notifications**: anchor size moved from 12px to 20px, still failing either way. The size
ratio moved from 1x to 1.67x, still failing either way. Imagery is still 0%, unchanged.

**/de/help**: nothing changed on the one number you had, imagery is still 0%.

**/de/warum-solen**: nothing changed. Imagery, anchor, and the bunched sizes all match exactly.

## The short version of the diff

Five pages (coiffeur, nails, spa, basel, basel/coiffeur) looked much worse than they actually
are, because the old checker read them before their content loaded, the real imagery numbers on
those pages pass the floor. Six pages (/de, barbershop, cuts-and-culture, cuts-and-culture
reviews, warum-solen, help) are exactly as bad as you were told, that part was never a timing
problem. Inspo has a real, separate issue where a logged-in user sees far less imagery than a
guest does, and that is worth its own look.
