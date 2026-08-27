# The ten answers, in one place (2026-08-27)

Workstream 81, step S5's last line. Ten design workstreams are ACTIVE and every single one is
waiting on ONE word or ONE look from him. They have been sitting in ten different rows in
`ACTIVE.md`, which is why nine of them have been open for weeks: nobody asks ten questions
spread across ten files.

**Both arms are decided and written for every one of them**, so no answer needs a follow-up
question and none of them needs him to explain his reasoning. One word each. Nine are a word;
the tenth is one look at his own phone.

They are ordered by how much moves when he answers, biggest first, so if he only answers three
they are the three worth answering.

---

## 1. The two greens (row 30, PDP)

`tailwind.config.js` ships two greens today: `s-success #16A34A` at line 167 and `s-open #22C55E`
at line 171. The approved mockup collapses them into one. Right now a confirmation tick and an
"open now" mark are different greens on the same page.

- **COLLAPSE** , one green everywhere, the mockup's value wins.
- **KEEP** , two greens stay and the mockup's green is reverted.

## 2. Motion speed (row 33, PDP)

Three more items hang off this one, so answering it unblocks four.

- **SNAP** , 80 to 100ms for a thing flipping state, 150 to 180ms for a thing that travels.
  Measured off the references.
- **KEEP** , the documented 180 to 520ms spread we have now.

## 3. The back arrow (workstream 81, step S3)

New today. Page: `public/_mockups/back-arrow-to-the-lock/index.html`. Everything except one value
was already locked by him on 2026-08-10 and never built.

- **WHITE** , the salon page control becomes a solid white circle, matching the lock exactly.
- **LEAVE IT** , the salon page keeps its see-through fill over the photo, as a named variant.

Either answer applies the other two locked changes (44 across, and the chevron he asked for) to
all 20 places at once.

## 4. Home sections B and C (row 70)

Both were built as mockups and never applied. Section A shipped and is live.

- **APPLY** , the walk-in colour marks and the 260x147 review cards get ported in as measured.
- **DROP** , both go to the graveyard and the row closes.

## 5. Category icons (row 66)

Two rows are rendered at `/en/dev/mock/category-morph`. The morph shape itself is built.

- **LINE** , or **SOLID**.

Flagged, not resolved: `_plans/ICON_SWAP_2026-08-17.md` is a live whole-set icon replacement at
52 of 52 coverage with no row in the index, and it may already own this decision. If he picks a
side here, that file gets checked against it first.

## 6. Home type direction (row 56)

One letter off `public/_mockups/home-type/index.html`. Seven of the eight boxes in that row
already shipped and are verified live.

- **A or D** , both stay inside the locked Inter Tight plus Inter contract; D just opens up the
  spacing.
- **B or C** , Nunito or Poppins, which unlocks the LOCKFILE font row and he has to say so by
  name for it to count.

## 7. Icon sizes across the site (row 110)

Re-measured today off the audit's own list: 888 instances became 998, and 26 distinct sizes
became 34. 310 of the first 400 recorded entries are still byte-identical at their recorded line,
so nothing has moved since the audit.

- **SWEEP** , to 16 for meta, 20 for a row, 24 for nav, customer surfaces only. Mechanical,
  because the audit JSON already carries file, line, current and target per instance.
- **DROP** , the spread stays and the row closes.

## 8. The animated category icons (row 48)

Correction to what this row said for four weeks: it claimed only 2 of 5 categories have a finished
clip. Decoding the base64 in `public/_research/solen-icon-motion.html` and checking the hashes
shows FOUR finished clips. Nails and Spa exist in the research file and were never extracted.
Also, `MobileCategoriesRow.tsx` is imported and mounted, it just carries `hidden`, so it is one
class away from appearing, not dead code.

- **WIRE** , extract the two blobs, which is a decode, not a paid render, and drop the `hidden`.
- **CUT** , they stay dev-only and the graveyard gets a line.

## 9. Sign-in flow after the email (row 51, item A2)

The chrome half of this row is fully answered and superseded by the back-arrow work above. Only
this is left, and it is a real privacy trade, which is why it is his.

- **SPLIT** , the email-first flow he described. It needs a does-this-email-exist endpoint, which
  publicly leaks whether an address is registered on Solen.
- **TWO DOORS** , sign in and sign up chosen at the first tap. No lookup, no leak, one extra tap.

## 10. One look, not a word (rows 62 and 63, search panel)

The only item on this list that no amount of work here can settle. Nothing on this machine
produces a soft keyboard, and this fix's own correction term reads 0 without one
(`SearchOverlay.tsx:744`), so every desktop check is a false pass by construction. He rejected
this twice on his phone and every check since has been on a desktop.

**The act:** open the search, tap through to the `Wo?` step, let the keyboard come up, on his own
iPhone, and say whether the sheet sits right.

Everything else in row 62 is verified fixed: the tapped day is ink with white numerals, today is
`#F4F4F5`, the home bar holds 64 at rest and scrolled, and the calendar has no cut-off scroller.
Rows 62 and 63 are the SAME act, which is why they are one item here and not two.

---

## What happens when he answers

Nine of the ten are then mechanical and need nothing more from him. Item 10 is a report back from
his phone, and whichever way it falls the fix or the confirmation follows from it directly.

Answering all ten takes the design ACTIVE count from 13 to 3.
