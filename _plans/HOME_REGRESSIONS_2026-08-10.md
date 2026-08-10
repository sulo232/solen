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

## Still to check, not yet answered

- [ ] The search-bar open and close ANIMATION, separately from H6's navigation bug.
- [ ] The logo.
- [ ] Salon card photos render as grey boxes on the live home page. Not something he raised, found
      while looking.
- [ ] The page title says "Stores" rather than "Salons" in several places, which no decision on
      record asks for.

## The structural cause behind ALL of it, which is his real question

**29 worktrees and 57 workstreams against one owner.** Sessions run in parallel on separate
branches, each matching a different mockup, and they land on main without anyone comparing the
result to what he last approved. Nothing here was a conflict in the git sense. It was one session
switching off what another had built, with a reasonable comment attached.
