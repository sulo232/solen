# The four things in the 2026-08-12 message: keyboard height, calendar, tapped date, home bar

Owner, with two of his own screenshots: "okay why when on keyboard wo why when expanded no full oage
on the bottom yk like sheet is not long enough and wann calender is not fully all visable yk and
tapped is blue it should be black and scrolled down why is the search bat collapsed in homepage yk"

Then, with no text, his own Airbnb capture of the same calendar step (IMG_7118).

## Readback

1. Wo?, keyboard up: the sheet stops short of the bottom.
2. Wann?: the calendar is not fully visible.
3. The tapped date is blue and should be black.
4. The home search bar collapses when the page is scrolled.

## The reference for item 2, MEASURED off his own capture with PIL, not eyeballed

Screen 402x874pt. Sheet top edge 146.0. Card bands at 146.0-205.7, 222.0-295.7, 375.3-494.3,
505.0-543.0, 551.7-594.7, 595.3-700.7, 715.0-746.7. So the When card runs to about 747 and the whole
month, all six rows, is on screen with nothing to scroll. Their sheet starts at 17% of the screen and
the calendar owns roughly 590pt of it.

## Boxes

- [x] **3. Tapped date black.** DONE, commit 0cb12ca7e. It was the accent blue. Measured after:
      background rgb(10,10,10), numerals white. Carries a `selected-ok:` note, because a black
      selected state is normally refused by the gate and this one is his literal instruction.
- [x] **4. Home search bar keeps its height.** DONE, commit 0cb12ca7e. It swapped 64 to 44 and
      dropped its shadow on scroll. The swap is deleted. Measured 64 at rest and 64 after scrolling
      to y=600. The scroll state itself stays, it still drives the shadow.
- [x] **2. The whole month on screen.** DONE, commit 0cb12ca7e. Ours gave the calendar a 234pt
      window onto 300pt of month, so it cut through the middle of a row, which is what his shot
      shows. The date step now LIFTS the sheet's top instead of leaving it where the other steps
      want it, clamped at the same floor every other step respects, and multiplied by the date
      step's own progress so no other step moves. Measured after at 402x780: sheet top at 8% of the
      screen (his reference sits at 17% on a taller screen), the month's scroller 331 tall with 331
      of content so there is nothing left to scroll, every day 1 through 31 rendered above the fold,
      Suchen still visible under it.
- [x] **1. The sheet reaching the bottom with the keyboard up.** DONE, and the cause is in this
      file rather than anything about iOS. `topFor` ends in `+ vvOffset` so the sheet's TOP follows
      the viewport the user can actually see when iOS scrolls it clear of the keyboard. The height
      was then computed as "layout bottom minus that top", which cancels the term and leaves the
      BOTTOM edge pinned to the layout viewport, so it renders exactly `vvOffset` above the bottom
      of what he can see. That is the gap in his screenshot. The bottom now carries the same term
      the top already had, which is what the K-A note directly below it always said it wanted.
      `vvOffset` is 0 with no keyboard and 0 in every desktop browser, so this is identity
      everywhere else, the same way the top's copy of it is.

      **HONEST LIMIT, stated rather than hidden:** I verified on desktop that the composed, open and
      focused states are unchanged (focused: sheet top 50, bottom 780 on a 780 viewport, gap 0) and
      the arithmetic is identity at `vvOffset` 0, so this cannot have broken anything I can see. I
      could NOT verify the fix on a real keyboard. The iOS Simulator would have done it and it is
      not usable on this Mac: Xcode is installed but not selected, and the fix needs his password.

        sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

      Whether `vvOffset` is the whole 100pt of his gap or only part of it is the one thing his next
      screenshot answers and I cannot.
