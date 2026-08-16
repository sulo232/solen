# Why it looks flat and pill-covered, and what is actually causing it (2026-08-15)

Owner, verbatim: *"i dont like ths flat sh and pil everywhere i told ths once whats causing this
wich files or gates bro for example the neuste or yk the sort in pills n text is too big n pill is
big like heierchy and spacing and sozeing yk of druff and lwk the the filter with stars hoe kany yk
we dont need how kany there is its jst clutter but its jst iverall do ass bro can u identify whats
causing ths like comparing to airbnb etc fresha too its jst so cluttered mainly i want airbnb"*

He asked a QUESTION first. The deliverable is the CAUSE, named in files, before any fix.

## The asks, atomised

- [x] 1. Flat look · verified (commit cf69073dd): 7 distinct sizes at 390x844 with five inside a
      5px band (12/13/14/15/17), which is the failure named by hand in `CLAUDE.md` FLOORS LAW 7c;
      NOT the bold share, which measured 14% against our own 30% ceiling
- [x] 2. Pills everywhere · verified (commit cf69073dd): 14 of 17 rounded elements in the first
      viewport are full capsules (82%), caused by `CLAUDE.md:106` ending "button/chip pill" plus
      `CLAUDE.md:97` routing every option through TabPill, whose `TabPill.tsx:47` is `rounded-full`
      and which 29 files import
- [x] 3. Name the FILES / RULES · verified (commit cf69073dd): `CLAUDE.md:97` (TabPill for every
      option), `:101` (the size row), `:106` (radius, "button/chip pill"), `:114` (44px touch),
      `:115` (filter pill), plus `TabPill.tsx:47,75,76` and its 29 importers
- [x] 4. The sort control · verified (commit cf69073dd): live getComputedStyle gives 108x44px, 13px
      text, radius 9999px, so the box is 3.38x its own text. Cause is `CLAUDE.md:114` read as a rule
      about the PAINTED box when it is a floor for the TAP AREA
- [x] 5. Hierarchy / spacing / sizing · verified (commit cf69073dd): 7 sizes against the ceiling of
      4, plus 4 letter-spacing values where every measured Airbnb tier is `normal`. The size row at
      `CLAUDE.md:101` mandates 6-7 sizes while FLOORS LAW 7 caps them at 4, and both are law
- [x] 6. Star filter counts · MOCKUP, not applied · verified (commit cf69073dd): at /en/dev/calm the
      "whole thing" option hides them, measured live as the pill reading "5" with the count wrapper
      computing `display: none`. The real component is untouched
- [x] 7. Compare against Airbnb · verified (commit cf69073dd): `airbnb--home-mobile.md:41` (20px
      dominant radius over 100 elements) and `:44` (capsule kept for the one search field), plus
      `AIRBNB_SYSTEM_VS_OURS.md` 2c for their type tiers, tracking and weight vocabulary
- [x] 8. ANSWERED AND APPLIED (commit ac1ec574c) · owner 2026-08-16: "Now it's a lot lot lot lot
      better. You can go implement this." He answered it on the SIBLING page, /dev/round5, whose
      combined option carries the same shape change this page was asking about, so the question
      closed there rather than here. The capsule is now a 16px corner in `TabPill.tsx:47` (29
      importers) with `CLAUDE.md:106`'s radius row updated in the same commit. · verified on the
      real salon page through the tunnel: radius 16px, and the three other measured gaps applied
      with it (photo 62px, row star 18px, score 44px).

      The clutter diagnosis this file exists for is therefore closed too: the three causes it
      named were the capsule-everywhere rule, the 44px floor read as a paint size rather than a
      tap size, and a type row demanding more sizes than the type ceiling allows. The first is
      fixed above. The second and third are recorded here and in
      `_plans/PDP_PILL_STARS_HIERARCHY_2026-08-16.md`, and the hierarchy half shipped as the
      44px score. What is NOT done, said plainly rather than quietly dropped: the contradiction
      between `CLAUDE.md:101` mandating six to seven sizes and FLOORS LAW 7 capping them at four
      is still on the books, because reconciling it rewrites a locked row across every screen and
      that is a decision he has not been asked for yet.

## The gap this turn CLOSED rather than just naming

The comparison had one row reading "not captured": Airbnb's own reviews screen, which is the
one control he complained about ("the neuste or yk the sort"). WHY it was absent, searched
rather than assumed: all eight Airbnb captures under `_design-system/references/` cover home,
profile, search chrome, category switch, icons and fonts; a grep for review/bewert across that
folder returns nothing, `REMOVED.md` has no entry, and `git log --all` finds no such file on
any branch. So it is reason 3, NEVER LANDED: no round ever needed that screen until now.
The fix follows the reason, so the capture is running.

## MEASURED, on the live page at 390x844, 2026-08-15

The screen he screenshotted: `/de/salon/cuts-and-culture/reviews`.

| what | ours, measured | Airbnb, measured | source |
|---|---|---|---|
| rounded elements that are full capsules | **14 of 17, 82%** | dominant radius **20px across 100 elements**; capsule kept for the ONE search field | `airbnb--home-mobile.md:41,44` |
| distinct type sizes in one viewport | **7** (30, 20, 17, 15, 14, 13, 12) | a real scale: 10, 11, 12, 14, 16, 18, 22, 26, 32, 40+ | `AIRBNB_SYSTEM_VS_OURS.md` 2c |
| of those, how many sit inside a 5px band | **5** (12, 13, 14, 15, 17) | their steps are 2, then 2, then 4, then 6 and up | same |
| letter-spacing values in one viewport | 4 | **`normal` on every single tier**, one opt-in exception | same |
| weight values in one viewport | 400 / 500 / 600 | book / medium / semibold, three named ramps | same |
| share of text at weight >= 600 | 14%, which PASSES our own 30% ceiling | 3.1% on their PDP | `CLAUDE.md` FLOORS LAW 7 |
| the sort control | 108 x 44px box on 13px text, ratio **3.38** | not captured; see NOT MEASURED | ours: live `getComputedStyle` |

## THE CAUSE, and it is our own written rules, not sloppy code

**1. "Pills everywhere" is `CLAUDE.md` line 106, the radius row.** It ends `button/chip pill`. So
every button and every chip in the system is a capsule by law. Line 97 then routes every option
through one component: *"The TabPill treatment, used for every pill/chip/option"*, and line 115 adds
the filter pill. `TabPill.tsx` renders `rounded-full` at both sizes, and 29 files import it. Nothing
here is a mistake; the screen is doing exactly what it was told. Airbnb's radius scale, measured, is
4/8/12/16/20/24/28/32 and contains no pill at all: their capsule is reserved for the single search
field, which is why it reads as one special object instead of wallpaper.

**2. "Too big" on the sort control is `CLAUDE.md` line 114**, the 44px touch floor, applied to the
VISIBLE box instead of to the tap area. A 13px label in a 44px capsule is a box 3.38 times its own
text. The floor is an accessibility minimum for the TAP TARGET, and it is satisfied just as well by
a smaller drawn control with invisible padding around it. Nothing in the rules ever said the paint
has to be 44px tall; that was my reading of it.

**3. The flat-but-busy feeling is `CLAUDE.md` line 101, the text-size row, against FLOORS LAW 7c.**
The row locks name 14, meta 12, H2 18-20, body 14, CTA 15, eyebrow 11, plus a display anchor of 28+.
That is SIX to SEVEN distinct sizes mandated by the contract, while the type budget ceiling is FOUR.
**The contract requires more sizes than the ceiling permits, and both are law.** The measured result
is the exact failure FLOORS LAW 7c names by hand: *"size variety is not range: breaking the 4-size
ceiling while every size sits within ~6px is the worst case, it costs consistency and buys no
hierarchy."* Five of our seven sizes sit within 5px, so the screen pays for seven sizes and gets the
hierarchy of one.

**It is NOT the bold share.** That measured 14%, comfortably under our own 30% ceiling, so the usual
suspect is innocent here and I am not going to pretend otherwise.

## THE CAPTURE CAME BACK AND IT CORRECTS ME ON TWO POINTS

`_design-system/references/airbnb--reviews.md`, written 2026-08-15 from their reviews screen at
390x844 on a real listing. Before this, every "Airbnb" number above came from their HOME screen,
because their reviews screen had never been captured. Two of those rows were wrong, and they were
wrong in the direction that matters, so they are corrected here rather than quietly left standing.

**WRONG 1. "They keep the capsule for one thing, the search field."** That is true of their home
screen and false of this one. Their sort control is `border-radius: 9999px`, a full capsule, and
about HALF of the rounded elements on their reviews screen are capsules. The finding survives but
shrinks: ours is 82% against their ~50%, which is still nearly double, and is no longer "they never
do this".

**WRONG 2, and this one reverses.** I told him a 44px box around 13px text was too big. THEIRS IS
48px around 12px, a ratio of 4.0 against our 3.38. By the reference, our sort control is already
TIGHTER than Airbnb's. Shrinking it is his taste, which is a completely legitimate reason, but it is
not "make it like Airbnb" and he was about to be told it was.

**Also his instinct, not theirs: the filter counts.** He called them clutter. Every one of Airbnb's
ten topic chips carries a count ("Location 95", "Hospitality 95"). Worth doing if he wants it; worth
not pretending the reference asked for it.

**WHAT SURVIVES, and is now much better evidenced:**
- **The capsule share.** 82% against about half.
- **The flatness, and this is the real one.** Their type runs 10px to 72px on one screen, a range of
  7.2x. Ours runs 12px to 30px, 2.5x. We both use SEVEN distinct sizes, so the count was never the
  problem and my "seven against a ceiling of four" framing was aimed at the wrong number. What
  differs is the SPREAD: five of our seven sit inside a 5px band, against two of theirs. That is
  exactly FLOORS LAW 7c, and their 72px anchor is the thing our 30px one is imitating at a quarter
  of the size.
- **The bold share.** 14% against their 5 to 6%.

**One more that goes his way and I did not expect:** they have NO star-rating filter at all. Their
5/4/3/2/1 is a static distribution chart, not a control. So his instinct to strip that row is more
Airbnb than keeping it, just not via the counts.

**A conflict between two of our own references, flagged not resolved:** the Fresha reviews capture
used earlier today says there is NO divider between review rows, and we removed ours on that basis.
Airbnb's has one, 1px at `rgb(235,235,235)`, with 60px between rows. Two references, opposite calls,
same element. His to settle if it ever matters.

## THE MOST AIRBNB-FAITHFUL MOVE IS ONE HE ALREADY KILLED, and his reason still holds

Their reviews screen has no star filter. The 5/4/3/2/1 is a static distribution chart you cannot
tap. So the literal "make it like Airbnb" answer is: replace our star chips with a chart.

**`REMOVED.md:95` says he killed exactly that on 2026-07-24.** The ink-filled rating-distribution
bars in the Filter-by block, removed because they "read monochrome/too black and imply a
distribution worth reading that 16 reviews do not have". He picked F2, chips WITH counts, instead,
which is what ships today.

So it is not proposed here, and the graveyard rule says it does not get re-proposed without his yes.

**AND HIS OWN REASON DEFEATS THE REFERENCE ON THIS ONE.** The Airbnb listing that was captured has
141 reviews. Cuts & Culture has 16. A distribution chart over 16 reviews is a chart of almost
nothing, which is precisely the objection he raised a month ago. Copying Airbnb here would be
copying a solution to a problem we do not have yet.

**ONE THING DID REVERSE, and it is his to reverse.** On 2026-07-24 he picked chips WITH counts. On
2026-08-15 he said the counts are clutter. That is a straightforward change of mind on a settled
call, not a contradiction to argue with, and it is recorded here so the next round reads the newer
decision rather than the older one. What has NOT changed: chips over bars.

## NOT MEASURED, said plainly rather than guessed

- Airbnb's own sort control. Their reviews screen was never captured, so the replacement size on
  `/en/dev/calm` is derived from their measured 20px radius and their 16px body tier, not copied
  from a control I have actually seen. If he wants it exact, that capture is the next step.
- Fresha. He named it second ("etc fresha too"). The Fresha reviews capture we have is the one used
  earlier today for the review rows; it has no sort control and no filter chips in frame.
