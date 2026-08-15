# Home: continue-search card + recently-viewed (2026-08-15)

Owner message, verbatim:

> There is a big size difference between the screenshot Airbnb reference and ours. So fix that.
> And, also, I told you about a new mocks... mock ups in direction based on other websites and apps.
> And I recently viewed, we didn't do anything for that. So harden the case so you actually listen to
> me. And the read back that you first do the read back before you actually start doing anything. Okay?

## Atomic boxes

- [x] **A1. Measure the Airbnb reference** at scale, both screenshots, PIL, not eyeballed.
- [x] **A2. Measure our live page** with getBoundingClientRect at the same normalised width.
- [x] **A3. Produce the size-difference table** naming every element that is off and by how much.
- [ ] **A4. Fix the size difference: see-all arrow.** Ours 41.9pt normalised vs 27.0pt measured. +55%.
- [ ] **A5. Fix the size difference: continue-card photo width.** Ours 87.6pt vs 66.6pt. +32%.
- [ ] **A6. Fix the size difference: continue-card photo orientation.** Ours 1.24:1 landscape, the
      reference is 0.87:1 PORTRAIT. This is a shape change, not a size change, so it is its own box.
- [ ] **A7. Fix the size difference: category pill icon.** Ours 22.9pt on the real page (18.1pt in the
      mockup) vs 13.9pt measured.
- [ ] **A8. Fix the size difference: row gutter.** Ours 15.2pt vs 23.6pt measured.
- [ ] **A9. Surface the touch-target collision.** A 27pt circle is below the 44pt touch floor in our
      own design contract and in WCAG 2.5.5. Tier 2 outranks a taste source, so the visible circle
      shrinks and the tap target stays 44. Do not silently ship a 27pt tap target.
- [ ] **B1. Recently-viewed: build it.** Nothing on our homepage renders it today. Measured this turn:
      `recentlyViewedOnPage: NO`, and the 11 h2 sections contain no such row.
  - [ ] B1a. Measured anatomy from the reference: thumb 106.1 x 100.7pt, ratio 1.05:1, gap 11.4pt,
        pitch 117.5pt, left gutter 23.6pt, heart badge ~14pt, header arrow 27pt.
  - [ ] B1b. Wire it to a real source (a viewed-salon history), never fabricated rows.
  - [ ] B1c. Answer the cold-start hole the reviewer raised: a brand-new visitor has no history, so
        the row must have a defined absent state rather than rendering empty.
- [ ] **C1. Direction mockups sourced from OTHER apps, not Airbnb.** Captured, never recalled.
  - [ ] C1a. Capture the real screens (Mobbin), do not build a named reference from memory.
  - [ ] C1b. At least 3 distinct directions, each named to the app it came from.
  - [ ] C1c. Each direction covers BOTH surfaces: the continue card and the recently-viewed row.
- [ ] **D1. Harden: readback-before-work.** He asked for the readback to come FIRST, before any tool
      call, and for the case to be enforced rather than remembered.
- [ ] **D2. Pay for the harden** (build-one-retire-one / fix-existing / delete-only / neither-with-a-reason).

## Measured, this turn

Scale anchor: the iOS home indicator is 139pt wide and measures 330px in the reference, so
2.3741 px/pt, and the screenshot is a 387.5pt phone (390pt class). Ours is normalised by x0.952.

| element | Airbnb, measured | ours, raw | ours, normalised | delta |
|---|---|---|---|---|
| continue card | 301.2 x 104.9pt, 2.87:1 | 321 x 104 | 305.6 x 99.0 | width +1.5%, height -5.6% |
| card photo | 66.6 x 76.2pt, **0.87:1 portrait** | 92 x 74, 1.24:1 | 87.6 x 70.4 | **+32% wide, orientation flipped** |
| see-all arrow | **27.0pt** | 44 | 41.9 | **+55%** |
| category pill icon | 13.9pt | 24 real / 19 mockup | 22.9 / 18.1 | **+65% / +30%** |
| category pill height | ~51pt | 40 | 38.1 | -25%, ours is smaller |
| recently-viewed thumb | 106.1 x 100.7pt, 1.05:1 | absent | absent | **missing** |
| row left gutter | 23.6pt | 16 | 15.2 | -36% |
| search pill | 347.5 x 54.8pt, gutter 19.8pt | | | |

Method note: the page background is not white. It is grey #F0F0F0 in the card rows and near-white
elsewhere, which broke the first three detection passes and merged every thumbnail into one run.
Content is detected by saturation plus luminance, not by "darker than white".
