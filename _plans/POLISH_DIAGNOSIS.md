# POLISH DIAGNOSIS , why Airbnb reads finished and ours reads unfinished

**Owner, 2026-07-28 (voice):** *"what is it that makes Airbnb look so much more polished, and ours look so much worse, unpolished? Is it the font? Is it the text? The arrow is, the sizes between stuff is not correct, and also just a lot of clutter, and it's just not clean. The text is really a lot much more bolder, and it's not aligning with the icons and stuff. Overall everywhere in the website it looks unfinished. Help me diagnose and research everything using subagents, and also a council too, for opinion."*

Status: **ACTIVE**. Three council lenses dispatched; typography returned, geometry and restraint outstanding.

---

## The asks, atomised

- [x] A1. Kill the big "Profile" page title. Owner: *"we dont need this big profile fucking text, people already know that theyre in the profile."* `verified:` removed from both panes, graveyarded in REMOVED.md, and the anchor role moved to the section headings so FLOORS LAW 6 is not silently dropped. Commit `ca382c124`.
- [x] A2. Diagnose the arrow. `verified:` the chevron computes to `rgba(10,10,10,0.2)` = **1.57:1** on white while the source claims `text-s-ink-2` (#6B6B6B, 5.33:1). 13 on the settings route, 11 in the first viewport, every one `aria-hidden`. It has drifted to nearly invisible.
- [x] A3. Diagnose "the sizes between stuff is not correct". `verified:` measured vertical gaps 17 / 20 / 28px on one screen against a claimed 4pt scale. 17 is off-scale. Handed to the geometry lens for the full ranking.
- [x] A4. Diagnose "not aligning with the icons". `verified:` label started at **x=62 on icon rows and x=84 on thumbnail rows**, a 22px break, because a 44px thumb and a 22px icon both sat flush against the page padding. Reference holds **194..196px across nine rows, a 2px spread**. Fixed with a fixed 44px icon slot; measured spread now **0**.
- [x] A5. Diagnose "the text is really a lot much more bolder". `verified:` **56%** of visible text at weight >=600 on /profile against the estate's own **30%** ceiling. The PDP was previously measured at 86%.
- [x] A6. Answer whether the FONT is part of it. `verified:` no. Every failure is distribution of weight and size, not letterforms; 56% bold renders 56% bold in any typeface. The estate already ships Inter, the recognised stand-in for Cereal.
- [x] A7. Answer "why EVERYWHERE, not one screen". **CORRECTED 2026-07-28, my first answer was wrong and I told the owner it three times.** I said "CI enforces every code rule and ZERO design rules". `verified:` false. `.github/workflows/quality.yml` has 15 jobs and three of them are design-adjacent and enforcing: `visual` (Playwright visual specs), `lighthouse` (`npx lhci autorun`), and `motion` (`npm run gate:motion`, a WCAG 2.2.2 runtime probe). So design IS enforced in CI, just not the floors.

  **And the precedent is already in the repo, which is the more useful finding.** The `motion` job carries this comment at quality.yml:493-497: the check "was sitting as a manual `npm run gate:motion` nobody was forced to run, so a new auto-starting >5s loop got zero automatic scrutiny", and it had already "caught 8 animate-spin + 25 animate-pulse loops a by-hand audit missed sixfold". That is exactly the state `gate:floors` is in now, and somebody already made this exact move once and wrote down why. So arming floors is not a novel proposal needing an owner call, it is repeating a decision this estate has already taken and documented, using the same build-and-serve job shape.
- [x] A8. Use SUBAGENTS. `verified:` three dispatched, one per lens, each briefed with the measured numbers rather than asked to re-measure.
- [x] A9. Use a COUNCIL for opinion. `verified:` three distinct lenses (typography and rhythm, alignment and geometry, chrome and restraint) so the verdicts are independent rather than one agent agreeing with itself.
- [x] A10. The new screenshot attached. `verified:` it is the Airbnb account-settings list, scrolled further than the earlier capture. PIL pixel-sampled this turn: **icon left 79px = 26.3pt** (spread 74..80), **label left 194..196px = 65.3pt** (spread 2px across 9 rows). Those two numbers are what produced A4's fix and the fixed-icon-column rule.

## The council's verdict, all three lenses in

All three converged on one shape: **the rules are right, they are written down, and nothing applies them.** Not a taste problem.

- [x] B1. **Geometry lens.** `verified:` the estate's real spacing law is three values (Section 32 / Group 16 / Card 12), and LOCKFILE line 598 already names `mt-5/mt-6/mt-7` as the drift signal to grep for. Our measured gaps are **17, 20, 28**. 20 is `mt-5` and 28 is `mt-7`, the two exact classes already flagged, and **17 is not a multiple of 4 at all**, so it is off the grid entirely rather than merely drifted. Its column rule: 26px inset, 44px slot, label fixed at 70px, with the 22px icon centred in the slot so a 44px thumbnail and a 22px icon never move the text. Two independent sources landed on 26px (the reference measurement and the container test written today), which is the strongest evidence in the audit.
- [x] B2. **Restraint lens**, on how the product is cluttered AND unfinished at once. `verified:` they are not contradictory, they are two opposite failures in one flow. The profile hub has 0 containers (clean to the letter). Settings has a bordered card AND a hairline per row (doubled chrome). A user does not experience that as two diagnoses; they experience one impression, that nothing was finished to the same standard. The chevron fails both ways in a single element: a container that should not exist around an affordance that should be visible and is not.
- [x] B3. **The chevron verdict: FIX it, do not delete it.** `verified:` the reference keeps its chevrons legible, so deletion is not what produces polish. And once the card goes, the chevron becomes the only remaining signal that a row is tappable, so deleting both leaves thirteen rows of plain text with no affordance, which is the wireframe failure FLOORS LAW exists to stop. The token `#6B6B6B` is intact in `tailwind.config.js`; the spec was right and the render broke it.
- [x] B4. **The estate-wide mechanism, and this is the biggest find.** `verified:` the invisible chevron is not a one-off. `text-s-ink/<opacity>` is a live authoring pattern in **55 files**, and the illegible band alone is **251 instances**: 13 at `/20`, 102 at `/30`, 136 at `/40`. Composited on white those render **1.57:1, 2.03:1 and 2.71:1**. Every one fails WCAG AA body text (4.5:1) and every one fails even the large-text floor (3:1). The correct token, `s-ink-2` #6B6B6B, is 5.33:1 and passes. So each time someone reaches for `/30` instead of the token, another signal silently vanishes, which is precisely "looks unfinished, everywhere".

- [x] B5. `verified:` sha `2c28e5737` (icon 22->24, arrow 16->22) then sha `6609f8e5b` (the structural fix). **The element-by-element diff I had skipped.** Owner, correctly: *"did u acc analize all the difference between the mockup u made and airbnb screenshot, like what i can see rn is the icon and text and arrow all have diff sizes nd dont align."* I had measured row pitch, label start and hairline inset, and never diffed icon against text against arrow. Doing it exposed a methodology error first: I was comparing our SVG **boxes** to the reference's **ink**, which read the arrow as too large. Measuring glyph ink on both sides with `getBBox` reversed the finding.

  | element (ink) | ours before | reference | delta |
  |---|---|---|---|
  | icon | 20.1 x 20.1 | 20.7 x 22.3 | 10% shorter |
  | **arrow** | **5.3 x 9.3** | **6.7 x 12.7** | **27% SMALLER** |
  | label cap | 11.6 | 12.3 | 6% smaller |
  | arrow / icon | 0.46 | 0.57 | 19% off |

  Everything was undersized and the arrow worst by a distance, which is exactly what "all have diff sizes" describes. Boxes solved so the INK lands on the reference: icon 22 to 24, arrow 16 to 22.

  `verified:` sha **`2c28e5737`** (3 files, +40/-5). Precisely, since the two mockups express it differently: `public/_mockups/settings-airbnb-fs/index.html:95` carries `.ico{...width:24px;height:24px...}` and `:111` carries `.chev{...width:22px;height:22px...}`; `public/_mockups/profile-typescale-fs/index.html:120` carries the same `.chev` rule, while its two account icons are inline-styled at `:241` and `:247` (`width:24px;height:24px`) because that file wraps each icon in a `.slot` rather than styling a shared `.ico` class. Re-measured on the live page after the change with `getBBox` ink extents: icon ink **21.9**, arrow ink **7.3 x 12.8**, arrow-to-icon ratio **0.58 against the reference's 0.57**, label column count **1**, vertical centre drift **0** against the reference's 1.17.

- [x] B6. `verified:` sha `6609f8e5b`, `public/_mockups/settings-airbnb-fs/index.html`. **The structural miss, and the real answer to "still isn't correct".** Owner: *"Still isn't correct, bro. Like, what are you doing?"* They were right. I screenshotted my own render beside the reference for the first time instead of comparing numbers in isolation, then measured the reference band by band: `y 399-490 capH 91px = 30.3pt at x=74` is ONE page title, and every band below it is a row. **No large heading appears between rows anywhere on that screen.** My mockup had no page title and TWO invented 30px section headings, which were the largest elements present and chopped one list into two chunks. Fixed: headings to 13px meta, one 30px page title at the top.

  **The lesson, which matters more than the fix:** I measured row pitch, label start x, hairline inset, icon ink, arrow ink and every ratio between them, all correctly, and still missed that the screen was built to a different structure. Element measurements do not compose into a structural check. The whole render goes beside the reference FIRST, before any number is touched.

## Outstanding
- [x] B3. `verified:` ran `BASE_URL=http://localhost:50723 npm run check:floors` this turn; report at `_design-system/_geometry-report.md`. **I overstated this and should have measured before saying it.** I told the owner arming `gate:floors` would fail the build until surfaces were swept, implying a large migration and a staged allowlist. Measured, the default route set is **3 routes with 5 total failures**:

  | route | fails | what |
  |---|---|---|
  | `/de` | 1/6 | F2 imagery |
  | `/de/salon/old-town-barbers` | 1/6 | F7a weight share 32.14% vs 30% ceiling |
  | `/de/booking/lookup` | 3/6 | F6 anchor 21px vs 28, F7b ratio 1.56x vs 1.8, ELEVATION 0 distinct vs 2 |

  That is a morning of work, not a migration. `/de/booking/lookup` carries three of the five and is plainly the worst screen in the set. **The honest caveat: the checker's default list is only 3 routes**, so arming it protects those three plus whatever is added to the list, not all 203 pages. It is a real floor to stand on, not full coverage.

  **Revised recommendation: arm it, and fix the five.** The decision I framed as needing the owner's judgement did not need it once measured.
## Named non-goals

Not chasing Airbnb's published spacing or type scale: verified this turn that **no such published scale exists**. Their own writing carries zero spacing values and exactly one type token (24px size / 32 leading), and independent third-party reconstructions disagree on the base unit (one rebuilds 8px, others 4px). Every number adopted here is measured off their shipped app and is therefore Solen's own decision, never a claim of matching.

Not touching the centred PDP title or the coloured pill CTA seen in the reference: both conflict with decisions the owner has already locked, and a screenshot is not grounds to overturn them.
