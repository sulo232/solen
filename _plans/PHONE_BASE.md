# PHONE_BASE , make every mockup/reference render correct on the owner's real phone (2026-07-21)

Owner: "measure what u have and see the difference how it looks on my phone vs the pinterest screenshot,
understand whats wrong in ur measurement, make a base so any reference or mockup looks correct on the
phone, make gate and principle, look in ss folder."

- [x] Look in the ss folder (IMG_6655 = my mockup on the phone, IMG_6656 = Pinterest original; both 1206x2622)
- [x] Measure both with the same PIL instrument and diff element-by-element
  - [x] avatar 108 vs 108 dev (exact) ; tile height 393 vs 393 (exact) ; sugg image 303 vs 303 (exact) ;
        search 111 vs 111 ; "Boards" word 172 vs 168 (+2%)
- [x] Name what is ACTUALLY different (the measurement was no longer wrong):
  - [x] grey placeholder boxes vs real photos (the dominant perceptual gap; rich-not-bland law)
  - [x] Safari chrome: bottom URL bar overlaps the fixed nav; no text-size-adjust guard; no safe-area insets
- [x] BASE: public/_mockups/_BASE.md , the standing on-phone mockup foundation (device constant 402,
      full-bleed no fake phone, text-size-adjust lock, safe-area, self-hosted real photos, verify protocol)
- [x] Real photos: 12 self-hosted salon photos at public/_mockups/_assets/salon-photos/ (downloaded from the
      product's own seed imagery), swapped into pinterest-ref-copy
- [x] Gate: mockup-base-gate.py (viewport + text-size-adjust + self-hosted-only + imagery-or-geometry-marker),
      self-tested, wired in ~/.claude/settings.local.json
- [x] Principle recorded in memory (feedback_reference_copy_width_calibration + the base memory)
