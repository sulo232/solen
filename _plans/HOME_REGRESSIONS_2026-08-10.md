# HOME PAGE , what he says is gone, 2026-08-10

His words: *"On the home page, I made a lot of edits about opening and closing of the search bar,
but I believe that's not even happening... when I click the search bar, it jumps me into another
version... it is, like, a weird line and stuff and also logo, and I also made, like, a category
thingy, also really gone. What's the core cause of this? because now it's, like, all mixed up and
conflicts."*

## The core cause of the category row, found and provable

- [x] **It is not lost and it is not a merge conflict. One class was changed.**
      `verified: 5354b0ec2 (2026-08-01)  app/[locale]/_components/homepage/MobileCategoriesRow.tsx:84`
      The row used to be `md:hidden`, meaning visible on a phone and hidden on desktop. It is now
      `hidden` outright, meaning invisible everywhere. Its own comment says so in as many words:
      *"Was `md:hidden` (mobile-only, already invisible on desktop); now `hidden` outright so
      desktop stays exactly as it was and mobile matches it."*
      So a session on 2026-08-01 deliberately hid it to match a mockup, and the component was left
      on disk for revert. His work is intact, the row is just switched off.
- [x] **WRONG, and corrected by measuring.** I claimed the empty band under the search bar was that
      hidden section still holding its `mb-4`. Measured live: the section is `display: none`, height
      **0**, so it occupies no space at all and its margin never applies. The gap he can see is
      something else and is still unexplained. `verified: measured on the live page 2026-08-10`

## ALREADY DIAGNOSED, in two workstreams, and never built , which IS the core cause

Checked the index before adding anything, and both of his other complaints are already sitting
there, correctly diagnosed, unbuilt:

- **"when I click the search bar, it jumps me into another version"** , workstream 55, item H6,
  dated 2026-08-01: *"H6 is a wiring bug not a design ask, the pill is a `<Link href=/search>` at
  `HomeSearchPill.tsx:108` so it navigates instead of opening the real `SearchTemplate`."*
  So it was found nine days ago, named as a bug rather than a design question, and left.
- **"a weird line"** , workstream 56, dated 2026-08-05, second ask: *"remove the divider under the
  home search bar"*. Also already his ask, also unbuilt. Workstream 55 H4 additionally says it was
  blocked waiting for him to say which page, which he has now effectively answered by saying the
  home page.

**So the honest core cause is not a conflict and not lost work. It is that his asks get measured,
written down accurately, and then not built.** Three separate home workstreams (54, 55, 56) are
open at once, all his, all with diagnosis in them.

## RESOLVED 2026-08-10 by the branch he named

He named the branch himself: `claude/security-audit-principles-a877df`, and said everything on it
is what he wants. It is merged into main, so nothing was ever lost. Two later commits on main
replaced the two parts he cares about, and both are now taken back from his branch.

- [x] **The category row.** His branch's `Header.tsx` carries the horizontal pill row with the
      **All** pill, the Inspo pill, and `showCategoryChrome = isHome || !!categorySegment ||
      isDiscover`, so it renders ON HOME with the current category selected. Main's copy has four
      plain pills, no All, and `{categorySegment && (`, so it never drew on home at all. Verified
      live at 375 wide: the row is at the top and All carries the sunken-gray selected fill, which
      is what "look like there being on a category" means.
- [x] **"It jumps me into another version".** Main's `HomeSearchPill` was a plain `<a>` to
      `/search?compose=1`, a full document load. His branch mounts the shared `SearchOverlay` and
      opens it over home. Verified: clicked the pill, `location.pathname` stayed `/de`, the
      composer drew with its own category pills.
- [x] **The 2x3 tile grid restore is reverted.** He rejected it, his branch hides it too, and the
      reader found it was hidden deliberately because the mockup he approved replaced it with this
      pill row. Restoring it also re-added the Walk-in tile he killed by name (REMOVED.md:110).
- [x] **Salon card photos.** Measured on the live page: 40 images over 80px wide, 0 with
      `naturalWidth === 0`. The grey boxes were a broken dev chunk mid-edit, not a real defect.
      My earlier note claiming otherwise was wrong.

## Still open, and both need him

- [ ] **The logo.** He said "and also logo" and did not say what is wrong with it. On his branch's
      header the pill row takes the top slot on home, so the wordmark is not where it used to be.
      Not guessing which of those he means.
- [ ] **"Stores" vs "Salons".** 6 strings in `messages/de.json` say Stores, including the page
      title. It reads as a deliberate house word, not a slip, and no decision on record settles it.
      His call, not mine to sweep.

## Not verified, named rather than claimed

The open and close MORPH itself. The overlay is wired to grow from the pill's own
`getBoundingClientRect()` (the same `originRect` contract SearchTemplate uses), and it opens, but I
did not record frames to prove the motion reads smoothly on a phone.

## The structural cause behind ALL of it, which is his real question

**29 worktrees and 57 workstreams against one owner.** Sessions run in parallel on separate
branches, each matching a different mockup, and they land on main without anyone comparing the
result to what he last approved. Nothing here was a conflict in the git sense. It was one session
switching off what another had built, with a reasonable comment attached.
