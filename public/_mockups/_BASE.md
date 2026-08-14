# _BASE , the on-phone mockup foundation (owner-mandated 2026-07-21)

## WHAT A MOCKUP IS, and it had to be written down because I kept shipping things that were not one (owner 2026-08-12)

**Owner, verbatim:** *"what part of mock up do you not fucking understand? ... What is this all fifty
one? What is that? That is not a fucking mock. No. Refine the definition of a mock up because you're
pissing me the fuck off. Harden the fucking gate."*

He had asked for mockups. I gave him three desktop comparison pages with paragraphs of reasoning
beside them, and a list of fifty-one findings. None of those is a mockup, and the reason none of
them is a mockup is the definition below, which did not exist in writing before today.

**A MOCKUP IS A SCREEN HE LOOKS AT ON HIS PHONE.** Nothing else. It is the proposed state of one
real screen, rendered full-bleed at 402 CSS px, so that opening the link on his phone shows him what
the app would look like. He judges it by looking.

**Six things a mockup MUST be:**

1. **Full-bleed.** The body is the screen. No desktop page wrapper, no `max-w-[1240px] px-5 py-10`,
   no site header or footer around it. The no-fake-phone rule already said this and it still holds.
2. **One screen at a time.** A before and after is one screen with a toggle, never two panes side by
   side on a wide page. He is on a phone; side by side means both are too small to judge.
3. **Silent.** No explanatory paragraphs, no measured-numbers block, no cost lists, no findings, no
   tables. The reasoning belongs in the commit message and the plan file. If the screen needs a
   paragraph to be understood, the screen is the problem.
4. **The real thing.** Real components, real data, real photography, the real route where possible.
5. **Judged by looking**, which means it must render correctly at 402 wide on a phone, not merely
   contain the right values.
6. **Reachable in one tap** from the link handed over.

**Four things that are NOT mockups, all of which I have called one:**

- a comparison page with prose beside it (screens 1 to 3 of the Airbnb loop, 2026-08-12)
- a list of findings, however well measured (`/dev/airbnb-findings`, same day)
- a document, a table, or a plan file
- a desktop layout containing phone-width iframes

Those artefacts are allowed to exist and some of them are useful. They are just not what the word
means, and handing one over when he asked for a mockup wastes his turn.

**Enforced by** `~/.claude/hooks/mockup-must-be-a-screen-gate.py`: a Stop message that calls
something a mockup while the turn wrote a dev page carrying a desktop wrapper, explanatory prose, or
a side-by-side pane layout is blocked before he ever reads it.

> **SCOPE NARROWED 2026-08-07 by owner decision 17: this file governs STATIC mockups only.**
>
> New mockups are REAL PAGES under `app/[locale]/dev/`, not standalone HTML here. He asked "if we
> aren't using HTML, what are we even using?" and chose real pages, because a standalone copy cannot
> be tapped, has no animation, and goes stale the moment the real screen changes.
>
> The 253 files in this folder still render and this file still governs them. It is no longer the
> law for new work. The phone-geometry rules below (402 width, no drawn phone frame, word-width font
> sizing, real self-hosted photos, no remote assets) still apply to anything static.
>
> Written at the top rather than in a plan file, because a scope change nobody reads is not a scope
> change: **98 files in this folder still load a remote font or CDN script this file banned on
> 2026-07-21**, which is what happens when the rule lives somewhere else.

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
