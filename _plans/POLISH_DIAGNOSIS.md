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
- [x] A7. Answer "why EVERYWHERE, not one screen". `verified:` **CI enforces every code rule and zero design rules.** `npm run gate:floors` exists and genuinely fails a run, but is wired into no workflow and no hook, appearing only in `package.json` and planning docs. Meanwhile typecheck, lint, audit, tests, i18n parity, token sync and secret scanning are all hard failures in `.github/workflows/quality.yml`. So a type error cannot survive a day and a design-floor violation survives forever.
- [x] A8. Use SUBAGENTS. `verified:` three dispatched, one per lens, each briefed with the measured numbers rather than asked to re-measure.
- [x] A9. Use a COUNCIL for opinion. `verified:` three distinct lenses (typography and rhythm, alignment and geometry, chrome and restraint) so the verdicts are independent rather than one agent agreeing with itself.
- [x] A10. The new screenshot attached. `verified:` it is the Airbnb account-settings list, scrolled further than the earlier capture. PIL pixel-sampled this turn: **icon left 79px = 26.3pt** (spread 74..80), **label left 194..196px = 65.3pt** (spread 2px across 9 rows). Those two numbers are what produced A4's fix and the fixed-icon-column rule.

## The council's verdict, all three lenses in

All three converged on one shape: **the rules are right, they are written down, and nothing applies them.** Not a taste problem.

- [x] B1. **Geometry lens.** `verified:` the estate's real spacing law is three values (Section 32 / Group 16 / Card 12), and LOCKFILE line 598 already names `mt-5/mt-6/mt-7` as the drift signal to grep for. Our measured gaps are **17, 20, 28**. 20 is `mt-5` and 28 is `mt-7`, the two exact classes already flagged, and **17 is not a multiple of 4 at all**, so it is off the grid entirely rather than merely drifted. Its column rule: 26px inset, 44px slot, label fixed at 70px, with the 22px icon centred in the slot so a 44px thumbnail and a 22px icon never move the text. Two independent sources landed on 26px (the reference measurement and the container test written today), which is the strongest evidence in the audit.
- [x] B2. **Restraint lens**, on how the product is cluttered AND unfinished at once. `verified:` they are not contradictory, they are two opposite failures in one flow. The profile hub has 0 containers (clean to the letter). Settings has a bordered card AND a hairline per row (doubled chrome). A user does not experience that as two diagnoses; they experience one impression, that nothing was finished to the same standard. The chevron fails both ways in a single element: a container that should not exist around an affordance that should be visible and is not.
- [x] B3. **The chevron verdict: FIX it, do not delete it.** `verified:` the reference keeps its chevrons legible, so deletion is not what produces polish. And once the card goes, the chevron becomes the only remaining signal that a row is tappable, so deleting both leaves thirteen rows of plain text with no affordance, which is the wireframe failure FLOORS LAW exists to stop. The token `#6B6B6B` is intact in `tailwind.config.js`; the spec was right and the render broke it.
- [x] B4. **The estate-wide mechanism, and this is the biggest find.** `verified:` the invisible chevron is not a one-off. `text-s-ink/<opacity>` is a live authoring pattern in **55 files**, and the illegible band alone is **251 instances**: 13 at `/20`, 102 at `/30`, 136 at `/40`. Composited on white those render **1.57:1, 2.03:1 and 2.71:1**. Every one fails WCAG AA body text (4.5:1) and every one fails even the large-text floor (3:1). The correct token, `s-ink-2` #6B6B6B, is 5.33:1 and passes. So each time someone reaches for `/30` instead of the token, another signal silently vanishes, which is precisely "looks unfinished, everywhere".

## Outstanding
- [ ] B3. Owner decision, after B1 and B2 land: arm `gate:floors` in CI. This is the structural fix from A7 and it is the one change that stops the whole class from recurring. It is a decision rather than a chore because arming it will FAIL the build on existing surfaces until they are swept, so the owner has to choose between a red build and a staged allowlist.

## Named non-goals

Not chasing Airbnb's published spacing or type scale: verified this turn that **no such published scale exists**. Their own writing carries zero spacing values and exactly one type token (24px size / 32 leading), and independent third-party reconstructions disagree on the base unit (one rebuilds 8px, others 4px). Every number adopted here is measured off their shipped app and is therefore Solen's own decision, never a claim of matching.

Not touching the centred PDP title or the coloured pill CTA seen in the reference: both conflict with decisions the owner has already locked, and a screenshot is not grounds to overturn them.
