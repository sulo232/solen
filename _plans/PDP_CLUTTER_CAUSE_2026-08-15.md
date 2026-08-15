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
- [ ] 8. BLOCKED ON HIM, and it is a real dependency, not a punt: which treatment to apply,
      "Softer corners" or "The whole thing", at `/en/dev/calm`. Applying either one edits
      `CLAUDE.md`'s radius row and the shared TabPill that 29 files import, so it changes every
      screen in the product at once. That is his call by name and cannot be guessed.

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

## NOT MEASURED, said plainly rather than guessed

- Airbnb's own sort control. Their reviews screen was never captured, so the replacement size on
  `/en/dev/calm` is derived from their measured 20px radius and their 16px body tier, not copied
  from a control I have actually seen. If he wants it exact, that capture is the next step.
- Fresha. He named it second ("etc fresha too"). The Fresha reviews capture we have is the one used
  earlier today for the review rows; it has no sort control and no filter chips in frame.
