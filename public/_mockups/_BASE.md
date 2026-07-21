# _BASE , the on-phone mockup foundation (owner-mandated 2026-07-21)

Every Solen mockup is judged ON the owner's real phone (iPhone 16 Pro, 402x874pt, 3x). This is the
standing base so any reference copy or mockup renders CORRECT there. It exists because two failure
modes kept shipping: sizes measured wrong (fixed by the measure protocol below) and pages that were
right in a desktop browser but wrong on the phone (fake frames, browser-chrome collisions, grey
wireframes that read "off").

## The device constant

- Design width = **402 CSS px** (1206 device px / 3). A 3x iOS screenshot converts to CSS px by **/3**.
- The page is FULL-BLEED: the body IS the screen. No drawn phone frame, no fake status bar
  (no-fake-phone-gate enforces; graveyarded 2026-07-21).

## The measure protocol (reference -> mockup)

1. **Boxes** (tiles, cards, pills, avatars, gaps, margins): PIL-measure the reference, /3 -> CSS px.
2. **Text**: NEVER size by glyph height (it swallows underlines + descenders, ships ~30% big).
   Size by **word width**: measure the reference word's width /3, probe the same string at 100px,
   `font = 100 * refWidth / probeWidth`. (mockup-width-calibration-gate enforces.)
3. **Coverage**: EVERY element gets measured , unmeasured values get guessed desktop-big
   (+15-50% on record). Ship only after a **full-diff**: getBoundingClientRect on the render at
   402x874 vs every reference target, all within ~3px. (same gate enforces.)

## The on-phone rules (why it looked right in Chrome and wrong on the phone)

- `<meta name="viewport" content="width=device-width, initial-scale=1">` , mandatory.
- `html{-webkit-text-size-adjust:100%}` , iOS Safari otherwise auto-inflates text.
- Fixed bottom bars: `padding-bottom: env(safe-area-inset-bottom)` and expect Safari's URL bar ,
  verify the bottom of the page ON the phone, not only in a desktop viewport.
- Page height: `min-height:100dvh` (not 100vh) so Safari's collapsing chrome doesn't lie.
- **Real imagery, self-hosted**: grey boxes make correct geometry read wrong (rich-not-bland law).
  Use `/_mockups/_assets/salon-photos/pNN.jpg` (12 product-seed photos, self-hosted). A pure
  geometry probe may use grey ONLY with an explicit `geometry-only` marker in the file.
- No remote (http/https) images, fonts, or CSS in a mockup , self-hosted only, so the tunnel
  page never depends on a third party. (mockup-base-gate enforces.)

## The verify ladder (in order)

1. Full-diff at 402x874 in the browser (boxes + word widths), 0 fails.
2. Screenshot at 402 wide , squint check.
3. THE FINAL JUDGE: the owner's phone screenshot vs the reference screenshot, SAME PIL instrument
   on both (they are both 1206-wide 3x shots, so numbers compare 1:1). That diff settles what a
   desktop browser can't (Safari chrome, text-size, rendering).
