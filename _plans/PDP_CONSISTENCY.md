<!-- batch: owner 2026-07-25, PDP reviews/date/buttons consistency + portfolio overflow + scroll motion -->
# PDP consistency + motion , owner batch 2026-07-25

## Readback (6 asks)
1. Review DATES are too detailed. Today: "Do., 11. Juni 2026 um 18:07". Wanted: "11. Juni 2026" , no weekday, no time.
2. The REVIEWS SECTION is inconsistent across surfaces (PDP section, the see-all full page, and the STYLIST profile page) and does not follow the design system. Needs to be ONE system.
3. Too many BUTTON variations for the same job (book / select / choose). The team section's select in particular does not align.
4. PORTFOLIO overflow: when there are more than 9 photos, the 9th (last visible) tile carries a "+N" overlay, bottom-right.
5. SCROLL MOTION: a frosted, condensing top bar like X/Twitter.
6. More animation generally, "be simple".

## Reference CAPTURED (not described from memory)
`/Users/sulo/solen/screenshots/ScreenRecording_07-25-2026 15-43-36_1.mp4` (5.15s, today 15:43), 10 frames
extracted at 2fps to scratchpad/rec/. It is the X profile of @60fpsdesign being scrolled. Observed behaviour:
  - t=0.0 top bar is minimal over the banner: back arrow + actions only, no title.
  - t=1.5-2.0 as content rises, the bar gains a TRANSLUCENT FROSTED background; content is visibly blurred
    THROUGH it rather than being clipped by it.
  - t=3.0+ the bar CONDENSES: the profile name plus a secondary stat ("60fps" / "4.5K posts") slides INTO
    the bar, and a compact primary action ("Follow") appears on the right.
  - The transition is scroll-linked and continuous, not a binary snap at one threshold.

## Boxes
- [ ] C1. Review date format -> day + month + year only, every surface that renders a review date.
- [ ] C2. Reviews SYSTEM: one review-row component + one summary grammar shared by the PDP section, the full reviews page, and the stylist profile page. Audit first, name every divergence, then unify.
- [ ] C3. BUTTON audit: enumerate every book/select/choose variant in the customer surfaces, then ONE rule per job (mockup, owner picks).
- [ ] C4. Portfolio overflow "+N" on the 9th tile, bottom-right.
- [ ] C5. Scroll motion: frosted condensing top bar, built from the CAPTURED reference above, scroll-linked not threshold-snapped.
- [ ] C6. Motion pass beyond C5, kept simple.
