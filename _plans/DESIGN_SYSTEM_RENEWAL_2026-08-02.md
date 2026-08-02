# DESIGN SYSTEM RENEWAL , owner dictation 2026-08-02, 22:2x

Owner verbatim, the load-bearing parts: *"what is this design system? We need to actually renew the
design system because this is not okay... why is the notification and also the hamburger still
accessible?... it's all grouped, grouping is okay, but I don't like how it's inside of this fucking
weird box thing. And also, yeah, I want there to be lines... I don't also appreciate how there is
this weird gray and gray thingy, and instead of that, there's this icon. It just looks overall
really really ass and not polished. And also how these texts are so small... I'm gonna attach a
screenshot that I like... five screenshots in the download folder... It's all from ten twenty four
PM today. So go actually analyze and make a new mockup based on that. And we are going to renew
the design system, bro."*

REFERENCE FILES, located and confirmed on disk: `~/Downloads/IMG_6900.PNG` ... `IMG_6904.PNG`,
all stamped 2026-08-02 22:22-22:23. IMG_6900 read directly and it is **Airbnb's Profile screen**.

## What IMG_6900 actually shows (read, not recalled; the other four still to be measured)

- Rows sit DIRECTLY ON WHITE. No card, no container, no rounded box, no fill behind the row.
- The icon is a BARE OUTLINE GLYPH on white. There is no grey rounded tile behind it. This is
  precisely the "weird gray and gray thingy" he named.
- Row labels are LARGE and regular-weight black. Ours are 15.5px medium.
- A thin chevron sits at the far right edge.
- NO sublines under the labels. Ours carry one on nearly every row.
- ONE full-width hairline separates GROUPS. Rows inside a group are separated by whitespace, not
  by a line each.
- The bell is a circled icon top-right on THEIR profile, so his "why is the notification still
  accessible" is about OUR chrome, not a copy of theirs. Resolve by asking what the profile's job
  is (FLOORS LAW 10), not by copying Airbnb's bell.

## Atomic asks

- [x] **A1. MEASURE all five screenshots.** DONE , `_design-system/references/airbnb--profile-list.md`.
      pixel-spec-auto ran on all 5, failed on all 5 (borderless, as predicted) with FAILED.md as
      proof; every number after that is direct PIL pixel-sampling with the method named beside it.
      Scale verified per-image (all 5 are 1206x2622 = 402x874pt @3.0x, not assumed from one file).
      Found TWO distinct row recipes, not one (icon nav list: 56.0pt pitch exactly, zero divider
      between rows, one #EBEBEB hairline per group-end, bare untiled icons, 11.7pt label; text
      detail list: divider after every row, 14.7pt label, black underlined link instead of a
      chevron, subline on every row). Two divider instances measured #DDDDDD against five at
      #EBEBEB in structurally identical positions , reported as an unresolved measured
      inconsistency, not smoothed to one value. "vs ours" table reads AccountHub.tsx live (current
      state is a bordered `divide-y rounded-[24px]` card with 38px icon tiles, already past the
      stale placeholder numbers this task started from).
- [ ] **A2. The box goes.** Rows render on white with no container.
- [ ] **A3. Lines, not boxes.** A hairline between GROUPS. Confirm from A1 whether Airbnb also
      rules between rows inside a group, and follow the measurement, not my reading of one image.
- [ ] **A4. Kill the grey icon tile.** `bg-s-bg-sunken` 38x38 `rounded-[14px]` behind every glyph
      is the grey-on-grey he named. Bare Lucide outline on white instead.
- [ ] **A5. Text up.** Ours: label 15.5px/500, subline 13px. Raise to the measured reference size.
- [ ] **A6. The bell and the hamburger on /profile.** He asked why they are still reachable there.
      Decide against the screen's job, then remove or keep with a stated reason. Do not just delete
      (unrequested-removal rule), but do not ignore the question either.
- [ ] **A7. New mockup** built from A1's numbers, on the real page copy, at 402 per `_BASE.md`.
- [ ] **A8. RENEW THE DESIGN SYSTEM.** The broadest ask and the one most likely to be quietly
      dropped. Scope it explicitly before building: which of `SOURCE.md` / `LOCKFILE.md` rows this
      changes (row treatment, list anatomy, icon treatment, type scale), and what it does NOT touch.
      A change to the list-row recipe is a change to every grouped list in the product, not just
      this screen.

## PREMORTEM (devil's-advocate gate, before dispatch)

Top 3 ways this goes wrong:
1. **Eyeballing the reference.** The single largest recurring failure in this repo, and the
   NEVER-AGAIN floor 5 gate exists for it. Airbnb rows are borderless, so auto-detection will
   likely fail and the fallback (PIL sampling) MUST run rather than someone guessing "looks like
   56px".
2. **Treating this as a /profile-only reskin.** He said renew the DESIGN SYSTEM. Changing the row
   recipe on one screen and calling it done reproduces exactly the inconsistency FLOORS LAW 8 was
   written about.
3. **Copying Airbnb wholesale.** Their profile is a settings list; ours carries live values
   (next booking, stamp progress, voucher count). Deleting every subline to match the reference
   would delete real information. The structure is the reference, the CONTENT is ours.

Load-bearing unknowns, cheapest probe first:
- Does Airbnb rule between rows inside a group, or only between groups? -> PIL sample IMG_6900's
  divider rows. Changes the whole list anatomy.
- What are the other four screenshots? Possibly other surfaces, which would widen A8's scope a lot.
  -> read them, cheapest possible probe, do it first.

OUT of scope until he says otherwise: the homepage, Inspo, the booking flow. This is the account
surface plus whatever system rows A8 legitimately touches.
