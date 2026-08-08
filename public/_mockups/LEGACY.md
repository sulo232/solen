<!-- exists-check: extends public/_mockups/_BASE.md, which already carries the scope-narrowing
     header from owner decision 17. Net-new only in that _BASE.md says what the RULES now cover,
     and nothing said what these 253 FILES now are. Read _BASE.md first; it still governs them. -->

# LEGACY , the 253 standalone mockups in this folder

**These files are legacy. They are not deleted, they still open, and they are still the record of
what was proposed and approved. They are simply not where new work goes.**

Owner decision 17, 2026-08-07: new mockups are REAL PAGES under `app/[locale]/dev/`. His question
was *"if we aren't using HTML, what are we even using?"*, and the answer he picked was real pages,
because a standalone copy cannot be tapped, has no animation, and goes stale the moment the real
screen changes.

## What that means in practice

- **Do not add a file here.** A new mockup is a route under `app/[locale]/dev/`.
- **Do not update a file here** to reflect a change in the product. It will drift again the same
  week. Change the real screen, or build the dev route.
- **Do read them.** When a screen was approved, the file that was approved is in here, and that is
  worth more than a summary of it.
- `_BASE.md` still governs anything static that genuinely has to be built here: 402 wide, no drawn
  phone frame, text sized by word width, real self-hosted photos, nothing loaded from another site.

## Why they are kept rather than deleted

Deleting them would destroy the only record of what he actually said yes to, and a rejected
direction is as useful as an approved one, which is the whole reason `_design-system/REMOVED.md`
exists. The cost of keeping them is that they look current when they are not, and that is what this
file is for.

## The honest state of them

**96 of these files load a font or a script from another site**, which `_BASE.md` banned on
2026-07-21. (Counted 2026-08-08 by scanning them; the "98" quoted in `_BASE.md` was close but was
never recounted, and a number nobody re-derives is how a wrong one survives.) That was never swept,
and it is not being swept now, because sweeping 96 legacy files
that no longer receive work is effort spent on the past. It is written down here so that the next
person who opens one and finds it broken offline knows why, rather than treating it as a new bug.
