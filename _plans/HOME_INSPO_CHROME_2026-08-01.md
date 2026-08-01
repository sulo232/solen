# HOME + INSPO CHROME , owner dictation 2026-08-01

12 asks, atomized. Every box carries the file:line or the measurement that grounds it, taken from
the LIVE page at 390x844 this turn, not from reading source. Live tunnel:
https://admission-integrated-achieved-assumption.trycloudflare.com

**Standing constraints on this batch, named up front so they are not rediscovered per item:**
- Mockup FIRST for every appearance change (CLAUDE.md). Two items here are REPEATS of calls the
  owner already made, and those apply directly under the `mockup-ok` escape with the quote cited
  in the code. Everything else needs a mockup he says yes to before real code moves.
- H2 names Airbnb. That is a brand motion reference, so `Skill(reference-lock)` fires and the real
  thing gets CAPTURED (video + computed styles + animation timeline). Building an "Airbnb-like"
  transition from memory is the banned failure mode, and the drift ledger already has two entries
  for exactly this shape.
- H5 ("make a new homepage") is a design fork, not an instruction. It gets 3 directions to react to.

---

## A. Chrome geometry + behaviour (home)

- [ ] **H1. Search bar + category row go STICKY on scroll.**
      MEASURED: `<header>` is already `position: sticky`, `top: 0`, height **102px**. The category
      pills and the search pill are NOT inside it, they sit below at top 117+ and scroll away.
      So this is not "make the header sticky", it is "move these two rows into the sticky region,
      or give them their own". Watch the stacked height: 102 + pills + pill row eats a third of a
      390x844 viewport if all three pin at once. Decide what pins and what scrolls away.
- [ ] **H3. Header, category row and search bar all sit TOO LOW.**
      MEASURED: content starts at y=102 and the first control (the hamburger) at y=**117**, so
      there is a ~102px band above the first thing the eye lands on. Confirmed visually in
      `scratchpad/shot-de.png`: a large empty band above the category pills.
      Fix is a spacing change in `_components/layout/Header.tsx` (the 102px) plus whatever pads
      `HomeSearchPill`. Needs a mockup, it is an appearance change.
- [ ] **H4. Remove the weird divider near the bottom.**
      NOT YET LOCATED. The dictation says "a weird divider like a sheep thingy at the bottom".
      BLOCKER, concrete: which page and roughly how far down. I measured the home first viewport
      only. Next step is a full-page screenshot at 390 wide and a walk down it looking for a rule
      or separator that is not in the divider ladder, then confirm with him it is the one he means.
- [x] **H9. Hamburger in the search bar is BARE, no circle. REPEAT , he had already said this.**
      PROOF it was circled: the live button computed `border-radius: 9999px` +
      `border: 1px solid #E4E4E7`, 44x44 at y=117, class
      `grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border`.
      FIXED at `app/[locale]/_components/homepage/HomeSearchPill.tsx:139` , ring and border removed,
      44px hit area kept (touch-target floor), hover moved from a background fill to a text tone.
      Applied under `mockup-ok` with his quote in the code, because a repeat of a call he already
      made is not a new design choice.
      STILL CIRCLED ELSEWHERE, and he only named the search bar, so these are NOT touched without
      his word: `inspo/page.tsx:509`, `search/SearchTemplate.tsx:1397`, and the `trailing="saved"`
      heart in this same file at line 124.

- [ ] **H2. Category switching should transition smoothly, "like Airbnb", not a page load.**
      Today each category is a route (`/{city}/{category}`), so switching is a full navigation.
      Airbnb's is a client-side content swap with the chrome held still.
      ORDER OF WORK: reference-lock capture FIRST (record the real airbnb.com category switch,
      pull the actual timing and easing), THEN propose. Do not name a duration from memory.

## B. Broken behaviour (home)

- [ ] **H6. Clicking search opens nothing, and a full search experience already exists.**
      GROUNDED: `HomeSearchPill.tsx:108` wraps the bar in `<Link href={/${locale}/search}>`, so it
      navigates instead of opening the built search surface. `SearchTemplate.tsx` is the real thing
      (1400+ lines, its own search bar, filters, map button).
      This is a WIRING bug, not a design ask. Verify what actually happens on tap before editing:
      does it 404, land on a blank `/search`, or open and render empty.
- [ ] **H7. Hamburger menu has no close / X.**
      The menu opens via a `solen:open-menu` window event
      (`HomeSearchPill.tsx:137` -> `Header.tsx:530`). Need to open it live and check the close
      affordance. Design-system close is the 38px circled X (CLAUDE.md copy-economy 5), so this one
      IS circled by law , do not "fix" it to bare by pattern-matching H9.
- [ ] **H8. Everything inside the hamburger menu sits too low.**
      Same root as H3 most likely (a shared top offset). Measure the menu open before assuming.

## C. Inspo page

- [ ] **H10. Inspo search bar should be LONG, with the heart INSIDE it.**
      EXISTS-CHECK HIT, and it changes the work: `HomeSearchPill` ALREADY has a `trailing="saved"`
      variant that renders a Heart inside the pill (`HomeSearchPill.tsx:119-129`). Inspo is not
      using it, it hand-rolls its own control at `inspo/page.tsx:509`. So this is COMPOSE THE
      EXISTING COMPONENT, not build a new bar , FLOORS LAW 9 ("screens are composed, not drawn")
      and the drift ledger's search-bar entries both bind here.
- [ ] **H11. Inspo filters have no shadows and read as a different style.**
      Grade against the ONE surface table in the design contract (SalonCard = photo + whisper +
      no border; tile on a gray tray = white, no shadow; a card carrying elevation drops its
      border). Name which row the Inspo filter is supposed to be before restyling it.
- [ ] **H12. Inspo filter belongs ABOVE the For You section.**
      Ordering change. Check `project_inspo_progressive_filter` first, the 3-level drill-down has a
      defined position, so this may be moving a locked element rather than a loose one.

## D. The big one

- [ ] **H5. "Too white, make a new homepage."**
      This is a fork, not a task. It also collides with two live laws that must be named in the
      same breath rather than discovered mid-build: WEB IS ONE LIGHT THEME (no dark mode, rejected
      twice by name), and the imagery floor is satisfied by MORE REAL STORE CONTENT, never by a
      hero photo or a banner (rejected three times, his words: "no other company has just image
      hard coded baked into a random area, SHOW OFF THE STORES THAT WE HAVE").
      So "less white" has to come from content density, photography that is real salon data,
      the sunken tray rhythm, and semantic-colour moments. DELIVERABLE: 3 distinct directions as
      mockups, each with a recommendation, not one.
